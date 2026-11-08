import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Content, CONTENT_TYPES, ACCESS_TYPES, ART_TONES } from '../models/Content.js';
import { User, ROLES, SUB_STATUSES } from '../models/User.js';
import { Review } from '../models/Review.js';
import { Payment } from '../models/Payment.js';
import { Collection } from '../models/Collection.js';
import { WatchProgress } from '../models/WatchProgress.js';
import { REGION_KEYS } from '../regions.js';
import { PLANS } from '../plans.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { validateBody, validateObjectIds } from '../middleware/validate.js';
import { HttpError } from '../middleware/errors.js';
import { contains, str, toInt } from '../lib/query.js';
import { adminUpdate } from '../services/subscription.js';

const router = Router();
router.use(requireAuth, requireAdmin);

const page = (req, fallback = 20) => ({ page: toInt(req.query.page, 1, 1, 1000), limit: toInt(req.query.limit, fallback, 1, 100) });
const paged = (items, total, { page: p, limit }) => ({ items, page: p, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });

/* ---------------- Dashboard ---------------- */

router.get('/stats', async (req, res) => {
  const now = new Date();
  const premiumFilter = { 'subscription.status': mongoose.trusted({ $in: ['ACTIVE', 'CANCELLED'] }), 'subscription.expiresAt': mongoose.trusted({ $gt: now }) };
  const [users, premium, contents, unpublished, reviews, hiddenReviews, payments, byType, topContent] = await Promise.all([
    User.countDocuments(),
    User.countDocuments(premiumFilter),
    Content.countDocuments(),
    Content.countDocuments({ published: false }),
    Review.countDocuments(),
    Review.countDocuments({ hidden: true }),
    Payment.find({ status: 'PAID' }).select('amount'),
    Promise.all(CONTENT_TYPES.map(async (type) => ({ type, count: await Content.countDocuments({ type }) }))),
    Content.find().sort({ viewCount: -1 }).limit(5),
  ]);
  res.json({
    users,
    premiumUsers: premium,
    contents,
    unpublished,
    reviews,
    hiddenReviews,
    simulatedRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
    contentsByType: byType,
    topContent: topContent.map((c) => c.toCard()),
  });
});

/* ---------------- Contents ---------------- */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const httpsUrl = z.string().trim().regex(/^https:\/\/\S+$/, 'URL harus diawali https://');
const mediaSrc = z.string().trim().regex(/^(https:\/\/\S+|\/media\/[A-Za-z0-9._-]+)$/, 'Sumber video harus URL https:// atau berkas /media/.');
const optText = (max) => z.string().trim().max(max).nullable().optional();

const playbackSchema = z.object({
  src: mediaSrc,
  fallbackSrc: mediaSrc.nullable().optional(),
  credit: z.string().trim().max(200).optional().default(''),
  isDemo: z.boolean().optional().default(true),
});

const episodeSchema = z.object({
  season: z.number().int().min(1).max(99).optional().default(1),
  number: z.number().int().min(1).max(999),
  title: z.string().trim().min(1, 'Judul episode wajib diisi.').max(120),
  synopsis: z.string().trim().max(500).optional().default(''),
  durationMinutes: z.number().int().min(1).max(600).nullable().optional(),
  access: z.enum(ACCESS_TYPES).optional().default('premium'),
  playback: playbackSchema,
});

const contentFields = z.object({
  slug: z.string().trim().toLowerCase().max(80).regex(SLUG, 'Slug hanya huruf kecil, angka, dan tanda hubung.'),
  type: z.enum(CONTENT_TYPES),
  title: z.string().trim().min(1, 'Judul wajib diisi.').max(120),
  originalTitle: optText(120),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  genres: z.array(z.string().trim().min(1).max(40)).max(8).optional().default([]),
  categories: z.array(z.string().trim().min(1).max(30)).max(4).optional().default([]),
  synopsis: z.string().trim().min(10, 'Sinopsis minimal 10 karakter.').max(1000),
  creator: z.string().trim().min(1, 'Kreator wajib diisi.').max(120),
  cast: z.array(z.string().trim().min(1).max(80)).max(20).optional().default([]),
  durationMinutes: z.number().int().min(1).max(1000).nullable().optional(),
  language: optText(80),
  country: optText(80),
  network: optText(80),
  album: optText(120),
  region: z.enum(REGION_KEYS).nullable().optional(),
  regionDetail: optText(120),
  regionBasis: optText(300),
  access: z.enum(ACCESS_TYPES).optional().default('free'),
  trailerYoutubeId: z.string().trim().regex(/^[A-Za-z0-9_-]{11}$/, 'ID YouTube terdiri dari 11 karakter.').nullable().optional(),
  officialWatch: z.object({ label: z.string().trim().min(1).max(120), url: httpsUrl }).nullable().optional(),
  posterUrl: httpsUrl.nullable().optional(),
  art: z.enum(ART_TONES).optional().default('coral'),
  playback: playbackSchema.nullable().optional(),
  episodes: z.array(episodeSchema).max(200).optional().default([]),
  featured: z.boolean().optional().default(false),
  editorPick: z.boolean().optional().default(false),
  editorNote: optText(160),
  published: z.boolean().optional().default(true),
});

