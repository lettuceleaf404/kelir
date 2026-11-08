/**
 * Demo accounts and activity. Passwords here are for local demos only:
 * set SEED_ADMIN_PASSWORD before seeding a public deployment.
 */
export const ADMIN_EMAIL = 'admin@kelir.app';

export const demoUsers = [
  {
    key: 'demo', name: 'Sekar Demo', email: 'demo@kelir.app', password: 'demo12345', avatar: 'coral',
    bio: 'Suka film keluarga dan lagu daerah.',
    favoriteGenres: ['Drama', 'Keluarga', 'Lagu Daerah'], favoriteRegions: ['sulawesi', 'maluku'],
    subscription: { plan: 'annual', days: 300 },
  },
  {
    key: 'gratis', name: 'Bayu Gratis', email: 'gratis@kelir.app', password: 'gratis12345', avatar: 'turquoise',
    bio: '', favoriteGenres: ['Komedi', 'Dokumenter'], favoriteRegions: ['jawa'], subscription: null,
  },
  { key: 'admin', name: 'Admin KELIR', email: ADMIN_EMAIL, password: 'admin12345', role: 'admin', avatar: 'ink', favoriteGenres: [], favoriteRegions: [], subscription: null },
  { key: 'alya', name: 'Alya Rahma', email: 'alya@kelir.app', password: 'alya12345', avatar: 'lilac', favoriteGenres: ['Drama'], favoriteRegions: [], subscription: { plan: 'monthly', days: 12 } },
  { key: 'bima', name: 'Bima Pratama', email: 'bima@kelir.app', password: 'bima12345', avatar: 'mango', favoriteGenres: ['Aksi', 'Fiksi Ilmiah'], favoriteRegions: [], subscription: { plan: 'monthly', days: -5 } },
  { key: 'citra', name: 'Citra Lestari', email: 'citra@kelir.app', password: 'citra12345', avatar: 'mint', favoriteGenres: ['Lagu Daerah', 'Dokumenter'], favoriteRegions: ['papua'], subscription: null },
  { key: 'bobby', name: 'Bobby', email: 'bobby@kelir.com', password: 'bobby12345', avatar: 'turquoise', favoriteGenres: ['Komedi'], favoriteRegions: [], subscription: null },
  { key: 'snape', name: 'Snape', email: 'snape@kelir.com', password: 'snape12345', avatar: 'ink', favoriteGenres: ['Drama'], favoriteRegions: [], subscription: { plan: 'annual', days: 365 } },
];

// [slug, user key, rating, comment]
export const reviews = [
  ['marlina-si-pembunuh-dalam-empat-babak', 'alya', 5, 'Sunyi tapi tegang. Lanskap Sumba-nya luar biasa.'],
  ['marlina-si-pembunuh-dalam-empat-babak', 'bima', 4, 'Pembagian empat babaknya bikin cerita gampang diikuti.'],
  ['ngeri-ngeri-sedap', 'demo', 5, 'Ketawa dari awal, nangis di akhir. Rindu pulang kampung.'],
  ['ngeri-ngeri-sedap', 'citra', 5, 'Lagu-lagu Bataknya bikin merinding.'],
  ['ngeri-ngeri-sedap', 'gratis', 4, 'Lucu dan dekat dengan keluarga sendiri.'],
  ['laskar-pelangi', 'gratis', 5, 'Tonton bareng keluarga, semua suka.'],
  ['laskar-pelangi', 'alya', 4, 'Hangat dan penuh semangat.'],
  ['laut-bercermin', 'demo', 5, 'Gambar lautnya cantik, ceritanya lembut.'],
  ['gadis-kretek', 'alya', 5, 'Kostum dan suasana 60-an-nya detail sekali.'],
  ['gadis-kretek', 'demo', 4, 'Episode pertama langsung bikin penasaran.'],
  ['tilik', 'gratis', 5, 'Bu Tejo legendaris.'],
  ['tilik', 'citra', 4, 'Pendek, padat, dan sangat Jawa.'],
  ['jendela-seribu-sungai', 'citra', 4, 'Sungai Martapura jadi tokoh tersendiri.'],
  ['banda-the-dark-forgotten-trail', 'citra', 5, 'Sejarah yang jarang dibahas di sekolah.'],
  ['tanah-mama', 'citra', 4, 'Jujur dan tidak menggurui.'],
  ['anging-mammiri', 'demo', 5, 'Lagu pengantar tidur dari nenek.'],
  ['rasa-sayange', 'gratis', 4, 'Selalu dinyanyikan waktu acara sekolah.'],
  ['interstellar', 'bima', 5, 'Musiknya masih terngiang.'],
  ['dune-part-two', 'bima', 4, 'Megah di layar lebar.'],
  ['squid-game', 'bima', 4, 'Tegang tiap episode.'],
  ['mencuri-raden-saleh', 'alya', 4, 'Seru, timnya kompak.'],
  ['spirited-away', 'alya', 5, 'Selalu ada detail baru tiap ditonton ulang.'],
  ['cahaya-dari-timur-beta-maluku', 'demo', 4, 'Sepak bola sebagai jalan damai.'],
  ['parasite', 'bima', 2, 'Bagus, tapi terlalu suram untukku.'],
];

export const libraries = {
  demo: {
    favorites: ['ngeri-ngeri-sedap', 'laut-bercermin', 'anging-mammiri', 'gadis-kretek'],
    watchlist: ['banda-the-dark-forgotten-trail', 'cahaya-dari-timur-beta-maluku', 'kinipan'],
    watched: ['laskar-pelangi', 'tilik'],
  },
  gratis: { favorites: ['tilik', 'laskar-pelangi'], watchlist: ['pulau-plastik'], watched: [] },
};

// [user key, slug, episode, positionSeconds, durationSeconds]
export const progress = [
  ['demo', 'gadis-kretek', 2, 410, 734],
  ['demo', 'marlina-si-pembunuh-dalam-empat-babak', null, 300, 888],
  ['demo', 'banda-the-dark-forgotten-trail', null, 120, 653],
  ['gratis', 'laskar-pelangi', null, 200, 596],
];

export const collections = {
  demo: [
    { name: 'Nonton bareng keluarga', description: 'Untuk akhir pekan di rumah.', items: ['laskar-pelangi', 'ngeri-ngeri-sedap', 'jendela-seribu-sungai', 'spirited-away'] },
    { name: 'Lagu dari timur', description: 'Lagu daerah Sulawesi, Maluku, dan Papua.', items: ['anging-mammiri', 'rasa-sayange', 'yamko-rambe-yamko'] },
  ],
};
