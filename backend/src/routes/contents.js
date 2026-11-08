import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Content, CONTENT_TYPES, VIDEO_TYPES } from '../models/Content.js';
import { Review } from '../models/Review.js';
import { WatchProgress } from '../models/WatchProgress.js';
import { REGIONS, REGION_KEYS } from '../regions.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { HttpError } from '../middleware/errors.js';
import { contains, findContent, inList, notInList, str, toInt } from '../lib/query.js';

const router = Router();

// Range and type operators built on the server (sanitizeFilter rejects operators from user input).
const inRange = (range) => mongoose.trusted(range);

export const SORTS = {
  popular: { viewCount: -1, ratingAvg: -1, title: 1 },
  rating: { ratingAvg: -1, ratingCount: -1, title: 1 },
  newest: { year: -1, createdAt: -1, title: 1 },
  added: { createdAt: -1, title: 1 },
  title: { title: 1 },
};

/**
 * Builds a catalog filter from query parameters. Every value is read as a plain string,
 * and server-built operators are marked trusted (sanitizeFilter rejects any others).
 */
export function buildCatalogFilter(query) {
  const filter = { published: true };

  const types = (str(query.type) || '').split(',').filter((t) => CONTENT_TYPES.includes(t));
  if (types.length === 1) filter.type = types[0];
  else if (types.length > 1) filter.type = inList(types);

  const region = str(query.region);
  if (region && REGION_KEYS.includes(region)) filter.region = region;

  const genre = str(query.genre, 40);
  if (genre) filter.genres = genre;

  const category = str(query.category, 30);
  if (category) filter.categories = category;

  const language = str(query.language, 40);
  if (language) filter.language = contains(language);

  const access = str(query.access);
  if (access === 'free' || access === 'premium') filter.access = access;

  const origin = str(query.origin);
  if (origin === 'nusantara') filter.country = 'Indonesia';
  if (origin === 'internasional') filter.country = notInList(['Indonesia']);

  const yearFrom = toInt(query.yearFrom, null, 1900, 2100);
  const yearTo = toInt(query.yearTo, null, 1900, 2100);
  if (yearFrom || yearTo) {
    const range = {};
    if (yearFrom) range.$gte = yearFrom;
    if (yearTo) range.$lte = yearTo;
    filter.year = inRange(range);
  }

  const minRating = Number.parseFloat(query.minRating);
  if (minRating > 0 && minRating <= 5) filter.ratingAvg = inRange({ $gte: minRating });

  if (str(query.hasTrailer) === '1') filter.trailerYoutubeId = inRange({ $type: 'string' });
  if (str(query.pick) === '1') filter.editorPick = true;

  const q = str(query.q, 60);
  if (q) {
    const pattern = contains(q);
    filter.$or = [
      { title: pattern },
      { originalTitle: pattern },
      { creator: pattern },
      { cast: pattern },
      { genres: pattern },
      { album: pattern },
      { regionDetail: pattern },
    ];
  }
  return filter;
}


/**
 * GET /api/contents
 * Query: type (film|series|documentary|music, comma-separated), q, genre, region, language, category,
 *        access (free|premium), origin (nusantara|internasional), yearFrom, yearTo, minRating, hasTrailer=1, pick=1,
 *        sort (popular|rating|newest|added|title), page, limit
 */
