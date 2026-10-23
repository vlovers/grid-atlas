import { MediaCollection } from '../../../collection';
import { CircuitDiagram, LicensedMedia } from '../../../licensed-media';
import publication from '../../../publication.json';
import type { MediaRegistry } from '../../../registry';
import { syntheticAsset, syntheticCollectionAsset } from '../../fixtures';

export default async function MediaPreview({ params, searchParams }: {
  params: Promise<{ locale: string }>; searchParams: Promise<{ test?: string }>;
}) {
  const locale = (await params).locale === 'uk' ? 'uk' : 'en';
  const uk = locale === 'uk';
  const { test } = await searchParams;
  const synthetic = test && ['verified', 'missing', 'withdrawn', 'wrong-race'].includes(test) ? syntheticAsset(test) : null;
  const assets = (publication as MediaRegistry).assets;
  const collectionFixture = test && ['gallery-verified','gallery-withdrawn','gallery-stale','gallery-car'].includes(test) ? syntheticCollectionAsset(test) : null;
  return <main>
    <header><a href={`/${uk ? 'en' : 'uk'}`}>{uk ? 'English' : 'Українська'}</a>
      <p className="eyebrow">GRID ATLAS / {uk ? 'МЕДІА · ЛОКАЛЬНИЙ ПЕРЕГЛЯД' : 'MEDIA · LOCAL PREVIEW'}</p>
      <h1>{uk ? 'Історія потребує джерел.' : 'History needs a source.'}</h1>
      <p className="intro">{uk ? 'Місце для історичних зображень — з перевіреною особою чи об’єктом, авторством і правами на використання.' : 'A place for historical images, with checked identity, creator credit and reuse rights.'}</p>
      <p className="notice">{uk ? 'Жодного реального зображення ще не схвалено. Тут показано чесні резервні стани.' : 'No real image has been approved yet. These are honest fallback states.'}</p>
    </header>
    {collectionFixture ? <section aria-label="Synthetic collection fixture"><h2>SYNTHETIC TEST DATA — not historical imagery or a real approval</h2><MediaCollection assets={[collectionFixture]} subject={collectionFixture.subject} label="NON-HISTORICAL TEST FIXTURE" locale={locale} asOf="2026-10-20" /></section> : synthetic ? <section aria-label="Synthetic test fixture">
      <h2>SYNTHETIC TEST DATA — not historical media or a real approval</h2>
      <div className="single"><CircuitDiagram assets={[synthetic]} assetId={synthetic.id} circuitId="fixture-circuit"
        raceId={test === 'wrong-race' ? 'different-race' : 'fixture-race'} label="NON-GEOGRAPHIC TEST FIXTURE" locale={locale} asOf="2026-10-20" /></div>
    </section> : <>
      <section aria-labelledby="portraits"><h2 id="portraits">{uk ? 'Люди за результатами' : 'The people behind the records'}</h2>
        <div className="grid">{[
          ['ayrton-senna', 'Ayrton Senna'], ['juan-manuel-fangio', 'Juan Manuel Fangio'], ['lewis-hamilton', 'Lewis Hamilton'],
        ].map(([id, label]) => <LicensedMedia key={id} assets={assets} assetId={`${id}-commons-pilot`}
          subject={{ type: 'driver', id }} label={label} locale={locale} />)}</div>
      </section>
      <section aria-labelledby="layouts"><h2 id="layouts">{uk ? 'Та сама траса. Інша конфігурація.' : 'The same venue. A different layout.'}</h2>
        <div className="layouts"><CircuitDiagram assets={assets} assetId="monaco-4-f1db-pilot" circuitId="monaco"
          raceId="394" label="Monaco · 1984" locale={locale} />
          <aside><p className="eyebrow">{uk ? 'ТОЧНА ВІДПОВІДНІСТЬ' : 'EXACT MATCH REQUIRED'}</p>
            <h3>{uk ? 'Рік — не декорація.' : 'The year matters.'}</h3>
            <p>{uk ? 'В імпортованому записі гонки 1984 року вказано monaco-4. Поточну monaco-6 не підставляємо.' : 'The imported 1984 race record names monaco-4. The current monaco-6 is not substituted.'}</p>
            <p>{uk ? 'Потрібні окрема перевірка конфігурації та людське схвалення прав на схему.' : 'Layout provenance and human rights approval are separate requirements.'}</p>
          </aside>
        </div>
      </section>
    </>}
    <footer>{uk ? 'Кандидати відокремлені від публікацій. Фотографії не завантажено й не підключено з чужих серверів.' : 'Candidates stay separate from publication. No photographs are downloaded or hotlinked.'}</footer>
  </main>;
}
