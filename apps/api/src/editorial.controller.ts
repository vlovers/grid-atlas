import { BadRequestException, Controller, Get, Inject, NotFoundException, Param, Query } from '@nestjs/common';
import { Pool } from 'pg';
import { DB } from './tokens';

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
         a.published_at::text AS published_at
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
    const { rows: references } = await this.db.query(
      `SELECT DISTINCT s.source_url AS url, s.title, s.publisher
       FROM content_article_claims ac
       JOIN content_claim_evidence e ON e.claim_id = ac.claim_id AND e.supports = true
       JOIN content_sources s ON s.id = e.source_id
       WHERE ac.article_id = $1
       ORDER BY s.title, s.source_url, s.publisher`,
      [rows[0].id],
    );
    return { data: { ...rows[0], references } };
  }
}
