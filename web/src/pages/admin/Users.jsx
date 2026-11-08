import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useAsync, useDocumentTitle } from '../../lib/hooks.js';
import { date, SUB_LABEL } from '../../lib/format.js';
import { Avatar, Badge, Button, ErrorState, Modal, Spinner, TextField } from '../../components/ui.jsx';

function SubscriptionEditor({ user, onClose, onSaved }) {
  const [form, setForm] = useState({ status: user.subscription.status, plan: user.subscription.plan || 'monthly', expiresAt: user.subscription.expiresAt ? user.subscription.expiresAt.slice(0, 10) : '' });
  const [status, setStatus] = useState({ busy: false, error: null });
  const save = async () => {
    setStatus({ busy: true, error: null });
    try {
      const res = await api.admin.updateSubscription(user.id, { status: form.status, plan: form.status === 'FREE' ? null : form.plan, expiresAt: form.expiresAt || null });
      onSaved(res.user);
    } catch (error) {
      setStatus({ busy: false, error });
    }
  };
  return (
    <Modal open onClose={onClose} title={`Langganan ${user.name}`} footer={<><Button variant="tertiary" onClick={onClose}>Batal</Button><Button busy={status.busy} onClick={save}>Simpan</Button></>}>
      <div className="stack">
        <TextField as="select" label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          {Object.entries(SUB_LABEL).map(([k, v]) => <option key={k} value={k}>{k} · {v}</option>)}
        </TextField>
        {form.status !== 'FREE' && (
          <div className="form-row">
            <TextField as="select" label="Paket" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
              <option value="monthly">Bulanan</option>
              <option value="annual">Tahunan</option>
            </TextField>
            <TextField label="Berlaku sampai" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} hint="Kosong: otomatis sesuai paket." />
          </div>
        )}
        <p className="muted small">ACTIVE dan CANCELLED memberi akses Premium sampai tanggal berlaku. Perubahan dicatat di Transaksi.</p>
        {status.error && <p className="field-error">{status.error.message}</p>}
      </div>
    </Modal>
  );
}

export default function Users() {
  useDocumentTitle('Admin · Pengguna');
  const { user: me } = useAuth();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const page = Number(params.get('page') || 1);
  const list = useAsync(() => api.admin.users({ q, page }), [q, page]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);
  const replace = (u) => list.setData((d) => ({ ...d, items: d.items.map((x) => (x.id === u.id ? u : x)) }));
  const patch = async (u, body) => {
    setError(null);
    try {
      replace((await api.admin.updateUser(u.id, body)).user);
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <div className="stack-lg">
      <header className="admin-head">
        <div>
          <h1 className="t-h1">Pengguna & langganan</h1>
          <p className="page-sub">Ubah peran, nonaktifkan akun, atau atur status langganan.</p>
        </div>
      </header>
      <form role="search" className="admin-filters" onSubmit={(e) => { e.preventDefault(); setParams({ q: new FormData(e.currentTarget).get('q') }); }}>
        <TextField key={q} name="q" label="Cari" icon="search" defaultValue={q} placeholder="Nama atau email" />
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}
      {list.loading && !list.data ? <Spinner /> : list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Pengguna</th><th>Peran</th><th>Status akun</th><th>Langganan</th><th>Bergabung</th><th><span className="sr-only">Aksi</span></th></tr></thead>
              <tbody>
                {list.data.items.map((u) => (
                  <tr key={u.id} className={u.status === 'suspended' ? 'row-muted' : ''}>
                    <td><span className="table-title"><Avatar user={u} size={32} /><span><strong>{u.name}</strong><span className="muted small">{u.email}</span></span></span></td>
                    <td>
                      <select className="input input-sm select" aria-label={`Peran ${u.name}`} value={u.role} disabled={u.id === me.id} onChange={(e) => patch(u, { role: e.target.value })}>
                        <option value="user">Pengguna</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <Button variant="tertiary" size="sm" disabled={u.id === me.id} onClick={() => patch(u, { status: u.status === 'active' ? 'suspended' : 'active' })}>
                        {u.status === 'active' ? 'Aktif · Nonaktifkan' : 'Nonaktif · Aktifkan'}
                      </Button>
                    </td>
                    <td>
                      <Badge tone={u.subscription.isPremium ? 'premium' : 'neutral'}>{SUB_LABEL[u.subscription.status]}</Badge>
                      {u.subscription.expiresAt && <span className="muted small block">s/d {date(u.subscription.expiresAt)}</span>}
                    </td>
                    <td className="muted">{date(u.createdAt)}</td>
                    <td><Button variant="secondary" size="sm" onClick={() => setEditing(u)}>Langganan</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pager">
            <Button variant="tertiary" size="sm" icon="chevron-left" disabled={page <= 1} onClick={() => setParams({ q, page: String(page - 1) })}>Sebelumnya</Button>
            <span className="muted">Halaman {list.data.page} dari {list.data.totalPages}</span>
            <Button variant="tertiary" size="sm" iconRight="chevron-right" disabled={page >= list.data.totalPages} onClick={() => setParams({ q, page: String(page + 1) })}>Berikutnya</Button>
          </div>
        </>
      )}
      {editing && <SubscriptionEditor user={editing} onClose={() => setEditing(null)} onSaved={(u) => { replace(u); setEditing(null); }} />}
    </div>
  );
}
