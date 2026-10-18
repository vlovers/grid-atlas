'use client';
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) { return <section className="page"><h1>Не удалось загрузить данные</h1><p>Исторические данные временно недоступны. Повторите попытку через несколько секунд.</p><button className="primary" onClick={reset}>Повторить</button></section>; }
