# 165 circuit stories — offline bilingual review workbench

This is the **next integration step after PR #354**, not a release. The six existing expansion JSON files hold 165 research stories for 33 circuits; this exporter combines them into one **read-only, local review packet**. The public Next.js app does not import the packet. The existing short, source-linked stories on 78 circuit pages remain unchanged.

## Generate the complete packet

From the repository root with Node 24:

~~~sh
pnpm review:circuits > /tmp/grid-atlas-165-review.json
pnpm review:circuits:html > /tmp/grid-atlas-165-review.html
~~~

Open the HTML file locally. It contains 33 collapsible dossiers with five bilingual English/Ukrainian stories each, year, source links, evidence-type classification, review warnings and a SHA-256 fingerprint of the exact draft. The layout is responsive and keyboard navigable; there is no JavaScript, remote image, CDN or third-party script. The HTML has a noindex directive, **but noindex is not access control**: do not upload the file to public hosting.

The JSON is machine-readable and can support a future private editorial queue. Fingerprints are for change detection, **not** review signatures or publication digests.

## What the exporter verifies

- All 33 expected circuit IDs and exactly 165 distinct five-story records from the six expansion files.
- UK/EN titles and narratives, valid year and HTTPS source URLs.
- Source counts and exact URLs against the existing 33-circuit triage ledger.
- Explicit publication=blocked and independent_approval=false in every source story.
- Exactly 177 source references, 39 distinct URLs and 27 single-source dossiers at the current pinned snapshot.
- Read-only HTML output with escaped content strings and no public media assets.

For single-source dossiers, every story carries a warning about the shared citation. A classification-only source receives a warning that race results do not substantiate all narrative claims. Cross-year race-result references and external context sources receive separate review prompts.

## What it does NOT verify

This tool does not fetch URLs, verify historical claims, prove source independence, check translation quality, approve a race-era layout or clear media rights. The source-type labels are heuristics. Human review must still inspect individual claims against the linked sources and record a decision on the **exact final bilingual edition**. None of the existing circuit-release.json or media publication gates are changed.

## Follow-up acceptance

1. Review the 27 single-source dossiers first, using the local HTML packet to compare EN/UK and identify unsupported assertions.
2. Record claim-level corroboration and revise copy without silently changing its historical scope.
3. Independently approve the final exact edition using the existing release mechanism. **Do not** copy the export's draft fingerprint into the release manifest as a substitute for that mechanism.
4. Only then wire approved longform into the public circuit UX; preserve the short-story fallback and race-link ambiguity protections.