router.get('/', async (req, res) => {
  const filter = buildCatalogFilter(req.query);
  const sort = SORTS[str(req.query.sort)] || SORTS.popular;
  const page = toInt(req.query.page, 1, 1, 1000);
  const limit = toInt(req.query.limit, 24, 1, 60);

  const [items, total] = await Promise.all([
    Content.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
    Content.countDocuments(filter),
  ]);
  res.json({ items: items.map((c) => c.toCard()), page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
});

/** GET /api/contents/filters: everything the filter panel needs, with counts. */
router.get('/filters', async (req, res) => {
  const all = await Content.find({ published: true }).select('type genres language year region categories country');
  const count = (list) => {
    const map = new Map();
    list.forEach((v) => v && map.set(v, (map.get(v) || 0) + 1));
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'id')).map(([value, n]) => ({ value, count: n }));
  };
  const years = all.map((c) => c.year).filter(Boolean);
  res.json({
    types: CONTENT_TYPES.map((t) => ({ value: t, count: all.filter((c) => c.type === t).length })),
    genres: count(all.flatMap((c) => c.genres)),
    languages: count(all.flatMap((c) => (c.language || '').split(',').map((l) => l.trim()))),
    categories: count(all.flatMap((c) => c.categories)),
    regions: REGIONS.map((r) => ({ value: r.key, name: r.name, count: all.filter((c) => c.region === r.key).length })),
    years: { min: Math.min(...years), max: Math.max(...years) },
  });
});

/** GET /api/contents/regions: the seven regions with counts and a few titles each. */
router.get('/regions', async (req, res) => {
  const items = await Content.find({ published: true, region: inList(REGION_KEYS) }).sort(SORTS.popular);
  res.json({
    regions: REGIONS.map((r) => {
      const inRegion = items.filter((c) => c.region === r.key);
      return { ...r, count: inRegion.length, sample: inRegion.slice(0, 4).map((c) => c.toCard()) };
    }),
  });
});

/** GET /api/contents/:id (id or slug): detail, plus the signed-in user's state for this title. */
router.get('/:id', optionalAuth, async (req, res) => {
  const content = await findContent(req.params.id, { includeUnpublished: req.user?.role === 'admin' });
  if (!content) throw new HttpError(404, 'Konten tidak ditemukan.');

  let me = null;
  if (req.user) {
    const has = (list) => list.some((id) => id.equals(content._id));
    const [review, progress] = await Promise.all([
      Review.findOne({ content: content._id, user: req.user._id }),
      WatchProgress.findOne({ content: content._id, user: req.user._id }),
    ]);
    me = {
      isFavorite: has(req.user.favorites),
      inWatchlist: has(req.user.watchlist),
      watched: has(req.user.watched),
      isPremium: req.user.isPremium(),
      review: review ? review.toPublic() : null,
      progress: progress ? progress.toPublic() : null,
    };
  }
  res.json({ content: content.toPublic(), me });
});

/** GET /api/contents/:id/related: same region first, then shared genres, same type as a tiebreak. */
router.get('/:id/related', async (req, res) => {
  const content = await findContent(req.params.id);
  if (!content) throw new HttpError(404, 'Konten tidak ditemukan.');
  const candidates = await Content.find({ published: true, _id: notInList([content._id]) });
  const scored = candidates
    .map((c) => {
      const shared = c.genres.filter((g) => content.genres.includes(g)).length;
      const score = (content.region && c.region === content.region ? 3 : 0) + shared * 2 + (c.type === content.type ? 1 : 0);
      return { c, score };
    })
    .filter((x) => x.score > 1)
    .sort((a, b) => b.score - a.score || b.c.viewCount - a.c.viewCount)
    .slice(0, toInt(req.query.limit, 8, 1, 20));
  res.json({ items: scored.map((x) => x.c.toCard()) });
});

