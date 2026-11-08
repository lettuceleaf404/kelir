import { Router } from 'express';
import { Content } from '../models/Content.js';
import { WatchProgress } from '../models/WatchProgress.js';
import { REGIONS } from '../regions.js';
import { optionalAuth } from '../middleware/auth.js';
import { inList, notInList } from '../lib/query.js';
import { SORTS } from './contents.js';

const router = Router();

/** Personal picks: preferred genres and regions plus the genres of saved titles, minus what is already saved or watched. */
export async function recommendFor(user, limit = 12) {
  const saved = [...user.favorites, ...user.watchlist, ...user.watched];
  const savedDocs = await Content.find({ _id: inList(saved) }).select('genres region');
  const genres = new Set(user.favoriteGenres);
  const regions = new Set(user.favoriteRegions);
  savedDocs.forEach((c) => {
    c.genres.forEach((g) => genres.add(g));
    if (c.region) regions.add(c.region);
  });

  const candidates = await Content.find({ published: true, _id: notInList(saved) });
  const scored = candidates
    .map((c) => ({ c, score: c.genres.filter((g) => genres.has(g)).length * 2 + (regions.has(c.region) ? 2 : 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.c.ratingAvg - a.c.ratingAvg)
    .slice(0, limit)
    .map((x) => x.c);
  return { basedOn: { genres: [...genres], regions: [...regions] }, items: scored };
}

/**
 * GET /api/home
 * One request for the Home screen. Sections follow the KELIR homepage direction:
 * hero, Lanjutkan Menonton, Trending di Nusantara, Jelajahi Cerita (regions), Pilihan KELIR, Konten Premium,
 * plus Rekomendasi, Serial Populer, Sorotan Musik and Baru Ditambahkan.
 */
router.get('/', optionalAuth, async (req, res) => {
  const published = { published: true };
  const [hero, trending, picks, premium, series, music, added, regionItems] = await Promise.all([
    Content.find({ ...published, featured: true }).sort(SORTS.popular).limit(5),
    Content.find({ ...published, country: 'Indonesia' }).sort(SORTS.popular).limit(10),
    Content.find({ ...published, editorPick: true }).sort(SORTS.popular).limit(8),
    Content.find({ ...published, access: 'premium' }).sort(SORTS.rating).limit(10),
    Content.find({ ...published, type: 'series' }).sort(SORTS.popular).limit(8),
    Content.find({ ...published, type: 'music' }).sort(SORTS.popular).limit(8),
    Content.find(published).sort(SORTS.added).limit(8),
    Content.find({ ...published, region: inList(REGIONS.map((r) => r.key)) }).sort(SORTS.popular),
  ]);

  let continueWatching = [];
  let recommended = null;
  if (req.user) {
    const progress = await WatchProgress.find({ user: req.user._id, completed: false })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('content');
    continueWatching = progress.filter((p) => p.content && p.content.published).map((p) => p.toPublic());
    const rec = await recommendFor(req.user, 10);
    recommended = { basedOn: rec.basedOn, items: rec.items.map((c) => c.toCard()) };
  }

  const card = (list) => list.map((c) => c.toCard());
  res.json({
    hero: hero.map((c) => c.toPublic()),
    continueWatching,
    recommended,
    trending: card(trending),
    regions: REGIONS.map((r) => {
      const inRegion = regionItems.filter((c) => c.region === r.key);
      return { ...r, count: inRegion.length, sample: card(inRegion.slice(0, 3)) };
    }),
    picks: card(picks),
    premium: card(premium),
    popularSeries: card(series),
    music: card(music),
    recentlyAdded: card(added),
  });
});

export default router;
