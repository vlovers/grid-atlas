'use client';

import { useState } from 'react';
import type batch from '../../../../../../docs/media/batch-290.json';
import { ImageFrame } from '../image-frame';
import styles from './review-workbench.module.css';

export type Task = typeof batch.entries[number];
export type ReviewRow = { task: Task; subject: { type: string; id: string }; originalAvailable: boolean };

/** Local review desk only. Proposed text and source observations never grant publication. */
export function ReviewWorkbench({ rows, locale }: { rows: ReviewRow[]; locale: 'uk' | 'en' }) {
  const uk = locale === 'uk';
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const shown = rows.filter(row => (filter === 'all' || row.subject.type === filter) && `${row.subject.id} ${row.task.proposed.caption[locale]}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <div className={styles.desk} data-testid="media-review-workbench">
    <header className={styles.opening}>
      <p className={styles.kicker}>GRID ATLAS / {uk ? 'МЕДІАРЕДАКЦІЯ · 01' : 'PICTURE DESK · 01'}</p>
      <h1>{uk ? 'Обличчя. Машини. Місця.' : 'Faces. Machines. Places.'}</h1>
      <p className={styles.lead}>{uk ? 'Дванадцять поглядів на історію перегонів. Джерело й контекст кожного кадру — поруч із майбутнім підписом.' : 'Twelve perspectives on racing history. The source and context of every frame, beside its proposed caption.'}</p>
      <div className={styles.status} role="note"><strong>{uk ? 'Лише локальна перевірка. 0 схвалено.' : 'Local review only. 0 approved.'}</strong><p>{uk ? 'Фотографії не опубліковано. Метадані Commons та перевірка байтів не замінюють незалежного рішення людини щодо прав, ідентичності й підписів.' : 'Photographs are unpublished. Commons metadata and byte checks do not replace independent human review of rights, identity and captions.'}</p></div>
      <dl className={styles.stats}><div><dt>{uk ? 'Кандидатів' : 'Candidates'}</dt><dd>12</dd></div><div><dt>{uk ? 'З наявної черги' : 'Reused candidates'}</dt><dd>7</dd></div><div><dt>{uk ? 'Нових джерел' : 'New sources'}</dt><dd>5</dd></div><div><dt>{uk ? 'Публічних фото' : 'Public photographs'}</dt><dd>0</dd></div></dl>
    </header>
    <div className={styles.filters}>
      <fieldset><legend>{uk ? 'Об’єкти зйомки' : 'Image subjects'}</legend>{[['all', uk ? 'Усі' : 'All'], ['driver', uk ? 'Пілоти' : 'Drivers'], ['constructor', uk ? 'Боліди й команди' : 'Cars & constructors'], ['circuit', uk ? 'Траси' : 'Circuits']].map(([value, name]) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{name}</button>)}</fieldset>
      <label>{uk ? 'Пошук у пакеті' : 'Search this batch'}<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
    </div>
    <p className={styles.result} role="status">{uk ? 'Показано' : 'Showing'} {shown.length} / 12</p>
    <div className={styles.contactSheet}>{shown.map(({ task, subject, originalAvailable }) => {
      const pin = task.source_observation;
      const id = task.candidate_id.startsWith('research-') ? task.candidate_id : 'research-' + task.candidate_id;
      return <article key={task.candidate_id} className={styles.card} data-candidate-id={task.candidate_id}>
        <div className={styles.photo}><ImageFrame source={originalAvailable ? `/research-originals/${id}.jpg` : null} width={4} height={3} alt={task.proposed.alt[locale]}
          label={subject.id.replaceAll('-', ' ')} unavailable={uk ? 'Оригінал очікує перевірки' : 'Original awaiting verification'} failed={uk ? 'Оригінал недоступний' : 'Original unavailable'} /></div>
        <div className={styles.body}><p className={styles.kicker}>{String(rows.findIndex(row => row.task.candidate_id === task.candidate_id) + 1).padStart(2, '0')} / {subject.type} · {uk ? 'КАНДИДАТ' : 'CANDIDATE'}</p>
          <h2>{subject.id.replaceAll('-', ' ')}</h2><p className={styles.caption}>{task.proposed.caption[locale]}</p>
          <p className={styles.credit}>{pin.creator ?? (uk ? 'Авторство не встановлено' : 'Creator unresolved')} · {pin.license ?? '—'} <span>{uk ? '(заявлено джерелом)' : '(source-declared)'}</span></p>
          <a href={`${pin.file_page_url.replace('/wiki/', '/w/index.php?title=')}&oldid=${pin.description_oldid}`} rel="noreferrer">{uk ? 'Ревізія джерела' : 'Source revision'} ↗</a>
          {originalAvailable && <a href={`/research-originals/${id}.jpg`} target="_blank" rel="noreferrer">{uk ? 'Відкрити приватний оригінал' : 'Open private original'} ↗</a>}
          <details><summary>{uk ? 'Походження й блокери' : 'Provenance & blockers'}</summary><dl className={styles.evidence}>
            <div><dt>{uk ? 'Ревізія / дата перевірки' : 'Revision / observation date'}</dt><dd>{pin.description_oldid} / {pin.observed_on}</dd></div>
            <div><dt>{uk ? 'Розмір оригіналу' : 'Original dimensions'}</dt><dd>{pin.width} × {pin.height} · {pin.bytes.toLocaleString('en')} B</dd></div>
            <div><dt>{uk ? 'SHA-1 джерела' : 'Source SHA-1'}</dt><dd>{pin.sha1}</dd></div>
            <div><dt>{uk ? 'Локальні байти / SHA-256' : 'Local bytes / SHA-256'}</dt><dd>{task.byte_verification.sha256 ?? (uk ? 'Не перевірено' : 'Not verified')}</dd>
              {task.byte_verification.evidence_url && <dd><a href={task.byte_verification.evidence_url} rel="noreferrer">{uk ? 'Попередній доказ' : 'Prior evidence'} · {task.byte_verification.observed_on}</a> · {uk ? 'цього разу не перевірено' : 'not rechecked this run'}</dd>}
              <dd lang="en">{task.byte_verification.current_attempt}</dd></div>
            <div><dt>{uk ? 'Ланцюжок походження' : 'Derivative chain'}</dt><dd lang="en">{task.derivative_chain}</dd></div>
            <div><dt>{uk ? 'Пропонований alt' : 'Proposed alt text'}</dt><dd>{task.proposed.alt[locale]}</dd></div>
            <div><dt>{uk ? 'Пропонований кредит' : 'Proposed credit'}</dt><dd lang="en">{task.proposed.attribution}</dd></div>
          </dl><ul lang="en">{task.blockers.map(blocker => <li key={blocker}>{blocker}</li>)}</ul>
          <p>{uk ? 'Доказові нотатки зберігаються англійською; українські підписи вище — чернетки для незалежної перевірки.' : 'Evidence notes retain their original research language. All proposed text requires independent review.'}</p>
          </details>
        </div>
      </article>;
    })}</div>
    {!shown.length && <p>{uk ? 'За цим запитом кандидатів немає.' : 'No candidates match this search.'}</p>}
    <footer className={styles.footer}>{uk ? 'Публікація відбувається через чинний media registry після перевірки точного відбитка файлу й метаданих. Цей стіл не створює схвалень.' : 'Publication uses the existing media registry after review of the exact file and metadata fingerprint. This desk cannot create approvals.'}</footer>
  </div>;
}
