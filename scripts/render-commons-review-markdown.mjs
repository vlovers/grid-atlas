import { commonsFileTitle } from './ingest-commons-original.mjs';

const sha256 = /^[a-f0-9]{64}$/;
const sha1 = /^[a-f0-9]{40}$/;

/** Escape source-derived text: the report is for human review, never trusted HTML. */
function mdText(value) {
  return String(value ?? '—').replace(/\s+/g, ' ').trim()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/([\\`*_{}\[\]()#+.!|~-])/g, '\\$1');
}

function safeLink(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port ||
      parsed.hash || parsed.search) throw Error('Unsafe external review link');
  return parsed.href.replaceAll('(', '%28').replaceAll(')', '%29');
}

function revisionLink(filePage, oldid) {
  const title = commonsFileTitle(filePage).replaceAll(' ', '_');
  if (!Number.isSafeInteger(oldid) || oldid < 1) throw Error('Invalid pinned Commons description revision');
  return 'https://commons.wikimedia.org/w/index.php?title=' +
    encodeURIComponent(title) + '&oldid=' + oldid;
}

/**
 * Human-readable, source-linked worklist from an already validated research
 * handoff. Never represents a review decision or generates media assets.
 */
export function renderCommonsReviewMarkdown(report) {
  if (report?.schema_version !== 1 ||
      report.kind !== 'commons_independent_review_handoff_not_approval' ||
      report.publication_allowed !== false || report.original_files_in_report !== false ||
      report.rights_approved !== 0 || !Array.isArray(report.entries) ||
      report.total !== report.entries.length || report.entries.length === 0) {
    throw Error('Expected unpublished Commons independent review handoff');
  }
  const ids = new Set();
  let observed = 0;
  const lines = [
    '# Commons original media review worklist / Перелік перевірки медіа Commons',
    '',
    '> **RESEARCH ONLY / ЛИШЕ ДОСЛІДЖЕННЯ.** No media rights, depicted subjects,',
    '> historical context or publication have been approved. / Жодні права,',
    '> зображені об’єкти, історичний контекст чи публікацію не схвалено.',
    '',
    'This report links **pinned, unverified description revisions** for independent inspection.',
    'F1DB record hashes, Commons SHA-1 metadata and verified original-image SHA-256 are different evidence.',
    'Do not copy research candidates or reviewer checkboxes into the public media registry.',
    '',
  ];
  for (const [index, item] of report.entries.entries()) {
    if (!/^research-[a-z0-9-]+$/.test(item?.research_id ?? '') || ids.has(item.research_id) ||
        item.publication_allowed !== false || item.reviewer !== null ||
        item.rights_decision !== 'pending' || item.subject_decision !== 'pending' ||
        item.locale_text?.en?.alt !== null || item.locale_text?.en?.caption !== null ||
        item.locale_text?.uk?.alt !== null || item.locale_text?.uk?.caption !== null ||
        !sha256.test(item.f1db_record?.record_sha256 ?? '') ||
        !sha256.test(item.f1db_record?.archive_sha256 ?? '') ||
        item.f1db_record?.release !== 'v2026.17.0' ||
        !sha1.test(item.commons_source?.original_sha1 ?? '')) {
      throw Error('Invalid or prematurely approved research review entry');
    }
    ids.add(item.research_id);
    const binary = item.original_binary;
    const hasHash = binary?.status === 'sha256_observed_not_rights_approved' &&
      sha256.test(binary.sha256 ?? '') &&
      /^https:\/\/github\.com\/vlovers\/grid-atlas\/actions\/runs\/\d+$/.test(binary.observation_run_url ?? '');
    const pending = binary?.status === 'pending_original' && binary.sha256 === null &&
      binary.observation_run_url === null;
    if (!hasHash && !pending) throw Error('Invalid original binary observation status');
    if (hasHash) observed++;
    const source = item.commons_source;
    const page = safeLink(source.file_page_url);
    const oldid = revisionLink(source.file_page_url, source.description_oldid);
    const license = source.license_url ? safeLink(source.license_url) : null;
    lines.push(
      `## ${index + 1}. ${mdText(item.subject.f1db_name)} — ${mdText(item.research_id)}`,
      '',
      `- **Canonical F1DB identity:** ${mdText(item.subject.type)} / ${mdText(item.subject.id)} (v2026.17.0)`,
      `- **F1DB archive SHA-256:** \`${item.f1db_record.archive_sha256}\``,
      `- **F1DB identity-record SHA-256:** \`${item.f1db_record.record_sha256}\` (not an image hash)`,
      `- **Commons file:** [file page](${page}) · [pinned description revision — verify independently](${oldid})`,
      `- **Commons original SHA-1 (metadata):** \`${source.original_sha1}\``,
      `- **Observed original:** ${source.bytes} bytes · ${source.width} × ${source.height} px`,
      `- **Observed creator (unverified):** ${mdText(source.observed_creator)}`,
      `- **Observed license claim (unverified):** ${license ? `[${mdText(source.observed_license)}](${license})` : mdText(source.observed_license)}`,
      `- **Original image SHA-256:** ${hasHash ? `\`${binary.sha256}\` ([prior research run](${safeLink(binary.observation_run_url)}); not re-downloaded)` : '**PENDING — original not byte-verified**'}`,
      `- **Source note (unverified):** ${mdText(source.source_note)}`,
      `- **Historical/context caution:** ${mdText(item.context_warning)}`,
      '- **Rights / subject / publication:** PENDING / PENDING / NOT APPROVED',
      '',
      '### Independent checks / Незалежна перевірка',
      '',
      '- [ ] Verify the exact description revision and full upload/derivative chain / Перевірити редакцію опису та історію файлу.',
      '- [ ] Establish the creator, source license, attribution and reuse obligations / Перевірити автора, ліцензію й атрибуцію.',
      '- [ ] Visually inspect the original and confirm depicted subject, capture date and context / Перевірити оригінал, об’єкт, дату та контекст.',
      '- [ ] Check privacy, personality, trademarks and intended use / Перевірити права особи, приватність, торговельні марки й використання.',
      '- [ ] Prepare independently verified EN and UK alt text and captions / Підготувати окремі перевірені описи англійською та українською.',
      '- [ ] Record a real independent reviewer, decision, rationale and exact reviewed bytes outside this generated report / Задокументувати незалежне рішення та перевірені байти.',
      '',
    );
  }
  if (report.binary_sha256_observed !== observed ||
      report.binary_sha256_pending !== report.entries.length - observed) {
    throw Error('Original SHA-256 coverage does not match the research handoff');
  }
  lines.splice(9, 0, `**Original SHA-256 coverage:** ${observed}/${report.total}; **rights approvals:** 0.`, '');
  return lines.join('\n') + '\n';
}
