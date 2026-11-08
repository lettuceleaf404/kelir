import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { DEMO_ACCOUNTS } from '../api';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { radius, space } from '../theme';
import Logo from '../components/Logo';
import { Button, T, TextField } from '../components/ui';

export default function LoginScreen({ navigation }) {
  const { c } = useTheme();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [status, setStatus] = useState({ busy: false, error: null });
  const submit = async (credentials = form) => {
    setStatus({ busy: true, error: null });
    try {
      await login(credentials);
      navigation.goBack();
    } catch (error) {
      setStatus({ busy: false, error });
    }
  };
  const err = status.error;
  const demos = [DEMO_ACCOUNTS.premium, DEMO_ACCOUNTS.free];
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: space[6], gap: space[4] }} keyboardShouldPersistTaps="handled">
        <Logo size={36} ink={c.text} window={c.bg} />
        <T variant="h1" accessibilityRole="header">Masuk ke KELIR</T>
        <T color={c.text2}>Lanjutkan tontonan, simpan favorit, dan tulis ulasan.</T>
        <TextField label="Email" autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={form.email} onChangeText={(t) => setForm({ ...form, email: t })} error={err?.fieldError?.('email')} />
        <TextField label="Kata sandi" secureTextEntry autoComplete="password" value={form.password} onChangeText={(t) => setForm({ ...form, password: t })} error={err?.fieldError?.('password')} onSubmitEditing={() => submit()} />
        {err && !err.fields?.length ? <T color={c.error}>{err.message}</T> : null}
        <Button title="Masuk" size="lg" block busy={status.busy} onPress={() => submit()} />
        <View style={{ padding: space[4], borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: c.borderStrong, backgroundColor: c.surface, gap: 8 }}>
          <T variant="label">Coba akun demo</T>
          {demos.map((d) => <Button key={d.email} title={d.label} variant="secondary" size="sm" onPress={() => submit({ email: d.email, password: d.password })} />)}
        </View>
        <Button title="Belum punya akun? Daftar gratis" variant="tertiary" onPress={() => navigation.replace('Register')} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
