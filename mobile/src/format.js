export const TYPE_LABEL = { film: 'Film', series: 'Serial', documentary: 'Dokumenter', music: 'Musik' };
export const TYPE_PLURAL = { film: 'Film', series: 'Serial', documentary: 'Dokumenter', music: 'Musik' };
export const TYPE_BADGE = { film: 'film', series: 'serial', documentary: 'dokumenter', music: 'musik' };

export const REGIONS = [
  { key: 'sumatra', name: 'Sumatra', art: 'coral' },
  { key: 'jawa', name: 'Jawa', art: 'mango' },
  { key: 'kalimantan', name: 'Kalimantan', art: 'turquoise' },
  { key: 'sulawesi', name: 'Sulawesi', art: 'lilac' },
  { key: 'bali-nusa-tenggara', name: 'Bali & Nusa Tenggara', art: 'coral' },
  { key: 'maluku', name: 'Maluku', art: 'mango' },
  { key: 'papua', name: 'Papua', art: 'turquoise' },
];
export const regionName = (key) => REGIONS.find((r) => r.key === key)?.name ?? null;

export const SUB_LABEL = { FREE: 'Gratis', ACTIVE: 'Premium aktif', CANCELLED: 'Dibatalkan', EXPIRED: 'Kedaluwarsa' };

export function duration(minutes) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}j${m ? ` ${m}m` : ''}` : `${m} mnt`;
}

export function clock(seconds = 0) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

export const rupiah = (n) => `Rp${Number(n || 0).toLocaleString('id-ID')}`;
export const rating = (n) => Number(n || 0).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const date = (d) => (d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—');

/** "2024 · Film · 1j 52m" */
export function metaLine(c, { withType = true } = {}) {
  const parts = [];
  parts.push(c.year ?? (c.type === 'music' ? 'Tradisional' : null));
  if (withType) parts.push(TYPE_LABEL[c.type]);
  if (c.type === 'series' || (c.type === 'documentary' && c.episodeCount)) parts.push(c.episodeCount ? `${c.episodeCount} episode` : null);
  else parts.push(duration(c.durationMinutes));
  return parts.filter(Boolean).join(' · ');
}

export function remaining(seconds) {
  const m = Math.ceil((seconds || 0) / 60);
  return m >= 60 ? `Sisa ${duration(m)}` : `Sisa ${m} mnt`;
}
