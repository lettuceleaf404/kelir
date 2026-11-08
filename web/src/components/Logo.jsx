const WORD = 'M8 8V40M28 8L12 24L28 40M64 8H44V40H64M44 24H60M80 8V40H98M114 8V40M130 40V8H141a8 8 0 0 1 0 16H130M140 24L150 40';

/** KELIR logo: kelir screen with a rising sun and the blencong lamp, plus the rounded wordmark. Follows `color`. */
export default function Logo({ size = 32, variant = 'lockup', className, label = 'KELIR' }) {
  const mark = variant !== 'wordmark';
  const word = variant !== 'mark';
  const w = mark && word ? 234 : mark ? 64 : 158;
  const h = mark ? 64 : 48;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} height={size} width={Math.round((size * w) / h)} role="img" aria-label={label} className={['logo', className].filter(Boolean).join(' ')}>
      {mark && (
        <>
          <rect x="6" y="14" width="52" height="44" rx="14" fill="currentColor" />
          <rect x="14" y="22" width="36" height="28" rx="8" className="logo-window" />
          <path d="M22 50a10 10 0 0 1 20 0z" className="logo-sun" />
          <circle cx="32" cy="12" r="7" className="logo-lamp" />
        </>
      )}
      {word && (
        <path d={WORD} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" transform={mark ? 'translate(76 8)' : undefined} />
      )}
    </svg>
  );
}
