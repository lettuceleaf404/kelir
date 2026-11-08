import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from './Icon';
import { Button, Checkbox, Sheet, StateView, T } from './ui';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { font, radius } from '../theme';
import { api } from '../api';

/** Favorite, Watchlist and Watched toggles plus "Koleksi". Guests are sent to sign in. */
export default function LibraryActions({ content, compact }) {
  const { c } = useTheme();
  const { user, inList, toggleList } = useAuth();
  const navigation = useNavigation();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [picker, setPicker] = useState(false);
  const music = content.type === 'music';

  const toggle = async (list) => {
    if (!user) return navigation.navigate('Login');
    setBusy(list);
    setError(null);
    try {
      await toggleList(list, content.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };
  const items = [
    { list: 'favorites', label: 'Favorit', icon: 'heart' },
    { list: 'watchlist', label: 'Watchlist', icon: music ? 'list' : 'plus' },
    { list: 'watched', label: music ? 'Didengar' : 'Ditonton', icon: 'check' },
  ];
  const chip = (on) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: compact ? 12 : 14, borderRadius: 999, borderWidth: 2, borderColor: on ? c.lilac : c.border, backgroundColor: on ? c.softLavender : c.surface });
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {items.map((it) => {
          const on = inList(it.list, content.id);
          return (
            <Pressable key={it.list} onPress={() => toggle(it.list)} disabled={busy === it.list} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={it.label} style={chip(on)}>
              <Icon name={it.icon} size={18} color={on && it.list === 'favorites' ? c.darkCoral : on ? c.ink : c.text} filled={on && it.list === 'favorites'} />
              {!compact ? <Text style={{ fontFamily: font.bold, fontSize: 14, color: on ? c.ink : c.text }}>{it.label}</Text> : null}
            </Pressable>
          );
        })}
        <Pressable onPress={() => (user ? setPicker(true) : navigation.navigate('Login'))} accessibilityRole="button" accessibilityLabel="Tambah ke koleksi" style={chip(false)}>
          <Icon name="grid" size={18} color={c.text} />
          {!compact ? <Text style={{ fontFamily: font.bold, fontSize: 14, color: c.text }}>Koleksi</Text> : null}
        </Pressable>
      </View>
      {error ? <T variant="caption" color={c.error}>{error}</T> : null}
      {picker ? <CollectionPicker content={content} onClose={() => setPicker(false)} /> : null}
    </View>
  );
}

function CollectionPicker({ content, onClose }) {
  const { c } = useTheme();
  const [state, setState] = useState({ loading: true, items: [], error: null });
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api.collections().then((r) => setState({ loading: false, items: r.items, error: null })).catch((error) => setState({ loading: false, items: [], error }));
  }, []);
  const has = (col) => col.items.some((i) => i.id === content.id);
  const toggle = async (col) => {
    const res = await api.setInCollection(col.id, content.id, !has(col));
    setState((s) => ({ ...s, items: s.items.map((x) => (x.id === col.id ? res.collection : x)) }));
  };
  const create = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const { collection } = await api.createCollection({ name });
      const res = await api.setInCollection(collection.id, content.id, true);
      setState((s) => ({ ...s, items: [res.collection, ...s.items] }));
      setName('');
    } catch (error) {
      setState((s) => ({ ...s, error }));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Sheet visible onClose={onClose} title="Tambah ke koleksi" footer={<Button title="Selesai" variant="secondary" onPress={onClose} />}>
      {state.loading ? <StateView loading /> : null}
      {!state.loading && state.items.length === 0 ? <T color={c.text2}>Belum ada koleksi. Buat yang pertama di bawah.</T> : null}
      {state.items.map((col) => (
        <Checkbox key={col.id} checked={has(col)} onChange={() => toggle(col)}>
          <T style={{ fontFamily: font.bold }}>{col.name}</T>
          <T variant="caption" color={c.text2}>{col.itemCount} judul</T>
        </Checkbox>
      ))}
      <View style={{ gap: 8 }}>
        <T variant="caption" style={{ fontFamily: font.bold }}>Koleksi baru</T>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput value={name} onChangeText={setName} maxLength={60} placeholder="Misal: Film tentang laut" placeholderTextColor={c.text2} accessibilityLabel="Nama koleksi baru" style={{ flex: 1, height: 48, borderRadius: radius.md, borderWidth: 2, borderColor: c.borderStrong, paddingHorizontal: 14, fontFamily: font.regular, fontSize: 16, color: c.text, backgroundColor: c.surface }} />
          <Button title="Buat" icon="plus" variant="secondary" busy={saving} onPress={create} />
        </View>
      </View>
      {state.error ? <T color={c.error}>{state.error.message}</T> : null}
    </Sheet>
  );
}
