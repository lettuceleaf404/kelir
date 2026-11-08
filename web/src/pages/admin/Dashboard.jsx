import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { useAsync, useDocumentTitle } from '../../lib/hooks.js';
import { rupiah, TYPE_PLURAL } from '../../lib/format.js';
import { Button, ErrorState, Spinner } from '../../components/ui.jsx';

export default function Dashboard() {
  useDocumentTitle('Admin');
  const stats = useAsync(() => api.admin.stats(), []);
  if (stats.loading) return <Spinner />;
  if (stats.error) return <ErrorState error={stats.error} onRetry={stats.reload} />;
  const s = stats.data;
  const tiles = [
    ['Pengguna', s.users, '/admin/users'],
    ['Premium aktif', s.premiumUsers, '/admin/users'],
    ['Konten', s.contents, '/admin/contents'],
    ['Draf', s.unpublished, '/admin/contents?status=draft'],
    ['Ulasan', s.reviews, '/admin/reviews'],
    ['Disembunyikan', s.hiddenReviews, '/admin/reviews?status=hidden'],
  ];
  const max = Math.max(...s.contentsByType.map((t) => t.count), 1);
  return (
    <div className="stack-lg">
      <header className="admin-head">
        <div>
          <h1 className="t-h1">Dasbor</h1>
          <p className="page-sub">Ringkasan katalog, pengguna, dan langganan.</p>
        </div>
        <Button icon="plus" to="/admin/contents/new">Konten baru</Button>
      </header>
      <div className="stat-grid">
        {tiles.map(([label, value, to]) => (
          <Link key={label} to={to} className="stat">
            <span className="stat-value">{value.toLocaleString('id-ID')}</span>
            <span className="stat-label">{label}</span>
          </Link>
        ))}
        <div className="stat stat-wide">
          <span className="stat-value">{rupiah(s.simulatedRevenue)}</span>
          <span className="stat-label">Pendapatan simulasi</span>
        </div>
      </div>
      <div className="admin-two">
        <section className="panel" aria-labelledby="by-type">
          <h2 className="t-h3" id="by-type">Konten per jenis</h2>
          <ul className="bars">
            {s.contentsByType.map((t) => (
              <li key={t.type}>
                <span className="bar-label">{TYPE_PLURAL[t.type]}</span>
                <span className="bar-track"><span className={`bar bar-${t.type}`} style={{ width: `${(t.count / max) * 100}%` }} /></span>
                <span className="bar-value">{t.count}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel" aria-labelledby="top">
          <h2 className="t-h3" id="top">Paling banyak ditonton</h2>
          <ol className="top-list">
            {s.topContent.map((c) => (
              <li key={c.id}><Link to={`/admin/contents/${c.id}`}>{c.title}</Link><span className="muted">{c.viewCount.toLocaleString('id-ID')} putar</span></li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
