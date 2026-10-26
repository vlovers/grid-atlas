/**
 * Curated editorial media only. A filename or a Commons page URL is not proof of
 * reuse permission. Review each asset and its attribution before adding it here.
 *
 * Public assets must be stored locally at /media/editorial/<filename>, with
 * a provenance record in docs/editorial/MEDIA-PROVENANCE.md.
 */
export type EditorialPhoto = {
  src: `/media/editorial/${string}`;
  alt: { en: string; uk: string };
  caption: { en: string; uk: string };
  creator: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  changes: string;
};

export const editorialPhotos: Partial<Record<string, EditorialPhoto>> = {
  'vettel-monza-2008': {
    src: '/media/editorial/vettel-monza-2008.jpg',
    alt: { en: 'Sebastian Vettel at Monza in 2008', uk: 'Себастьян Феттель на трасі Монца у 2008 році' },
    caption: { en: 'Vettel at Monza in 2008, the weekend of his breakthrough Toro Rosso victory.', uk: 'Феттель у Монці 2008 року — вікенд його історичної перемоги за Toro Rosso.' },
    creator: 'Jane Belinda Smith',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Vettel_Monza_2008.jpg',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
    changes: 'Resized to 1920px width by Wikimedia Commons; no other edits.',
  },
  'brawn-2009': {
    src: '/media/editorial/brawn-2009.jpg',
    alt: { en: 'Jenson Button driving the Brawn BGP 001 at the 2009 Abu Dhabi Grand Prix', uk: 'Дженсон Баттон за кермом Brawn BGP 001 на Гран-прі Абу-Дабі 2009 року' },
    caption: { en: 'Button in the Brawn BGP 001 at Abu Dhabi, in the team’s championship-winning season.', uk: 'Баттон у Brawn BGP 001 в Абу-Дабі — у чемпіонському сезоні команди.' },
    creator: 'Yuriy Lapitskiy',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Jenson_Button_(Brawn_BGP_001)_on_Sunday_at_2009_Abu_Dhabi_Grand_Prix.jpg',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    changes: 'Resized to 1920px width by Wikimedia Commons; no other edits.',
  },
};

/** Only display media with a complete human-reviewed provenance record. */
export function approvedEditorialPhoto(slug: string): EditorialPhoto | null {
  const photo = editorialPhotos[slug];
  if (!photo) return null;
  if (!photo.src.startsWith('/media/editorial/') || !photo.alt.en || !photo.alt.uk ||
      !photo.caption.en || !photo.caption.uk || !photo.creator ||
      !photo.sourceUrl.startsWith('https://') || !photo.license ||
      !photo.licenseUrl.startsWith('https://') || !photo.changes) return null;
  return photo;
}