// Regional metadata needs a stated basis (setting, filming location, song origin), never a guess.
const regionNeedsBasis = (data, ctx) => {
  if (data.region && (!data.regionBasis || data.regionBasis.trim().length < 10)) {
    ctx.addIssue({ code: 'custom', path: ['regionBasis'], message: 'Tulis dasar penentuan daerah (latar cerita, lokasi syuting, atau asal lagu).' });
  }
  const numbers = (data.episodes || []).map((e) => `${e.season ?? 1}-${e.number}`);
  if (new Set(numbers).size !== numbers.length) {
    ctx.addIssue({ code: 'custom', path: ['episodes'], message: 'Nomor episode tidak boleh kembar dalam satu musim.' });
  }
};

const createSchema = contentFields.superRefine(regionNeedsBasis);
// For PATCH, defaults must not overwrite stored values, so every field becomes optional without defaults.
const patchSchema = z
  .object(Object.fromEntries(Object.entries(contentFields.shape).map(([k, v]) => [k, (v.removeDefault ? v.removeDefault() : v).optional()])))
  .superRefine((data, ctx) => (data.region !== undefined || data.regionBasis !== undefined ? regionNeedsBasis(data, ctx) : undefined));

router.get('/contents', async (req, res) => {
  const p = page(req, 25);
  const filter = {};
  const type = str(req.query.type);
  if (type && CONTENT_TYPES.includes(type)) filter.type = type;
  const q = str(req.query.q, 60);
  if (q) filter.$or = [{ title: contains(q) }, { creator: contains(q) }, { slug: contains(q) }];
  const status = str(req.query.status);
  if (status === 'draft') filter.published = false;
  if (status === 'published') filter.published = true;
  const [items, total] = await Promise.all([
    Content.find(filter).sort({ updatedAt: -1 }).skip((p.page - 1) * p.limit).limit(p.limit),
    Content.countDocuments(filter),
  ]);
  res.json(paged(items.map((c) => c.toCard()), total, p));
});

router.get('/contents/:id', validateObjectIds('id'), async (req, res) => {
  const content = await Content.findById(req.params.id);
  if (!content) throw new HttpError(404, 'Konten tidak ditemukan.');
  res.json({ content: content.toAdmin() });
});

router.post('/contents', validateBody(createSchema), async (req, res) => {
  if (await Content.exists({ slug: req.body.slug })) throw new HttpError(409, 'Slug ini sudah dipakai judul lain.');
  const content = await Content.create(req.body);
  res.status(201).json({ content: content.toAdmin() });
});

router.patch('/contents/:id', validateObjectIds('id'), validateBody(patchSchema), async (req, res) => {
  const content = await Content.findById(req.params.id);
  if (!content) throw new HttpError(404, 'Konten tidak ditemukan.');
  if (req.body.slug && req.body.slug !== content.slug && (await Content.exists({ slug: req.body.slug }))) {
    throw new HttpError(409, 'Slug ini sudah dipakai judul lain.');
  }
  const merged = { ...content.toObject(), ...req.body };
  regionNeedsBasis(merged, { addIssue: (issue) => { throw new HttpError(400, issue.message, { fields: [{ field: issue.path.join('.'), message: issue.message }] }); } });
  content.set(req.body);
  if (req.body.region === null) content.set({ regionDetail: null, regionBasis: req.body.regionBasis ?? null });
  await content.save();
  res.json({ content: content.toAdmin() });
});

