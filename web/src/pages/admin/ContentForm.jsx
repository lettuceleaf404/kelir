import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api.js';
import { useDocumentTitle } from '../../lib/hooks.js';
import { REGIONS, TYPE_LABEL } from '../../lib/format.js';
import Artwork from '../../components/Artwork.jsx';
import Icon from '../../components/Icon.jsx';
import { Button, ErrorState, IconButton, Spinner, TextField } from '../../components/ui.jsx';

const ARTS = ['coral', 'mango', 'turquoise', 'lilac', 'ink'];
const EMPTY = {
  slug: '', type: 'film', title: '', originalTitle: '', year: '', genres: '', categories: [], synopsis: '', creator: '', cast: '',
  durationMinutes: '', language: '', country: 'Indonesia', network: '', album: '', region: '', regionDetail: '', regionBasis: '',
  access: 'free', trailerYoutubeId: '', officialLabel: '', officialUrl: '', posterUrl: '', art: 'coral',
  playbackSrc: '/media/kelir-demo-film.mp4', playbackFallback: '', playbackCredit: 'Klip demo KELIR', episodes: [],
  featured: false, editorPick: false, editorNote: '', published: true,
};
const slugify = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
const list = (text) => text.split(',').map((s) => s.trim()).filter(Boolean);
const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
const textOrNull = (v) => (v && String(v).trim() ? String(v).trim() : null);

function toForm(c) {
  return {
    ...EMPTY,
    ...Object.fromEntries(Object.entries(c).filter(([k]) => k in EMPTY && !['genres', 'cast', 'episodes'].includes(k)).map(([k, v]) => [k, v ?? ''])),
    genres: c.genres.join(', '),
    cast: c.cast.join(', '),
    region: c.region || '',
    officialLabel: c.officialWatch?.label || '',
    officialUrl: c.officialWatch?.url || '',
    playbackSrc: c.playback?.src || '',
    playbackFallback: c.playback?.fallbackSrc || '',
    playbackCredit: c.playback?.credit || '',
    episodes: c.episodes.map((e) => ({ ...e, durationMinutes: e.durationMinutes ?? '', src: e.playback?.src || '', credit: e.playback?.credit || '', fallbackSrc: e.playback?.fallbackSrc || '' })),
  };
}

function toPayload(f) {
  const hasEpisodes = f.type === 'series' || f.episodes.length > 0;
  return {
    slug: f.slug,
    type: f.type,
    title: f.title,
    originalTitle: textOrNull(f.originalTitle),
    year: numOrNull(f.year),
    genres: list(f.genres),
    categories: f.categories,
    synopsis: f.synopsis,
    creator: f.creator,
    cast: list(f.cast),
    durationMinutes: numOrNull(f.durationMinutes),
    language: textOrNull(f.language),
    country: textOrNull(f.country),
    network: textOrNull(f.network),
    album: textOrNull(f.album),
    region: f.region || null,
    regionDetail: f.region ? textOrNull(f.regionDetail) : null,
    regionBasis: f.region ? textOrNull(f.regionBasis) : null,
    access: f.access,
    trailerYoutubeId: textOrNull(f.trailerYoutubeId),
    officialWatch: f.officialUrl ? { label: f.officialLabel || 'Tonton di kanal resmi', url: f.officialUrl } : null,
    posterUrl: textOrNull(f.posterUrl),
    art: f.art,
    playback: !hasEpisodes && f.playbackSrc ? { src: f.playbackSrc, fallbackSrc: textOrNull(f.playbackFallback), credit: f.playbackCredit, isDemo: true } : null,
    episodes: hasEpisodes
      ? f.episodes.map((e) => ({
          season: Number(e.season) || 1,
          number: Number(e.number),
          title: e.title,
          synopsis: e.synopsis || '',
          durationMinutes: numOrNull(e.durationMinutes),
          access: e.access,
          playback: { src: e.src, fallbackSrc: textOrNull(e.fallbackSrc), credit: e.credit || '', isDemo: true },
        }))
      : [],
    featured: f.featured,
    editorPick: f.editorPick,
    editorNote: textOrNull(f.editorNote),
    published: f.published,
  };
}

