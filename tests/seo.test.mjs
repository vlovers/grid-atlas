import test from 'node:test';
import assert from 'node:assert/strict';
import { siteOrigin, localizedUrl, routeMetadata, pageStructuredData, serializeJsonLd } from '../apps/web/src/lib/seo.ts';
import { sitemapPaths } from '../apps/web/src/lib/sitemap.ts';

test('canonical origin is explicit and rejects credentials, paths and unsafe schemes', () => {
  assert.equal(siteOrigin('https://atlas.example/'), 'https://atlas.example');
  for (const value of ['javascript:alert(1)', 'ftp://atlas.example', 'https://user:pass@atlas.example', 'https://atlas.example/base', 'https://atlas.example/?q=1', 'https://atlas.example/#a']) {
    assert.throws(() => siteOrigin(value));
  }
});

test('canonicals retain locale and meaningful pagination while removing duplicate variants', () => {
  const origin = 'https://atlas.example';
  for (const locale of ['uk', 'en']) {
    assert.equal(localizedUrl(origin, locale, '/'), `${origin}/${locale}`);
    assert.equal(localizedUrl(origin, locale, '/drivers/1/?utm_source=test'), `${origin}/${locale}/drivers/1`);
    assert.equal(localizedUrl(origin, locale, '/drivers?q=Senna&page=2&utm_source=test'), `${origin}/${locale}/drivers?page=2`);
    assert.equal(localizedUrl(origin, locale, '/circuits/1?page=2'), `${origin}/${locale}/circuits/1?page=2`);
    for (const page of ['1', '01', '0', '-1', '1002', 'Infinity', '1e2']) {
      assert.equal(localizedUrl(origin, locale, `/drivers?page=${page}`), `${origin}/${locale}/drivers`);
    }
    assert.equal(localizedUrl(origin, locale, '/races/1?page=2'), `${origin}/${locale}/races/1`);
    assert.equal(localizedUrl(origin, locale, '/drivers/1?page=2'), `${origin}/${locale}/drivers/1`);
  }
  for (const [locale, path] of [['fr', '/drivers'], ['uk', '//evil.example'], ['en', '/a\\b'], ['en', '/a#b']]) {
    assert.throws(() => localizedUrl(origin, locale, path));
  }
});

test('indexing defaults off without SITE_URL; searches opt out even with an origin', () => {
  const saved = process.env.SITE_URL;
  try {
    delete process.env.SITE_URL;
    assert.equal(routeMetadata('en', '/drivers').robots.index, false);
    assert.equal(routeMetadata('en', '/drivers').alternates, undefined);
    process.env.SITE_URL = 'https://atlas.example';
    const metadata = routeMetadata('en', '/drivers?page=2');
    assert.equal(metadata.robots.index, true);
    assert.equal(metadata.alternates.canonical, 'https://atlas.example/en/drivers?page=2');
    assert.equal(metadata.alternates.languages.uk, 'https://atlas.example/uk/drivers?page=2');
    assert.equal(routeMetadata('uk', '/drivers', true).robots.index, false);
  } finally {
    if (saved === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = saved;
  }
});

test('JSON-LD is parseable, escapes script termination and matches the visible breadcrumb trail', () => {
  const name = '</script><script>alert("x")</script>';
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Drivers', path: '/drivers' }, { name, path: '/drivers/1' }];
  const data = pageStructuredData('https://atlas.example', 'en', crumbs, `${name} — imported results`);
  const json = serializeJsonLd(data);
  assert.ok(!json.includes('<'));
  assert.deepEqual(JSON.parse(json), data);
  assert.equal(data['@graph'][0]['@type'], 'WebPage');
  assert.equal(data['@graph'][0].name, name);
  assert.deepEqual(data['@graph'][1].itemListElement.map(item => item.position), [1, 2, 3]);
  assert.equal(data['@graph'][1].itemListElement[2].item, 'https://atlas.example/en/drivers/1');
});

test('sitemap enumerates full API pages, deduplicates paths and uses only public archive APIs', async () => {
  const calls = [];
  const paths = await sitemapPaths(async path => {
    calls.push(path);
    if (path === '/api/seasons') return [{ year: 1950 }, { year: 1951 }];
    if (path.startsWith('/api/drivers?')) {
      const offset = Number(new URL(path, 'http://fixture').searchParams.get('offset'));
      return Array.from({ length: offset === 0 ? 100 : 1 }, (_, i) => ({ id: String(offset + i + 1) }));
    }
    if (path === '/api/lineage/network') return [
      { entity_type: 'entrant', subject_id: '1', object_id: '2' },
      { entity_type: 'entrant', subject_id: '1', object_id: '2' },
    ];
    if (path.includes('/1950/races')) return [{ id: '1' }];
    return [];
  });
  assert.ok(paths.includes('/drivers/101'));
  assert.ok(paths.includes('/races/1'));
  assert.ok(paths.includes('/seasons/1951'));
  assert.ok(paths.includes('/entrants/2'));
  assert.equal(new Set(paths).size, paths.length);
  assert.ok(paths.every(path => !/[?]|draft|article|content/.test(path)));
  assert.ok(calls.every(path => !/editorial|article|content/.test(path)));
  assert.ok(calls.includes('/api/drivers?limit=100&offset=100'));
});

test('sitemap never silently publishes a partial response on API failure or invalid pagination', async () => {
  await assert.rejects(sitemapPaths(async () => { throw new Error('API unavailable'); }), /API unavailable/);
  await assert.rejects(sitemapPaths(async path => path === '/api/seasons' ? [{ year: 1949 }] : []), /Invalid sitemap season/);
  await assert.rejects(sitemapPaths(async path => path.startsWith('/api/drivers?') ? [{ id: '01' }] : []), /Invalid sitemap record ID/);
  await assert.rejects(sitemapPaths(async path => path.startsWith('/api/drivers?')
    ? Array.from({ length: 100 }, (_, i) => ({ id: String(i + 1) })) : []), /pagination did not advance/);
});


test('story sitemap requires an actual canonical F1DB identity, not a similar external name', async () => {
  for (const source of ['f1db', 'other']) {
    const paths = await sitemapPaths(async path => {
      if (path.startsWith('/api/drivers?')) return [{id:'42',external_id:'ayrton-senna'}];
      if (path === '/api/drivers/42/career') return [{id:'42',external_id:'ayrton-senna',source_slug:source}];
      return [];
    });
    assert.equal(paths.includes('/stories/ayrton-senna'), source === 'f1db');
    assert.equal(paths.includes('/stories/lewis-hamilton'), false);
  }
});
