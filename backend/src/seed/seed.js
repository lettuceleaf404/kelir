/**
 * Fills the database with the KELIR demo catalog, accounts and activity.
 * Safe to run more than once: contents and users are upserted.
 *
 *   npm run seed            -> upsert demo data
 *   npm run seed -- --reset -> drop all KELIR collections first
 */
import { pathToFileURL } from 'node:url';
import { config } from '../config.js';
import { connectDatabase, disconnectDatabase } from '../db.js';
import { Content } from '../models/Content.js';
import { User } from '../models/User.js';
import { Review } from '../models/Review.js';
import { Collection } from '../models/Collection.js';
import { WatchProgress } from '../models/WatchProgress.js';
import { Payment } from '../models/Payment.js';
import { PLANS } from '../plans.js';
import { catalog } from './catalog.js';
import { ADMIN_EMAIL, collections, demoUsers, libraries, progress, reviews } from './data.js';

const DAY = 24 * 60 * 60 * 1000;

export async function seedDatabase({ reset = false, log = console.log, now = new Date() } = {}) {
  if (reset) {
    await Promise.all([Content, User, Review, Collection, WatchProgress, Payment].map((m) => m.deleteMany({})));
    log('Cleared existing data');
  }

  // Stagger createdAt so "Baru Ditambahkan" has a stable order: the last items in the catalog are the newest.
  for (const [i, item] of catalog.entries()) {
    const createdAt = new Date(now.getTime() - (catalog.length - i) * 6 * 60 * 60 * 1000);
    await Content.updateOne({ slug: item.slug }, { $set: item, $setOnInsert: { createdAt } }, { upsert: true, timestamps: false });
  }
  log(`Upserted ${catalog.length} contents`);
  const bySlug = Object.fromEntries((await Content.find()).map((c) => [c.slug, c]));
  const id = (slug) => {
    if (!bySlug[slug]) throw new Error(`Seed refers to unknown slug: ${slug}`);
    return bySlug[slug]._id;
  };

  const users = {};
  for (const u of demoUsers) {
    let user = await User.findOne({ email: u.email });
    const password = u.email === ADMIN_EMAIL ? process.env.SEED_ADMIN_PASSWORD || u.password : u.password;
    if (!user) {
      user = await User.create({
        name: u.name,
        email: u.email,
        passwordHash: await User.hashPassword(password),
        role: u.role || 'user',
        avatar: u.avatar,
        bio: u.bio || '',
        favoriteGenres: u.favoriteGenres,
        favoriteRegions: u.favoriteRegions,
      });
      if (u.subscription) {
        // days > 0: still running for that many days; days < 0: ended that many days ago.
        const plan = PLANS[u.subscription.plan];
        const expiresAt = new Date(now.getTime() + u.subscription.days * DAY);
        const startedAt = new Date(expiresAt.getTime() - plan.days * DAY);
        user.subscription = { status: 'ACTIVE', plan: plan.key, startedAt, expiresAt, cancelledAt: null };
        await user.save();
        await Payment.create({
          user: user._id, kind: 'purchase', plan: plan.key, amount: plan.price, status: 'PAID',
          reference: `KLR-SEED-${u.key.toUpperCase()}`, periodStart: startedAt, periodEnd: expiresAt,
          note: 'Pembayaran simulasi (data contoh).', createdAt: startedAt,
        });
      }
    }
    users[u.key] = user;
  }
  if (!process.env.SEED_ADMIN_PASSWORD) log(`Admin ${ADMIN_EMAIL} uses the demo password. Set SEED_ADMIN_PASSWORD for public deployments.`);
  log(`Ensured ${demoUsers.length} demo users`);

  for (const [slug, key, rating, comment] of reviews) {
    await Review.updateOne({ content: id(slug), user: users[key]._id }, { $set: { rating, comment } }, { upsert: true });
  }
  for (const content of Object.values(bySlug)) await Review.refreshContentRating(content._id);
  log(`Upserted ${reviews.length} reviews and refreshed ratings`);

  for (const [key, lists] of Object.entries(libraries)) {
    const user = users[key];
    for (const [list, slugs] of Object.entries(lists)) user[list] = slugs.map(id);
    await user.save();
  }
  for (const [key, slug, episode, positionSeconds, durationSeconds] of progress) {
    await WatchProgress.updateOne(
      { user: users[key]._id, content: id(slug) },
      { $set: { episode, positionSeconds, durationSeconds, completed: false } },
      { upsert: true },
    );
  }
  for (const [key, list] of Object.entries(collections)) {
    for (const c of list) {
      await Collection.updateOne(
        { user: users[key]._id, name: c.name },
        { $set: { description: c.description, items: c.items.map(id) } },
        { upsert: true },
      );
    }
  }
  log('Set libraries, watch progress and collections');
}

// Run directly: node src/seed/seed.js
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const reset = process.argv.includes('--reset');
  connectDatabase(config.mongoUri)
    .then(() => seedDatabase({ reset }))
    .then(async () => {
      console.log('Seeding finished. Demo login: demo@kelir.app / demo12345 (Premium), gratis@kelir.app / gratis12345 (Gratis)');
      await disconnectDatabase();
    })
    .catch(async (err) => {
      console.error('Seeding failed:', err);
      await disconnectDatabase();
      process.exit(1);
    });
}
