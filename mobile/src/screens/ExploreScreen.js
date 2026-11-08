import { useEffect, useRef, useState } from 'react';
import { FlatList, View, useWindowDimensions } from 'react-native';
import { api } from '../api';
import { useTheme } from '../ThemeContext';
import { radius, space } from '../theme';
import { REGIONS, TYPE_PLURAL } from '../format';
import { useAsync } from '../hooks';
import { ContentCard } from '../components/Cards';
import { Button, Chips, Sheet, StateView, T, TextField } from '../components/ui';
import { TopBar } from './common';

const SORTS = [
  { value: '', label: 'Terpopuler' },
  { value: 'rating', label: 'Rating' },
  { value: 'newest', label: 'Terbaru' },
  { value: 'title', label: 'A–Z' },
];
const EMPTY = { q: '', type: '', region: '', genre: '', access: '', origin: '', minRating: '', category: '', yearFrom: '', sort: '' };

export default function ExploreScreen({ route }) {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const [f, setF] = useState(EMPTY);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [sheet, setSheet] = useState(false);
  const searchRef = useRef(null);
  const meta = useAsync(() => api.filters(), []);

  // Deep links from Home: region tiles, "Sorotan Musik", search icon
  useEffect(() => {
    const p = route.params || {};
    if (p.region || p.type) setF({ ...EMPTY, region: p.region || '', type: p.type || '' });
    if (p.focusSearch) setTimeout(() => searchRef.current?.focus(), 300);
  }, [route.params]);

  const key = JSON.stringify(f);
  useEffect(() => setPage(1), [key]);
  const result = useAsync(() => api.contents({ ...f, page, limit: 24 }), [key, page]);
  useEffect(() => {
    if (result.data) setItems((prev) => (result.data.page === 1 ? result.data.items : [...prev, ...result.data.items]));
  }, [result.data]);

  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const region = REGIONS.find((r) => r.key === f.region);
  const active = Object.entries(f).filter(([k, v]) => v && !['q', 'sort', 'region'].includes(k)).length;
  const cardW = (width - space[4] * 2 - space[4]) / 2;
  const decades = meta.data ? Array.from({ length: Math.floor((meta.data.years.max - 1930) / 10) + 1 }, (_, i) => 1930 + i * 10) : [];

  const header = (
    <View style={{ gap: space[4], paddingTop: space[4], paddingBottom: space[4] }}>
      <View style={{ paddingHorizontal: space[4], gap: 4 }}>
        {region ? (
          <View style={{ backgroundColor: { coral: c.softPeach, mango: c.warmSand, turquoise: c.paleMint, lilac: c.softLavender }[region.art], borderRadius: radius.xl, padding: space[4], gap: 6 }}>
            <T variant="label" color={c.ink}>JELAJAHI DAERAH</T>
            <T variant="h1" color={c.ink}>{region.name}</T>
            <T color={c.ink}>Judul yang berlatar, diambil gambarnya, atau berasal dari {region.name}.</T>
          </View>
        ) : (
          <>
            <T variant="h1" accessibilityRole="header">Temukan cerita</T>
            <T color={c.text2}>Cari per jenis, daerah, genre, tahun, dan rating.</T>
          </>
        )}
      </View>
      <View style={{ paddingHorizontal: space[4] }}>
        <TextField ref={searchRef} icon="search" placeholder="Judul, kreator, pemeran, tempat" value={query} onChangeText={setQuery} onSubmitEditing={() => set('q', query.trim())} returnKeyType="search" accessibilityLabel="Cari" />
      </View>
      <Chips scroll label="Daerah" value={f.region} onChange={(v) => set('region', v)} options={(meta.data?.regions || REGIONS.map((r) => ({ value: r.key, name: r.name }))).map((r) => ({ value: r.value || r.key, label: r.name, count: r.count, icon: 'map-pin' }))} />
      <Chips scroll label="Jenis" value={f.type} onChange={(v) => set('type', v)} options={['film', 'series', 'documentary', 'music'].map((t) => ({ value: t, label: TYPE_PLURAL[t] }))} />
      <View style={{ flexDirection: 'row', paddingHorizontal: space[4], gap: 8, alignItems: 'center' }}>
        <Button title={`Filter${active ? ` (${active})` : ''}`} icon="filter" variant="secondary" size="sm" onPress={() => setSheet(true)} />
        <View style={{ flex: 1 }}>
          <Chips scroll label="Urutkan" value={f.sort} onChange={(v) => set('sort', v)} options={SORTS.filter((s) => s.value)} />
        </View>
      </View>
      {result.data ? <T variant="caption" color={c.text2} style={{ paddingHorizontal: space[4] }}>{result.data.total} judul{f.q ? ` untuk “${f.q}”` : ''}</T> : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar title="Explore" />
      <FlatList
        data={items}
        keyExtractor={(x) => x.id}
        numColumns={2}
        ListHeaderComponent={header}
        columnWrapperStyle={{ gap: space[4], paddingHorizontal: space[4] }}
        contentContainerStyle={{ gap: space[6], paddingBottom: space[12] }}
        renderItem={({ item }) => <ContentCard content={item} width={cardW} />}
        onEndReachedThreshold={0.5}
        onEndReached={() => result.data && !result.loading && result.data.page < result.data.totalPages && setPage((p) => p + 1)}
        ListEmptyComponent={
          <StateView loading={result.loading} error={result.error} onRetry={result.reload} empty emptyIcon="search" emptyTitle="Tidak ada yang cocok" emptyText="Coba kata kunci lain atau longgarkan filter." action={<Button title="Hapus filter" variant="secondary" size="sm" onPress={() => { setQuery(''); setF(EMPTY); }} />} />
        }
      />
      <Sheet visible={sheet} onClose={() => setSheet(false)} title="Filter" footer={<><Button title="Hapus semua" variant="tertiary" onPress={() => setF({ ...EMPTY, q: f.q, region: f.region })} /><Button title="Terapkan" onPress={() => setSheet(false)} /></>}>
        <T variant="label">Akses</T>
        <Chips value={f.access} onChange={(v) => set('access', v)} options={[{ value: 'free', label: 'Gratis' }, { value: 'premium', label: 'Premium', icon: 'lock' }]} />
        <T variant="label">Asal</T>
        <Chips value={f.origin} onChange={(v) => set('origin', v)} options={[{ value: 'nusantara', label: 'Nusantara' }, { value: 'internasional', label: 'Internasional' }]} />
        <T variant="label">Genre</T>
        <Chips value={f.genre} onChange={(v) => set('genre', v)} options={(meta.data?.genres || []).map((g) => ({ value: g.value, label: g.value }))} />
        <T variant="label">Rilis sejak</T>
        <Chips value={f.yearFrom} onChange={(v) => set('yearFrom', v)} options={decades.map((y) => ({ value: String(y), label: `${y}-an` }))} />
        <T variant="label">Rating minimal</T>
        <Chips value={f.minRating} onChange={(v) => set('minRating', v)} options={[{ value: '4', label: '4+' }, { value: '4.5', label: '4,5+' }].map((o) => ({ ...o, icon: 'star' }))} />
        <T variant="label">Lainnya</T>
        <Chips value={f.category} onChange={(v) => set('category', v)} options={[{ value: 'budaya', label: 'Budaya' }]} />
      </Sheet>
    </View>
  );
}
