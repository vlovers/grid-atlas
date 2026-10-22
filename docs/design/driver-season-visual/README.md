# Driver season data visualization

This is a reusable, server-rendered **data visualization**, not an AI-generated image or editorial illustration. It appears in every public driver dossier and uses only the existing public driver season response.

## Historical semantics
- `starts` is the API's recorded season result-entry measure, not a claim about race starts under all historical regulations.
- `wins` and `podiums` are archive-derived result counts; do not infer titles, poles, retirements or official championship standings.
- Bar heights are independently normalized for starts and wins, and this is explicitly disclosed. Do not compare the *absolute heights across series*.
- Exact counts remain in screen-reader labels and the detailed season ledger. Missing seasons are not interpolated.
- Clicking a year selects that season via a regular URL. No-JavaScript navigation works.

## UI / QA
- Ukrainian and English copy; responsive horizontal scrolling for long careers; accessible keyboard focus, high-contrast and reduced-motion fallbacks.
- Playwright coverage at 390, 1024 and 1440 px in both languages plus no-JavaScript navigation.
- Uses no third-party images or fonts. All photographs still require the separate verified-media registry and human rights approval.
- Validate on GitHub Actions before merging; no production deployment is implied by this PR.
