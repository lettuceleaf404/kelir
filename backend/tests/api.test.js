/**
 * End-to-end API tests. Needs a running MongoDB (or compatible) server:
 *   MONGODB_URI=mongodb://127.0.0.1:27017/kelir_test npm test
 * The tests seed a fresh copy of the demo data into that database.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/kelir_test';

const { createApp } = await import('../src/app.js');
const { connectDatabase, disconnectDatabase } = await import('../src/db.js');
const { seedDatabase } = await import('../src/seed/seed.js');

const app = createApp();
const tokens = {};
const login = async (email, password) => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return res.body.token;
};
const auth = (who) => ({ Authorization: `Bearer ${tokens[who]}` });

before(async () => {
  await connectDatabase(process.env.MONGODB_URI);
  await seedDatabase({ reset: true, log: () => {} });
  tokens.demo = await login('demo@kelir.app', 'demo12345');
  tokens.gratis = await login('gratis@kelir.app', 'gratis12345');
  tokens.admin = await login('admin@kelir.app', 'admin12345');
});

after(async () => {
  await disconnectDatabase();
});

/* ---------- Catalog and discovery ---------- */

test('health check and demo media are served', async () => {
  const health = await request(app).get('/api/health');
  assert.equal(health.body.status, 'ok');
  const media = await request(app).get('/media/kelir-demo-film.mp4');
  assert.equal(media.status, 200);
  assert.equal(media.headers['cross-origin-resource-policy'], 'cross-origin');
  const missing = await request(app).get('/media/does-not-exist.mp4');
  assert.equal(missing.status, 404);
});

test('home returns every section, personalised when signed in', async () => {
  const guest = await request(app).get('/api/home');
  assert.equal(guest.status, 200);
  for (const key of ['hero', 'trending', 'regions', 'picks', 'premium', 'popularSeries', 'music', 'recentlyAdded']) {
    assert.ok(Array.isArray(guest.body[key]) && guest.body[key].length, `section ${key}`);
  }
  assert.equal(guest.body.regions.length, 7);
  assert.equal(guest.body.recommended, null);
  assert.ok(guest.body.trending.every((c) => c.regionName !== undefined));

  const me = await request(app).get('/api/home').set(auth('demo'));
  assert.ok(me.body.continueWatching.length >= 2);
  assert.ok(me.body.recommended.items.length > 0);
  const saved = new Set((await request(app).get('/api/auth/me').set(auth('demo'))).body.user.favorites);
  assert.ok(me.body.recommended.items.every((c) => !saved.has(c.id)), 'recommendations skip saved titles');
});

test('filters by type, region, access, origin, year, language and rating', async () => {
  const films = await request(app).get('/api/contents?type=film&limit=60');
  assert.ok(films.body.items.every((c) => c.type === 'film'));

  const multi = await request(app).get('/api/contents?type=series,documentary&limit=60');
  assert.ok(multi.body.items.every((c) => ['series', 'documentary'].includes(c.type)));

  const papua = await request(app).get('/api/contents?region=papua');
  assert.equal(papua.body.total, 3);
  assert.ok(papua.body.items.every((c) => c.region === 'papua'));

  const free = await request(app).get('/api/contents?access=free&origin=nusantara&limit=60');
  assert.ok(free.body.items.length > 0 && free.body.items.every((c) => c.access === 'free'));

  const intl = await request(app).get('/api/contents?origin=internasional&limit=60');
  assert.ok(intl.body.items.every((c) => c.region === null));

  const years = await request(app).get('/api/contents?yearFrom=2020&yearTo=2022&limit=60');
  assert.ok(years.body.items.every((c) => c.year >= 2020 && c.year <= 2022));

  const jawa = await request(app).get('/api/contents?language=jawa');
  assert.ok(jawa.body.items.some((c) => c.slug === 'tilik'));

  const top = await request(app).get('/api/contents?minRating=4.5&sort=rating');
  const ratings = top.body.items.map((c) => c.ratingAvg);
  assert.ok(ratings.every((r) => r >= 4.5));
  assert.deepEqual(ratings, [...ratings].sort((a, b) => b - a));

  const trailers = await request(app).get('/api/contents?hasTrailer=1');
  assert.ok(trailers.body.total >= 3);
});

