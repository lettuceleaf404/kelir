import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAsync, useDocumentTitle } from '../lib/hooks.js';
import { date, duration, metaLine, rating, REGIONS, remaining, TYPE_LABEL } from '../lib/format.js';
import Artwork from '../components/Artwork.jsx';
import { Rail } from '../components/ContentCard.jsx';
import LibraryActions from '../components/LibraryActions.jsx';
import Icon from '../components/Icon.jsx';
import { Avatar, Badge, Button, EmptyState, ErrorState, Spinner, StarInput, Stars, TypeBadge } from '../components/ui.jsx';

const CREATOR_LABEL = { film: 'Sutradara', series: 'Kreator', documentary: 'Sutradara', music: 'Artis' };

/** What the main button does, given who is watching. */
function PlayAction({ content, me }) {
  const { user, isPremium } = useAuth();
  const location = useLocation();
  const isMusic = content.type === 'music';
  const verb = isMusic ? 'Dengarkan' : 'Tonton';
  if (!content.playable) return null;

  if (!user) {
    return (
      <Button size="lg" icon="play" to="/login" state={{ from: location.pathname }}>
        Masuk untuk {verb.toLowerCase()}
      </Button>
    );
  }
  const progress = me?.progress;
  const resumeTo = `/play/${content.slug}${progress?.episode ? `?episode=${progress.episode}` : ''}`;
  if (content.access === 'premium' && !isPremium) {
    const freeEpisode = content.episodes.find((e) => e.access === 'free');
    return (
      <>
        {freeEpisode && (
          <Button size="lg" icon="play" to={`/play/${content.slug}?episode=${freeEpisode.number}`}>
            Tonton Episode {freeEpisode.number} gratis
          </Button>
        )}
        <Button size="lg" variant="premium" icon="lock" to="/premium" state={{ from: location.pathname }}>
          Buka dengan Premium
        </Button>
      </>
    );
  }
  if (progress && !progress.completed) {
    return (
      <Button size="lg" icon="play" to={resumeTo}>
        Lanjutkan{progress.episode ? ` Ep. ${progress.episode}` : ''} · {remaining(progress.remainingSeconds)}
      </Button>
    );
  }
  return (
    <Button size="lg" icon="play" to={`/play/${content.slug}`}>
      {content.episodes.length ? `${verb} Episode 1` : `${verb} Sekarang`}
    </Button>
  );
}

