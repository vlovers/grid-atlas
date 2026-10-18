'use client';
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) { return <section className="page"><h1>Не удалось загрузить данные</h1><p>Проверьте доступность API и повторите попытку.</p><button className="primary" onClick={reset}>Повторить</button></section>; }
