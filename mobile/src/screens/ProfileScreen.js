import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { font, space } from '../theme';
import { date, REGIONS, SUB_LABEL } from '../format';
import { useAsync, useReloadOnFocus } from '../hooks';
import Artwork from '../components/Artwork';
import { Avatar, AVATAR_TONES, Badge, Button, Chips, Panel, Sheet, StateView, Stars, T, TextField } from '../components/ui';
import { TopBar } from './common';

function Subscription({ navigation }) {
  const { c } = useTheme();
  const { user, setUser } = useAuth();
  const sub = user.subscription;
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const cancel = async () => {
    setBusy(true);
    try {
      setUser((await api.cancelSubscription()).user);
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  };
  const text = {
    FREE: 'Kamu bisa menonton semua konten Gratis. Premium membuka seluruh film dan serial.',
    ACTIVE: `Paket ${sub.plan === 'annual' ? 'Tahunan' : 'Bulanan'} aktif sampai ${date(sub.expiresAt)} (perpanjangan otomatis, simulasi).`,
    CANCELLED: `Perpanjangan dihentikan. Premium tetap aktif sampai ${date(sub.expiresAt)}.`,
    EXPIRED: `Premium berakhir pada ${date(sub.expiresAt)}. Konten Premium terkunci lagi.`,
  }[sub.status];
  const ink = sub.isPremium;
  return (
    <Panel style={ink ? { backgroundColor: c.ink, borderColor: c.ink } : null}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <T variant="label" color={ink ? '#C4C0D0' : c.text2}>LANGGANAN</T>
          <T variant="h2" color={ink ? c.cream : c.text}>{sub.isPremium ? 'KELIR Premium' : 'Akun Gratis'}</T>
        </View>
        <Badge tone={sub.isPremium ? 'premium' : 'neutral'} style={sub.isPremium ? { backgroundColor: c.mango } : null}>{SUB_LABEL[sub.status]}</Badge>
      </View>
      <T color={ink ? c.cream : c.text}>{text}</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {sub.status !== 'ACTIVE' ? <Button title={sub.status === 'FREE' ? 'Langganan Premium' : 'Langganan lagi'} variant="premium" icon="sparkle" onPress={() => navigation.navigate('Premium')} /> : null}
        {sub.status === 'ACTIVE' ? <Button title="Batalkan perpanjangan" variant="secondary" size="sm" onPress={() => setConfirm(true)} /> : null}
        <Button title="Riwayat" variant="tertiary" size="sm" style={ink ? { backgroundColor: '#303047' } : null} onPress={() => navigation.navigate('Premium')} />
      </View>
      <Sheet visible={confirm} onClose={() => setConfirm(false)} title="Hentikan perpanjangan?" footer={<><Button title="Tidak jadi" variant="tertiary" onPress={() => setConfirm(false)} /><Button title="Ya, hentikan" busy={busy} onPress={cancel} /></>}>
        <T>Premium tetap bisa dipakai sampai {date(sub.expiresAt)}. Setelah itu akunmu kembali ke Gratis.</T>
      </Sheet>
    </Panel>
  );
}

function EditProfile() {
  const { c } = useTheme();
  const { user, setUser } = useAuth();
  const filters = useAsync(() => api.filters(), []);
  const [form, setForm] = useState({ name: user.name, bio: user.bio || '', avatar: user.avatar, favoriteGenres: user.favoriteGenres, favoriteRegions: user.favoriteRegions });
  const [status, setStatus] = useState({ busy: false, error: null, saved: false });
  const save = async () => {
    setStatus({ busy: true, error: null, saved: false });
    try {
      setUser((await api.updateMe(form)).user);
      setStatus({ busy: false, error: null, saved: true });
    } catch (error) {
      setStatus({ busy: false, error, saved: false });
    }
  };
  return (
    <Panel>
      <T variant="h3">Profil & preferensi</T>
      <T variant="label">Foto profil</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {AVATAR_TONES.map((tone) => (
          <Pressable key={tone} onPress={() => setForm({ ...form, avatar: tone })} accessibilityRole="radio" accessibilityState={{ selected: form.avatar === tone }} accessibilityLabel={`Warna ${tone}`} style={{ padding: 2, borderRadius: 26, borderWidth: 3, borderColor: form.avatar === tone ? c.text : 'transparent' }}>
            <Avatar user={{ name: form.name, avatar: tone }} size={40} />
          </Pressable>
        ))}
      </View>
      <TextField label="Nama" maxLength={60} value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} error={status.error?.fieldError?.('name')} />
      <TextField label="Bio" multiline maxLength={160} value={form.bio} onChangeText={(t) => setForm({ ...form, bio: t })} hint="Maksimal 160 karakter." />
      <T variant="label">Genre favorit</T>
      <Chips multiple value={form.favoriteGenres} onChange={(v) => setForm({ ...form, favoriteGenres: v })} options={(filters.data?.genres || []).map((g) => ({ value: g.value, label: g.value }))} />
      <T variant="label">Daerah yang ingin dijelajahi</T>
      <Chips multiple value={form.favoriteRegions} onChange={(v) => setForm({ ...form, favoriteRegions: v })} options={REGIONS.map((r) => ({ value: r.key, label: r.name }))} />
      {status.saved ? <T variant="caption" color={c.success}>Tersimpan. Rekomendasi di Home ikut diperbarui.</T> : null}
      {status.error && !status.error.fields?.length ? <T variant="caption" color={c.error}>{status.error.message}</T> : null}
      <Button title="Simpan profil" busy={status.busy} onPress={save} style={{ alignSelf: 'flex-start' }} />
    </Panel>
  );
}

