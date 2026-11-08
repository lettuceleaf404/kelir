import { Router } from 'express';
import { z } from 'zod';
import { Collection } from '../models/Collection.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateObjectIds } from '../middleware/validate.js';
import { HttpError } from '../middleware/errors.js';
import { findContent } from '../lib/query.js';

const router = Router();
router.use(requireAuth);

const MAX_COLLECTIONS = 30;
const MAX_ITEMS = 200;

const collectionSchema = z.object({
  name: z.string().trim().min(1, 'Nama koleksi wajib diisi.').max(60, 'Nama koleksi maksimal 60 karakter.'),
  description: z.string().trim().max(200, 'Deskripsi maksimal 200 karakter.').optional().default(''),
});

async function own(req) {
  const collection = await Collection.findOne({ _id: req.params.id, user: req.user._id });
  if (!collection) throw new HttpError(404, 'Koleksi tidak ditemukan.');
  return collection;
}

const populated = (c) => c.populate({ path: 'items', match: { published: true } });

router.get('/', async (req, res) => {
  const items = await Collection.find({ user: req.user._id }).sort({ updatedAt: -1 }).populate({ path: 'items', match: { published: true } });
  res.json({ items: items.map((c) => c.toPublic()) });
});

router.post('/', validateBody(collectionSchema), async (req, res) => {
  if ((await Collection.countDocuments({ user: req.user._id })) >= MAX_COLLECTIONS) {
    throw new HttpError(400, `Maksimal ${MAX_COLLECTIONS} koleksi.`);
  }
  const collection = await Collection.create({ ...req.body, user: req.user._id });
  res.status(201).json({ collection: collection.toPublic() });
});

router.get('/:id', validateObjectIds('id'), async (req, res) => {
  const collection = await populated(await own(req));
  res.json({ collection: collection.toPublic() });
});

router.patch('/:id', validateObjectIds('id'), validateBody(collectionSchema.partial()), async (req, res) => {
  const collection = await own(req);
  Object.assign(collection, req.body);
  await collection.save();
  res.json({ collection: (await populated(collection)).toPublic() });
});

router.delete('/:id', validateObjectIds('id'), async (req, res) => {
  const collection = await own(req);
  await collection.deleteOne();
  res.json({ deleted: true });
});

router.put('/:id/items/:contentId', validateObjectIds('id'), async (req, res) => {
  const collection = await own(req);
  const content = await findContent(req.params.contentId);
  if (!content) throw new HttpError(404, 'Konten tidak ditemukan.');
  if (!collection.items.some((id) => id.equals(content._id))) {
    if (collection.items.length >= MAX_ITEMS) throw new HttpError(400, `Satu koleksi maksimal ${MAX_ITEMS} judul.`);
    collection.items.push(content._id);
    await collection.save();
  }
  res.json({ collection: (await populated(collection)).toPublic() });
});

router.delete('/:id/items/:contentId', validateObjectIds('id'), async (req, res) => {
  const collection = await own(req);
  const content = await findContent(req.params.contentId, { includeUnpublished: true });
  if (content) {
    collection.items = collection.items.filter((id) => !id.equals(content._id));
    await collection.save();
  }
  res.json({ collection: (await populated(collection)).toPublic() });
});

export default router;
