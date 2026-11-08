import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useDocumentTitle } from '../lib/hooks.js';
import { REGIONS } from '../lib/format.js';
import { Button, Chips, TextField } from '../components/ui.jsx';
import AuthLayout from './AuthLayout.jsx';

const GENRES = ['Drama', 'Komedi', 'Keluarga', 'Thriller', 'Aksi', 'Fiksi Ilmiah', 'Animasi', 'Sejarah', 'Lingkungan', 'Lagu Daerah', 'Pop', 'Jazz'];

function validate(form) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = 'Nama minimal 2 karakter.';
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Format email belum benar.';
  if (form.password.length < 8) errors.password = 'Kata sandi minimal 8 karakter.';
  else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) errors.password = 'Gabungkan huruf dan angka.';
  if (form.confirm !== form.password) errors.confirm = 'Kata sandi belum sama.';
  return errors;
}

export default function Register() {
  useDocumentTitle('Daftar');
  const { register } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', favoriteGenres: [], favoriteRegions: [] });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState({ busy: false, error: null });
  const update = (key) => (e) => {
    const next = { ...form, [key]: e.target.value };
    setForm(next);
    if (touched[key]) setErrors(validate(next));
  };
  const blur = (key) => () => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors(validate(form));
  };
  const submit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    setTouched({ name: true, email: true, password: true, confirm: true });
    if (Object.keys(found).length) return;
    setStatus({ busy: true, error: null });
    try {
      const { confirm, ...payload } = form;
      await register(payload); // GuestOnly redirects once the session exists.
    } catch (error) {
      setStatus({ busy: false, error });
      setErrors((prev) => ({ ...prev, ...Object.fromEntries((error.fields || []).map((f) => [f.field, f.message])) }));
    }
  };
  const show = (key) => (touched[key] ? errors[key] : undefined);
  return (
    <AuthLayout title="Buat akun KELIR" subtitle="Gratis. Pilih selera tontonanmu supaya beranda terasa milikmu." footer={<>Sudah punya akun? <Link to="/login" state={location.state}>Masuk</Link></>}>
      <form className="stack" onSubmit={submit} noValidate>
        <TextField label="Nama" autoComplete="name" value={form.name} onChange={update('name')} onBlur={blur('name')} error={show('name')} />
        <TextField label="Email" type="email" autoComplete="email" value={form.email} onChange={update('email')} onBlur={blur('email')} error={show('email')} />
        <TextField label="Kata sandi" type="password" autoComplete="new-password" value={form.password} onChange={update('password')} onBlur={blur('password')} error={show('password')} hint="Minimal 8 karakter, berisi huruf dan angka." />
        <TextField label="Ulangi kata sandi" type="password" autoComplete="new-password" value={form.confirm} onChange={update('confirm')} onBlur={blur('confirm')} error={show('confirm')} />
        <div>
          <p className="field-label">Genre favorit <span className="muted">(opsional)</span></p>
          <Chips multiple label="Genre favorit" options={GENRES.map((g) => ({ value: g, label: g }))} value={form.favoriteGenres} onChange={(v) => setForm({ ...form, favoriteGenres: v })} />
        </div>
        <div>
          <p className="field-label">Daerah yang ingin dijelajahi <span className="muted">(opsional)</span></p>
          <Chips multiple label="Daerah" options={REGIONS.map((r) => ({ value: r.key, label: r.name }))} value={form.favoriteRegions} onChange={(v) => setForm({ ...form, favoriteRegions: v })} />
        </div>
        {status.error && !status.error.fields?.length && <p className="form-error" role="alert">{status.error.message}</p>}
        <Button type="submit" size="lg" block busy={status.busy}>Daftar</Button>
      </form>
    </AuthLayout>
  );
}
