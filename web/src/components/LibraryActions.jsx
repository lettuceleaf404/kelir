import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, EmptyState } from './ui.jsx';
import Icon from './Icon.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { api } from '../api.js';

/** Favorite, Watchlist and Watched toggles plus "Tambah ke koleksi". Guests are sent to sign in. */
export default function LibraryActions({ content, compact }) {
  const { user, inList, toggleList } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [collectionsOpen, setCollectionsOpen] = useState(false);

  const toggle = async (list) => {
    if (!user) return navigate('/login', { state: { from: `/title/${content.slug}` } });
    setBusy(list);
    setError(null);
    try {
      await toggleList(list, content.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const items = [
    { list: 'favorites', on: 'Favorit', off: 'Favorit', icon: 'heart' },
    { list: 'watchlist', on: 'Di watchlist', off: 'Watchlist', icon: content.type === 'music' ? 'list' : 'plus' },
    { list: 'watched', on: content.type === 'music' ? 'Sudah didengar' : 'Sudah ditonton', off: content.type === 'music' ? 'Sudah didengar?' : 'Sudah ditonton?', icon: 'check' },
  ];
  return (
    <div className="library-actions">
      {items.map((it) => {
        const on = inList(it.list, content.id);
        return (
          <button key={it.list} type="button" className={`toggle ${on ? 'toggle-on' : ''}`} aria-pressed={on} onClick={() => toggle(it.list)} disabled={busy === it.list}>
            <Icon name={it.icon} size={18} filled={on && it.list === 'favorites'} />
            {!compact && <span>{on ? it.on : it.off}</span>}
          </button>
        );
      })}
      <button type="button" className="toggle" onClick={() => (user ? setCollectionsOpen(true) : navigate('/login'))}>
        <Icon name="grid" size={18} />
        {!compact && <span>Koleksi</span>}
      </button>
      {error && <p className="field-error" role="alert">{error}</p>}
      {collectionsOpen && <CollectionPicker content={content} onClose={() => setCollectionsOpen(false)} />}
    </div>
  );
}

function CollectionPicker({ content, onClose }) {
  const [state, setState] = useState({ loading: true, items: [], error: null });
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.collections().then((r) => setState({ loading: false, items: r.items, error: null })).catch((e) => setState({ loading: false, items: [], error: e }));
  }, []);
  const has = (col) => col.items.some((i) => i.id === content.id);
  const toggle = async (col) => {
    const res = await api.setInCollection(col.id, content.id, !has(col));
    setState((s) => ({ ...s, items: s.items.map((c) => (c.id === col.id ? res.collection : c)) }));
  };
  const create = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const { collection } = await api.createCollection({ name });
      const res = await api.setInCollection(collection.id, content.id, true);
      setState((s) => ({ ...s, items: [res.collection, ...s.items] }));
      setName('');
    } catch (err) {
      setState((s) => ({ ...s, error: err }));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open onClose={onClose} title="Tambah ke koleksi" footer={<Button variant="secondary" onClick={onClose}>Selesai</Button>}>
      {state.loading ? (
        <p className="muted">Memuat koleksi…</p>
      ) : (
        <>
          {state.items.length === 0 && <EmptyState icon="grid" title="Belum ada koleksi">Buat koleksi pertamamu di bawah.</EmptyState>}
          <ul className="picker-list">
            {state.items.map((col) => (
              <li key={col.id}>
                <label className="picker-row">
                  <input type="checkbox" checked={has(col)} onChange={() => toggle(col)} />
                  <span>
                    <strong>{col.name}</strong>
                    <span className="muted"> · {col.itemCount} judul</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <form className="picker-new" onSubmit={create}>
            <label htmlFor="new-collection" className="field-label">Koleksi baru</label>
            <div className="row">
              <input id="new-collection" className="input" maxLength={60} placeholder="Misal: Film tentang laut" value={name} onChange={(e) => setName(e.target.value)} />
              <Button type="submit" variant="secondary" icon="plus" busy={saving}>Buat</Button>
            </div>
          </form>
          {state.error && <p className="field-error">{state.error.message}</p>}
        </>
      )}
    </Modal>
  );
}