export default function ContentForm() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState(null);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [status, setStatus] = useState({ busy: false, error: null, saved: false });
  useDocumentTitle(isNew ? 'Admin · Konten baru' : `Admin · ${form.title}`);

  useEffect(() => {
    if (isNew) return;
    api.admin.content(id).then(({ content }) => setForm(toForm(content))).catch(setLoadError).finally(() => setLoading(false));
  }, [id, isNew]);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value, ...(key === 'title' && !slugTouched ? { slug: slugify(value) } : {}) }));
  };
  const fieldError = (name) => status.error?.fields?.find((x) => x.field === name || x.field.startsWith(`${name}.`))?.message;
  const setEpisode = (i, key, value) => setForm((f) => ({ ...f, episodes: f.episodes.map((e, j) => (j === i ? { ...e, [key]: value } : e)) }));
  const addEpisode = () =>
    setForm((f) => ({
      ...f,
      episodes: [...f.episodes, { season: 1, number: f.episodes.length + 1, title: `Episode ${f.episodes.length + 1}`, durationMinutes: '', access: f.episodes.length ? 'premium' : 'free', src: '/media/kelir-demo-film.mp4', credit: 'Klip demo KELIR', fallbackSrc: '' }],
    }));

  const save = async (e) => {
    e.preventDefault();
    setStatus({ busy: true, error: null, saved: false });
    try {
      const payload = toPayload(form);
      const { content } = isNew ? await api.admin.createContent(payload) : await api.admin.updateContent(id, payload);
      setStatus({ busy: false, error: null, saved: true });
      if (isNew) navigate(`/admin/contents/${content.id}`, { replace: true });
      else setForm(toForm(content));
    } catch (error) {
      setStatus({ busy: false, error, saved: false });
    }
  };

  if (loading) return <Spinner />;
  if (loadError) return <ErrorState error={loadError} />;
  const hasEpisodes = form.type === 'series' || form.episodes.length > 0;

  return (
    <form className="stack-lg content-form" onSubmit={save} noValidate>
      <header className="admin-head">
        <div>
          <Link to="/admin/contents" className="back-link"><Icon name="arrow-left" size={18} /> Semua konten</Link>
          <h1 className="t-h1">{isNew ? 'Konten baru' : form.title || 'Tanpa judul'}</h1>
        </div>
        <div className="row">
          {!isNew && form.published && <Button variant="tertiary" to={`/title/${form.slug}`} iconRight="external">Lihat</Button>}
          <Button type="submit" busy={status.busy}>{isNew ? 'Simpan' : 'Simpan perubahan'}</Button>
        </div>
      </header>
      {status.error && (
        <p className="form-error" role="alert">
          <Icon name="alert" size={16} /> {status.error.message}
          {status.error.fields?.length > 0 && ` (${status.error.fields.map((f) => f.field).join(', ')})`}
        </p>
      )}
      {status.saved && <p className="success-text" role="status"><Icon name="check" size={16} /> Tersimpan</p>}

      <div className="form-grid">
        <fieldset className="panel stack">
          <legend className="t-h3">Informasi dasar</legend>
          <div className="form-row">
            <TextField as="select" label="Jenis" value={form.type} onChange={set('type')}>
              {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </TextField>
            <TextField label="Tahun rilis" type="number" min={1900} max={2100} value={form.year} onChange={set('year')} hint="Kosongkan untuk lagu tradisional." error={fieldError('year')} />
          </div>
          <TextField label="Judul" required value={form.title} onChange={set('title')} error={fieldError('title')} />
          <TextField label="Slug (alamat halaman)" required value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug')(e); }} error={fieldError('slug')} hint={`/title/${form.slug || '…'}`} />
          <TextField label="Judul asli / internasional" value={form.originalTitle} onChange={set('originalTitle')} />
          <TextField label={form.type === 'music' ? 'Artis' : form.type === 'series' ? 'Kreator' : 'Sutradara'} required value={form.creator} onChange={set('creator')} error={fieldError('creator')} />
          <TextField label="Pemeran" value={form.cast} onChange={set('cast')} hint="Pisahkan dengan koma." />
          <TextField label="Genre" value={form.genres} onChange={set('genres')} hint="Pisahkan dengan koma, maksimal 8." error={fieldError('genres')} />
          <label className="check-row">
            <input type="checkbox" checked={form.categories.includes('budaya')} onChange={(e) => setForm((f) => ({ ...f, categories: e.target.checked ? ['budaya'] : [] }))} />
            <span>Tandai sebagai konten <strong>Budaya</strong></span>
          </label>
          <TextField as="textarea" label="Sinopsis" rows={4} required maxLength={1000} value={form.synopsis} onChange={set('synopsis')} error={fieldError('synopsis')} />
          <div className="form-row">
            <TextField label="Durasi (menit)" type="number" min={1} value={form.durationMinutes} onChange={set('durationMinutes')} />
            <TextField label="Bahasa" value={form.language} onChange={set('language')} />
          </div>
          <div className="form-row">
            <TextField label="Negara" value={form.country} onChange={set('country')} hint="Tulis “Indonesia” agar masuk Trending di Nusantara." />
            <TextField label={form.type === 'music' ? 'Album' : 'Jaringan / platform'} value={form.type === 'music' ? form.album : form.network} onChange={set(form.type === 'music' ? 'album' : 'network')} />
          </div>
        </fieldset>

        <div className="stack">
          <fieldset className="panel stack">
            <legend className="t-h3">Metadata daerah</legend>
            <TextField as="select" label="Daerah" value={form.region} onChange={set('region')}>
              <option value="">Tidak dikaitkan dengan daerah</option>
              {REGIONS.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
            </TextField>
            {form.region && (
              <>
                <TextField label="Detail tempat" value={form.regionDetail} onChange={set('regionDetail')} placeholder="Misal: Wakatobi, Sulawesi Tenggara" />
                <TextField as="textarea" rows={3} label="Dasar penentuan daerah" required value={form.regionBasis} onChange={set('regionBasis')} error={fieldError('regionBasis')} hint="Wajib: latar cerita, lokasi syuting, atau asal lagu. Jangan menebak dari identitas pembuatnya." />
              </>
            )}
          </fieldset>

          <fieldset className="panel stack">
            <legend className="t-h3">Akses & tampilan</legend>
            <div className="form-row">
              <TextField as="select" label="Akses" value={form.access} onChange={set('access')}>
                <option value="free">Gratis</option>
                <option value="premium">Premium</option>
              </TextField>
              <TextField as="select" label="Warna artwork" value={form.art} onChange={set('art')}>
                {ARTS.map((a) => <option key={a} value={a}>{a}</option>)}
              </TextField>
            </div>
            <div className="preview-art">
              <Artwork content={{ ...form, posterUrl: textOrNull(form.posterUrl) }} shape={form.type === 'music' ? 'square' : 'poster'} />
              <TextField label="URL poster resmi (https)" value={form.posterUrl} onChange={set('posterUrl')} error={fieldError('posterUrl')} hint="Kosongkan untuk memakai artwork KELIR." />
            </div>
            <TextField label="ID trailer YouTube" value={form.trailerYoutubeId} onChange={set('trailerYoutubeId')} error={fieldError('trailerYoutubeId')} hint="11 karakter setelah watch?v=" />
            <div className="form-row">
              <TextField label="Tautan tonton resmi" value={form.officialUrl} onChange={set('officialUrl')} error={fieldError('officialWatch')} placeholder="https://…" />
              <TextField label="Label tautan" value={form.officialLabel} onChange={set('officialLabel')} />
            </div>
          </fieldset>

          <fieldset className="panel stack">
            <legend className="t-h3">Kurasi & status</legend>
            <label className="check-row"><input type="checkbox" checked={form.published} onChange={set('published')} /> <span><strong>Tayang</strong> (hapus centang untuk menyimpan sebagai draf)</span></label>
            <label className="check-row"><input type="checkbox" checked={form.featured} onChange={set('featured')} /> <span>Tampilkan di hero Home</span></label>
            <label className="check-row"><input type="checkbox" checked={form.editorPick} onChange={set('editorPick')} /> <span>Masukkan ke <strong>Pilihan KELIR</strong></span></label>
            {form.editorPick && <TextField label="Catatan redaksi" maxLength={160} value={form.editorNote} onChange={set('editorNote')} />}
          </fieldset>
        </div>
      </div>

      <fieldset className="panel stack">
        <legend className="t-h3">{hasEpisodes ? 'Episode' : 'Pemutaran'}</legend>
        <p className="muted small">Gunakan aset yang berlisensi: berkas di /media (klip demo KELIR) atau URL https dari sumber yang mengizinkan. Jangan unggah film tanpa hak tayang.</p>
        {!hasEpisodes ? (
          <div className="form-row three">
            <TextField label="Sumber video" value={form.playbackSrc} onChange={set('playbackSrc')} error={fieldError('playback')} />
            <TextField label="Cadangan (opsional)" value={form.playbackFallback} onChange={set('playbackFallback')} />
            <TextField label="Kredit" value={form.playbackCredit} onChange={set('playbackCredit')} />
          </div>
        ) : (
          <>
            {fieldError('episodes') && <p className="field-error">{fieldError('episodes')}</p>}
            <div className="table-wrap">
              <table className="table episodes-table">
                <thead><tr><th>Musim</th><th>No.</th><th>Judul</th><th>Menit</th><th>Akses</th><th>Sumber video</th><th>Kredit</th><th><span className="sr-only">Hapus</span></th></tr></thead>
                <tbody>
                  {form.episodes.map((ep, i) => (
                    <tr key={i}>
                      <td><input className="input input-sm" aria-label="Musim" type="number" min={1} value={ep.season} onChange={(e) => setEpisode(i, 'season', e.target.value)} /></td>
                      <td><input className="input input-sm" aria-label="Nomor" type="number" min={1} value={ep.number} onChange={(e) => setEpisode(i, 'number', e.target.value)} /></td>
                      <td><input className="input input-sm" aria-label="Judul episode" value={ep.title} onChange={(e) => setEpisode(i, 'title', e.target.value)} /></td>
                      <td><input className="input input-sm" aria-label="Durasi menit" type="number" min={1} value={ep.durationMinutes} onChange={(e) => setEpisode(i, 'durationMinutes', e.target.value)} /></td>
                      <td>
                        <select className="input input-sm select" aria-label="Akses episode" value={ep.access} onChange={(e) => setEpisode(i, 'access', e.target.value)}>
                          <option value="free">Gratis</option>
                          <option value="premium">Premium</option>
                        </select>
                      </td>
                      <td><input className="input input-sm" aria-label="Sumber video" value={ep.src} onChange={(e) => setEpisode(i, 'src', e.target.value)} /></td>
                      <td><input className="input input-sm" aria-label="Kredit" value={ep.credit} onChange={(e) => setEpisode(i, 'credit', e.target.value)} /></td>
                      <td><IconButton icon="trash" label={`Hapus episode ${ep.number}`} onClick={() => setForm((f) => ({ ...f, episodes: f.episodes.filter((_, j) => j !== i) }))} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button variant="secondary" icon="plus" onClick={addEpisode}>Tambah episode</Button>
          </>
        )}
      </fieldset>
      <div className="row"><Button type="submit" busy={status.busy}>{isNew ? 'Simpan' : 'Simpan perubahan'}</Button></div>
    </form>
  );
}
