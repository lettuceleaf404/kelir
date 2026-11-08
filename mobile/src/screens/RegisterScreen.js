import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { space } from '../theme';
import { REGIONS } from '../format';
import Logo from '../components/Logo';
import { Button, Chips, T, TextField } from '../components/ui';

const GENRES = ['Drama', 'Komedi', 'Keluarga', 'Thriller', 'Aksi', 'Fiksi Ilmiah', 'Animasi', 'Sejarah', 'Lingkungan', 'Lagu Daerah', 'Pop', 'Jazz'];

function validate(f) {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Nama minimal 2 karakter.';
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Format email belum benar.';
  if (f.password.length < 8) e.password = 'Kata sandi minimal 8 karakter.';
  else if (!/[A-Za-z]/.test(f.password) || !/[0-9]/.test(f.password)) e.password = 'Gabungkan huruf dan angka.';
  return e;
}

export default function RegisterScreen({ navigation }) {
  const { c } = useTheme();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', favoriteGenres: [], favoriteRegions: [] });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ busy: false, error: null });
  const submit = async () => {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setStatus({ busy: true, error: null });
    try {
      await register(form);
      navigation.goBack();
    } catch (error) {
      setStatus({ busy: false, error });
      setErrors(Object.fromEntries((error.fields || []).map((x) => [x.field, x.message])));
    }
  };
  const set = (k) => (t) => setForm({ ...form, [k]: t });
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: space[6], gap: space[4] }} keyboardShouldPersistTaps="handled">
        <Logo size={36} ink={c.text} window={c.bg} />
        <T variant="h1" accessibilityRole="header">Buat akun KELIR</T>
        <T color={c.text2}>Gratis. Pilih selera tontonanmu supaya beranda terasa milikmu.</T>
        <TextField label="Nama" value={form.name} onChangeText={set('name')} error={errors.name} />
        <TextField label="Email" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={set('email')} error={errors.email} />
        <TextField label="Kata sandi" secureTextEntry value={form.password} onChangeText={set('password')} error={errors.password} hint="Minimal 8 karakter, berisi huruf dan angka." />
        <T variant="label">Genre favorit (opsional)</T>
        <Chips multiple value={form.favoriteGenres} onChange={(v) => setForm({ ...form, favoriteGenres: v })} options={GENRES.map((g) => ({ value: g, label: g }))} />
        <T variant="label">Daerah yang ingin dijelajahi (opsional)</T>
        <Chips multiple value={form.favoriteRegions} onChange={(v) => setForm({ ...form, favoriteRegions: v })} options={REGIONS.map((r) => ({ value: r.key, label: r.name }))} />
        {status.error && !status.error.fields?.length ? <T color={c.error}>{status.error.message}</T> : null}
        <Button title="Daftar" size="lg" block busy={status.busy} onPress={submit} />
        <Button title="Sudah punya akun? Masuk" variant="tertiary" onPress={() => navigation.replace('Login')} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
