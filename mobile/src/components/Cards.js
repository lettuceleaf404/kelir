import { FlatList, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Artwork from './Artwork';
import Icon from './Icon';
import { Badge, TypeBadge } from './ui';
import { useTheme } from '../ThemeContext';
import { font, radius, space, type } from '../theme';
import { metaLine, rating, remaining } from '../format';

/** Content card from the design system: media first, metadata below. */
export function ContentCard({ content, width, kind, progress, meta, onPress }) {
  const { c } = useTheme();
  const navigation = useNavigation();
  const shape = kind || (content.type === 'music' ? 'square' : 'poster');
  const premium = content.access === 'premium';
  const open = onPress || (() => navigation.navigate('Detail', { slug: content.slug, title: content.title }));
  return (
    <Pressable onPress={open} style={({ pressed }) => [{ width, gap: 8, opacity: pressed ? 0.85 : 1 }]} accessibilityRole="button" accessibilityLabel={`${content.title}${premium ? ', Premium' : ''}`}>
      <View style={{ borderRadius: radius.lg, borderWidth: 1, borderColor: c.border }}>
        <Artwork content={content} shape={shape} rounded={radius.lg - 1} />
        <View style={{ position: 'absolute', top: 8, left: 8, right: 40, flexDirection: 'row', gap: 4 }}>
          <TypeBadge type={content.type} style={{ borderWidth: 2, borderColor: c.surface, height: 26 }} />
        </View>
        {premium ? (
          <View style={{ position: 'absolute', top: 8, right: 8, height: 26, minWidth: 26, paddingHorizontal: 5, borderRadius: 13, backgroundColor: c.premiumBg, borderWidth: 2, borderColor: c.surface, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 }}>
            <Icon name="lock" size={13} color={c.premiumFg} />
            {shape === 'video' ? <Text style={[type.label, { color: c.premiumFg }]}>Premium</Text> : null}
          </View>
        ) : null}
        {progress ? (
          <View style={{ position: 'absolute', left: 8, right: 8, bottom: 8, height: 6, borderRadius: 3, backgroundColor: c.scrim, overflow: 'hidden' }}>
            <View style={{ width: `${Math.max(3, progress.progress * 100)}%`, height: '100%', backgroundColor: c.highlight }} />
          </View>
        ) : null}
      </View>
      <View style={{ paddingHorizontal: 2, gap: 2 }}>
        <Text numberOfLines={2} style={{ fontFamily: font.bold, fontSize: 15, lineHeight: 20, color: c.text }}>{content.title}</Text>
        <Text numberOfLines={1} style={[type.caption, { color: c.text2 }]}>
          {progress ? `${progress.episode ? `Episode ${progress.episode} · ` : ''}${remaining(progress.remainingSeconds)}` : meta || metaLine(content, { withType: false })}
        </Text>
        {!progress && (content.ratingCount > 0 || content.regionName) ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {content.ratingCount > 0 ? (
              <>
                <Icon name="star" size={13} filled color={c.highlight} />
                <Text style={[type.caption, { color: c.text2 }]}>{rating(content.ratingAvg)}</Text>
              </>
            ) : (
              <Icon name="map-pin" size={13} color={c.text2} />
            )}
            {content.regionName ? <Text numberOfLines={1} style={[type.caption, { color: c.text2, flexShrink: 1 }]}>{content.ratingCount > 0 ? '· ' : ''}{content.regionName}</Text> : null}
          </View>
        ) : null}
        {!progress && content.categories?.includes('budaya') ? <Badge tone="budaya" style={{ height: 20, marginTop: 2 }}>Budaya</Badge> : null}
      </View>
    </Pressable>
  );
}

/** Horizontal list for Home sections. */
export function Rail({ items, kind, progressFor, width }) {
  const navigation = useNavigation();
  const w = width || (kind === 'video' ? 260 : 140);
  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={(x) => (x.content || x).id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: space[4], gap: space[4] }}
      renderItem={({ item }) => {
        const content = item.content || item;
        return (
          <ContentCard
            content={content}
            kind={kind}
            width={w}
            progress={progressFor ? item : undefined}
            onPress={progressFor ? () => navigation.navigate('Player', { slug: content.slug, episode: item.episode || undefined }) : undefined}
          />
        );
      }}
    />
  );
}

/** Two-column grid without FlatList nesting (used inside ScrollViews). */
export function Grid({ items, columns = 2, kind, gap = space[4], width }) {
  const cardW = (width - space[4] * 2 - gap * (columns - 1)) / columns;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap, paddingHorizontal: space[4] }}>
      {items.map((item) => (
        <ContentCard key={item.id} content={item} kind={kind} width={cardW} />
      ))}
    </View>
  );
}
