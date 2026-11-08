import { Router } from 'express';
import { z } from 'zod';
import { User, AVATARS } from '../models/User.js';
import { Content } from '../models/Content.js';
import { Review } from '../models/Review.js';
import { WatchProgress } from '../models/WatchProgress.js';
import { REGION_KEYS } from '../regions.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { HttpError } from '../middleware/errors.js';
import { findContent, inList, toInt } from '../lib/query.js';
import { passwordRule } from './auth.js';
import { recommendFor } from './home.js';

const router = Router();
router.use(requireAuth);

const profileSchema = z
  .object({
    name: z.string().trim().min(2, 'Nama minimal 2 karakter.').max(60, 'Nama maksimal 60 karakter.'),
    bio: z.string().trim().max(160, 'Bio maksimal 160 karakter.'),
    avatar: z.enum(AVATARS),
    favoriteGenres: z.array(z.string().trim().min(1).max(40)).max(20),
    favoriteRegions: z.array(z.enum(REGION_KEYS)).max(7),
  })
  .partial();

/** PATCH /api/me: profile and preferences. */
router.patch('/', validateBody(profileSchema), async (req, res) => {
  Object.assign(req.user, req.body);
  await req.user.save();
  res.json({ user: req.user.toPublic() });
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Kata sandi lama wajib diisi.'),
  newPassword: passwordRule,
});

/** POST /api/me/password */
router.post('/password', validateBody(passwordSchema), async (req, res) => {
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await user.checkPassword(req.body.currentPassword))) throw new HttpError(400, 'Kata sandi lama tidak cocok.');
  user.passwordHash = await User.hashPassword(req.body.newPassword);
  await user.save();
  res.json({ updated: true });
});

const LISTS = ['favorites', 'watchlist', 'watched'];

/** GET /api/me/library: favorites, watchlist and watched as cards. */
router.get('/library', async (req, res) => {
  const ids = [...new Set(LISTS.flatMap((l) => req.user[l].map(String)))];
  const docs = await Content.find({ _id: inList(ids), published: true });
  const byId = new Map(docs.map((d) => [d._id.toString(), d.toCard()]));
  const pick = (list) => [...req.user[list]].reverse().map((id) => byId.get(id.toString())).filter(Boolean);
  res.json({ favorites: pick('favorites'), watchlist: pick('watchlist'), watched: pick('watched') });
});

/** PUT /api/me/library/:list/:contentId and DELETE the same: add to or remove from favorites, watchlist or watched. */
async function changeList(req, res, add) {
  const { list } = req.params;
  if (!LISTS.includes(list)) throw new HttpError(404, 'Daftar tidak dikenal.');
  const content = await findContent(req.params.contentId);
  if (!content) throw new HttpError(404, 'Konten tidak ditemukan.');
  await User.updateOne({ _id: req.user._id }, add ? { $addToSet: { [list]: content._id } } : { $pull: { [list]: content._id } });
  const user = await User.findById(req.user._id);
  res.json({ list, contentId: content._id.toString(), [list]: user[list].map(String), user: user.toPublic() });
}
router.put('/library/:list/:contentId', (req, res) => changeList(req, res, true));
router.delete('/library/:list/:contentId', (req, res) => changeList(req, res, false));

/** GET /api/me/reviews: review and rating history. */
router.get('/reviews', async (req, res) => {
  const reviews = await Review.find({ user: req.user._id }).sort({ updatedAt: -1 }).populate('content', 'slug title type art posterUrl');
  res.json({ items: reviews.filter((r) => r.content).map((r) => r.toPublic()) });
});

/** GET /api/me/progress: unfinished titles, most recent first ("Lanjutkan Menonton"). */
router.get('/progress', async (req, res) => {
  const progress = await WatchProgress.find({ user: req.user._id, completed: false })
    .sort({ updatedAt: -1 })
    .limit(toInt(req.query.limit, 20, 1, 50))
    .populate('content');
  res.json({ items: progress.filter((p) => p.content?.published).map((p) => p.toPublic()) });
});

const progressSchema = z.object({
  episode: z.number().int().min(1).nullable().optional(),
  positionSeconds: z.number().min(0).max(24 * 3600),
  durationSeconds: z.number().min(0).max(24 * 3600),
});

/**
 * PUT /api/me/progress/:contentId
 * Saves the position. At 90% the title counts as finished: it leaves "Lanjutkan Menonton" and joins Watched.
 */
router.put('/progress/:contentId', validateBody(progressSchema), async (req, res) => {
  const content = await findContent(req.params.contentId);
  if (!content) throw new HttpError(404, 'Konten tidak ditemukan.');
  const { positionSeconds, durationSeconds } = req.body;
  const episode = content.episodes.length ? req.body.episode ?? 1 : null;
  const isLastEpisode = !content.episodes.length || episode === Math.max(...content.episodes.map((e) => e.number));
  const finished = durationSeconds > 0 && positionSeconds / durationSeconds >= 0.9;

  const progress = await WatchProgress.findOneAndUpdate(
    { user: req.user._id, content: content._id },
    { $set: { episode, positionSeconds, durationSeconds, completed: finished && isLastEpisode } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );
  if (finished && isLastEpisode) await User.updateOne({ _id: req.user._id }, { $addToSet: { watched: content._id } });
  res.json({ progress: progress.toPublic() });
});

/** DELETE /api/me/progress/:contentId: remove a title from "Lanjutkan Menonton". */
router.delete('/progress/:contentId', async (req, res) => {
  const content = await findContent(req.params.contentId);
  if (!content) throw new HttpError(404, 'Konten tidak ditemukan.');
  await WatchProgress.deleteOne({ user: req.user._id, content: content._id });
  res.json({ deleted: true });
});

/** GET /api/me/recommendations */
router.get('/recommendations', async (req, res) => {
  const rec = await recommendFor(req.user, toInt(req.query.limit, 12, 1, 30));
  res.json({ basedOn: rec.basedOn, items: rec.items.map((c) => c.toCard()) });
});

export default router;
