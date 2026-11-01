import { BadRequestException, Controller, Get, Inject, NotFoundException, Param, Query, Res } from '@nestjs/common';
import { Pool } from 'pg';
import { createHash } from 'node:crypto';
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
  async article(@Param('id') rawId: string, @Query('locale') rawLocale: string | undefined,
    @Res({ passthrough: true }) response: { setHeader(name: string, value: string): void }) {
    // Errors and withdrawals must be uncacheable too, including a default-off404.
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader('Pragma', 'no-cache');
    response.setHeader('X-Robots-Tag', 'noindex');
    const id = circuitId(rawId);
    const language = locale(rawLocale);
    if (process.env.CIRCUIT_EDITORIAL_READ_ENABLED !== '1') {
      throw new NotFoundException('Published circuit article not found');
    }

    const { rows } = await this.db.query(
      `SELECT data FROM circuit_editorial_public_articles
       WHERE circuit_id=$1::bigint AND locale=$2`, [id, language]);
    for (const row of rows) {
      const payload = row.data;
      delete payload.circuit_id;
      Object.assign(row, payload);
      delete row.data;
    }

    if (rows.length !== 1) throw new NotFoundException('Published circuit article not found');
    // A matching body digest is necessary, but never sufficient, for human approval.
    const revision = rows[0].review_revision_sha256;
    delete rows[0].review_revision_sha256;
    if (createHash('sha256').update(rows[0].body_markdown, 'utf8').digest('hex') !== revision) {
      throw new NotFoundException('Published circuit article not found');
    }
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
