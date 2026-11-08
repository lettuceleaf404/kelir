import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAsync, useDocumentTitle } from '../lib/hooks.js';
import ContentCard from '../components/ContentCard.jsx';
import { Button, EmptyState, ErrorState, IconButton, Modal, Spinner, TextField } from '../components/ui.jsx';

export default function CollectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const col = useAsync(() => api.collection(id), [id]);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState(null);
  useDocumentTitle(col.data?.collection.name);

  if (col.loading && !col.data) return <Spinner />;
  if (col.error) return <div className="page container"><ErrorState error={col.error} /></div>;
  const { collection } = col.data;

  const remove = async (contentId) => {
    const res = await api.setInCollection(collection.id, contentId, false);
    col.setData(res);
  };
  const save = async (e) => {
    e.preventDefault();
    try {
      col.setData(await api.updateCollection(collection.id, form));
      setEditing(false);
    } catch (err) {
      setError(err);
    }
  };
  const destroy = async () => {
    await api.deleteCollection(collection.id);
    navigate('/collection?tab=collections');
  };

  return (
    <div className="page container">
      <header className="page-head">
        <div>
          <p className="overline">Koleksi saya</p>
          <h1 className="t-h1">{collection.name}</h1>
          <p className="page-sub">{collection.description || 'Tanpa deskripsi'} · {collection.itemCount} judul</p>
        </div>
        <div className="row">
          <Button variant="secondary" icon="edit" onClick={() => { setForm({ name: collection.name, description: collection.description }); setEditing(true); }}>Ubah</Button>
          <Button variant="tertiary" icon="trash" onClick={() => setConfirmDelete(true)}>Hapus</Button>
        </div>
      </header>
      {collection.items.length === 0 ? (
        <EmptyState icon="grid" title="Koleksi ini masih kosong" action={<Button to="/explore">Cari judul</Button>}>
          Buka halaman judul mana pun lalu pilih “Koleksi”.
        </EmptyState>
      ) : (
        <div className="grid grid-poster">
          {collection.items.map((c) => (
            <div key={c.id} className="removable">
              <ContentCard content={c} />
              <IconButton icon="close" label={`Keluarkan ${c.title} dari koleksi`} className="removable-btn" onClick={() => remove(c.id)} />
            </div>
          ))}
        </div>
      )}
      <Modal open={editing} onClose={() => setEditing(false)} title="Ubah koleksi">
        <form className="stack" onSubmit={save}>
          <TextField label="Nama" required maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={error?.fieldError?.('name')} />
          <TextField as="textarea" label="Deskripsi" rows={2} maxLength={200} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="row"><Button type="submit">Simpan</Button><Button variant="tertiary" onClick={() => setEditing(false)}>Batal</Button></div>
        </form>
      </Modal>
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Hapus koleksi?" footer={<><Button variant="tertiary" onClick={() => setConfirmDelete(false)}>Batal</Button><Button onClick={destroy} icon="trash">Hapus koleksi</Button></>}>
        <p>“{collection.name}” akan dihapus. Judul-judulnya tetap ada di KELIR dan di favoritmu.</p>
      </Modal>
    </div>
  );
}
