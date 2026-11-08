import { useLayoutEffect, useState } from 'react';
import { Alert, Platform, ScrollView, View, useWindowDimensions } from 'react-native';
import { api } from '../api';
import { useTheme } from '../ThemeContext';
import { space } from '../theme';
import { useAsync } from '../hooks';
import { ContentCard } from '../components/Cards';
import { Button, IconButton, Sheet, StateView, T, TextField } from '../components/ui';

export default function CollectionDetailScreen({ route, navigation }) {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const col = useAsync(() => api.collection(route.params.id), [route.params.id]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  useLayoutEffect(() => {
    navigation.setOptions({ title: col.data?.collection.name || 'Koleksi' });
  }, [navigation, col.data]);
  if (!col.data) return <View style={{ flex: 1, backgroundColor: c.bg }}><StateView loading={col.loading} error={col.error} /></View>;
  const { collection } = col.data;
  const cardW = (width - space[4] * 3) / 2;

  const remove = async (id) => col.setData(await api.setInCollection(collection.id, id, false));
  const save = async () => {
    col.setData(await api.updateCollection(collection.id, form));
    setEditing(false);
  };
  const destroy = () => {
    const go = async () => {
      await api.deleteCollection(collection.id);
      navigation.goBack();
    };
    if (Platform.OS === 'web') return go();
    Alert.alert('Hapus koleksi?', `“${collection.name}” akan dihapus. Judul-judulnya tetap ada di KELIR.`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: go },
    ]);
  };

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: space[4], gap: space[4], paddingBottom: space[12] }}>
      <View style={{ gap: 4 }}>
        <T variant="h1">{collection.name}</T>
        <T color={c.text2}>{collection.description || 'Tanpa deskripsi'} · {collection.itemCount} judul</T>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button title="Ubah" icon="edit" variant="secondary" size="sm" onPress={() => { setForm({ name: collection.name, description: collection.description }); setEditing(true); }} />
        <Button title="Hapus" icon="trash" variant="tertiary" size="sm" onPress={destroy} />
      </View>
      {collection.items.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[4] }}>
          {collection.items.map((item) => (
            <View key={item.id}>
              <ContentCard content={item} width={cardW} />
              <IconButton icon="close" label={`Keluarkan ${item.title}`} onPress={() => remove(item.id)} style={{ position: 'absolute', top: 36, right: 4, backgroundColor: c.surface, width: 36, height: 36 }} size={18} />
            </View>
          ))}
        </View>
      ) : (
        <StateView empty emptyIcon="grid" emptyTitle="Koleksi ini masih kosong" emptyText="Buka halaman judul mana pun lalu pilih “Koleksi”." />
      )}
      <Sheet visible={editing} onClose={() => setEditing(false)} title="Ubah koleksi" footer={<Button title="Simpan" onPress={save} />}>
        <TextField label="Nama" maxLength={60} value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
        <TextField label="Deskripsi" multiline maxLength={200} value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} />
      </Sheet>
    </ScrollView>
  );
}