function History({ navigation }) {
  const { c } = useTheme();
  const list = useAsync(() => api.myReviews(), []);
  useReloadOnFocus(list.reload);
  return (
    <Panel>
      <T variant="h3">Riwayat ulasan & rating</T>
      {!list.data ? <StateView loading={list.loading} error={list.error} /> : list.data.items.length ? list.data.items.slice(0, 8).map((r) => (
        <Pressable key={r.id} onPress={() => navigation.navigate('Detail', { slug: r.content.slug })} style={{ flexDirection: 'row', gap: 12 }}>
          <Artwork content={r.content} shape={r.content.type === 'music' ? 'square' : 'poster'} width={44} showTitle={false} rounded={8} />
          <View style={{ flex: 1, gap: 2 }}>
            <T style={{ fontFamily: font.bold }}>{r.content.title}</T>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><Stars value={r.rating} size={12} /><T variant="caption" color={c.text2}>{date(r.updatedAt)}</T></View>
            {r.hidden ? <Badge>Disembunyikan moderator</Badge> : null}
            {r.comment ? <T variant="caption" color={c.text2} numberOfLines={2}>“{r.comment}”</T> : null}
          </View>
        </Pressable>
      )) : <T color={c.text2}>Rating dan ulasan yang kamu tulis akan tersimpan di sini.</T>}
    </Panel>
  );
}

function Settings() {
  const { c, pref, setPref } = useTheme();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [status, setStatus] = useState({ busy: false, error: null, saved: false });
  const change = async () => {
    setStatus({ busy: true, error: null, saved: false });
    try {
      await api.changePassword(form);
      setForm({ currentPassword: '', newPassword: '' });
      setStatus({ busy: false, error: null, saved: true });
    } catch (error) {
      setStatus({ busy: false, error, saved: false });
    }
  };
  return (
    <Panel>
      <T variant="h3">Tampilan & keamanan</T>
      <Chips value={pref} onChange={(v) => setPref(v || 'light')} options={[{ value: 'light', label: 'Terang', icon: 'sun' }, { value: 'dark', label: 'Gelap', icon: 'moon' }, { value: 'system', label: 'Ikuti perangkat' }]} />
      <TextField label="Kata sandi lama" secureTextEntry value={form.currentPassword} onChangeText={(t) => setForm({ ...form, currentPassword: t })} />
      <TextField label="Kata sandi baru" secureTextEntry value={form.newPassword} onChangeText={(t) => setForm({ ...form, newPassword: t })} hint="Minimal 8 karakter, berisi huruf dan angka." error={status.error?.fieldError?.('newPassword') || (status.error && !status.error.fields?.length ? status.error.message : undefined)} />
      {status.saved ? <T variant="caption" color={c.success}>Kata sandi diganti.</T> : null}
      <Button title="Ganti kata sandi" variant="secondary" busy={status.busy} onPress={change} style={{ alignSelf: 'flex-start' }} />
    </Panel>
  );
}

export default function ProfileScreen({ navigation }) {
  const { c } = useTheme();
  const { user, logout, isAdmin } = useAuth();
  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <TopBar title="Profile" />
        <StateView empty emptyIcon="profile" emptyTitle="Belum masuk" emptyText="Masuk untuk mengatur profil, preferensi, dan langganan." action={<View style={{ gap: 8 }}><Button title="Masuk" onPress={() => navigation.navigate('Login')} /><Button title="Daftar gratis" variant="secondary" onPress={() => navigation.navigate('Register')} /></View>} />
      </View>
    );
  }
  const stats = [['Favorit', user.favorites.length], ['Watchlist', user.watchlist.length], ['Ditonton', user.watched.length]];
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar title="Profile" />
      <ScrollView contentContainerStyle={{ padding: space[4], gap: space[4], paddingBottom: space[12] }}>
        <View style={{ flexDirection: 'row', gap: space[4], alignItems: 'center' }}>
          <Avatar user={user} size={72} />
          <View style={{ flex: 1, gap: 2 }}>
            <T variant="h1">{user.name}</T>
            <T variant="caption" color={c.text2}>{user.email}{isAdmin ? ' · Admin' : ''}</T>
            {user.bio ? <T>{user.bio}</T> : null}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: space[6] }}>
          {stats.map(([k, v]) => (
            <Pressable key={k} onPress={() => navigation.navigate('Collection')}>
              <T variant="h2">{v}</T>
              <T variant="caption" color={c.text2}>{k}</T>
            </Pressable>
          ))}
        </View>
        {isAdmin ? <T variant="caption" color={c.text2}>Panel admin tersedia di versi web KELIR.</T> : null}
        <Subscription navigation={navigation} />
        <EditProfile />
        <History navigation={navigation} />
        <Settings />
        <Button title="Keluar" icon="logout" variant="tertiary" onPress={logout} style={{ alignSelf: 'flex-start' }} />
      </ScrollView>
    </View>
  );
}