test('searches title, creator, cast and region detail; ignores injection objects', async () => {
  const byCast = await request(app).get('/api/contents?q=Dian%20Sastrowardoyo');
  assert.deepEqual(byCast.body.items.map((c) => c.slug), ['gadis-kretek']);
  const byCreator = await request(app).get('/api/contents?q=kamila');
  assert.ok(byCreator.body.items.some((c) => c.slug === 'yuni'));
  const byPlace = await request(app).get('/api/contents?q=wakatobi');
  assert.equal(byPlace.body.items[0].slug, 'laut-bercermin');
  const regex = await request(app).get('/api/contents?q=.*');
  assert.equal(regex.body.total, 0, 'regex characters are escaped');
  const injection = await request(app).get('/api/contents?q[$ne]=x&region[$ne]=papua');
  assert.equal(injection.status, 200);
});

test('every regional title states its basis; filters panel and regions list agree', async () => {
  const filters = await request(app).get('/api/contents/filters');
  assert.equal(filters.body.regions.length, 7);
  const regions = await request(app).get('/api/contents/regions');
  for (const r of regions.body.regions) {
    assert.equal(r.count, filters.body.regions.find((f) => f.value === r.key).count);
  }
  const all = await request(app).get('/api/contents?limit=60');
  for (const card of all.body.items.filter((c) => c.region)) {
    const detail = await request(app).get(`/api/contents/${card.slug}`);
    assert.ok(detail.body.content.regionBasis?.length >= 10, `${card.slug} needs a region basis`);
  }
});

test('detail works by slug or id, hides playback URLs, and includes user state', async () => {
  const bySlug = await request(app).get('/api/contents/gadis-kretek');
  assert.equal(bySlug.status, 200);
  assert.equal(bySlug.body.content.episodes.length, 5);
  assert.equal(bySlug.body.content.episodes[0].access, 'free');
  assert.equal(JSON.stringify(bySlug.body).includes('commondatastorage'), false, 'no playback URL in detail');
  assert.equal(bySlug.body.me, null);

  const byId = await request(app).get(`/api/contents/${bySlug.body.content.id}`).set(auth('demo'));
  assert.equal(byId.body.content.slug, 'gadis-kretek');
  assert.equal(byId.body.me.isFavorite, true);
  assert.equal(byId.body.me.isPremium, true);
  assert.equal(byId.body.me.progress.episode, 2);

  const missing = await request(app).get('/api/contents/tidak-ada');
  assert.equal(missing.status, 404);

  const related = await request(app).get('/api/contents/ngeri-ngeri-sedap/related');
  assert.ok(related.body.items.length > 0);
  assert.ok(related.body.items.every((c) => c.slug !== 'ngeri-ngeri-sedap'));
});

/* ---------- Playback and Premium access ---------- */

