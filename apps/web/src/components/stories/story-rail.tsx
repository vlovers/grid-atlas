'use client';
import { useRef, useState, useEffect, type ReactNode } from 'react';
import styles from './stories.module.css';

export function StoryRail({ children, label, locale }: { children: ReactNode; label: string; locale: 'uk' | 'en' }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ first: true, last: false });
  useEffect(() => {
    const rail = ref.current!;
    const update = () => setEdges({ first: rail.scrollLeft <= 2, last: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2 });
    const observer = new ResizeObserver(update); observer.observe(rail); update();
    rail.addEventListener('scroll', update, { passive: true });
    return () => { observer.disconnect(); rail.removeEventListener('scroll', update); };
  }, []);
  const move = (direction: number) => ref.current?.scrollBy({ left: direction * ref.current.clientWidth * .8,
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  return <div className={styles.railWrap}>
    <div className={styles.rail} ref={ref} role="region" aria-label={`${locale === 'uk' ? 'Стрічка історій' : 'Story rail'}: ${label}`} tabIndex={0} onKeyDown={event => {
      if (event.target === event.currentTarget && ['ArrowRight', 'ArrowLeft'].includes(event.key)) { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); }
    }}>{children}</div>
    <div className={styles.railControls}><span>{locale === 'uk' ? 'Більше історій — далі' : 'There’s more around the next corner'}</span><div>
      <button type="button" onClick={() => move(-1)} disabled={edges.first} aria-label={locale === 'uk' ? 'Попередні історії' : 'Previous stories'}>←</button>
      <button type="button" onClick={() => move(1)} disabled={edges.last} aria-label={locale === 'uk' ? 'Наступні історії' : 'Next stories'}>→</button>
    </div></div>
  </div>;
}