function Episodes({ content }) {
  const { isPremium, user } = useAuth();
  return (
    <section className="detail-section" aria-labelledby="episodes">
      <h2 className="t-h3" id="episodes">Episode</h2>
      <ol className="episodes">
        {content.episodes.map((e) => {
          const locked = e.access === 'premium' && !isPremium;
          return (
            <li key={`${e.season}-${e.number}`} className="episode">
              <span className="episode-num">{e.number}</span>
              <span className="episode-text">
                <span className="episode-title">{e.title}</span>
                <span className="episode-meta">
                  Musim {e.season}{e.durationMinutes ? ` · ${duration(e.durationMinutes)}` : ''}
                </span>
              </span>
              {e.access === 'free' ? <Badge tone="neutral">Gratis</Badge> : <Badge tone="premium" icon="lock">Premium</Badge>}
              {locked ? (
                <Button variant="premium" size="sm" to="/premium">Buka</Button>
              ) : (
                <Button variant="secondary" size="sm" icon="play" to={user ? `/play/${content.slug}?episode=${e.number}` : '/login'} aria-label={`Putar episode ${e.number}`}>
                  Putar
                </Button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Trailer({ content }) {
  if (content.trailerYoutubeId) {
    return (
      <div className="trailer">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${content.trailerYoutubeId}?rel=0`}
          title={`Trailer ${content.title}`}
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }
  return (
    <div className="trailer trailer-empty">
      <Icon name="play" size={28} />
      <p>{content.type === 'music' ? 'Video resmi belum ditautkan.' : 'Trailer resmi belum ditautkan.'}</p>
      <Button variant="secondary" size="sm" href={content.trailerSearchUrl} target="_blank" rel="noreferrer" iconRight="external">
        Cari di YouTube
      </Button>
    </div>
  );
}

function Reviews({ content, me, onChanged }) {
  const { user } = useAuth();
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const list = useAsync(() => api.reviews(content.slug, page), [content.slug, page, me?.review?.updatedAt]);
  const [form, setForm] = useState({ rating: me?.review?.rating || 0, comment: me?.review?.comment || '' });
  const [status, setStatus] = useState({ saving: false, error: null, saved: false });

  useEffect(() => {
    setForm({ rating: me?.review?.rating || 0, comment: me?.review?.comment || '' });
  }, [me?.review]);
  useEffect(() => {
    if (list.data) setItems((prev) => (list.data.page === 1 ? list.data.items : [...prev, ...list.data.items]));
  }, [list.data]);

  const save = async (e) => {
    e.preventDefault();
    if (!form.rating) return setStatus({ saving: false, error: 'Pilih 1 sampai 5 bintang dulu.', saved: false });
    setStatus({ saving: true, error: null, saved: false });
    try {
      await api.saveReview(content.slug, form);
      setStatus({ saving: false, error: null, saved: true });
      setPage(1);
      onChanged();
    } catch (err) {
      setStatus({ saving: false, error: err.fieldError?.('comment') || err.message, saved: false });
    }
  };
  const remove = async () => {
    setStatus({ saving: true, error: null, saved: false });
    try {
      await api.deleteReview(content.slug);
      setStatus({ saving: false, error: null, saved: false });
      setPage(1);
      onChanged();
    } catch (err) {
      setStatus({ saving: false, error: err.message, saved: false });
    }
  };

  return (
    <section className="detail-section" aria-labelledby="reviews">
      <div className="reviews-head">
        <h2 className="t-h3" id="reviews">Ulasan</h2>
        <span className="reviews-score">
          <strong>{content.ratingCount ? rating(content.ratingAvg) : '–'}</strong>
          <Stars value={content.ratingAvg} />
          <span className="muted">{content.ratingCount} ulasan</span>
        </span>
      </div>

      {user ? (
        <form className="review-form" onSubmit={save}>
          <p className="field-label">{me?.review ? 'Ulasanmu' : 'Beri rating dan ulasan'}</p>
          <StarInput value={form.rating} onChange={(r) => setForm((f) => ({ ...f, rating: r }))} />
          <label htmlFor="review-comment" className="sr-only">Ulasan</label>
          <textarea id="review-comment" className="input" rows={3} maxLength={1000} placeholder="Apa yang paling kamu ingat? (opsional)" value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} />
          <div className="row">
            <Button type="submit" busy={status.saving}>{me?.review ? 'Simpan perubahan' : 'Kirim ulasan'}</Button>
            {me?.review && <Button variant="tertiary" icon="trash" onClick={remove}>Hapus ulasanku</Button>}
            {status.saved && <span className="success-text" role="status"><Icon name="check" size={16} /> Tersimpan</span>}
          </div>
          {status.error && <p className="field-error" role="alert"><Icon name="alert" size={16} />{status.error}</p>}
        </form>
      ) : (
        <p className="review-login">
          <Link to="/login" state={{ from: location.pathname }}>Masuk</Link> untuk memberi rating dan ulasan.
        </p>
      )}

      {list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : items.length === 0 && !list.loading ? (
        <EmptyState icon="message" title="Belum ada ulasan">Jadilah yang pertama mengulas.</EmptyState>
      ) : (
        <ul className="review-list">
          {items.map((r) => (
            <li key={r.id} className="review">
              <Avatar user={r.user} size={40} />
              <div>
                <p className="review-who">
                  <strong>{r.user.name}</strong> <Stars value={r.rating} size={14} /> <span className="muted">{date(r.updatedAt)}</span>
                </p>
                {r.comment && <p className="review-text">{r.comment}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
      {list.data && list.data.page < list.data.totalPages && (
        <Button variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)} busy={list.loading}>Muat ulasan lain</Button>
      )}
    </section>
  );
}

export default function Detail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const detail = useAsync(() => api.content(slug), [slug, user?.id]);
  const related = useAsync(() => api.related(slug), [slug]);
  useDocumentTitle(detail.data?.content.title);

  if (detail.loading && !detail.data) return <Spinner />;
  if (detail.error) {
    return detail.error.status === 404 ? (
      <div className="page container"><EmptyState icon="search" title="Judul tidak ditemukan" action={<Button to="/explore">Ke Explore</Button>}>Mungkin sudah dihapus atau tautannya salah.</EmptyState></div>
    ) : (
      <ErrorState error={detail.error} onRetry={detail.reload} />
    );
  }
  const { content, me } = detail.data;
  const shape = content.type === 'music' ? 'square' : 'poster';
  const facts = [
    ['Tahun', content.year ?? 'Tradisional'],
    [content.episodes.length ? 'Episode' : 'Durasi', content.episodes.length ? `${content.episodes.length} episode` : duration(content.durationMinutes)],
    ['Bahasa', content.language],
    ['Negara', content.country],
    ['Jaringan', content.network],
    ['Album', content.album],
    ['Genre', content.genres.join(', ')],
  ].filter(([, v]) => v);

  return (
    <div className="page detail">
      <div className="detail-hero">
        <div className="container detail-hero-inner">
          <Artwork content={content} shape={shape} className="detail-art" />
          <div className="detail-copy">
            <div className="badge-row">
              <TypeBadge type={content.type} />
              {content.categories.includes('budaya') && <Badge tone="budaya">Budaya</Badge>}
              {content.access === 'premium' ? <Badge tone="premium" icon="lock">Premium</Badge> : <Badge tone="neutral">Gratis</Badge>}
            </div>
            <h1 className="t-h1 detail-title">{content.title}</h1>
            {content.originalTitle && <p className="detail-original">{content.originalTitle}</p>}
            <p className="detail-meta">
              {metaLine(content)}
              {content.ratingCount > 0 && (
                <span className="detail-rating"><Icon name="star" size={16} filled /> {rating(content.ratingAvg)} ({content.ratingCount})</span>
              )}
            </p>
            <p className="detail-creator">{CREATOR_LABEL[content.type]}: <strong>{content.creator}</strong></p>
            <p className="t-body-l detail-synopsis">{content.synopsis}</p>
            <div className="detail-actions">
              <PlayAction content={content} me={me} />
              <Button size="lg" variant="secondary" icon="play" href="#trailer">{content.type === 'music' ? 'Video' : 'Trailer'}</Button>
            </div>
            <LibraryActions content={content} />
            {content.officialWatch && (
              <a className="official-link" href={content.officialWatch.url} target="_blank" rel="noreferrer">
                <Icon name="external" size={16} /> {content.officialWatch.label}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="container detail-body">
        <div className="detail-main">
          {content.episodes.length > 0 && <Episodes content={content} />}
          <section className="detail-section" id="trailer" aria-labelledby="trailer-title">
            <h2 className="t-h3" id="trailer-title">{content.type === 'music' ? 'Video' : 'Trailer'}</h2>
            <Trailer content={content} />
          </section>
          <Reviews content={content} me={me} onChanged={detail.reload} />
        </div>

        <aside className="detail-side">
          {content.region && (
            <section className={`region-card art-${REGIONS.find((r) => r.key === content.region)?.art || 'coral'}`} aria-labelledby="asal">
              <p className="overline"><Icon name="map-pin" size={16} /> Asal daerah</p>
              <h2 className="t-h3" id="asal">{content.regionName}</h2>
              {content.regionDetail && content.regionDetail !== content.regionName && <p className="region-detail">{content.regionDetail}</p>}
              <p className="region-basis"><strong>Dasar:</strong> {content.regionBasis}</p>
              <Button variant="tertiary" size="sm" to={`/explore?region=${content.region}`} iconRight="chevron-right">Cerita lain dari {content.regionName}</Button>
            </section>
          )}
          <section className="facts" aria-label="Informasi">
            <dl>
              {facts.map(([k, v]) => (
                <div key={k} className="fact">
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            {content.cast.length > 0 && (
              <>
                <h2 className="facts-title">Pemeran</h2>
                <ul className="cast">
                  {content.cast.map((name) => (
                    <li key={name}><Link to={`/explore?q=${encodeURIComponent(name.replace(/ \(.*\)$/, ''))}`}>{name}</Link></li>
                  ))}
                </ul>
              </>
            )}
            <p className="muted small">Jenis: {TYPE_LABEL[content.type]}. Video yang diputar di KELIR adalah aset demo.</p>
          </section>
        </aside>
      </div>

      {related.data?.items.length > 0 && (
        <section className="container section" aria-labelledby="related">
          <h2 className="t-h2 section-title" id="related">Mungkin kamu suka</h2>
          <Rail items={related.data.items} label="Konten terkait" />
        </section>
      )}
    </div>
  );
}
