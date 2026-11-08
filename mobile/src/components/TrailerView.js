import { Linking, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from './Icon';
import { Button } from './ui';
import { useTheme } from '../ThemeContext';
import { font, radius, type } from '../theme';

/**
 * YouTube trailer in a WebView. The iframe is loaded from inline HTML with an https base URL,
 * because YouTube refuses embeds that arrive without a referring origin.
 */
export default function TrailerView({ content, width }) {
  const { c } = useTheme();
  const height = Math.round((width * 9) / 16);
  const open = () => Linking.openURL(content.trailerYoutubeId ? `https://www.youtube.com/watch?v=${content.trailerYoutubeId}` : content.trailerSearchUrl);
  if (!content.trailerYoutubeId) {
    return (
      <View style={{ width, height, borderRadius: radius.lg, backgroundColor: c.ink, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16 }}>
        <Icon name="play" size={28} color={c.mango} />
        <Text style={[type.body, { color: c.cream, textAlign: 'center' }]}>{content.type === 'music' ? 'Video resmi' : 'Trailer resmi'} belum ditautkan.</Text>
        <Button title="Cari di YouTube" variant="secondary" size="sm" iconRight="external" onPress={open} />
      </View>
    );
  }
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;background:#000;height:100%}iframe{border:0;width:100%;height:100%}</style></head>
<body><iframe src="https://www.youtube-nocookie.com/embed/${content.trailerYoutubeId}?playsinline=1&rel=0"
allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></body></html>`;
  return (
    <View style={{ gap: 8 }}>
      <View style={{ width, height, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#000' }}>
        <WebView source={{ html, baseUrl: 'https://kelir.app' }} allowsFullscreenVideo allowsInlineMediaPlayback mediaPlaybackRequiresUserAction style={{ backgroundColor: '#000' }} />
      </View>
      <Text onPress={open} accessibilityRole="link" style={{ fontFamily: font.bold, fontSize: 13, color: c.secondary }}>Tidak bisa diputar? Buka di YouTube</Text>
    </View>
  );
}
