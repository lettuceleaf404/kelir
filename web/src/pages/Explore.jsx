import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAsync, useDocumentTitle } from '../lib/hooks.js';
import { REGIONS, TYPE_PLURAL } from '../lib/format.js';
import { CardGrid } from '../components/ContentCard.jsx';
import Icon from '../components/Icon.jsx';
import { Button, Chips, EmptyState, ErrorState, Spinner, TextField } from '../components/ui.jsx';

const FILTER_KEYS = ['q', 'type', 'region', 'genre', 'language', 'yearFrom', 'yearTo', 'minRating', 'access', 'origin', 'category', 'pick', 'sort'];
const SORTS = [
  { value: 'popular', label: 'Terpopuler' },
  { value: 'rating', label: 'Rating tertinggi' },
  { value: 'newest', label: 'Rilis terbaru' },
  { value: 'added', label: 'Baru ditambahkan' },
  { value: 'title', label: 'Judul A–Z' },
];
const PAGE = 24;

export default function Explore() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || ''])), [params]);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const region = REGIONS.find((r) => r.key === filters.region);
  useDocumentTitle(region ? `Explore ${region.name}` : 'Explore');

  const meta = useAsync(() => api.filters(), []);
  const key = params.toString();
  const result = useAsync(() => api.contents({ ...filters, page, limit: PAGE }), [key, page]);

  useEffect(() => {
    setPage(1);
  }, [key]);
  useEffect(() => {
    if (!result.data) return;
    setItems((prev) => (result.data.page === 1 ? result.data.items : [...prev, ...result.data.items]));
  }, [result.data]);

  const set = (name, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: true });
  };
  const clearAll = () => setParams(filters.q ? { q: filters.q } : {}, { replace: true });
  const activeCount = FILTER_KEYS.filter((k) => !['q', 'sort'].includes(k) && filters[k]).length;
  const years = meta.data?.years;
  const yearOptions = years ? Array.from({ length: Math.ceil((years.max - 1930) / 10) + 1 }, (_, i) => 1930 + i * 10).filter((y) => y <= years.max) : [];

  return (
    <div className="page container explore">
      <header className={`page-head ${region ? `region-banner art-${region.art}` : ''}`}>
        <div>
          <p className="overline">{region ? 'Jelajahi daerah' : 'Explore'}</p>
          <h1 className="t-h1">{region ? region.name : 'Temukan cerita dari mana saja'}</h1>
          <p className="page-sub">
            {region
              ? `Judul yang berlatar, diambil gambarnya, atau berasal dari ${region.name}. Setiap judul mencantumkan dasar penentuan daerahnya.`
              : 'Cari berdasarkan jenis, genre, daerah, bahasa, tahun, dan rating.'}
          </p>
        </div>
      </header>

      <div className="region-strip">
        <Chips
          label="Daerah"
          options={(meta.data?.regions || REGIONS.map((r) => ({ value: r.key, name: r.name }))).map((r) => ({ value: r.value || r.key, label: r.name, count: r.count, icon: 'map-pin' }))}
          value={filters.region}
          onChange={(v) => set('region', v)}
        />
      </div>

      <div className="explore-bar">
        <form className="explore-search" role="search" onSubmit={(e) => { e.preventDefault(); set('q', new FormData(e.currentTarget).get('q').trim()); }}>
          <TextField key={filters.q} name="q" label="Cari" icon="search" defaultValue={filters.q} placeholder="Judul, kreator, pemeran, album, atau tempat" type="search" />
        </form>
        <TextField as="select" label="Urutkan" value={filters.sort || 'popular'} onChange={(e) => set('sort', e.target.value === 'popular' ? '' : e.target.value)}>
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </TextField>
        <Button variant="secondary" icon="filter" className="filters-toggle" aria-expanded={showFilters} onClick={() => setShowFilters((v) => !v)}>
          Filter{activeCount ? ` (${activeCount})` : ''}
        </Button>
      </div>

      <div className="explore-layout">
        <aside className={`filters ${showFilters ? 'filters-open' : ''}`} aria-label="Filter">
          <div className="filter-group">
            <h2 className="filter-title">Jenis</h2>
            <Chips label="Jenis konten" options={(meta.data?.types || []).map((t) => ({ value: t.value, label: TYPE_PLURAL[t.value], count: t.count }))} value={filters.type} onChange={(v) => set('type', v)} />
          </div>
          <div className="filter-group">
            <h2 className="filter-title">Akses</h2>
            <Chips label="Akses" options={[{ value: 'free', label: 'Gratis' }, { value: 'premium', label: 'Premium', icon: 'lock' }]} value={filters.access} onChange={(v) => set('access', v)} />
          </div>
          <div className="filter-group">
            <h2 className="filter-title">Asal</h2>
            <Chips label="Asal" options={[{ value: 'nusantara', label: 'Nusantara' }, { value: 'internasional', label: 'Internasional' }]} value={filters.origin} onChange={(v) => set('origin', v)} />
          </div>
          <TextField as="select" label="Genre" value={filters.genre} onChange={(e) => set('genre', e.target.value)}>
            <option value="">Semua genre</option>
            {(meta.data?.genres || []).map((g) => <option key={g.value} value={g.value}>{g.value} ({g.count})</option>)}
          </TextField>
          <TextField as="select" label="Bahasa" value={filters.language} onChange={(e) => set('language', e.target.value)}>
            <option value="">Semua bahasa</option>
            {(meta.data?.languages || []).map((l) => <option key={l.value} value={l.value}>{l.value}</option>)}
          </TextField>
          <div className="filter-row">
            <TextField as="select" label="Dari tahun" value={filters.yearFrom} onChange={(e) => set('yearFrom', e.target.value)}>
              <option value="">Semua</option>
              {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </TextField>
            <TextField as="select" label="Sampai" value={filters.yearTo} onChange={(e) => set('yearTo', e.target.value)}>
              <option value="">Semua</option>
              {yearOptions.map((y) => <option key={y} value={y + 9}>{y + 9}</option>)}
            </TextField>
          </div>
          <div className="filter-group">
            <h2 className="filter-title">Rating minimal</h2>
            <Chips label="Rating minimal" options={[{ value: '3', label: '3+' }, { value: '4', label: '4+' }, { value: '4.5', label: '4,5+' }].map((o) => ({ ...o, icon: 'star' }))} value={filters.minRating} onChange={(v) => set('minRating', v)} />
          </div>
          <div className="filter-group">
            <h2 className="filter-title">Lainnya</h2>
            <Chips
              label="Lainnya"
              options={[{ value: 'budaya', label: 'Budaya' }]}
              value={filters.category}
              onChange={(v) => set('category', v)}
            />
            <Chips label="Kurasi" options={[{ value: '1', label: 'Pilihan KELIR' }]} value={filters.pick} onChange={(v) => set('pick', v)} />
          </div>
          {activeCount > 0 && <Button variant="tertiary" icon="close" onClick={clearAll}>Hapus semua filter</Button>}
        </aside>

        <section className="results" aria-live="polite" aria-busy={result.loading}>
          {result.error ? (
            <ErrorState error={result.error} onRetry={result.reload} />
          ) : result.loading && page === 1 ? (
            <Spinner label="Mencari…" />
          ) : items.length === 0 ? (
            <EmptyState icon="search" title="Tidak ada yang cocok" action={activeCount ? <Button variant="secondary" onClick={clearAll}>Hapus filter</Button> : null}>
              Coba kata kunci lain atau longgarkan filter.
            </EmptyState>
          ) : (
            <>
              <p className="results-count">
                <Icon name="grid" size={16} /> {result.data?.total ?? items.length} judul{filters.q ? ` untuk “${filters.q}”` : ''}
              </p>
              <CardGrid items={items} />
              {result.data && result.data.page < result.data.totalPages && (
                <div className="load-more">
                  <Button variant="secondary" busy={result.loading} onClick={() => setPage((p) => p + 1)}>Muat lebih banyak</Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
