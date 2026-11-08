/**
 * Checks that every YouTube ID in the seed data still points to a playable video.
 * Uses YouTube's public oEmbed endpoint (no API key needed). Run on a machine with internet access:
 *
 *   npm run verify:trailers
 */
import { catalog as contents } from '../seed/catalog.js';

const check = async (item) => {
  if (!item.trailerYoutubeId) return { item, status: 'none' };
  const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${item.trailerYoutubeId}`,
  )}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { item, status: 'broken', detail: `HTTP ${res.status}` };
    const data = await res.json();
    return { item, status: 'ok', detail: `${data.title} (${data.author_name})` };
  } catch (err) {
    return { item, status: 'error', detail: err.message };
  }
};

const results = await Promise.all(contents.map(check));
let broken = 0;
for (const { item, status, detail } of results) {
  const icon = { ok: 'OK    ', none: 'NONE  ', broken: 'BROKEN', error: 'ERROR ' }[status];
  if (status === 'broken' || status === 'error') broken += 1;
  console.log(`${icon} ${item.title.padEnd(38)} ${item.trailerYoutubeId ?? '-'}  ${detail ?? ''}`);
}
console.log(
  broken
    ? `\n${broken} video(s) need a new ID. Update trailerYoutubeId in src/seed/catalog.js, then run npm run seed.`
    : '\nAll trailer IDs are playable.',
);
process.exit(broken ? 1 : 0);
