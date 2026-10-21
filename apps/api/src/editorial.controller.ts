import { BadRequestException, Controller, Get, Inject, NotFoundException, Param, Query } from '@nestjs/common';
import { Pool } from 'pg';
import { DB } from './tokens';
import { articleSections } from '../scripts/editorial-body.cjs';

function validatedId(id: string): string {
  if (!/^[1-9][0-9]{0,18}$/.test(id) || BigInt(id) > 9223372036854775807n) {
    throw new BadRequestException('id must be a positive PostgreSQL BIGINT');
  }
  return id;
}

function validatedLocale(locale?: string): 'uk' | 'en' {
  if (locale === undefined) return 'uk';
  if (locale !== 'uk' && locale !== 'en') throw new BadRequestException('locale must be uk or en');
  return locale;
}

/**
 * Public editorial read model. Never returns drafts, review metadata, unapproved
 * media, or unpublished claims. This endpoint does not perform editorial approval.
 */
@Controller()
export class EditorialController {
  constructor(@Inject(DB) private readonly db: Pool) {}

  @Get('drivers/:id/article')
  async driverArticle(@Param('id') rawId: string, @Query('locale') rawLocale?: string) {
    const id = validatedId(rawId);
    const locale = validatedLocale(rawLocale);
    const { rows } = await this.db.query(
      `SELECT a.id::text AS id, a.locale, a.slug, a.title, a.body_markdown,
         a.published_at::text AS published_at,
         (SELECT jsonb_agg(jsonb_build_object('id', c.id::text, 'statement', c.statement,
           'evidence', (SELECT jsonb_agg(jsonb_build_object(
             'url',s.source_url,'title',s.title,'publisher',s.publisher,
             'author',s.author,'accessed_on',s.accessed_on::text,'locator',e.locator)
             ORDER BY s.title,s.source_url,e.locator)
             FROM content_claim_evidence e JOIN content_sources s ON s.id=e.source_id
             WHERE e.claim_id=c.id AND e.supports=true)) ORDER BY c.id)
           FROM content_article_claims ac JOIN content_claims c ON c.id=ac.claim_id
           WHERE ac.article_id=a.id) AS claims,
         (SELECT jsonb_agg(r ORDER BY r.title,r.url,r.publisher) FROM
           (SELECT DISTINCT s.source_url AS url,s.title,s.publisher
            FROM content_article_claims ac JOIN content_claim_evidence e ON e.claim_id=ac.claim_id AND e.supports=true
            JOIN content_sources s ON s.id=e.source_id WHERE ac.article_id=a.id) r) AS "references"
       FROM content_articles a
       WHERE a.subject_driver_id = $1 AND a.locale = $2
         AND a.status = 'published'
         AND a.reviewer IS NOT NULL AND a.reviewed_at IS NOT NULL
         AND a.published_at IS NOT NULL
         AND EXISTS (SELECT 1 FROM content_article_claims ac WHERE ac.article_id = a.id)
         AND NOT EXISTS (
           SELECT 1 FROM content_article_claims ac
           JOIN content_claims c ON c.id = ac.claim_id
           WHERE ac.article_id = a.id AND (
             c.subject_driver_id <> a.subject_driver_id
             OR c.status <> 'verified'
             OR c.reviewer IS NULL OR c.reviewed_at IS NULL
             OR NOT EXISTS (
               SELECT 1 FROM content_claim_evidence e
               WHERE e.claim_id = c.id AND e.supports = true
             )
           )
         )`,
      [id, locale],
    );
    if (!rows.length) throw new NotFoundException('Published article not found');
    // One statement snapshots approval, prose and source locators together.
    // A published row cannot smuggle prose unrelated to its approved claims.
    try { rows[0].sections = articleSections<{ id: string; statement: string }>(rows[0].body_markdown, rows[0].claims)
      .map(section => ({ heading: section.heading, claim_ids: section.claims.map(claim => claim.id) })); }
    catch { throw new NotFoundException('Published article not found'); }
    return { data: rows[0] };
  }
}
