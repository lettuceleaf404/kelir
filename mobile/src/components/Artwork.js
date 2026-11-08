import { Image, Text, View } from 'react-native';
import { useTheme } from '../ThemeContext';
import { font, radius } from '../theme';

const RATIO = { poster: 2 / 3, video: 16 / 9, wide: 16 / 9, square: 1 };

/**
 * Official poster when an admin added one; otherwise KELIR's placeholder artwork:
 * a flat palette field, a half-disc rising from the bottom edge, and the title.
 */
export default function Artwork({ content, shape = 'poster', width, showTitle = true, style, rounded = radius.lg }) {
  const { c } = useTheme();
  const ratio = RATIO[shape];
  const box = [{ width: width || '100%', aspectRatio: ratio, borderRadius: rounded, overflow: 'hidden' }, style];
  if (content.posterUrl) {
    return <Image source={{ uri: content.posterUrl }} style={[box, { backgroundColor: c.surface2 }]} resizeMode="cover" accessibilityIgnoresInvertColors />;
  }
  const tone = {
    coral: [c.coral, c.mango, c.ink],
    mango: [c.mango, c.coral, c.ink],
    turquoise: [c.turquoise, c.mango, c.ink],
    lilac: [c.lilac, c.softLavender, c.ink],
    ink: [c.ink, c.coral, c.cream],
  }[content.art || 'coral'];
  const sunInset = shape === 'poster' ? '16%' : shape === 'square' ? '22%' : '32%';
  const small = width && width < 90;
  return (
    <View style={[box, { backgroundColor: tone[0] }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {showTitle && !small ? (
        <Text numberOfLines={4} style={{ position: 'absolute', left: 12, right: shape === 'poster' || shape === 'square' ? 12 : '30%', top: 36, fontFamily: font.extrabold, fontSize: shape === 'wide' ? 26 : 17, lineHeight: shape === 'wide' ? 30 : 21, color: tone[2] }}>
          {content.title}
        </Text>
      ) : null}
      <View style={{ position: 'absolute', left: sunInset, right: sunInset, bottom: 0, aspectRatio: 2, borderTopLeftRadius: 999, borderTopRightRadius: 999, backgroundColor: tone[1] }} />
    </View>
  );
}
