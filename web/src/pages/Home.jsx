import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAsync, useDocumentTitle } from '../lib/hooks.js';
import { metaLine, TYPE_LABEL } from '../lib/format.js';
import Artwork from '../components/Artwork.jsx';
import { Rail } from '../components/ContentCard.jsx';
import LibraryActions from '../components/LibraryActions.jsx';
import Icon from '../components/Icon.jsx';
import { Badge, Button, ErrorState, SectionHeader, Spinner, TypeBadge } from '../components/ui.jsx';

function Hero({ items }) {
  const [index, setIndex] = useState(0);
  const item = items[index];
  if (!item) return null;
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <div className="badge-row">
          <TypeBadge type={item.type} />
          {item.access === 'premium' ? <Badge tone="premium" icon="lock">Premium</Badge> : <Badge tone="neutral">Gratis</Badge>}
          {item.regionName && <Badge tone="neutral" icon="map-pin">{item.regionName}</Badge>}
        </div>
        <h1 id="hero-title" className="hero-title">{item.title}</h1>
        <p className="hero-meta">{metaLine(item)} · {item.creator}</p>
        <p className="hero-synopsis">{item.synopsis}</p>
        <div className="hero-actions">
          <Button size="lg" icon="play" to={`/play/${item.slug}`}>Tonton Sekarang</Button>
          <Button size="lg" variant="tertiary" to={`/title/${item.slug}`} iconRight="chevron-right">Detail</Button>
        </div>
        <LibraryActions content={item} compact />
        {items.length > 1 && (
          <div className="hero-dots" role="tablist" aria-label="Konten unggulan">
            {items.map((it, i) => (
              <button key={it.id} role="tab" aria-selected={i === index} aria-label={it.title} className={i === index ? 'on' : ''} onClick={() => setIndex(i)} />
            ))}
          </div>
        )}
      </div>
      <Link to={`/title/${item.slug}`} className="hero-art" tabIndex={-1} aria-hidden>
        <Artwork content={item} shape="wide" />
      </Link>
    </section>
  );
}

function Trending({ items }) {
  const [first, ...rest] = items;
  if (!first) return null;
  return (
    <div className="trending">
      <Link to={`/title/${first.slug}`} className="trending-top">
        <Artwork content={first} shape="wide" />
        <div className="trending-top-copy">
          <span className="trending-rank">1</span>
          <div>
            <span className="trending-title">{first.title}</span>
            <span className="trending-meta">{metaLine(first)}{first.regionName ? ` · ${first.regionName}` : ''}</span>
          </div>
        </div>
      </Link>
      <ol className="trending-list" start={2}>
        {rest.slice(0, 6).map((c, i) => (
          <li key={c.id}>
            <Link to={`/title/${c.slug}`} className="trending-row">
              <span className="trending-rank">{i + 2}</span>
              <Artwork content={c} shape={c.type === 'music' ? 'square' : 'poster'} showTitle={false} className="trending-thumb" />
              <span className="trending-text">
                <span className="trending-title">{c.title}</span>
                <span className="trending-meta">{TYPE_LABEL[c.type]}{c.regionName ? ` · ${c.regionName}` : ''}</span>
              </span>
              {c.access === 'premium' && <Icon name="lock" size={18} title="Premium" />}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

function RegionTiles({ regions }) {
  return (
    <div className="region-grid">
      {regions.map((r) => (
        <Link key={r.key} to={`/explore?region=${r.key}`} className={`region-tile art-${r.art}`}>
          <span className="region-name">{r.name}</span>
          <span className="region-count">{r.count} judul</span>
          <span className="region-stack" aria-hidden>
            {r.sample.map((c) => (
              <Artwork key={c.id} content={c} shape="poster" showTitle={false} />
            ))}
          </span>
        </Link>
      ))}
      <Link to="/explore" className="region-tile region-all">
        <Icon name="explore" size={28} />
        <span className="region-name">Semua cerita</span>
        <span className="region-count">Cari per genre, bahasa, tahun</span>
      </Link>
    </div>
  );
}

function Picks({ items }) {
  return (
    <div className="picks">
      {items.slice(0, 4).map((c) => (
        <Link key={c.id} to={`/title/${c.slug}`} className="pick">
          <Artwork content={c} shape={c.type === 'music' ? 'square' : 'poster'} className="pick-art" />
          <div className="pick-copy">
            <TypeBadge type={c.type} />
            <span className="pick-title">{c.title}</span>
            {c.editorNote && <q className="pick-note">{c.editorNote}</q>}
            <span className="pick-meta">{metaLine(c, { withType: false })}{c.regionName ? ` · ${c.regionName}` : ''}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function Home() {
  useDocumentTitle(null);
  const { user, isPremium } = useAuth();
  const { loading, error, data, reload } = useAsync(() => api.home(), [user?.id]);

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="page home">
      <div className="container">
        <Hero items={data.hero} />

        {data.continueWatching.length > 0 && (
          <section className="section" aria-labelledby="continue">
            <SectionHeader id="continue" title="Lanjutkan Menonton" to="/collection?tab=progress" />
            <Rail items={data.continueWatching} kind="video" label="Lanjutkan Menonton" progressFor />
          </section>
        )}

        {data.recommended?.items.length > 0 && (
          <section className="section" aria-labelledby="for-you">
            <SectionHeader id="for-you" title={`Untuk ${user.name.split(' ')[0]}`} subtitle="Dari genre dan daerah favoritmu" />
            <Rail items={data.recommended.items} label="Rekomendasi" />
          </section>
        )}

        <section className="section" aria-labelledby="trending">
          <SectionHeader id="trending" title="Trending di Nusantara" subtitle="Paling banyak ditonton dan didengar minggu ini" to="/explore?origin=nusantara&sort=popular" />
          <Trending items={data.trending} />
        </section>

        <section className="section" aria-labelledby="regions">
          <SectionHeader id="regions" title="Jelajahi Cerita" subtitle="Dari Sumatra sampai Papua, berdasarkan latar cerita, lokasi syuting, atau asal lagu" />
          <RegionTiles regions={data.regions} />
        </section>

        <section className="section" aria-labelledby="picks">
          <SectionHeader id="picks" title="Pilihan KELIR" subtitle="Dikurasi tim redaksi" to="/explore?pick=1" />
          <Picks items={data.picks} />
        </section>
      </div>

      <section className="section premium-band" data-theme="dark" aria-labelledby="premium">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 className="t-h2" id="premium">Konten Premium</h2>
              <p className="section-sub">Film dan serial pilihan dengan langganan KELIR Premium</p>
            </div>
            {!isPremium && <Button variant="premium" to="/premium" icon="sparkle">Langganan Premium</Button>}
          </div>
          <Rail items={data.premium} label="Konten Premium" />
        </div>
      </section>

      <div className="container">
        <section className="section" aria-labelledby="series">
          <SectionHeader id="series" title="Serial Populer" to="/watch?type=series" />
          <Rail items={data.popularSeries} label="Serial Populer" />
        </section>
        <section className="section" aria-labelledby="music">
          <SectionHeader id="music" title="Sorotan Musik" subtitle="Lagu daerah sampai album yang membentuk zamannya" to="/explore?type=music" />
          <Rail items={data.music} label="Sorotan Musik" />
        </section>
        <section className="section" aria-labelledby="added">
          <SectionHeader id="added" title="Baru Ditambahkan" to="/explore?sort=added" />
          <Rail items={data.recentlyAdded} label="Baru Ditambahkan" />
        </section>
      </div>
    </div>
  );
}

