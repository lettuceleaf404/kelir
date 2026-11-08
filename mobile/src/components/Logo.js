import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

const WORD = 'M8 8V40M28 8L12 24L28 40M64 8H44V40H64M44 24H60M80 8V40H98M114 8V40M130 40V8H141a8 8 0 0 1 0 16H130M140 24L150 40';

/** KELIR logo: kelir screen with rising sun and blencong lamp, plus the rounded wordmark. */
export default function Logo({ size = 28, variant = 'lockup', ink = '#24243A', window = '#FFF8ED' }) {
  const mark = variant !== 'wordmark';
  const word = variant !== 'mark';
  const w = mark && word ? 234 : mark ? 64 : 158;
  const h = mark ? 64 : 48;
  return (
    <Svg width={(size * w) / h} height={size} viewBox={`0 0 ${w} ${h}`} accessibilityLabel="KELIR">
      {mark && (
        <G>
          <Rect x="6" y="14" width="52" height="44" rx="14" fill={ink} />
          <Rect x="14" y="22" width="36" height="28" rx="8" fill={window} />
          <Path d="M22 50a10 10 0 0 1 20 0z" fill="#FF7165" />
          <Circle cx="32" cy="12" r="7" fill="#FFC857" />
        </G>
      )}
      {word && <Path d={WORD} fill="none" stroke={ink} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" transform={mark ? 'translate(76 8)' : undefined} />}
    </Svg>
  );
}
