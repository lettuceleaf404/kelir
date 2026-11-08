import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAsync, useDocumentTitle, useTheme } from '../lib/hooks.js';
import { date, REGIONS, SUB_LABEL } from '../lib/format.js';
import Artwork from '../components/Artwork.jsx';
import Icon from '../components/Icon.jsx';
import { Avatar, AVATAR_TONES, Badge, Button, Chips, EmptyState, Modal, Spinner, Stars, TextField } from '../components/ui.jsx';

function SubscriptionCard() {
  const { user, setUser } = useAuth();
  const sub = user.subscription;
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const cancel = async () => {
    setBusy(true);
    try {
      const res = await api.cancelSubscription();
      setUser(res.user);
      setConfirm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className={`panel sub-card ${sub.isPremium ? 'sub-premium' : ''}`} aria-labelledby="sub">
      <div className="sub-head">
        <div>
          <p className="overline">Langganan</p>
          <h2 className="t-h3" id="sub">{sub.isPremium ? 'KELIR Premium' : 'Akun Gratis'}</h2>
        </div>
        <Badge tone={sub.isPremium ? 'premium' : 'neutral'} icon={sub.isPremium ? 'sparkle' : undefined}>{SUB_LABEL[sub.status]}</Badge>
      </div>
      {sub.status === 'FREE' && <p>Kamu bisa menonton semua konten Gratis. Premium membuka seluruh film dan serial.</p>}
      {sub.status === 'ACTIVE' && <p>Paket {sub.plan === 'annual' ? 'Tahunan' : 'Bulanan'} aktif sampai <strong>{date(sub.expiresAt)}</strong> dan akan diperpanjang otomatis (simulasi).</p>}
      {sub.status === 'CANCELLED' && <p>Perpanjangan dihentikan. Premium tetap aktif sampai <strong>{date(sub.expiresAt)}</strong>.</p>}
      {sub.status === 'EXPIRED' && <p>Premium berakhir pada {date(sub.expiresAt)}. Konten Premium terkunci lagi sampai kamu berlangganan.</p>}
      <div className="row">
        {sub.status !== 'ACTIVE' && <Button variant="premium" icon="sparkle" to="/premium">{sub.status === 'FREE' ? 'Langganan Premium' : 'Langganan lagi'}</Button>}
        {sub.status === 'ACTIVE' && <Button variant="tertiary" onClick={() => setConfirm(true)}>Batalkan perpanjangan</Button>}
        <Button variant="tertiary" to="/premium" iconRight="chevron-right">Riwayat & paket</Button>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Hentikan perpanjangan?" footer={<><Button variant="tertiary" onClick={() => setConfirm(false)}>Tidak jadi</Button><Button busy={busy} onClick={cancel}>Ya, hentikan</Button></>}>
        <p>Premium tetap bisa dipakai sampai {date(sub.expiresAt)}. Setelah itu akunmu kembali ke Gratis.</p>
        {error && <p className="field-error">{error}</p>}
      </Modal>
    </section>
  );
}

function ProfileForm() {
  const { user, setUser } = useAuth();
  const filters = useAsync(() => api.filters(), []);
  const [form, setForm] = useState(() => ({ name: user.name, bio: user.bio || '', avatar: user.avatar, favoriteGenres: user.favoriteGenres, favoriteRegions: user.favoriteRegions }));
  const [status, setStatus] = useState({ busy: false, error: null, saved: false });
  const save = async (e) => {
    e.preventDefault();
    setStatus({ busy: true, error: null, saved: false });
    try {
      const res = await api.updateMe(form);
      setUser(res.user);
      setStatus({ busy: false, error: null, saved: true });
    } catch (error) {
      setStatus({ busy: false, error, saved: false });
    }
  };
  return (
    <form className="panel stack" onSubmit={save} aria-labelledby="profile-form">
      <h2 className="t-h3" id="profile-form">Profil & preferensi</h2>
      <fieldset className="avatar-picker">
        <legend className="field-label">Foto profil</legend>
        {AVATAR_TONES.map((tone) => (
          <label key={tone} className={form.avatar === tone ? 'on' : ''}>
            <input type="radio" name="avatar" value={tone} checked={form.avatar === tone} onChange={() => setForm({ ...form, avatar: tone })} className="sr-only" />
            <Avatar user={{ ...user, name: form.name, avatar: tone }} size={44} />
            <span className="sr-only">Warna {tone}</span>
          </label>
        ))}
      </fieldset>
      <TextField label="Nama" value={form.name} maxLength={60} onChange={(e) => setForm({ ...form, name: e.target.value })} error={status.error?.fieldError?.('name')} />
      <TextField as="textarea" label="Bio" rows={2} maxLength={160} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} hint="Maksimal 160 karakter." />
      <div>
        <p className="field-label">Genre favorit</p>
        <Chips multiple label="Genre favorit" options={(filters.data?.genres || []).map((g) => ({ value: g.value, label: g.value }))} value={form.favoriteGenres} onChange={(v) => setForm({ ...form, favoriteGenres: v })} />
      </div>
      <div>
        <p className="field-label">Daerah yang ingin kamu jelajahi</p>
        <Chips multiple label="Daerah favorit" options={REGIONS.map((r) => ({ value: r.key, label: r.name, icon: 'map-pin' }))} value={form.favoriteRegions} onChange={(v) => setForm({ ...form, favoriteRegions: v })} />
      </div>
      <div className="row">
        <Button type="submit" busy={status.busy}>Simpan profil</Button>
        {status.saved && <span className="success-text" role="status"><Icon name="check" size={16} /> Tersimpan. Rekomendasi di Home ikut diperbarui.</span>}
      </div>
      {status.error && !status.error.fields?.length && <p className="field-error">{status.error.message}</p>}
    </form>
  );
}

