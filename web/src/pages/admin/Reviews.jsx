import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api.js';
import { useAsync, useDocumentTitle } from '../../lib/hooks.js';
import { date } from '../../lib/format.js';
import { Avatar, Badge, Button, ErrorState, Modal, Spinner, Stars, Tabs, TextField } from '../../components/ui.jsx';

export default function Reviews() {
  useDocumentTitle('Admin · Moderasi');
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'all';
  const page = Number(params.get('page') || 1);
  const list = useAsync(() => api.admin.reviews({ status: status === 'all' ? '' : status, page }), [status, page]);
  const [hiding, setHiding] = useState(null);
  const [reason, setReason] = useState('');
  const replace = (r) => list.setData((d) => ({ ...d, items: d.items.map((x) => (x.id === r.id ? r : x)) }));
  const moderate = async (r, hidden, why) => {
    const res = await api.admin.moderate(r.id, { hidden, reason: why || null });
    replace(res.review);
    setHiding(null);
  };
  const remove = async (r) => {
    await api.admin.deleteReview(r.id);
    list.reload();
  };
  return (
    <div className="stack-lg">
      <header className="admin-head">
        <div>
          <h1 className="t-h1">Moderasi ulasan</h1>
          <p className="page-sub">Ulasan yang disembunyikan tidak tampil publik dan tidak dihitung dalam rating rata-rata.</p>
        </div>
      </header>
      <Tabs label="Status ulasan" tabs={[{ value: 'all', label: 'Semua' }, { value: 'visible', label: 'Tampil' }, { value: 'hidden', label: 'Disembunyikan' }]} value={status} onChange={(v) => setParams({ status: v })} />
      {list.loading && !list.data ? <Spinner /> : list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : (
        <ul className="mod-list">
          {list.data.items.map((r) => (
            <li key={r.id} className={`mod ${r.hidden ? 'mod-hidden' : ''}`}>
              <Avatar user={r.user} size={40} />
              <div className="mod-body">
                <p><strong>{r.user.name}</strong> tentang <Link to={`/title/${r.content.slug}`}>{r.content.title}</Link> <Stars value={r.rating} size={14} /> <span className="muted small">{date(r.updatedAt)}</span></p>
                {r.comment ? <p className="review-text">{r.comment}</p> : <p className="muted small">(hanya rating)</p>}
                {r.hidden && <Badge tone="neutral">Disembunyikan: {r.hiddenReason}</Badge>}
              </div>
              <div className="mod-actions">
                {r.hidden ? (
                  <Button variant="secondary" size="sm" onClick={() => moderate(r, false)}>Tampilkan lagi</Button>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => { setReason(''); setHiding(r); }}>Sembunyikan</Button>
                )}
                <Button variant="tertiary" size="sm" icon="trash" onClick={() => remove(r)}>Hapus</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {list.data && list.data.totalPages > 1 && (
        <div className="pager">
          <Button variant="tertiary" size="sm" disabled={page <= 1} onClick={() => setParams({ status, page: String(page - 1) })}>Sebelumnya</Button>
          <span className="muted">Halaman {list.data.page} dari {list.data.totalPages}</span>
          <Button variant="tertiary" size="sm" disabled={page >= list.data.totalPages} onClick={() => setParams({ status, page: String(page + 1) })}>Berikutnya</Button>
        </div>
      )}
      <Modal open={Boolean(hiding)} onClose={() => setHiding(null)} title="Sembunyikan ulasan" footer={<><Button variant="tertiary" onClick={() => setHiding(null)}>Batal</Button><Button onClick={() => moderate(hiding, true, reason)}>Sembunyikan</Button></>}>
        <TextField label="Alasan (tampil ke penulis)" value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} placeholder="Misal: Mengandung spoiler tanpa peringatan" />
      </Modal>
    </div>
  );
}
