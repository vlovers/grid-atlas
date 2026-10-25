import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = path => readFileSync(join(root, path), 'utf8');
const previews = read('apps/web/src/components/stories/editorial-previews.ts');
const paths = read('apps/web/src/components/stories/editorial-moment-model.ts');
const scenes = read('apps/web/src/components/stories/editorial-moment-scenes.ts');
const related = read('apps/web/src/components/stories/editorial-related.ts');
const hub = read('apps/web/src/app/[locale]/stories/page.tsx');
const detail = read('apps/web/src/app/[locale]/stories/moments/[slug]/page.tsx');
const slugs = ['lauda-hunt-1976','senna-prost-1988-89','villeneuve-arnoux-1979','vettel-monza-2008','button-canada-2011','perez-sakhir-2020','kubica-bmw-2008','schumacher-ferrari-1996-2000','massa-2008','brawn-2009'];

test('all ten editorial moment slugs have previews, paths, scenes and related links', () => {
  for (const slug of slugs) {
    for (const [name, source] of [['previews',previews],['paths',paths],['scenes',scenes],['related',related]]) {
      assert.ok(source.includes(`'${slug}'`) || source.includes(`"${slug}"`), `${name} missing ${slug}`);
    }
  }
  assert.equal(new Set(slugs).size, 10);
});

test('editorial previews remain distinct from published driver stories', () => {
  assert.match(hub, /stories\\/moments\\/\\$\\{story\\.slug\\}/);
  assert.match(detail, /robots: \\{ index: false, follow: true \\}/);
  assert.match(detail, /notFound\\(\\)/);
  assert.match(detail, /momentScenes\\(slug, locale\\)/);
  assert.match(detail, /relatedEditorialMoments\\(slug\\)/);
  assert.match(detail, /full story is in preparation/i);
});

test('bilingual story beats and scenes are present in the editorial sources', () => {
  for (const source of [previews, paths, scenes]) {
    assert.match(source, /\\ben\\b/);
    assert.match(source, /\\buk\\b/);
  }
  assert.match(detail, /beats\\.map/);
  assert.match(detail, /scenes\\?\\.\\[index\\]/);
});
