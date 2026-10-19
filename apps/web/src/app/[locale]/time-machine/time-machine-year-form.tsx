'use client';

import { useState } from 'react';
import styles from './time-machine.module.css';

export default function TimeMachineYearForm({ locale, kind, id, fromYear, toYear, labels }: {
  locale: string; kind: 'driver' | 'constructor'; id: string; fromYear: string; toYear: string;
  labels: { earlier: string; later: string; compare: string };
}) {
  const [from, setFrom] = useState(fromYear);
  const [to, setTo] = useState(toYear);
  return <form className={styles.yearForm} action={`/${locale}/time-machine`} method="get">
    <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={id} />
    <label htmlFor="tm-earlier-season">{labels.earlier}
      <input id="tm-earlier-season" name="from" type="number" min="1950" max="2200" step="1"
        required value={from} onChange={event => setFrom(event.target.value)} />
    </label>
    <span className={styles.yearBridge} aria-hidden="true">→</span>
    <label htmlFor="tm-later-season">{labels.later}
      <input id="tm-later-season" name="to" type="number" min="1950" max="2200" step="1"
        required value={to} onChange={event => setTo(event.target.value)} />
    </label>
    <button className="primary" type="submit">{labels.compare}</button>
  </form>;
}
