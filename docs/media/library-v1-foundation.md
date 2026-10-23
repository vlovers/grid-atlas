# Media Library V1 · historical context and publication provenance

23 October 2026. This batch extends the existing media registry and presentation
components. It introduces no second CMS, automatic clearance, remote hotlinking,
or independent editorial approval. Public photographs remain at zero.

## Model and migration

Registry schema 2 retains entity association, original URL, local delivery path,
creator, exact source revision, license identifier/version and URL, attribution,
inspection date, byte hash, modifications, rights note, bilingual text and the
independent publication review. It adds:

- `historical_context`: a described subject/context, its year (nullable when
  unknown), and a supporting source URL. Capture date and depicted year must not
  be treated as interchangeable.
- `ai_generated`: true, false or unknown/null during research. Publication
  requires an explicit decision. A generated work cannot be classified as an
  archival photograph, portrait or sourced circuit geometry. Approved generated
  car illustrations receive a visible UK/EN label, even when attribution exists.

Both fields participate in the existing payload fingerprint. Changes invalidate
review. Schema-1 manifests are rejected rather than silently assuming that their
images are authentic or historically appropriate. The five existing candidates
are migrated without inventing review decisions; their AI provenance remains
unknown pending review. Publication is empty, so no approved payload is lost.
Synthetic preview assets/tests are updated separately and remain test-only.

`LicensedMedia`, `ImageFrame`, `MediaCollection` and `EditorialMedia` remain the
reusable presentation path. They reserve dimensions, avoid implicit cropping,
show visible credit/source/license and modification details, and retain honest
missing/withdrawn/error fallbacks. Historical context appears in reuse details.

## Rechecked pilot research

Source pages and license deeds were opened on 23 October; these observations
are research evidence, not a new human verification date or an approval.

| Era / candidate | Source-stated license and creator | Publication decision |
| --- | --- | --- |
| [Fangio, 1957 crop](https://commons.wikimedia.org/wiki/File:J.M._Fangio_1957.jpg) | CC BY-SA 3.0; crop page names Spin2Win | Blocked: the [parent](https://commons.wikimedia.org/wiki/File:1957ArgentineGP04.jpg) describes a photo by Carlos Alberto Navarro but carries a Spin2Win public-domain dedication. Resolve creator/rights chain; do not confuse uploader and photographer. |
| [Senna, 1989 Belgian GP podium](https://commons.wikimedia.org/wiki/File:Ayrton_Senna_1989_Belgian_GP_podium_(cropped).jpg) | CC BY 2.0; madagascarica | Commons page identifies a crop and Flickr original. Original Flickr fetch could not be completed in this research pass. Derivative/credit chain and independent review remain open. Not an image of a 1985 race. |
| [Hamilton, Monaco 2016](https://commons.wikimedia.org/wiki/File:Lewis_Hamilton_(27333186713).jpg) | CC BY 2.0; 35mmMan | Commons records a 29 May 2016 photograph. Original Flickr fetch could not be completed here. Exact rights/context, bytes, attribution and independent review remain open. |
| F1DB Monaco layouts, 1984/2016 mappings | Jules Roy; source declares CC BY 4.0 | Existing separate SVG collection retained. Exact race/layout mappings, byte integrity and attribution preserved; no new per-asset rights approval asserted. |

The pinned F1DB LICENSE was retrieved through GitHub at commit
`3c980fd510ef97ea0de577aff7ecee193869de65`: title Attribution 4.0 International,
Git blob `4ea99c213c5c0c005ae4e80df8e52169d06896ec`. The existing README-link
discrepancy remains documented; a failed lookup of an upstream repository does
not supply replacement permission. See [existing SVG provenance](historical-circuit-svg-provenance.md).

The live [Commons reuse guidance](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia)
requires file-specific review. [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/)
and [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) permit reuse
subject to their conditions; attribution, supplied notices, license links and
derivative obligations must be assessed against the actual asset. [CC0](https://creativecommons.org/publicdomain/zero/1.0/)
is a rights dedication by its affirmer, not independent proof that the affirmer
owns a historical photograph. No verified CC0 pilot was established in this pass.
An independently licensed photograph needs recorded permission for the intended
use; public accessibility and noncommercial intent do not substitute for it.

Research PR [#221](https://github.com/vlovers/grid-atlas/pull/221) was opened
during implementation. Its additional metadata-only candidates remain separate
research, with zero approvals. This batch does not duplicate that inventory.

## Next review batch

Prioritize resolving the two CC BY portrait chains, then the Fangio provenance
conflict, and one constructor/car and venue photograph from the research queue.
After human clearance, retrieve exact bytes, validate dimensions and subject,
write original UK/EN alt/captions, record transformations, and request independent
review against the final fingerprint. Publish only through the established
reviewed PR process. This batch supplies the foundation and review-ready triage;
it does not claim a cleared photographic pilot.

Run `node scripts/validate-media-registry.mjs --as-of 2026-10-23`,
`node scripts/audit-media-readiness.mjs --as-of 2026-10-23`, the media Node
tests and isolated media browser preview before publishing any later asset.
