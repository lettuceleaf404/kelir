import { useSearchParams } from 'react-router-dom';
import { api } from '../../api.js';
import { useAsync, useDocumentTitle } from '../../lib/hooks.js';
import { date, rupiah } from '../../lib/format.js';
import { Button, ErrorState, Spinner, Tabs } from '../../components/ui.jsx';

const KIND = { purchase: 'Pembelian', cancel: 'Pembatalan', admin_update: 'Diubah admin' };

export default function Payments() {
  useDocumentTitle('Admin · Transaksi');
  const [params, setParams] = useSearchParams();
  const kind = params.get('kind') || '';
  const page = Number(params.get('page') || 1);
  const list = useAsync(() => api.admin.payments({ kind, page }), [kind, page]);
  return (
    <div className="stack-lg">
      <header className="admin-head">
        <div>
          <h1 className="t-h1">Transaksi langganan</h1>
          <p className="page-sub">Semua pembayaran adalah simulasi; tidak ada data kartu atau rekening yang disimpan.</p>
        </div>
      </header>
      <Tabs label="Jenis transaksi" tabs={[{ value: '', label: 'Semua' }, ...Object.entries(KIND).map(([value, label]) => ({ value, label }))]} value={kind} onChange={(v) => setParams(v ? { kind: v } : {})} />
      {list.loading && !list.data ? <Spinner /> : list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Tanggal</th><th>Pengguna</th><th>Jenis</th><th>Paket</th><th>Jumlah</th><th>Berlaku sampai</th><th>Referensi</th></tr></thead>
            <tbody>
              {list.data.items.map((p) => (
                <tr key={p.id}>
                  <td>{date(p.createdAt)}</td>
                  <td>{p.user.name}<span className="muted small block">{p.user.email}</span></td>
                  <td>{KIND[p.kind]}</td>
                  <td>{p.plan === 'annual' ? 'Tahunan' : p.plan === 'monthly' ? 'Bulanan' : '—'}</td>
                  <td>{p.amount ? rupiah(p.amount) : '—'}</td>
                  <td>{date(p.periodEnd)}</td>
                  <td><code>{p.reference}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {list.data && list.data.totalPages > 1 && (
        <div className="pager">
          <Button variant="tertiary" size="sm" disabled={page <= 1} onClick={() => setParams({ kind, page: String(page - 1) })}>Sebelumnya</Button>
          <span className="muted">Halaman {list.data.page} dari {list.data.totalPages}</span>
          <Button variant="tertiary" size="sm" disabled={page >= list.data.totalPages} onClick={() => setParams({ kind, page: String(page + 1) })}>Berikutnya</Button>
        </div>
      )}
    </div>
  );
}
