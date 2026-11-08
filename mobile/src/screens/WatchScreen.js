import { useEffect, useState } from 'react';
import { FlatList, View, useWindowDimensions } from 'react-native';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { space } from '../theme';
import { useAsync, useReloadOnFocus } from '../hooks';
import { ContentCard, Rail } from '../components/Cards';
import { Button, Chips, SectionHeader, StateView, T, Tabs } from '../components/ui';
import { TopBar } from './common';

const TABS = [
  { value: '', label: 'Semua' },
  { value: 'film', label: 'Film' },
  { value: 'series', label: 'Serial' },
  { value: 'documentary', label: 'Dokumenter' },
  { value: 'trailer', label: 'Trailer' },
];

export default function WatchScreen({ navigation, route }) {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const { user, isPremium } = useAuth();
  const [tab, setTab] = useState('');
  const [access, setAccess] = useState('');
  useEffect(() => {
    if (route.params?.tab) setTab(route.params.tab);
  }, [route.params]);
  const list = useAsync(() => api.contents({ type: !tab || tab === 'trailer' ? 'film,series,documentary' : tab, hasTrailer: tab === 'trailer' ? '1' : '', access, limit: 60 }), [tab, access]);
  const progress = useAsync(() => (user ? api.progress() : Promise.resolve({ items: [] })), [user?.id]);
  useReloadOnFocus(progress.reload);

  const header = (
    <View style={{ gap: space[4], paddingBottom: space[4] }}>
      <View style={{ paddingHorizontal: space[4], paddingTop: space[4], gap: 6 }}>
        <T variant="h1" accessibilityRole="header">Film, serial, dokumenter</T>
        <T color={c.text2}>Gratis bisa ditonton semua akun. Premium butuh langganan.</T>
        {!isPremium ? <Button title="Buka semua dengan Premium" variant="premium" icon="sparkle" size="sm" style={{ alignSelf: 'flex-start', marginTop: 4 }} onPress={() => navigation.navigate('Premium')} /> : null}
      </View>
      {progress.data?.items.length ? (
        <View>
          <SectionHeader title="Lanjutkan Menonton" />
          <Rail items={progress.data.items} kind="video" progressFor />
        </View>
      ) : null}
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      <Chips scroll label="Akses" value={access} onChange={setAccess} options={[{ value: 'free', label: 'Gratis' }, { value: 'premium', label: 'Premium', icon: 'lock' }]} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar title="Watch" />
      <FlatList
        data={list.data?.items || []}
        keyExtractor={(x) => x.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ gap: space[6], paddingBottom: space[12] }}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: space[4] }}>
            <ContentCard content={item} kind="video" width={width - space[4] * 2} meta={tab === 'trailer' ? 'Trailer resmi · YouTube' : undefined} />
          </View>
        )}
        ListEmptyComponent={<StateView loading={list.loading} error={list.error} onRetry={list.reload} empty emptyIcon="watch" emptyTitle="Belum ada video di sini" emptyText="Coba tab atau filter akses lain." />}
      />
    </View>
  );
}
