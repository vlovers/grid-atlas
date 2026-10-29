import { BadRequestException, Controller, Get, Inject, NotFoundException, Param, Query } from '@nestjs/common';
import { Pool } from 'pg';
import { DB } from './tokens';
import { articleSections } from '../scripts/editorial-body.cjs';

function circuitId(value: string): string {
  if (!/^[1-9][0-9]{0,18}$/.test(value) || BigInt(value) > 9223372036854775807n) {
    throw new BadRequestException('id must be a positive PostgreSQL BIGINT');
  }
  return value;
}

function locale(value?: string): 'uk' | 'en' {
  if (value === undefined) return 'uk';
  if (value !== 'uk' && value !== 'en') throw new BadRequestException('locale must be uk or en');
  return value;
}

/**
 * A separate, disabled-by-default circuit read model. No draft preview, write,
 * approval, or media route is exposed. Enabling reads is an operator release
 * decision AFTER independent human review, not an editorial approval itself.
 */
@Controller()
export class CircuitEditorialController {
  constructor(@Inject(DB) private readonly db: Pool) {}

  @Get('circuits/:id/article')
  async article(@Param('id') rawId: string, @Query('locale') rawLocale?: string) {
    const id = circuitId(rawId);
    const language = locale(rawLocale);
    if (process.env.CIRCUIT_EDITORIAL_READ_ENABLED !== '1') {
      throw new NotFoundException('Published circuit article not found');
    }

    const { rows } = await this.db.query(`
      SELECT a.id::text AS id, a.locale, a.slug, a.title, a.body_markdown,
        a.published_at::text AS published_at,
        (SELECT jsonb_agg(jsonb_build_object(
          'id', c.id::text, 'statement', c.statement,
          'evidence', (SELECT jsonb_agg(jsonb_build_object(
            'url', s.source_url, 'title', s.title, 'publisher', s.publisher,
            'author', s.author, 'accessed_on', s.accessed_on::text, 'locator', e.locator
          ) ORDER BY s.title, s.source_url, e.locator)
          FROM circuit_editorial_evidence e
          JOIN content_sources s ON s.id = e.source_id
          WHERE e.claim_id = c.id AND e.supports = true)
        ) ORDER BY c.id)
        FROM circuit_editorial_article_claims ac
        JOIN circuit_editorial_claims c ON c.id = ac.claim_id
        WHERE ac.article_id = a.id) AS claims,
        (SELECT jsonb_agg(r ORDER BY r.title, r.url, r.publisher)
         FROM (SELECT DISTINCT s.source_url AS url, s.title, s.publisher
           FROM circuit_editorial_article_claims ac
           JOIN circuit_editorial_evidence e ON e.claim_id = ac.claim_id AND e.supports = true
           JOIN content_sources s ON s.id = e.source_id
           WHERE ac.article_id = a.id) r) AS "references"
      FROM circuit_editorial_articles a
      WHERE a.circuit_id = $1 AND a.locale = $2
        AND a.status = 'published' AND a.review_method = 'human'
        AND a.review_revision_sha256 IS NOT NULL
        AND a.author IS NOT NULL AND a.reviewer IS NOT NULL
        AND lower(btrim(a.author)) <> lower(btrim(a.reviewer))
        AND a.reviewed_at IS NOT NULL AND a.published_at IS NOT NULL
        AND EXISTS (SELECT 1 FROM circuit_editorial_article_claims ac WHERE ac.article_id = a.id)
        AND NOT EXISTS (
          SELECT 1 FROM circuit_editorial_article_claims ac
          JOIN circuit_editorial_claims c ON c.id = ac.claim_id
          WHERE ac.article_id = a.id AND (
            c.circuit_id <> a.circuit_id OR c.status <> 'verified'
            OR c.review_method <> 'human' OR c.reviewer IS NULL OR c.reviewed_at IS NULL
            OR NOT EXISTS (
              SELECT 1 FROM circuit_editorial_evidence e
              WHERE e.claim_id = c.id AND e.supports = true
            )
          )
        )`, [id, language]);

    if (rows.length !== 1) throw new NotFoundException('Published circuit article not found');
    try {
      rows[0].sections = articleSections<{ id: string; statement: string }>(
        rows[0].body_markdown, rows[0].claims,
      ).map(section => ({
        heading: section.heading,
        claim_ids: section.claims.map(claim => claim.id),
      }));
    } catch {
      throw new NotFoundException('Published circuit article not found');
    }
    return { data: rows[0] };
  }
}
