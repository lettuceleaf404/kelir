import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useDocumentTitle } from '../lib/hooks.js';
import { clock, rupiah } from '../lib/format.js';
import Logo from '../components/Logo.jsx';
import Icon from '../components/Icon.jsx';
import { Button, ErrorState, IconButton, Spinner } from '../components/ui.jsx';

const SAVE_EVERY_MS = 10000;

/** Gate shown instead of the video when the server refuses playback. */
function Gate({ error, slug }) {
  const location = useLocation();
  const plans = error.code === 'PREMIUM_REQUIRED';
  return (
    <div className="gate">
      <span className="gate-art" aria-hidden><Icon name={plans ? 'lock' : 'profile'} size={32} /></span>
      <h1 className="t-h2">{plans ? 'Konten ini khusus Premium' : 'Masuk dulu, yuk'}</h1>
      <p className="t-body-l">
        {plans
          ? `Langganan KELIR Premium mulai ${rupiah(49000)} per bulan untuk menonton semua film dan serial Premium.`
          : 'Akun gratis sudah cukup untuk menonton semua konten bertanda Gratis.'}
      </p>
      <div className="row">
        {plans ? (
          <Button variant="premium" size="lg" icon="sparkle" to="/premium" state={{ from: `/play/${slug}${location.search}` }}>Lihat paket Premium</Button>
        ) : (
          <Button size="lg" to="/login" state={{ from: `/play/${slug}${location.search}` }}>Masuk</Button>
        )}
        <Button variant="tertiary" size="lg" to={`/title/${slug}`}>Kembali ke detail</Button>
      </div>
    </div>
  );
}

