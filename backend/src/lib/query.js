import mongoose from 'mongoose';
import { Content } from '../models/Content.js';

export const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Only accept plain strings from the query string. */
export const str = (value, max = 80) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined);

export const toInt = (value, fallback, min, max) => {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : Math.min(Math.max(n, min), max);
};

/** Case-insensitive "contains" match. Built on the server, so it is marked trusted for sanitizeFilter. */
export const contains = (text) => mongoose.trusted({ $regex: escapeRegex(text), $options: 'i' });
export const inList = (values) => mongoose.trusted({ $in: values });
export const notInList = (values) => mongoose.trusted({ $nin: values });

/** Accept a Mongo ObjectId or a slug. */
export async function findContent(idOrSlug, { includeUnpublished = false } = {}) {
  const filter = mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: String(idOrSlug).toLowerCase() };
  if (!includeUnpublished) filter.published = true;
  return Content.findOne(filter);
}
