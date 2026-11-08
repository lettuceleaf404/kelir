import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api.js';
import { useAsync, useDocumentTitle } from '../../lib/hooks.js';
import { regionName, TYPE_LABEL } from '../../lib/format.js';
import Artwork from '../../components/Artwork.jsx';
import { Badge, Button, ErrorState, IconButton, Modal, Spinner, TextField } from '../../components/ui.jsx';

export default function Contents() {
  useDocumentTitle('Admin · Konten');
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const type = params.get('type') || '';
  const status = params.get('status') || '';
  const page = Number(params.get('page') || 1);
  const list = useAsync(() => api.admin.contents({ q, type, status, page }), [q, type, status, page]);
  const [toDelete, setToDelete] = useState(null);
  const navigate = useNavigate();
  const set = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };
  const quick = async (c, patch) => {
    const { content } = await api.admin.updateContent(c.id, patch);
    list.setData((d) => ({ ...d, items: d.items.map((x) => (x.id === c.id ? { ...x, ...content } : x)) }));
  };
  const remove = async () => {
    await api.admin.deleteContent(toDelete.id);
    setToDelete(null);
    list.reload();
  };
  return (
    <div className="stack-lg">
      <header className="admin-head">
        <div>
          <h1 className="t-h1">Konten</h1>
          <p className="page-sub">Film, serial, dokumenter, dan musik. Termasuk akses, metadata daerah, dan kurasi.</p>
        </div>
        <Button icon="plus" to="/admin/contents/new">Konten baru</Button>
      </header>
      <div className="admin-filters">
        <form role="search" onSubmit={(e) => { e.preventDefault(); set('q', new FormData(e.currentTarget).get('q')); }}>
          <TextField key={q} name="q" label="Cari" icon="search" defaultValue={q} placeholder="Judul, kreator, atau slug" />
        </form>
        <TextField as="select" label="Jenis" value={type} onChange={(e) => set('type', e.target.value)}>
          <option value="">Semua</option>
          {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </TextField>
        <TextField as="select" label="Status" value={status} onChange={(e) => set('status', e.target.value)}>
          <option value="">Semua</option>
          <option value="published">Tayang</option>
          <option value="draft">Draf</option>
        </TextField>
      </div>
      {list.loading && !list.data ? <Spinner /> : list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Judul</th><th>Jenis</th><th>Akses</th><th>Daerah</th><th>Status</th><th>Unggulan</th><th>Pilihan KELIR</th><th><span className="sr-only">Aksi</span></th></tr>
              </thead>
              <tbody>
                {list.data.items.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/admin/contents/${c.id}`} className="table-title">
                        <Artwork content={c} shape={c.type === 'music' ? 'square' : 'poster'} showTitle={false} className="table-thumb" />
                        <span><strong>{c.title}</strong><span className="muted small">{c.slug}</span></span>
                      </Link>
                    </td>
                    <td>{TYPE_LABEL[c.type]}</td>
                    <td>{c.access === 'premium' ? <Badge tone="premium" icon="lock">Premium</Badge> : <Badge tone="neutral">Gratis</Badge>}</td>
                    <td>{regionName(c.region) || <span className="muted">—</span>}</td>
                    <td>{c.published ? 'Tayang' : <Badge tone="neutral">Draf</Badge>}</td>
                    <td><input type="checkbox" aria-label={`Unggulan: ${c.title}`} checked={c.featured} onChange={(e) => quick(c, { featured: e.target.checked })} /></td>
                    <td><input type="checkbox" aria-label={`Pilihan KELIR: ${c.title}`} checked={c.editorPick} onChange={(e) => quick(c, { editorPick: e.target.checked })} /></td>
                    <td className="table-actions">
                      <IconButton icon="edit" label={`Ubah ${c.title}`} onClick={() => navigate(`/admin/contents/${c.id}`)} />
                      <IconButton icon="trash" label={`Hapus ${c.title}`} onClick={() => setToDelete(c)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pager">
            <Button variant="tertiary" size="sm" icon="chevron-left" disabled={page <= 1} onClick={() => set('page', String(page - 1))}>Sebelumnya</Button>
            <span className="muted">Halaman {list.data.page} dari {list.data.totalPages} · {list.data.total} konten</span>
            <Button variant="tertiary" size="sm" iconRight="chevron-right" disabled={page >= list.data.totalPages} onClick={() => set('page', String(page + 1))}>Berikutnya</Button>
          </div>
        </>
      )}
      <Modal open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Hapus konten?" footer={<><Button variant="tertiary" onClick={() => setToDelete(null)}>Batal</Button><Button icon="trash" onClick={remove}>Hapus permanen</Button></>}>
        <p>“{toDelete?.title}” beserta ulasan dan progres tontonannya akan dihapus, dan dikeluarkan dari favorit, watchlist, serta koleksi pengguna. Untuk menyembunyikan sementara, ubah statusnya menjadi Draf.</p>
      </Modal>
    </div>
  );
}