router.delete('/contents/:id', validateObjectIds('id'), async (req, res) => {
  const content = await Content.findById(req.params.id);
  if (!content) throw new HttpError(404, 'Konten tidak ditemukan.');
  const id = content._id;
  await Promise.all([
    Review.deleteMany({ content: id }),
    WatchProgress.deleteMany({ content: id }),
    User.updateMany({}, { $pull: { favorites: id, watchlist: id, watched: id } }),
    Collection.updateMany({}, { $pull: { items: id } }),
  ]);
  await content.deleteOne();
  res.json({ deleted: true });
});

/* ---------------- Users and subscriptions ---------------- */

router.get('/users', async (req, res) => {
  const p = page(req);
  const filter = {};
  const q = str(req.query.q, 60);
  if (q) filter.$or = [{ name: contains(q) }, { email: contains(q) }];
  const role = str(req.query.role);
  if (role && ROLES.includes(role)) filter.role = role;
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((p.page - 1) * p.limit).limit(p.limit),
    User.countDocuments(filter),
  ]);
  res.json(paged(items.map((u) => u.toPublic()), total, p));
});

const userPatchSchema = z
  .object({ role: z.enum(ROLES), status: z.enum(['active', 'suspended']), name: z.string().trim().min(2).max(60) })
  .partial();

router.patch('/users/:id', validateObjectIds('id'), validateBody(userPatchSchema), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'Pengguna tidak ditemukan.');
  if (user._id.equals(req.user._id) && (req.body.role === 'user' || req.body.status === 'suspended')) {
    throw new HttpError(400, 'Kamu tidak bisa menurunkan peran atau menonaktifkan akunmu sendiri.');
  }
  Object.assign(user, req.body);
  await user.save();
  res.json({ user: user.toPublic() });
});

const subscriptionPatchSchema = z.object({
  status: z.enum(SUB_STATUSES),
  plan: z.enum(Object.keys(PLANS)).nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
});

router.patch('/users/:id/subscription', validateObjectIds('id'), validateBody(subscriptionPatchSchema), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'Pengguna tidak ditemukan.');
  const record = await adminUpdate(user, req.body, req.user);
  res.json({ user: user.toPublic(), record: record.toPublic() });
});

router.get('/payments', async (req, res) => {
  const p = page(req);
  const filter = {};
  const kind = str(req.query.kind);
  if (['purchase', 'cancel', 'admin_update'].includes(kind)) filter.kind = kind;
  const [items, total] = await Promise.all([
    Payment.find(filter).sort({ createdAt: -1 }).skip((p.page - 1) * p.limit).limit(p.limit).populate('user', 'name email'),
    Payment.countDocuments(filter),
  ]);
  res.json(paged(items.map((x) => x.toPublic()), total, p));
});

/* ---------------- Review moderation ---------------- */

router.get('/reviews', async (req, res) => {
  const p = page(req);
  const filter = {};
  const status = str(req.query.status);
  if (status === 'hidden') filter.hidden = true;
  if (status === 'visible') filter.hidden = false;
  const [items, total] = await Promise.all([
    Review.find(filter)
      .sort({ updatedAt: -1 })
      .skip((p.page - 1) * p.limit)
      .limit(p.limit)
      .populate('user', 'name avatar')
      .populate('content', 'slug title type art posterUrl'),
    Review.countDocuments(filter),
  ]);
  res.json(paged(items.map((r) => r.toPublic()), total, p));
});

const moderationSchema = z.object({
  hidden: z.boolean(),
  reason: z.string().trim().max(200).nullable().optional(),
});

router.patch('/reviews/:id', validateObjectIds('id'), validateBody(moderationSchema), async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new HttpError(404, 'Ulasan tidak ditemukan.');
  review.hidden = req.body.hidden;
  review.hiddenReason = req.body.hidden ? req.body.reason || 'Melanggar pedoman komunitas.' : null;
  await review.save();
  const rating = await Review.refreshContentRating(review.content);
  await review.populate([{ path: 'user', select: 'name avatar' }, { path: 'content', select: 'slug title type art posterUrl' }]);
  res.json({ review: review.toPublic(), ...rating });
});

router.delete('/reviews/:id', validateObjectIds('id'), async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new HttpError(404, 'Ulasan tidak ditemukan.');
  await review.deleteOne();
  const rating = await Review.refreshContentRating(review.content);
  res.json({ deleted: true, ...rating });
});

export default router;
