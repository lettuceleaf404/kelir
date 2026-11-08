import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { DarkScope, useStyles, useTheme } from '../ThemeContext';
import { dark as darkColors, font, radius, space, type } from '../theme';
import { metaLine, TYPE_LABEL } from '../format';
import { useAsync, useReloadOnFocus } from '../hooks';
import Artwork from '../components/Artwork';
import Icon from '../components/Icon';
import { Rail } from '../components/Cards';
import LibraryActions from '../components/LibraryActions';
import { Badge, Button, SectionHeader, StateView, T, TypeBadge } from '../components/ui';
import { TopBar } from './common';

function Hero({ items, width }) {
  const { c } = useTheme();
  const navigation = useNavigation();
  const [index, setIndex] = useState(0);
  const cardW = width - space[4] * 2;
  return (
    <View>
      <FlatList
        horizontal
        pagingEnabled
        data={items}
        keyExtractor={(x) => x.id}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={{ width, paddingHorizontal: space[4] }}>
            <View style={{ backgroundColor: c.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: c.border, padding: space[4], gap: 12 }}>
              <Pressable onPress={() => navigation.navigate('Detail', { slug: item.slug })} accessibilityLabel={`Detail ${item.title}`}>
                <Artwork content={item} shape="wide" width={cardW - space[4] * 2} />
              </Pressable>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                <TypeBadge type={item.type} />
                {item.access === 'premium' ? <Badge tone="premium" icon="lock">Premium</Badge> : <Badge>Gratis</Badge>}
                {item.regionName ? <Badge icon="map-pin">{item.regionName}</Badge> : null}
              </View>
              <T variant="display" accessibilityRole="header">{item.title}</T>
              <T variant="caption" color={c.text2}>{metaLine(item)} · {item.creator}</T>
              <T numberOfLines={3}>{item.synopsis}</T>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Button title="Tonton Sekarang" icon="play" onPress={() => navigation.navigate('Player', { slug: item.slug })} />
                <Button title="Detail" variant="tertiary" iconRight="chevron-right" onPress={() => navigation.navigate('Detail', { slug: item.slug })} />
              </View>
              <LibraryActions content={item} compact />
            </View>
          </View>
        )}
      />
      <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 12 }} accessibilityLabel={`Konten unggulan ${index + 1} dari ${items.length}`}>
        {items.map((it, i) => (
          <View key={it.id} style={{ width: i === index ? 28 : 12, height: 6, borderRadius: 3, backgroundColor: i === index ? c.primary : c.borderStrong }} />
        ))}
      </View>
    </View>
  );
}

const trendingStyles = (c) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: space[4] },
  rank: { fontFamily: font.extrabold, fontSize: 28, color: c.primary, width: 32, textAlign: 'center' },
  title: { fontFamily: font.bold, fontSize: 16, color: c.text },
  meta: { ...type.caption, color: c.text2 },
});

function Trending({ items }) {
  const { c } = useTheme();
  const s = useStyles(trendingStyles);
  const navigation = useNavigation();
  return (
    <View>
      {items.slice(0, 7).map((item, i) => (
        <Pressable key={item.id} onPress={() => navigation.navigate('Detail', { slug: item.slug })} style={({ pressed }) => [s.row, pressed && { backgroundColor: c.surface }]} accessibilityLabel={`Peringkat ${i + 1}, ${item.title}`}>
          <Text style={s.rank}>{i + 1}</Text>
          <Artwork content={item} shape={item.type === 'music' ? 'square' : 'poster'} width={52} showTitle={false} rounded={10} />
          <View style={{ flex: 1 }}>
            <Text style={s.title} numberOfLines={1}>{item.title}</Text>
            <Text style={s.meta} numberOfLines={1}>{TYPE_LABEL[item.type]}{item.regionName ? ` · ${item.regionName}` : ''}</Text>
          </View>
          {item.access === 'premium' ? <Icon name="lock" size={18} color={c.text2} /> : null}
        </Pressable>
      ))}
    </View>
  );
}

function Regions({ regions, width }) {
  const { c } = useTheme();
  const navigation = useNavigation();
  const tileW = (width - space[4] * 2 - 12) / 2;
  const tint = { coral: [c.softPeach, c.coral], mango: [c.warmSand, c.mango], turquoise: [c.paleMint, c.turquoise], lilac: [c.softLavender, c.lilac] };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: space[4] }}>
      {regions.map((r) => (
        <Pressable key={r.key} onPress={() => navigation.navigate('Tabs', { screen: 'Explore', params: { region: r.key } })} accessibilityLabel={`${r.name}, ${r.count} judul`} style={{ width: tileW, height: 124, borderRadius: radius.xl, padding: 14, backgroundColor: tint[r.art][0], overflow: 'hidden' }}>
          <View style={{ position: 'absolute', right: -20, bottom: -40, width: 100, height: 100, borderRadius: 50, backgroundColor: tint[r.art][1] }} />
          <Text style={{ fontFamily: font.extrabold, fontSize: 18, lineHeight: 22, color: c.ink }}>{r.name}</Text>
          <Text style={[type.caption, { color: c.ink }]}>{r.count} judul</Text>
          <View style={{ flexDirection: 'row', position: 'absolute', left: 14, bottom: 12 }}>
            {r.sample.map((item, i) => (
              <View key={item.id} style={{ marginLeft: i ? -10 : 0, borderRadius: 7, borderWidth: 2, borderColor: c.cream }}>
                <Artwork content={item} shape="poster" width={30} showTitle={false} rounded={5} />
              </View>
            ))}
          </View>
        </Pressable>
      ))}
      <Pressable onPress={() => navigation.navigate('Tabs', { screen: 'Explore' })} style={{ width: tileW, height: 124, borderRadius: radius.xl, padding: 14, backgroundColor: c.ink, justifyContent: 'space-between' }} accessibilityLabel="Semua cerita">
        <Icon name="explore" size={26} color={c.mango} />
        <View>
          <Text style={{ fontFamily: font.extrabold, fontSize: 18, color: c.cream }}>Semua cerita</Text>
          <Text style={[type.caption, { color: '#C4C0D0' }]}>Genre, bahasa, tahun</Text>
        </View>
      </Pressable>
    </View>
  );
}