/** GET /api/contents/:id/reviews: visible reviews, newest first. */
router.get('/:id/reviews', async (req, res) => {
  const content = await findContent(req.params.id);
  if (!content) throw new HttpError(404, 'Konten tidak ditemukan.');
  const page = toInt(req.query.page, 1, 1, 1000);
  const limit = toInt(req.query.limit, 10, 1, 50);
  const filter = { content: content._id, hidden: false };
  const [reviews, total] = await Promise.all([
    Review.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).populate('user', 'name avatar'),
    Review.countDocuments(filter),
  ]);
  res.json({ items: reviews.map((r) => r.toPublic()), page, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
});

const reviewSchema = z.object({
  rating: z.coerce.number().int('Rating harus bilangan bulat.').min(1, 'Pilih 1 sampai 5 bintang.').max(5, 'Pilih 1 sampai 5 bintang.'),
  comment: z.string().trim().max(1000, 'Ulasan maksimal 1000 karakter.').optional().default(''),
});

/** POST /api/contents/:id/reviews: create or edit the signed-in user's single review. */
router.post('/:id/reviews', requireAuth, validateBody(reviewSchema), async (req, res) => {
  const content = await findContent(req.params.id);
  if (!content) throw new HttpError(404, 'Konten tidak ditemukan.');
  const review = await Review.findOneAndUpdate(
    { content: content._id, user: req.user._id },
    { $set: { rating: req.body.rating, comment: req.body.comment } },
    { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
  ).populate('user', 'name avatar');
  const rating = await Review.refreshContentRating(content._id);
  res.status(201).json({ review: review.toPublic(), ...rating });
});

/** DELETE /api/contents/:id/reviews/me */
router.delete('/:id/reviews/me', requireAuth, async (req, res) => {
  const content = await findContent(req.params.id);
  if (!content) throw new HttpError(404, 'Konten tidak ditemukan.');
  const result = await Review.deleteOne({ content: content._id, user: req.user._id });
  if (!result.deletedCount) throw new HttpError(404, 'Kamu belum mengulas judul ini.');
  const rating = await Review.refreshContentRating(content._id);
  res.json({ deleted: true, ...rating });
});

const absolute = (req, src) => (src && src.startsWith('/') ? `${req.protocol}://${req.get('host')}${src}` : src);

/**
 * GET /api/contents/:id/play?episode=N
 * Access check for playback: guests must sign in; Premium titles and Premium episodes need an active subscription.
 * Returns the (demo) source only when access is granted.
 */
router.get('/:id/play', optionalAuth, async (req, res) => {
  const content = await findContent(req.params.id);
  if (!content) throw new HttpError(404, 'Konten tidak ditemukan.');
  if (!req.user) throw new HttpError(401, 'Masuk dulu untuk menonton atau mendengarkan.', { code: 'AUTH_REQUIRED' });

  let playback = content.playback;
  let access = content.access;
  let episode = null;
  if (content.episodes.length) {
    const number = toInt(req.query.episode, 1, 1, 999);
    const season = toInt(req.query.season, 1, 1, 99);
    episode = content.episodes.find((e) => e.number === number && e.season === season);
    if (!episode) throw new HttpError(404, 'Episode tidak ditemukan.');
    playback = episode.playback;
    access = episode.access;
  }
  if (!playback) throw new HttpError(404, 'Belum ada video untuk judul ini.', { code: 'NOT_PLAYABLE' });

  if (access === 'premium' && !req.user.isPremium()) {
    throw new HttpError(403, 'Konten ini khusus Premium.', { code: 'PREMIUM_REQUIRED' });
  }

  await Content.updateOne({ _id: content._id }, { $inc: { viewCount: 1 } });
  const progress = await WatchProgress.findOne({ user: req.user._id, content: content._id });
  const sameEpisode = progress && (progress.episode ?? null) === (episode ? episode.number : null);
  res.json({
    content: content.toCard(),
    episode: episode ? { season: episode.season, number: episode.number, title: episode.title, access: episode.access } : null,
    nextEpisode: episode ? content.episodes.find((e) => e.season === episode.season && e.number === episode.number + 1)?.number ?? null : null,
    source: {
      src: absolute(req, playback.src),
      fallbackSrc: absolute(req, playback.fallbackSrc),
      credit: playback.credit,
      isDemo: playback.isDemo,
    },
    resumeAt: sameEpisode && !progress.completed ? Math.round(progress.positionSeconds) : 0,
  });
});

export { VIDEO_TYPES };
export default router;
