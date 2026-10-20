/** Historical story content stays invisible until a separately authorized publication adapter supplies an approved revision. */
export type StoryLocale = 'en' | 'uk';
export type StoryCitation = Readonly<{
  id: string;
  title: string;
  publisher: string;
  url: string;
  locator: string;
}>;
export type StoryChapter = Readonly<{
  id: string;
  heading: string;
  paragraphs: readonly string[];
  citations: readonly string[];
  links: readonly { label: string; href: string }[];
}>;
export type ApprovedStory = Readonly<{
  status: 'published';
  publicationId: string;
  approvedRevision: string;
  locale: StoryLocale;
  title: string;
  introduction: string;
  chapters: readonly StoryChapter[];
  sources: readonly StoryCitation[];
}>;

const validId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const safePath = /^\/(?:en|uk)\/(?:seasons\/[0-9]{4}|drivers\/[1-9][0-9]*|constructors\/[1-9][0-9]*|races\/[1-9][0-9]*)$/;
export function validatePublishedStory(value: unknown): ApprovedStory {
  if (!value || typeof value !== 'object') throw new Error('Story must be an object');
  const story = value as Partial<ApprovedStory>;
  if (story.status !== 'published' || !story.publicationId?.trim() || !/^[a-f0-9]{64}$/.test(story.approvedRevision ?? ''))
    throw new Error('Story is not an approved published revision');
  if (story.locale !== 'en' && story.locale !== 'uk') throw new Error('Unsupported locale');
  if (!story.title?.trim() || !story.introduction?.trim() || !Array.isArray(story.chapters) || !story.chapters.length || !Array.isArray(story.sources))
    throw new Error('Incomplete story');
  const ids = new Set<string>();
  for (const source of story.sources) {
    if (!validId.test(source.id) || ids.has(source.id) || !source.title.trim() || !source.publisher.trim() || !source.locator.trim())
      throw new Error('Invalid citation');
    const u = new URL(source.url);
    if (u.protocol !== 'https:') throw new Error('Non-HTTPS citation');
    ids.add(source.id);
  }
  const chapters = new Set<string>();
  for (const chapter of story.chapters) {
    if (!validId.test(chapter.id) || chapters.has(chapter.id) || !chapter.heading.trim() || !chapter.paragraphs.length ||
        chapter.paragraphs.some((p: string) => !p.trim())) throw new Error('Invalid chapter');
    chapters.add(chapter.id);
    if (chapter.citations.some((id: string) => !ids.has(id))) throw new Error('Orphan citation');
    if (chapter.links.some((link: { label: string; href: string }) => !link.label.trim() || !safePath.test(link.href) || !link.href.startsWith('/' + story.locale + '/')))
      throw new Error('Unresolved or unsafe internal link');
  }
  return story as ApprovedStory;
}
