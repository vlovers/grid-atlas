/** The release body may contain reviewed headings and registered claim text only.
 * This structural check does not establish source truth or human approval.
 */
function articleSections(body, claims) {
  if (typeof body !== 'string' || !body.trim() || !Array.isArray(claims) || !claims.length)
    throw new Error('article needs a body and cited claims');
  const byText = new Map();
  for (const claim of claims) {
    if (typeof claim.statement !== 'string' || !claim.statement.trim() || byText.has(claim.statement.trim()))
      throw new Error('empty or ambiguous claim statement');
    byText.set(claim.statement.trim(), claim);
  }
  const sections = [];
  let section = { heading: '', claims: [] };
  const used = new Set();
  for (const block of body.replaceAll('\r\n', '\n').trim().split(/\n[\t ]*\n/)) {
    if (/^## [^\n<>#[\]`]+$/.test(block)) {
      if (section.heading || section.claims.length) {
        if (!section.claims.length) throw new Error('empty editorial section');
        sections.push(section);
      }
      section = { heading: block.slice(3), claims: [] };
      continue;
    }
    const claim = byText.get(block);
    if (!claim || used.has(block)) throw new Error('article prose is not covered exactly once by its reviewed claims');
    used.add(block);
    section.claims.push(claim);
  }
  if (!section.claims.length || used.size !== claims.length)
    throw new Error('article must include every reviewed claim exactly once');
  sections.push(section);
  return sections;
}
module.exports = { articleSections };