function Picks({ items }) {
  const { c } = useTheme();
  const navigation = useNavigation();
  return (
    <View style={{ gap: 12, paddingHorizontal: space[4] }}>
      {items.slice(0, 4).map((item) => (
        <Pressable key={item.id} onPress={() => navigation.navigate('Detail', { slug: item.slug })} style={{ flexDirection: 'row', gap: 14, padding: 12, borderRadius: radius.xl, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, alignItems: 'center' }}>
          <Artwork content={item} shape={item.type === 'music' ? 'square' : 'poster'} width={84} rounded={12} />
          <View style={{ flex: 1, gap: 6 }}>
            <TypeBadge type={item.type} />
            <Text style={{ fontFamily: font.bold, fontSize: 17, lineHeight: 22, color: c.text }}>{item.title}</Text>
            {item.editorNote ? <T numberOfLines={2}>“{item.editorNote}”</T> : null}
            <T variant="caption" color={c.text2}>{metaLine(item, { withType: false })}{item.regionName ? ` · ${item.regionName}` : ''}</T>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const { user, isPremium } = useAuth();
  const home = useAsync(() => api.home(), [user?.id]);
  useReloadOnFocus(home.reload);
  const [refreshing, setRefreshing] = useState(false);
  const refresh = useCallback(async () => {
    setRefreshing(true);
    home.reload();
    setTimeout(() => setRefreshing(false), 600);
  }, [home]);

  const d = home.data;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar />
      {!d ? (
        <StateView loading={home.loading} error={home.error} onRetry={home.reload} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingTop: space[4], paddingBottom: space[12] }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.primary} />}>
          <Hero items={d.hero} width={width} />
          {d.continueWatching.length > 0 && (
            <View style={{ marginTop: space[12] }}>
              <SectionHeader title="Lanjutkan Menonton" />
              <Rail items={d.continueWatching} kind="video" progressFor />
            </View>
          )}
          {d.recommended?.items.length > 0 && (
            <View style={{ marginTop: space[12] }}>
              <SectionHeader title={`Untuk ${user.name.split(' ')[0]}`} subtitle="Dari genre dan daerah favoritmu" />
              <Rail items={d.recommended.items} />
            </View>
          )}
          <View style={{ marginTop: space[12] }}>
            <SectionHeader title="Trending di Nusantara" subtitle="Paling banyak ditonton dan didengar" />
            <Trending items={d.trending} />
          </View>
          <View style={{ marginTop: space[12] }}>
            <SectionHeader title="Jelajahi Cerita" subtitle="Berdasarkan latar cerita, lokasi syuting, atau asal lagu" />
            <Regions regions={d.regions} width={width} />
          </View>
          <View style={{ marginTop: space[12] }}>
            <SectionHeader title="Pilihan KELIR" subtitle="Dikurasi tim redaksi" />
            <Picks items={d.picks} />
          </View>
          <DarkScope>
          <View style={{ marginTop: space[12], paddingVertical: space[8], backgroundColor: darkColors.bg }}>
            <View style={{ paddingHorizontal: space[4], marginBottom: space[4], gap: 8 }}>
              <Text style={[type.h2, { color: darkColors.text }]}>Konten Premium</Text>
              <Text style={[type.caption, { color: darkColors.text2 }]}>Film dan serial pilihan dengan KELIR Premium</Text>
              {!isPremium ? <Button title="Langganan Premium" variant="premium" icon="sparkle" size="sm" style={{ alignSelf: 'flex-start', marginTop: 4 }} onPress={() => navigation.navigate('Premium')} /> : null}
            </View>
            <Rail items={d.premium} />
          </View>
          </DarkScope>
          <View style={{ marginTop: space[12] }}>
            <SectionHeader title="Serial Populer" action="Semua" onAction={() => navigation.navigate('Tabs', { screen: 'Watch', params: { tab: 'series' } })} />
            <Rail items={d.popularSeries} />
          </View>
          <View style={{ marginTop: space[12] }}>
            <SectionHeader title="Sorotan Musik" action="Semua" onAction={() => navigation.navigate('Tabs', { screen: 'Explore', params: { type: 'music' } })} />
            <Rail items={d.music} />
          </View>
          <View style={{ marginTop: space[12] }}>
            <SectionHeader title="Baru Ditambahkan" />
            <Rail items={d.recentlyAdded} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}