test('playback: guests sign in, free users get free titles and free episodes only', async () => {
  const guest = await request(app).get('/api/contents/laskar-pelangi/play');
  assert.equal(guest.status, 401);
  assert.equal(guest.body.error.code, 'AUTH_REQUIRED');

  const freeTitle = await request(app).get('/api/contents/laskar-pelangi/play').set(auth('gratis'));
  assert.equal(freeTitle.status, 200);
  assert.match(freeTitle.body.source.src, /^https:\/\//);
  assert.match(freeTitle.body.source.credit, /Blender Foundation/);
  assert.equal(freeTitle.body.resumeAt, 200, 'resumes where the seed left off');

  const premiumTitle = await request(app).get('/api/contents/marlina-si-pembunuh-dalam-empat-babak/play').set(auth('gratis'));
  assert.equal(premiumTitle.status, 403);
  assert.equal(premiumTitle.body.error.code, 'PREMIUM_REQUIRED');

  const ep1 = await request(app).get('/api/contents/gadis-kretek/play?episode=1').set(auth('gratis'));
  assert.equal(ep1.status, 200);
  assert.equal(ep1.body.nextEpisode, 2);
  const ep2 = await request(app).get('/api/contents/gadis-kretek/play?episode=2').set(auth('gratis'));
  assert.equal(ep2.status, 403);

  const local = await request(app).get('/api/contents/tilik/play').set(auth('gratis'));
  assert.match(local.body.source.src, /^http:\/\/127\.0\.0\.1:\d+\/media\/kelir-demo-film\.mp4$/);
});

test('playback: Premium users get everything; expired Premium does not count', async () => {
  const premium = await request(app).get('/api/contents/gadis-kretek/play?episode=2').set(auth('demo'));
  assert.equal(premium.status, 200);
  assert.equal(premium.body.resumeAt, 410);
  const noEpisode = await request(app).get('/api/contents/gadis-kretek/play?episode=99').set(auth('demo'));
  assert.equal(noEpisode.status, 404);

  const bima = await login('bima@kelir.app', 'bima12345');
  const me = await request(app).get('/api/auth/me').set({ Authorization: `Bearer ${bima}` });
  assert.equal(me.body.user.subscription.status, 'EXPIRED');
  assert.equal(me.body.user.subscription.isPremium, false);
  const blocked = await request(app).get('/api/contents/interstellar/play').set({ Authorization: `Bearer ${bima}` });
  assert.equal(blocked.status, 403);
});

test('watch progress feeds Lanjutkan Menonton and marks titles watched at 90%', async () => {
  const save = await request(app).put('/api/me/progress/tilik').set(auth('gratis')).send({ positionSeconds: 300, durationSeconds: 720 });
  assert.equal(save.status, 200);
  let list = await request(app).get('/api/me/progress').set(auth('gratis'));
  assert.equal(list.body.items[0].content.slug, 'tilik');

  await request(app).put('/api/me/progress/tilik').set(auth('gratis')).send({ positionSeconds: 700, durationSeconds: 720 });
  list = await request(app).get('/api/me/progress').set(auth('gratis'));
  assert.ok(!list.body.items.some((p) => p.content.slug === 'tilik'));
  const library = await request(app).get('/api/me/library').set(auth('gratis'));
  assert.ok(library.body.watched.some((c) => c.slug === 'tilik'));

  const invalid = await request(app).put('/api/me/progress/tilik').set(auth('gratis')).send({ positionSeconds: -1 });
  assert.equal(invalid.status, 400);
});

/* ---------- Subscription ---------- */

test('simulated checkout activates Premium, cancel keeps access until expiry', async () => {
  const plans = await request(app).get('/api/subscription/plans');
  assert.equal(plans.body.plans.length, 2);

  const user = await request(app).post('/api/auth/register').send({ name: 'Tester Premium', email: 'premium-test@kelir.app', password: 'rahasia123' });
  assert.equal(user.status, 201);
  assert.equal(user.body.user.subscription.status, 'FREE');
  const headers = { Authorization: `Bearer ${user.body.token}` };

  const unconfirmed = await request(app).post('/api/subscription/checkout').set(headers).send({ plan: 'monthly' });
  assert.equal(unconfirmed.status, 400);

  const paid = await request(app).post('/api/subscription/checkout').set(headers).send({ plan: 'monthly', confirmSimulation: true });
  assert.equal(paid.status, 201);
  assert.equal(paid.body.subscription.status, 'ACTIVE');
  assert.equal(paid.body.payment.amount, 49000);
  assert.equal(paid.body.payment.method, 'SIMULASI');
  const firstExpiry = new Date(paid.body.subscription.expiresAt);

  const renewed = await request(app).post('/api/subscription/checkout').set(headers).send({ plan: 'monthly', confirmSimulation: true });
  const days = (new Date(renewed.body.subscription.expiresAt) - firstExpiry) / 86400000;
  assert.equal(Math.round(days), 30, 'early renewal adds to the remaining period');

  const play = await request(app).get('/api/contents/interstellar/play').set(headers);
  assert.equal(play.status, 200);

  const cancelled = await request(app).post('/api/subscription/cancel').set(headers);
  assert.equal(cancelled.body.subscription.status, 'CANCELLED');
  assert.equal(cancelled.body.subscription.isPremium, true);
  const stillPlays = await request(app).get('/api/contents/interstellar/play').set(headers);
  assert.equal(stillPlays.status, 200);

  const again = await request(app).post('/api/subscription/cancel').set(headers);
  assert.equal(again.status, 400);
  const history = await request(app).get('/api/subscription').set(headers);
  assert.equal(history.body.history.length, 3);
});

/* ---------- Auth and profile ---------- */

test('register validates input and rejects duplicate email', async () => {
  const bad = await request(app).post('/api/auth/register').send({ name: 'A', email: 'bukan-email', password: 'pendek' });
  assert.equal(bad.status, 400);
  const fields = bad.body.error.fields.map((f) => f.field);
  assert.ok(fields.includes('name') && fields.includes('email') && fields.includes('password'));

  const dup = await request(app).post('/api/auth/register').send({ name: 'Sekar', email: 'demo@kelir.app', password: 'rahasia123' });
  assert.equal(dup.status, 409);

  const wrong = await request(app).post('/api/auth/login').send({ email: 'demo@kelir.app', password: 'salah12345' });
  assert.equal(wrong.status, 401);
  assert.equal(wrong.body.error.message, 'Email atau kata sandi salah.');
});

test('profile, preferences and password can be changed', async () => {
  const reg = await request(app).post('/api/auth/register').send({ name: 'Profil Uji', email: 'profil@kelir.app', password: 'rahasia123', favoriteRegions: ['maluku'] });
  const headers = { Authorization: `Bearer ${reg.body.token}` };
  const patch = await request(app).patch('/api/me').set(headers).send({ bio: 'Pencinta keroncong', avatar: 'lilac', favoriteGenres: ['Keroncong'] });
  assert.equal(patch.status, 200);
  assert.equal(patch.body.user.avatar, 'lilac');
  assert.deepEqual(patch.body.user.favoriteRegions, ['maluku']);
  const badAvatar = await request(app).patch('/api/me').set(headers).send({ avatar: 'emas' });
  assert.equal(badAvatar.status, 400);
  const roleEscalation = await request(app).patch('/api/me').set(headers).send({ role: 'admin' });
  assert.equal(roleEscalation.body.user.role, 'user', 'unknown fields are dropped');

  const wrongOld = await request(app).post('/api/me/password').set(headers).send({ currentPassword: 'salah', newPassword: 'barubaru123' });
  assert.equal(wrongOld.status, 400);
  const ok = await request(app).post('/api/me/password').set(headers).send({ currentPassword: 'rahasia123', newPassword: 'barubaru123' });
  assert.equal(ok.status, 200);
  await login('profil@kelir.app', 'barubaru123');
});

/* ---------- Reviews ---------- */

test('one review per user: create, edit, list, delete, with rating refresh', async () => {
  const create = await request(app).post('/api/contents/yuni/reviews').set(auth('gratis')).send({ rating: 4, comment: 'Kuat dan jujur.' });
  assert.equal(create.status, 201);
  assert.equal(create.body.ratingCount, 1);
  const edit = await request(app).post('/api/contents/yuni/reviews').set(auth('gratis')).send({ rating: 5, comment: 'Makin suka.' });
  assert.equal(edit.body.ratingCount, 1);
  assert.equal(edit.body.ratingAvg, 5);
  const bad = await request(app).post('/api/contents/yuni/reviews').set(auth('gratis')).send({ rating: 9 });
  assert.equal(bad.status, 400);
  const guest = await request(app).post('/api/contents/yuni/reviews').send({ rating: 5 });
  assert.equal(guest.status, 401);

  const history = await request(app).get('/api/me/reviews').set(auth('gratis'));
  assert.ok(history.body.items.some((r) => r.content.slug === 'yuni'));

  const del = await request(app).delete('/api/contents/yuni/reviews/me').set(auth('gratis'));
  assert.equal(del.body.ratingCount, 0);
  const again = await request(app).delete('/api/contents/yuni/reviews/me').set(auth('gratis'));
  assert.equal(again.status, 404);
});

/* ---------- Library and collections ---------- */

test('favorites, watchlist and watched lists', async () => {
  const add = await request(app).put('/api/me/library/watchlist/kinipan').set(auth('gratis'));
  assert.equal(add.status, 200);
  const twice = await request(app).put('/api/me/library/watchlist/kinipan').set(auth('gratis'));
  assert.equal(twice.body.watchlist.filter((id) => id === add.body.contentId).length, 1);
  const lib = await request(app).get('/api/me/library').set(auth('gratis'));
  assert.equal(lib.body.watchlist[0].slug, 'kinipan', 'newest first');
  const remove = await request(app).delete('/api/me/library/watchlist/kinipan').set(auth('gratis'));
  assert.ok(!remove.body.watchlist.includes(add.body.contentId));
  const unknown = await request(app).put('/api/me/library/rahasia/kinipan').set(auth('gratis'));
  assert.equal(unknown.status, 404);
});

test('custom collections are private to their owner', async () => {
  const created = await request(app).post('/api/collections').set(auth('gratis')).send({ name: 'Dokumenter akhir pekan' });
  assert.equal(created.status, 201);
  const id = created.body.collection.id;
  const added = await request(app).put(`/api/collections/${id}/items/pulau-plastik`).set(auth('gratis'));
  assert.equal(added.body.collection.itemCount, 1);
  assert.equal(added.body.collection.items[0].slug, 'pulau-plastik');
  const renamed = await request(app).patch(`/api/collections/${id}`).set(auth('gratis')).send({ name: 'Dokumen Nusantara' });
  assert.equal(renamed.body.collection.name, 'Dokumen Nusantara');

  const stranger = await request(app).get(`/api/collections/${id}`).set(auth('demo'));
  assert.equal(stranger.status, 404);
  const mine = await request(app).get('/api/collections').set(auth('demo'));
  assert.equal(mine.body.items.length, 2);

  const removed = await request(app).delete(`/api/collections/${id}/items/pulau-plastik`).set(auth('gratis'));
  assert.equal(removed.body.collection.itemCount, 0);
  const deleted = await request(app).delete(`/api/collections/${id}`).set(auth('gratis'));
  assert.equal(deleted.body.deleted, true);
  const empty = await request(app).post('/api/collections').set(auth('gratis')).send({ name: '' });
  assert.equal(empty.status, 400);
});

/* ---------- Admin ---------- */

test('admin routes are closed to regular users', async () => {
  const guest = await request(app).get('/api/admin/stats');
  assert.equal(guest.status, 401);
  const user = await request(app).get('/api/admin/stats').set(auth('demo'));
  assert.equal(user.status, 403);
  const admin = await request(app).get('/api/admin/stats').set(auth('admin'));
  assert.equal(admin.status, 200);
  assert.equal(admin.body.contents, 42);
  assert.ok(admin.body.premiumUsers >= 2);
  assert.ok(admin.body.simulatedRevenue > 0);
});

test('admin content CRUD with region-basis rule, episodes, publish and delete', async () => {
  const noBasis = await request(app).post('/api/admin/contents').set(auth('admin')).send({
    slug: 'uji-tanpa-dasar', type: 'film', title: 'Uji', synopsis: 'Sinopsis uji yang cukup panjang.', creator: 'Tim KELIR', region: 'papua',
  });
  assert.equal(noBasis.status, 400);
  assert.equal(noBasis.body.error.fields[0].field, 'regionBasis');

  const badUrl = await request(app).post('/api/admin/contents').set(auth('admin')).send({
    slug: 'uji-url', type: 'film', title: 'Uji', synopsis: 'Sinopsis uji yang cukup panjang.', creator: 'Tim', posterUrl: 'http://contoh.id/a.jpg',
  });
  assert.equal(badUrl.status, 400);

  const created = await request(app).post('/api/admin/contents').set(auth('admin')).send({
    slug: 'serial-uji', type: 'series', title: 'Serial Uji', synopsis: 'Serial uji untuk admin.', creator: 'Tim KELIR',
    region: 'maluku', regionDetail: 'Ambon', regionBasis: 'Berlatar di Kota Ambon, Maluku.', access: 'premium', published: false,
    episodes: [
      { number: 1, title: 'Pembuka', access: 'free', playback: { src: '/media/kelir-demo-film.mp4', credit: 'Klip demo' } },
      { number: 2, title: 'Lanjutan', playback: { src: '/media/kelir-demo-film.mp4' } },
    ],
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const id = created.body.content.id;
  assert.equal(created.body.content.episodes[1].access, 'premium');

  const hidden = await request(app).get('/api/contents/serial-uji');
  assert.equal(hidden.status, 404, 'drafts stay hidden from the public');

  const dupEpisodes = await request(app).patch(`/api/admin/contents/${id}`).set(auth('admin')).send({
    episodes: [
      { number: 1, title: 'A', playback: { src: '/media/kelir-demo-film.mp4' } },
      { number: 1, title: 'B', playback: { src: '/media/kelir-demo-film.mp4' } },
    ],
  });
  assert.equal(dupEpisodes.status, 400);

  const published = await request(app).patch(`/api/admin/contents/${id}`).set(auth('admin')).send({ published: true, featured: true });
  assert.equal(published.body.content.published, true);
  assert.equal(published.body.content.region, 'maluku', 'PATCH keeps fields it does not mention');
  const visible = await request(app).get('/api/contents/serial-uji');
  assert.equal(visible.status, 200);

  const clearBasis = await request(app).patch(`/api/admin/contents/${id}`).set(auth('admin')).send({ regionBasis: '' });
  assert.equal(clearBasis.status, 400);

  const dupSlug = await request(app).patch(`/api/admin/contents/${id}`).set(auth('admin')).send({ slug: 'tilik' });
  assert.equal(dupSlug.status, 409);

  await request(app).put('/api/me/library/favorites/serial-uji').set(auth('gratis'));
  const del = await request(app).delete(`/api/admin/contents/${id}`).set(auth('admin'));
  assert.equal(del.body.deleted, true);
  const me = await request(app).get('/api/auth/me').set(auth('gratis'));
  assert.ok(!me.body.user.favorites.includes(id), 'deleting a title removes it from user lists');
});

test('admin moderates reviews; hidden reviews leave lists and averages', async () => {
  const list = await request(app).get('/api/admin/reviews?status=visible').set(auth('admin'));
  const target = list.body.items.find((r) => r.content.slug === 'parasite');
  assert.ok(target);
  const before = await request(app).get('/api/contents/parasite');
  const hide = await request(app).patch(`/api/admin/reviews/${target.id}`).set(auth('admin')).send({ hidden: true, reason: 'Uji moderasi' });
  assert.equal(hide.body.review.hidden, true);
  assert.equal(hide.body.ratingCount, before.body.content.ratingCount - 1);
  const pub = await request(app).get('/api/contents/parasite/reviews');
  assert.ok(!pub.body.items.some((r) => r.id === target.id));
  const restore = await request(app).patch(`/api/admin/reviews/${target.id}`).set(auth('admin')).send({ hidden: false });
  assert.equal(restore.body.ratingCount, before.body.content.ratingCount);
});

test('admin manages users and subscriptions, but cannot lock themselves out', async () => {
  const users = await request(app).get('/api/admin/users?q=gratis').set(auth('admin'));
  const gratis = users.body.items[0];
  assert.equal(gratis.email, 'gratis@kelir.app');

  const grant = await request(app).patch(`/api/admin/users/${gratis.id}/subscription`).set(auth('admin')).send({ status: 'ACTIVE', plan: 'monthly' });
  assert.equal(grant.body.user.subscription.isPremium, true);
  const play = await request(app).get('/api/contents/marlina-si-pembunuh-dalam-empat-babak/play').set(auth('gratis'));
  assert.equal(play.status, 200);
  const revoke = await request(app).patch(`/api/admin/users/${gratis.id}/subscription`).set(auth('admin')).send({ status: 'FREE' });
  assert.equal(revoke.body.user.subscription.isPremium, false);

  const payments = await request(app).get('/api/admin/payments?kind=admin_update').set(auth('admin'));
  assert.ok(payments.body.total >= 2);

  const suspend = await request(app).patch(`/api/admin/users/${gratis.id}`).set(auth('admin')).send({ status: 'suspended' });
  assert.equal(suspend.body.user.status, 'suspended');
  const blocked = await request(app).get('/api/auth/me').set(auth('gratis'));
  assert.equal(blocked.status, 403);
  const loginBlocked = await request(app).post('/api/auth/login').send({ email: 'gratis@kelir.app', password: 'gratis12345' });
  assert.equal(loginBlocked.status, 403);
  await request(app).patch(`/api/admin/users/${gratis.id}`).set(auth('admin')).send({ status: 'active' });

  const adminMe = await request(app).get('/api/auth/me').set(auth('admin'));
  const self = await request(app).patch(`/api/admin/users/${adminMe.body.user.id}`).set(auth('admin')).send({ role: 'user' });
  assert.equal(self.status, 400);
});
