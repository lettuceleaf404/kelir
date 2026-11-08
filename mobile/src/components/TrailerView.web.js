import { Linking, Text, View } from 'react-native';
import Icon from './Icon';
import { Button } from './ui';
import { useTheme } from '../ThemeContext';
import { radius, type } from '../theme';

/** Web preview (npm run web): a plain iframe instead of react-native-webview. */
export default function TrailerView({ content, width }) {
  const { c } = useTheme();
  const height = Math.round((width * 9) / 16);
  if (!content.trailerYoutubeId) {
    return (
      <View style={{ width, height, borderRadius: radius.lg, backgroundColor: c.ink, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16 }}>
        <Icon name="play" size={28} color={c.mango} />
        <Text style={[type.body, { color: c.cream, textAlign: 'center' }]}>{content.type === 'music' ? 'Video resmi' : 'Trailer resmi'} belum ditautkan.</Text>
        <Button title="Cari di YouTube" variant="secondary" size="sm" iconRight="external" onPress={() => Linking.openURL(content.trailerSearchUrl)} />
      </View>
    );
  }
  return (
    <View style={{ width, height, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#000' }}>
      <iframe title={`Trailer ${content.title}`} src={`https://www.youtube-nocookie.com/embed/${content.trailerYoutubeId}?rel=0`} style={{ border: 0, width: '100%', height: '100%' }} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
    </View>
  );
}
