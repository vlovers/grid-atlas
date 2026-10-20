import { useId } from 'react';
import styles from './motorsport-art.module.css';

export type ArtKind = 'velocity' | 'apex' | 'duel' | 'grid' | 'helmet';
/** Original decorative vector artwork. Never a historical car, portrait or circuit layout. */
export function MotorsportArt({ kind = 'velocity', tone = 'coral' }: { kind?: ArtKind; tone?: 'coral' | 'mint' | 'violet' | 'gold' }) {
  const uid = useId().replace(/:/g, '');
  const paint = `${uid}-paint`;
  const light = `${uid}-light`;
  return <div className={`${styles.art} ${styles[tone]} ${styles[kind]}`} aria-hidden="true" data-art={kind}>
    <svg viewBox="0 0 1200 800" fill="none" focusable="false">
      <defs>
        <linearGradient id={paint} x1="300" y1="250" x2="850" y2="550" gradientUnits="userSpaceOnUse"><stop stopColor="var(--art-light)" /><stop offset=".38" stopColor="var(--art-color)" /><stop offset="1" stopColor="var(--art-dark)" /></linearGradient>
        <linearGradient id={light} x1="100" y1="0" x2="1000" y2="700" gradientUnits="userSpaceOnUse"><stop stopColor="var(--art-light)" stopOpacity=".7" /><stop offset="1" stopColor="var(--art-color)" stopOpacity="0" /></linearGradient>
      </defs>
      <g className={styles.traces} stroke="var(--art-color)" opacity=".26">
        <path d="M-100 680C200 670 310 50 780 110S1080 620 1380 480" strokeWidth="90" />
        <path d="M-100 760C200 750 310 130 780 190S1080 700 1380 560" strokeWidth="2" />
        <path d="M-100 600C200 590 310-30 780 30S1080 540 1380 400" strokeWidth="2" />
      </g>
      <g className={styles.speed} stroke={`url(#${light})`} strokeWidth="2">
        {[0, 1, 2, 3, 4, 5].map(i => <path key={i} d={`M${-250 + i * 80} ${180 + i * 105}l1300-220`} />)}
      </g>
      {(kind === 'velocity' || kind === 'duel') && <g className={styles.machine} transform="translate(75 -25) rotate(-24 600 400)">
        <Car paint={paint} />
        {kind === 'duel' && <g transform="translate(-330 240) scale(.78)" opacity=".76"><Car paint={paint} /></g>}
      </g>}
      {kind === 'apex' && <g className={styles.apexLines} transform="rotate(-20 600 400)">
        <path d="M-100 660H460C860 660 980 90 590 90H430C180 90 190 420 450 420H1300" stroke="#080e14" strokeWidth="125" />
        <path d="M-100 660H460C860 660 980 90 590 90H430C180 90 190 420 450 420H1300" stroke={`url(#${paint})`} strokeWidth="76" />
        <path d="M-100 660H460C860 660 980 90 590 90H430C180 90 190 420 450 420H1300" stroke="#f3f0e8" strokeWidth="2" strokeDasharray="7 20" />
        <path d="M160 650L420 520L620 570" stroke="var(--art-light)" strokeWidth="2" />
        <circle cx="620" cy="570" r="18" fill="var(--art-light)" /><circle cx="620" cy="570" r="38" stroke="var(--art-light)" />
      </g>}
      {kind === 'helmet' && <g className={styles.helmetShape} transform="translate(70 -10) rotate(-12 600 400)">
        <ellipse cx="580" cy="650" rx="290" ry="25" fill="#000" opacity=".4" />
        <path d="M295 525C250 338 332 135 560 125C810 113 893 335 818 547L742 651H391Z" fill={`url(#${paint})`} stroke="var(--art-light)" strokeWidth="2" />
        <path d="M300 385C452 310 670 300 845 385L808 470C645 422 485 430 313 479Z" fill="#0a1119" stroke="#becfd5" strokeWidth="3" />
        <path d="M330 391C500 329 664 330 809 385" stroke="#d6e8ed" strokeOpacity=".55" strokeWidth="4" />
        <path d="M330 520C488 482 644 480 793 525L737 614H395Z" fill="#101c25" opacity=".82" />
        <path d="M450 167C381 217 354 258 346 307M581 153C751 156 795 243 814 308" stroke="var(--art-light)" strokeWidth="5" opacity=".6" />
        <path d="M440 553H679M456 575H663" stroke="var(--art-light)" strokeWidth="5" />
        <circle cx="332" cy="429" r="15" fill="#192732" stroke="#8ba5b1" /><circle cx="819" cy="428" r="15" fill="#192732" stroke="#8ba5b1" />
      </g>}
      {kind === 'grid' && <g transform="rotate(-18 600 400)">
        {Array.from({ length: 8 }, (_, x) => Array.from({ length: 5 }, (_, y) => <rect key={`${x}:${y}`} x={220 + x * 110} y={140 + y * 110} width="110" height="110" fill={(x + y) % 2 ? '#f3f0e8' : '#18232d'} opacity={.2 + y * .13} />))}
        <path d="M120 130V720M160 130V720" stroke="var(--art-color)" strokeWidth="12" />
      </g>}
      <g stroke="#c1d5dd" opacity=".28"><path d="M70 85H115M92 63V108M1050 695H1095M1072 673V718" /><circle cx="1020" cy="100" r="28" /><path d="M980 100H1060M1020 60V140" /></g>
    </svg>
    <span className={styles.texture} />
  </div>;
}
function Car({ paint }: { paint: string }) {
  return <g>
    <ellipse cx="610" cy="425" rx="370" ry="155" fill="#03080c" opacity=".6" />
    <path d="M370 306L542 380L815 300M370 507L542 425L815 514" stroke="#7b909a" strokeWidth="7" />
    <path d="M380 290L580 378L807 285M380 525L580 433L807 530" stroke="#141f28" strokeWidth="14" />
    {[{ x: 320, y: 238, w: 116 }, { x: 320, y: 477, w: 116 }, { x: 750, y: 240, w: 100 }, { x: 750, y: 475, w: 100 }].map(wheel => <g key={`${wheel.x}:${wheel.y}`}>
      <rect x={wheel.x} y={wheel.y} width={wheel.w} height="88" rx="18" fill="#080d13" stroke="#3b4c57" strokeWidth="3" />
      <path d={`M${wheel.x + 18} ${wheel.y + 8}v72M${wheel.x + wheel.w - 18} ${wheel.y + 8}v72`} stroke="#7b919b" strokeWidth="2" opacity=".5" />
      <path d={`M${wheel.x + 7} ${wheel.y + 20}h${wheel.w - 14}M${wheel.x + 7} ${wheel.y + 67}h${wheel.w - 14}`} stroke="var(--art-color)" strokeWidth="3" />
    </g>)}
    <path d="M307 307H348V510H307Z" fill={`url(#${paint})`} stroke="#c4d2d6" strokeWidth="2" />
    <path d="M297 304H311V513H297M334 304H348V513H334" fill="#111f29" />
    <path d="M344 372L442 330L552 331L654 362L722 385L906 393V423L720 431L655 458L551 478L440 477L344 444Z" fill={`url(#${paint})`} stroke="var(--art-light)" strokeWidth="2" />
    <path d="M350 395L465 374L515 382L536 424L478 446L349 422Z" fill="#e6e6db" opacity=".9" />
    <path d="M446 341L535 365M442 467L535 437M645 384L899 402" stroke="#f7e9df" strokeWidth="3" opacity=".7" />
    <path d="M525 360C573 342 618 358 641 393L640 424C617 455 573 466 531 444Z" fill="#101c26" stroke="#b6c7cf" strokeWidth="3" />
    <ellipse cx="574" cy="404" rx="28" ry="30" fill="#080f16" stroke="#7c939e" strokeWidth="3" />
    <path d="M555 365C624 343 678 389 644 438M574 366L597 405L642 414" stroke="#e6eceb" strokeWidth="8" strokeLinecap="round" />
    <path d="M877 320H922V493H877Z" fill={`url(#${paint})`} stroke="var(--art-light)" strokeWidth="2" />
    <path d="M884 333V480M904 326V488" stroke="#14232d" strokeWidth="7" />
    <path d="M478 344V367M477 449V473" stroke="#14242d" strokeWidth="5" />
  </g>;
}
