import { editorialStoryPreviews } from './editorial-previews';
/** Curated thematic links; not claims of direct historical causation. */
const relatedSlugs: Record<string, readonly string[]> = {
  "lauda-hunt-1976": [
    "senna-prost-1988-89",
    "massa-2008",
    "schumacher-ferrari-1996-2000"
  ],
  "senna-prost-1988-89": [
    "lauda-hunt-1976",
    "massa-2008",
    "schumacher-ferrari-1996-2000"
  ],
  "villeneuve-arnoux-1979": [
    "vettel-monza-2008",
    "kubica-bmw-2008",
    "brawn-2009"
  ],
  "vettel-monza-2008": [
    "kubica-bmw-2008",
    "button-canada-2011",
    "brawn-2009"
  ],
  "button-canada-2011": [
    "perez-sakhir-2020",
    "vettel-monza-2008",
    "massa-2008"
  ],
  "perez-sakhir-2020": [
    "button-canada-2011",
    "kubica-bmw-2008",
    "brawn-2009"
  ],
  "kubica-bmw-2008": [
    "vettel-monza-2008",
    "perez-sakhir-2020",
    "villeneuve-arnoux-1979"
  ],
  "schumacher-ferrari-1996-2000": [
    "brawn-2009",
    "massa-2008",
    "senna-prost-1988-89"
  ],
  "massa-2008": [
    "senna-prost-1988-89",
    "lauda-hunt-1976",
    "button-canada-2011"
  ],
  "brawn-2009": [
    "schumacher-ferrari-1996-2000",
    "kubica-bmw-2008",
    "vettel-monza-2008"
  ]
};
export function relatedEditorialMoments(slug: string) {
  const keys = relatedSlugs[slug] ?? [];
  return keys.flatMap(key => { const item = editorialStoryPreviews.find(story => story.slug === key); return item ? [item] : []; });
}