export default function Player() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const episode = params.get('episode') ? Number(params.get('episode')) : undefined;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [src, setSrc] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState({ current: 0, duration: 0 });
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const videoRef = useRef(null);
  const shellRef = useRef(null);
  const lastSaved = useRef(0);
  const hideTimer = useRef(null);

  useDocumentTitle(state.data ? `Menonton ${state.data.content.title}` : 'Menonton');

  useEffect(() => {
    let active = true;
    setState({ loading: true, error: null, data: null });
    api
      .play(slug, episode)
      .then((data) => {
        if (!active) return;
        setState({ loading: false, error: null, data });
        setSrc(data.source.src);
        setUsingFallback(false);
      })
      .catch((error) => active && setState({ loading: false, error, data: null }));
    return () => {
      active = false;
    };
  }, [slug, episode, user?.id]);

  const save = useCallback(
    (force = false) => {
      const v = videoRef.current;
      const data = state.data;
      if (!v || !data || !user || !v.duration || Number.isNaN(v.duration)) return;
      const now = Date.now();
      if (!force && now - lastSaved.current < SAVE_EVERY_MS) return;
      lastSaved.current = now;
      api
        .saveProgress(data.content.id, { episode: data.episode?.number ?? null, positionSeconds: v.currentTime, durationSeconds: v.duration })
        .catch(() => {});
    },
    [state.data, user],
  );

  // Save on leaving the page
  useEffect(() => () => save(true), [save]);

  // Fullscreen state follows the browser (Esc also exits)
  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };
  const seek = (seconds) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    v.currentTime = Math.min(Math.max(0, seconds), v.duration);
  };
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else shellRef.current?.requestFullscreen?.();
  };
  const changeVolume = (value) => {
    const v = videoRef.current;
    setVolume(value);
    if (v) {
      v.volume = value;
      v.muted = value === 0;
    }
    setMuted(value === 0);
  };
  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };
  const nudge = () => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => videoRef.current && !videoRef.current.paused && setControlsVisible(false), 2800);
  };

  const onKeyDown = (e) => {
    // Form controls (including the seek and volume sliders) handle their own keys.
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    if (['BUTTON', 'A'].includes(e.target.tagName) && [' ', 'Enter'].includes(e.key)) return;
    const v = videoRef.current;
    if (!v) return;
    const keys = {
      ' ': toggle,
      k: toggle,
      ArrowRight: () => seek(v.currentTime + 10),
      ArrowLeft: () => seek(v.currentTime - 10),
      ArrowUp: () => changeVolume(Math.min(1, Math.round((volume + 0.1) * 10) / 10)),
      ArrowDown: () => changeVolume(Math.max(0, Math.round((volume - 0.1) * 10) / 10)),
      f: toggleFullscreen,
      m: toggleMute,
    };
    if (keys[e.key]) {
      e.preventDefault();
      keys[e.key]();
      nudge();
    }
  };

  // Keyboard shortcuts work anywhere on the page, not only when the video has focus.
  const keyRef = useRef(onKeyDown);
  keyRef.current = onKeyDown;
  useEffect(() => {
    const handler = (e) => keyRef.current(e);
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  if (state.loading) return <div className="player-page" data-theme="dark"><Spinner label="Menyiapkan video…" /></div>;
  if (state.error) {
    return (
      <div className="player-page" data-theme="dark">
        <header className="player-top"><IconButton icon="arrow-left" label="Kembali" onClick={() => navigate(-1)} /><Link to="/" aria-label="KELIR, ke Home"><Logo size={26} /></Link></header>
        {['PREMIUM_REQUIRED', 'AUTH_REQUIRED'].includes(state.error.code) ? <Gate error={state.error} slug={slug} /> : <ErrorState error={state.error} />}
      </div>
    );
  }

  const { content, episode: ep, nextEpisode, source, resumeAt } = state.data;
  const pct = time.duration ? (time.current / time.duration) * 100 : 0;
  return (
    <div className="player-page" data-theme="dark">
      <div
        ref={shellRef}
        className={`player ${controlsVisible ? '' : 'player-idle'}`}
        onMouseMove={nudge}
        aria-label={`Pemutar video ${content.title}`}
      >
        <header className="player-top">
          <IconButton icon="arrow-left" label="Kembali ke detail" onClick={() => navigate(`/title/${content.slug}`)} />
          <div className="player-heading">
            <h1 className="player-title">{content.title}</h1>
            {ep && <p className="player-sub">Musim {ep.season} · Episode {ep.number}{ep.title !== `Episode ${ep.number}` ? `: ${ep.title}` : ''}</p>}
          </div>
          <Link to="/" className="player-logo" aria-label="KELIR, ke Home"><Logo size={24} /></Link>
        </header>

        <video
          ref={videoRef}
          key={src}
          src={src}
          className="player-video"
          playsInline
          preload="metadata"
          onClick={toggle}
          onPlay={() => { setPlaying(true); nudge(); }}
          onPause={() => { setPlaying(false); setControlsVisible(true); save(true); }}
          onEnded={() => { save(true); setControlsVisible(true); }}
          onTimeUpdate={(e) => { setTime({ current: e.currentTarget.currentTime, duration: e.currentTarget.duration || 0 }); save(); }}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            setTime({ current: v.currentTime, duration: v.duration });
            if (resumeAt && resumeAt < v.duration - 5) v.currentTime = resumeAt;
            v.volume = volume;
          }}
          onError={() => {
            // The CC demo film did not load (network, blocked host): switch to KELIR's own clip.
            if (!usingFallback && source.fallbackSrc) {
              setUsingFallback(true);
              setSrc(source.fallbackSrc);
            }
          }}
        />

        {!playing && (
          <button type="button" className="player-bigplay" onClick={toggle} aria-label="Putar">
            <Icon name="play" size={40} />
          </button>
        )}

        <div className="player-controls">
          <div className="player-seek">
            <label htmlFor="seek" className="sr-only">Posisi video</label>
            <input
              id="seek"
              type="range"
              min={0}
              max={time.duration || 0}
              step={1}
              value={time.current}
              onChange={(e) => seek(Number(e.target.value))}
              style={{ '--pct': `${pct}%` }}
              aria-valuetext={`${clock(time.current)} dari ${clock(time.duration)}`}
            />
          </div>
          <div className="player-row">
            <IconButton icon={playing ? 'pause' : 'play'} label={playing ? 'Jeda (spasi)' : 'Putar (spasi)'} onClick={toggle} />
            <IconButton icon="replay" label="Mundur 10 detik (←)" onClick={() => seek(time.current - 10)} />
            <div className="player-volume">
              <IconButton icon={muted || volume === 0 ? 'volume-off' : 'volume'} label={muted ? 'Bunyikan (m)' : 'Bisukan (m)'} onClick={toggleMute} />
              <label htmlFor="volume" className="sr-only">Volume</label>
              <input id="volume" type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={(e) => changeVolume(Number(e.target.value))} style={{ '--pct': `${(muted ? 0 : volume) * 100}%` }} />
            </div>
            <span className="player-time">{clock(time.current)} / {clock(time.duration)}</span>
            <span className="player-spacer" />
            {nextEpisode && (
              <Button variant="secondary" size="sm" icon="skip" to={`/play/${content.slug}?episode=${nextEpisode}`}>Episode {nextEpisode}</Button>
            )}
            <IconButton icon={fullscreen ? 'fullscreen-exit' : 'fullscreen'} label={fullscreen ? 'Keluar layar penuh (f)' : 'Layar penuh (f)'} onClick={toggleFullscreen} />
          </div>
        </div>
      </div>

      <div className="player-info container">
        <p className="player-credit">
          <Icon name="alert" size={16} />
          <span>
            <strong>Aset demo, bukan {content.type === 'music' ? 'rekaman' : 'film'} aslinya.</strong> {usingFallback ? 'Klip demo KELIR (cadangan karena video utama tidak termuat).' : source.credit}
          </span>
        </p>
        <p className="muted small">Pintasan: spasi putar/jeda · ← → 10 detik · ↑ ↓ volume · m bisu · f layar penuh. Posisi tersimpan otomatis.</p>
      </div>
    </div>
  );
}
