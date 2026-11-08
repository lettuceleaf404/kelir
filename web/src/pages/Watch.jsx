import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAsync, useDocumentTitle } from '../lib/hooks.js';
import { CardGrid, Rail } from '../components/ContentCard.jsx';
import { Button, Chips, EmptyState, ErrorState, SectionHeader, Spinner, Tabs } from '../components/ui.jsx';

const TABS = [
  { value: '', label: 'Semua video', icon: 'watch' },
  { value: 'film', label: 'Film', icon: 'film' },
  { value: 'series', label: 'Serial', icon: 'list' },
  { value: 'documentary', label: 'Dokumenter', icon: 'eye' },
  { value: 'trailer', label: 'Trailer', icon: 'play' },
];

export default function Watch() {
  useDocumentTitle('Watch');
  const { user, isPremium } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('type') || '';
  const access = params.get('access') || '';
  const set = (name, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: true });
  };

  const query = {
    type: tab === 'trailer' || !tab ? 'film,series,documentary' : tab,
    hasTrailer: tab === 'trailer' ? '1' : '',
    access,
    limit: 60,
  };
  const list = useAsync(() => api.contents(query), [tab, access]);
  const progress = useAsync(() => (user ? api.progress() : Promise.resolve({ items: [] })), [user?.id]);

  return (
    <div className="page container watch">
      <header className="page-head">
        <div>
          <p className="overline">Watch</p>
          <h1 className="t-h1">Film, serial, dan dokumenter</h1>
          <p className="page-sub">
            Badge <strong>Gratis</strong> bisa ditonton semua akun; badge <strong>Premium</strong> butuh langganan.
            {!isPremium && ' Serial bertanda “Ep. 1 gratis” bisa dicoba dulu.'}
          </p>
        </div>
        {!isPremium && <Button variant="premium" to="/premium" icon="sparkle">Buka semua dengan Premium</Button>}
      </header>

      {progress.data?.items.length > 0 && (
        <section className="section section-tight" aria-labelledby="continue">
          <SectionHeader id="continue" title="Lanjutkan Menonton" />
          <Rail items={progress.data.items} kind="video" label="Lanjutkan Menonton" progressFor />
        </section>
      )}

      <div className="watch-bar">
        <Tabs label="Jenis video" tabs={TABS} value={tab} onChange={(v) => set('type', v)} />
        <Chips label="Akses" options={[{ value: 'free', label: 'Gratis' }, { value: 'premium', label: 'Premium', icon: 'lock' }]} value={access} onChange={(v) => set('access', v)} />
      </div>

      {list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : list.loading ? (
        <Spinner />
      ) : list.data.items.length === 0 ? (
        <EmptyState icon="watch" title="Belum ada video di sini">Coba tab atau filter akses lain.</EmptyState>
      ) : (
        <CardGrid
          items={list.data.items}
          kind="video"
          {...(tab === 'trailer' ? { meta: 'Trailer resmi · YouTube' } : {})}
        />
      )}
      {tab === 'trailer' && list.data && <p className="muted small">Trailer diputar dari YouTube di halaman detail tiap judul.</p>}
    </div>
  );
}
