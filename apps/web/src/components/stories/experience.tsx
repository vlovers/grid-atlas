'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './stories.module.css';

/** Progressive motion: content is visible before JS. Both OS preference and pause control win. */
export function StoryExperience({ locale }: { locale: 'uk' | 'en' }) {
  const [paused, setPaused] = useState(false);
  const animations = useRef(new Set<Animation>());
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const running = animations.current;
    try { if (sessionStorage.getItem('atlas-motion') === 'paused') { document.documentElement.dataset.storyMotion = 'paused'; setPaused(true); } } catch { /* Storage is optional. */ }
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        if (!preference.matches && document.documentElement.dataset.storyMotion !== 'paused') {
          const animation = entry.target.animate([{ opacity: .4, transform: 'translateY(30px)' }, { opacity: 1, transform: 'translateY(0)' }],
            { duration: 750, easing: 'cubic-bezier(.2,.7,.2,1)' });
          running.add(animation); animation.onfinish = () => running.delete(animation);
        }
        observer.unobserve(entry.target);
      }
    }, { threshold: .08 });
    // Streaming/navigation can add sections after this persistent layout has mounted.
    const seen = new WeakSet<Element>();
    const observe = () => document.querySelectorAll('[data-story-reveal]').forEach(el => { if (!seen.has(el)) { seen.add(el); observer.observe(el); } });
    const mutations = new MutationObserver(observe); mutations.observe(document.getElementById('content')!, { childList: true, subtree: true }); observe();
    const stop = () => { if (preference.matches) { running.forEach(a => a.cancel()); running.clear(); } };
    preference.addEventListener('change', stop);
    return () => { mutations.disconnect(); observer.disconnect(); running.forEach(a => a.cancel()); preference.removeEventListener('change', stop); };
  }, []);
  const toggle = () => {
    const next = !paused; setPaused(next); document.documentElement.dataset.storyMotion = next ? 'paused' : 'running';
    try { sessionStorage.setItem('atlas-motion', next ? 'paused' : 'running'); } catch { /* Storage is optional. */ }
    if (next) { animations.current.forEach(a => a.cancel()); animations.current.clear(); }
  };
  return <button type="button" className={styles.motionControl} onClick={toggle} aria-pressed={paused}>
    <span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span>{locale === 'uk' ? paused ? 'Відновити рух' : 'Призупинити рух' : paused ? 'Resume motion' : 'Pause motion'}
  </button>;
}
