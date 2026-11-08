import { useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { font, radius, space } from '../theme';
import { TYPE_PLURAL } from '../format';
import { useAsync, useReloadOnFocus } from '../hooks';
import Artwork from '../components/Artwork';
import { ContentCard, Grid } from '../components/Cards';
import { Button, Chips, Sheet, StateView, T, Tabs, TextField } from '../components/ui';
import { TopBar } from './common';

const TABS = [
  { value: 'favorites', label: 'Favorit' },
  { value: 'watchlist', label: 'Watchlist' },
  { value: 'progress', label: 'Lanjutkan' },
  { value: 'watched', label: 'Ditonton' },
  { value: 'collections', label: 'Koleksi saya' },
];
const EMPTY = {
  favorites: ['Belum ada favorit', 'Ketuk ikon hati di halaman judul untuk menyimpannya di sini.'],
  watchlist: ['Watchlist masih kosong', 'Simpan judul yang ingin kamu tonton nanti.'],
  watched: ['Belum ada yang ditonton', 'Judul yang selesai ditonton atau kamu tandai akan muncul di sini.'],
  progress: ['Tidak ada tontonan tertunda', 'Mulai menonton, KELIR akan mengingat posisimu.'],
};

function Collections({ navigation, width }) {
  const { c } = useTheme();
  const list = useAsync(() => api.collections(), []);
  useReloadOnFocus(list.reload);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [status, setStatus] = useState({ busy: false, error: null });
  const create = async () => {
    setStatus({ busy: true, error: null });
    try {
      const { collection } = await api.createCollection(form);
      setOpen(false);
      setForm({ name: '', description: '' });
      setStatus({ busy: false, error: null });
      navigation.navigate('CollectionDetail', { id: collection.id });
    } catch (error) {
      setStatus({ busy: false, error });
    }
  };
  if (!list.data) return <StateView loading={list.loading} error={list.error} onRetry={list.reload} />;
  const tileW = (width - space[4] * 2 - 12) / 2;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: space[4] }}>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" style={{ width: tileW, minHeight: 170, borderRadius: radius.xl, borderWidth: 2, borderStyle: 'dashed', borderColor: c.borderStrong, padding: 14, justifyContent: 'center', gap: 6 }}>
        <View style={{ width: 44, height: 44, borderTopLeftRadius: 22, borderTopRightRadius: 22, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, backgroundColor: c.turquoise, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: font.extrabold, fontSize: 26, color: c.ink }}>+</Text>
        </View>
        <T style={{ fontFamily: font.bold }}>Koleksi baru</T>
        <T variant="caption" color={c.text2}>Kelompokkan judul sesukamu</T>
      </Pressable>
      {list.data.items.map((col) => (
        <Pressable key={col.id} onPress={() => navigation.navigate('CollectionDetail', { id: col.id })} style={{ width: tileW, borderRadius: radius.xl, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, padding: 10, gap: 6 }}>
          <View style={{ flexDirection: 'row', gap: 3 }}>
            {[0, 1, 2].map((i) => (col.items[i] ? <Artwork key={i} content={col.items[i]} shape="poster" width={(tileW - 26) / 3} showTitle={false} rounded={6} /> : <View key={i} style={{ width: (tileW - 26) / 3, aspectRatio: 2 / 3, borderRadius: 6, backgroundColor: c.surface2 }} />))}
          </View>
          <T style={{ fontFamily: font.bold }} numberOfLines={1}>{col.name}</T>
          <T variant="caption" color={c.text2}>{col.itemCount} judul</T>
        </Pressable>
      ))}
      <Sheet visible={open} onClose={() => setOpen(false)} title="Koleksi baru" footer={<Button title="Buat koleksi" busy={status.busy} onPress={create} />}>
        <TextField label="Nama" maxLength={60} value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} placeholder="Misal: Film tentang laut" error={status.error?.fieldError?.('name') || (status.error && !status.error.fields?.length ? status.error.message : undefined)} />
        <TextField label="Deskripsi (opsional)" multiline maxLength={200} value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} />
      </Sheet>
    </View>
  );
}

export default function CollectionScreen({ navigation }) {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const [tab, setTab] = useState('favorites');
  const [type, setType] = useState('');
  const library = useAsync(() => (user ? api.library() : Promise.resolve(null)), [user?.id, user?.favorites?.length, user?.watchlist?.length, user?.watched?.length]);
  const progress = useAsync(() => (user ? api.progress() : Promise.resolve(null)), [user?.id, tab]);
  useReloadOnFocus(library.reload);

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <TopBar title="Collection" />
        <StateView empty emptyIcon="collection" emptyTitle="Koleksimu menunggu" emptyText="Masuk untuk menyimpan favorit, watchlist, dan koleksi kustom." action={<Button title="Masuk" onPress={() => navigation.navigate('Login')} />} />
      </View>
    );
  }
  const items = library.data?.[tab] || [];
  const filtered = type ? items.filter((x) => x.type === type) : items;
  const counts = { favorites: library.data?.favorites.length, watchlist: library.data?.watchlist.length, watched: library.data?.watched.length };
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar title="Collection" />
      <ScrollView contentContainerStyle={{ paddingBottom: space[12], gap: space[4] }} stickyHeaderIndices={[0]}>
        <View style={{ backgroundColor: c.bg }}>
          <Tabs tabs={TABS.map((t) => ({ ...t, count: counts[t.value] }))} value={tab} onChange={(v) => { setTab(v); setType(''); }} />
        </View>
        {tab === 'collections' ? (
          <Collections navigation={navigation} width={width} />
        ) : tab === 'progress' ? (
          progress.data?.items.length ? (
            <View style={{ gap: space[6], paddingHorizontal: space[4] }}>
              {progress.data.items.map((p) => (
                <ContentCard key={p.contentId} content={p.content} kind="video" width={width - space[4] * 2} progress={p} onPress={() => navigation.navigate('Player', { slug: p.content.slug, episode: p.episode || undefined })} />
              ))}
            </View>
          ) : (
            <StateView loading={progress.loading} empty emptyIcon="play" emptyTitle={EMPTY.progress[0]} emptyText={EMPTY.progress[1]} />
          )
        ) : !library.data ? (
          <StateView loading={library.loading} error={library.error} onRetry={library.reload} />
        ) : (
          <>
            {items.length ? <Chips scroll label="Jenis" value={type} onChange={setType} options={['film', 'series', 'documentary', 'music'].filter((t) => items.some((x) => x.type === t)).map((t) => ({ value: t, label: TYPE_PLURAL[t], count: items.filter((x) => x.type === t).length }))} /> : null}
            {filtered.length ? <Grid items={filtered} width={width} /> : <StateView empty emptyIcon="heart" emptyTitle={EMPTY[tab][0]} emptyText={EMPTY[tab][1]} action={<Button title="Jelajahi konten" variant="secondary" onPress={() => navigation.navigate('Explore')} />} />}
          </>
        )}
      </ScrollView>
    </View>
  );
}
