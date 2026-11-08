/**
 * Demo playback assets. KELIR holds no rights to the catalog titles, so the player uses:
 *  - Blender Foundation open movies (Creative Commons Attribution), served from Google's public sample bucket;
 *  - KELIR's own short clips in /media as a fallback that always works (generated for this project).
 * Every asset carries a credit line that the player shows.
 */
const BLENDER = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample';

export const DEMO_ASSETS = {
  sintel: { src: `${BLENDER}/Sintel.mp4`, credit: 'Sintel (2010) © Blender Foundation · durian.blender.org · CC BY 3.0', fallbackSrc: '/media/kelir-demo-film.mp4' },
  tears: { src: `${BLENDER}/TearsOfSteel.mp4`, credit: 'Tears of Steel (2012) © Blender Foundation · mango.blender.org · CC BY 3.0', fallbackSrc: '/media/kelir-demo-film.mp4' },
  bunny: { src: `${BLENDER}/BigBuckBunny.mp4`, credit: 'Big Buck Bunny (2008) © Blender Foundation · peach.blender.org · CC BY 3.0', fallbackSrc: '/media/kelir-demo-film.mp4' },
  elephants: { src: `${BLENDER}/ElephantsDream.mp4`, credit: 'Elephants Dream (2006) © Blender Foundation · orange.blender.org · CC BY 2.5', fallbackSrc: '/media/kelir-demo-dokumenter.mp4' },
  'kelir-film': { src: '/media/kelir-demo-film.mp4', credit: 'Klip demo KELIR, dibuat khusus untuk proyek ini', fallbackSrc: null },
  'kelir-dokumenter': { src: '/media/kelir-demo-dokumenter.mp4', credit: 'Klip demo KELIR, dibuat khusus untuk proyek ini', fallbackSrc: null },
  'kelir-musik': { src: '/media/kelir-demo-musik.mp4', credit: 'Klip demo KELIR dengan musik pentatonik buatan sendiri', fallbackSrc: null },
};

export function demo(key) {
  const asset = DEMO_ASSETS[key];
  if (!asset) throw new Error(`Unknown demo asset: ${key}`);
  return { ...asset, isDemo: true };
}
