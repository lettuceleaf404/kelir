import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAsync, useDocumentTitle } from '../lib/hooks.js';
import { TYPE_PLURAL } from '../lib/format.js';
import Artwork from '../components/Artwork.jsx';
import ContentCard, { CardGrid } from '../components/ContentCard.jsx';
import { Button, Chips, EmptyState, ErrorState, Modal, Spinner, Tabs, TextField } from '../components/ui.jsx';

const TABS = [
  { value: 'favorites', label: 'Favorit', icon: 'heart' },
  { value: 'watchlist', label: 'Watchlist', icon: 'plus' },
  { value: 'progress', label: 'Lanjutkan', icon: 'play' },
  { value: 'watched', label: 'Sudah ditonton', icon: 'check' },
  { value: 'collections', label: 'Koleksi saya', icon: 'grid' },
];
const EMPTY = {
  favorites: ['Belum ada favorit', 'Ketuk ikon hati di halaman judul untuk menyimpannya di sini.'],
  watchlist: ['Watchlist masih kosong', 'Simpan judul yang ingin kamu tonton nanti.'],
  watched: ['Belum ada yang ditonton', 'Judul yang selesai ditonton atau kamu tandai akan muncul di sini.'],
  progress: ['Tidak ada tontonan yang tertunda', 'Mulai menonton, KELIR akan mengingat posisimu.'],
};

function NewCollection({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [status, setStatus] = useState({ busy: false, error: null });
  const submit = async (e) => {
    e.preventDefault();
    setStatus({ busy: true, error: null });
    try {
      const { collection } = await api.createCollection(form);
      setForm({ name: '', description: '' });
      setStatus({ busy: false, error: null });
      onCreated(collection);
    } catch (error) {
      setStatus({ busy: false, error });
    }
  };
  return (
    <Modal open={open} onClose={onClose} title="Koleksi baru">
      <form className="stack" onSubmit={submit}>
        <TextField label="Nama" required maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={status.error?.fieldError?.('name')} placeholder="Misal: Film tentang laut" />
        <TextField as="textarea" label="Deskripsi (opsional)" rows={2} maxLength={200} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        {status.error && !status.error.fields?.length && <p className="field-error">{status.error.message}</p>}
        <div className="row">
          <Button type="submit" busy={status.busy}>Buat koleksi</Button>
          <Button variant="tertiary" onClick={onClose}>Batal</Button>
        </div>
      </form>
    </Modal>
  );
}

function Collections() {
  const list = useAsync(() => api.collections(), []);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  if (list.loading) return <Spinner />;
  if (list.error) return <ErrorState error={list.error} onRetry={list.reload} />;
  return (
    <>
      <div className="collections">
        <button type="button" className="collection-tile collection-new" onClick={() => setCreating(true)}>
          <span className="collection-new-icon" aria-hidden>+</span>
          <span className="collection-name">Koleksi baru</span>
          <span className="muted">Kelompokkan judul sesukamu</span>
        </button>
        {list.data.items.map((c) => (
          <Link key={c.id} to={`/collection/${c.id}`} className="collection-tile">
            <span className="collection-mosaic" aria-hidden>
              {c.items.slice(0, 4).map((item) => <Artwork key={item.id} content={item} shape="poster" showTitle={false} />)}
              {Array.from({ length: Math.max(0, 4 - c.items.length) }, (_, i) => <span key={i} className="mosaic-empty" />)}
            </span>
            <span className="collection-name">{c.name}</span>
            <span className="muted">{c.itemCount} judul{c.description ? ` · ${c.description}` : ''}</span>
          </Link>
        ))}
      </div>
      <NewCollection open={creating} onClose={() => setCreating(false)} onCreated={(c) => navigate(`/collection/${c.id}`)} />
    </>
  );
}

export default function Collection() {
  useDocumentTitle('Collection');
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'favorites';
  const [type, setType] = useState('');
  const library = useAsync(() => (user ? api.library() : Promise.resolve(null)), [user?.id, user?.favorites?.length, user?.watchlist?.length, user?.watched?.length]);
  const progress = useAsync(() => (user && tab === 'progress' ? api.progress() : Promise.resolve(null)), [user?.id, tab]);

  if (!user) {
    return (
      <div className="page container">
        <EmptyState icon="collection" title="Koleksimu menunggu" action={<Button to="/login" state={{ from: '/collection' }}>Masuk</Button>}>
          Masuk untuk menyimpan favorit, watchlist, dan koleksi kustom.
        </EmptyState>
      </div>
    );
  }

  const listItems = library.data?.[tab] || [];
  const filtered = type ? listItems.filter((c) => c.type === type) : listItems;
  const counts = { favorites: library.data?.favorites.length, watchlist: library.data?.watchlist.length, watched: library.data?.watched.length };

  return (
    <div className="page container collection">
      <header className="page-head">
        <div>
          <p className="overline">Collection</p>
          <h1 className="t-h1">Koleksimu</h1>
          <p className="page-sub">Favorit, watchlist, riwayat tontonan, dan koleksi buatanmu sendiri.</p>
        </div>
      </header>
      <Tabs label="Bagian koleksi" tabs={TABS.map((t) => ({ ...t, count: counts[t.value] }))} value={tab} onChange={(v) => { setType(''); setParams({ tab: v }, { replace: true }); }} />

      {tab === 'collections' ? (
        <Collections />
      ) : tab === 'progress' ? (
        progress.loading ? <Spinner /> : progress.data?.items.length ? (
          <div className="grid grid-video">
            {progress.data.items.map((p) => (
              <ContentCard key={p.contentId} content={p.content} kind="video" progress={p} to={`/play/${p.content.slug}${p.episode ? `?episode=${p.episode}` : ''}`} />
            ))}
          </div>
        ) : <EmptyState icon="play" title={EMPTY.progress[0]}>{EMPTY.progress[1]}</EmptyState>
      ) : library.loading && !library.data ? (
        <Spinner />
      ) : library.error ? (
        <ErrorState error={library.error} onRetry={library.reload} />
      ) : (
        <>
          {listItems.length > 0 && (
            <Chips
              label="Jenis"
              options={['film', 'series', 'documentary', 'music'].filter((t) => listItems.some((c) => c.type === t)).map((t) => ({ value: t, label: TYPE_PLURAL[t], count: listItems.filter((c) => c.type === t).length }))}
              value={type}
              onChange={setType}
            />
          )}
          {filtered.length ? <CardGrid items={filtered} /> : <EmptyState icon="heart" title={EMPTY[tab][0]} action={<Button variant="secondary" to="/explore">Jelajahi konten</Button>}>{EMPTY[tab][1]}</EmptyState>}
        </>
      )}
    </div>
  );
}