function PasswordForm() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [status, setStatus] = useState({ busy: false, error: null, saved: false });
  const save = async (e) => {
    e.preventDefault();
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
    <form className="panel stack" onSubmit={save} aria-labelledby="pw">
      <h2 className="t-h3" id="pw">Keamanan</h2>
      <TextField label="Kata sandi lama" type="password" autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} error={status.error?.fieldError?.('currentPassword') || (status.error && !status.error.fields?.length ? status.error.message : undefined)} />
      <TextField label="Kata sandi baru" type="password" autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} hint="Minimal 8 karakter, berisi huruf dan angka." error={status.error?.fieldError?.('newPassword')} />
      <div className="row">
        <Button type="submit" variant="secondary" busy={status.busy}>Ganti kata sandi</Button>
        {status.saved && <span className="success-text" role="status"><Icon name="check" size={16} /> Kata sandi diganti</span>}
      </div>
    </form>
  );
}

function ThemePanel() {
  const [pref, setPref] = useTheme();
  return (
    <section className="panel stack" aria-labelledby="theme">
      <h2 className="t-h3" id="theme">Tampilan</h2>
      <Chips label="Tema" options={[{ value: 'light', label: 'Terang', icon: 'sun' }, { value: 'dark', label: 'Gelap', icon: 'moon' }, { value: 'system', label: 'Ikuti perangkat', icon: 'settings' }]} value={pref} onChange={(v) => setPref(v || 'light')} />
      <p className="muted small">Layar Watch selalu memakai tema gelap agar video jadi pusat perhatian.</p>
    </section>
  );
}

function ReviewHistory() {
  const list = useAsync(() => api.myReviews(), []);
  return (
    <section className="panel" aria-labelledby="history">
      <h2 className="t-h3" id="history">Riwayat ulasan & rating</h2>
      {list.loading ? <Spinner /> : list.data?.items.length ? (
        <ul className="history">
          {list.data.items.map((r) => (
            <li key={r.id}>
              <Link to={`/title/${r.content.slug}`} className="history-row">
                <Artwork content={r.content} shape={r.content.type === 'music' ? 'square' : 'poster'} showTitle={false} className="history-thumb" />
                <span>
                  <strong>{r.content.title}</strong>
                  <span className="history-meta"><Stars value={r.rating} size={14} /> {date(r.updatedAt)}</span>
                  {r.hidden && <Badge tone="neutral">Disembunyikan moderator</Badge>}
                  {r.comment && <span className="history-comment">“{r.comment}”</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="star" title="Belum ada ulasan">Rating dan ulasan yang kamu tulis akan tersimpan di sini.</EmptyState>
      )}
    </section>
  );
}

export default function Profile() {
  useDocumentTitle('Profile');
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  if (!user) return null; // RequireAuth guards this route
  const stats = [
    ['Favorit', user.favorites.length],
    ['Watchlist', user.watchlist.length],
    ['Ditonton', user.watched.length],
  ];
  return (
    <div className="page container profile">
      <header className="profile-head">
        <Avatar user={user} size={88} />
        <div>
          <p className="overline">Profile</p>
          <h1 className="t-h1">{user.name}</h1>
          <p className="muted">{user.email}{isAdmin ? ' · Admin' : ''}</p>
          {user.bio && <p>{user.bio}</p>}
          <ul className="profile-stats">
            {stats.map(([k, v]) => (
              <li key={k}><Link to={`/collection?tab=${k === 'Favorit' ? 'favorites' : k === 'Watchlist' ? 'watchlist' : 'watched'}`}><strong>{v}</strong> {k}</Link></li>
            ))}
          </ul>
        </div>
        <Button variant="tertiary" icon="logout" className="profile-logout" onClick={() => { logout(); navigate('/'); }}>Keluar</Button>
      </header>
      <div className="profile-grid">
        <div className="stack">
          <SubscriptionCard />
          <ProfileForm />
        </div>
        <div className="stack">
          <ReviewHistory />
          <ThemePanel />
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}
