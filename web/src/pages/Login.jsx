import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DEMO_ACCOUNTS } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useDocumentTitle } from '../lib/hooks.js';
import { Button, TextField } from '../components/ui.jsx';
import AuthLayout from './AuthLayout.jsx';

export default function Login() {
  useDocumentTitle('Masuk');
  const { login } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [status, setStatus] = useState({ busy: false, error: null });
  const submit = async (e, credentials = form) => {
    e?.preventDefault();
    setStatus({ busy: true, error: null });
    try {
      // GuestOnly redirects once the session exists.
      await login(credentials);
    } catch (error) {
      setStatus({ busy: false, error });
    }
  };
  const err = status.error;
  return (
    <AuthLayout
      title="Masuk ke KELIR"
      subtitle="Lanjutkan tontonan, simpan favorit, dan tulis ulasan."
      footer={<>Belum punya akun? <Link to="/register" state={location.state}>Daftar gratis</Link></>}
    >
      <form className="stack" onSubmit={submit} noValidate>
        <TextField label="Email" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={err?.fieldError?.('email')} />
        <TextField label="Kata sandi" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={err?.fieldError?.('password')} />
        {err && !err.fields?.length && <p className="form-error" role="alert">{err.message}</p>}
        <Button type="submit" size="lg" block busy={status.busy}>Masuk</Button>
      </form>
      <div className="demo-box">
        <p className="field-label">Coba akun demo</p>
        <div className="row wrap">
          {Object.values(DEMO_ACCOUNTS).map((acc) => (
            <Button key={acc.email} variant={acc.email.startsWith('admin') ? 'tertiary' : 'secondary'} size="sm" onClick={() => submit(null, { email: acc.email, password: acc.password })}>
              {acc.label}
            </Button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
