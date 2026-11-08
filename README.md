# KELIR — Nusantara Entertainment Hub

> **Satu Ruang, Sejuta Cerita.**

KELIR adalah platform hiburan yang mengumpulkan film, serial, dokumenter, dan musik dalam satu tempat, dengan fokus pada cerita dari tujuh wilayah Nusantara yang berdampingan dengan karya internasional. Model bisnisnya freemium: akun Gratis bisa menonton judul gratis dan trailer, sedangkan Premium membuka semua judul. Pembayaran Premium disimulasikan.

Proyek LO3 mata kuliah *Specialized Platform Development* (BINUS Online), terdiri dari tiga aplikasi:

| Bagian | Teknologi | Folder |
| --- | --- | --- |
| REST API + database | Node.js 20+, Express 5, MongoDB (Mongoose 9) | `backend/` |
| Aplikasi web | React 19, Vite 8, React Router 7 | `web/` |
| Aplikasi mobile | React Native 0.88 dengan Expo SDK 58 | `mobile/` |

**Tautan pengumpulan** (isi setelah deploy):

- Web: `https://…vercel.app`
- API: `https://…onrender.com/api/health`
- QR Expo Go: lihat bagian [Mobile](#d-mobile-qr-expo-go-dan-apk)
- Desain UI/UX (Figma-style canvas): 
- Design system KELIR: 

---

## Fitur

### Peran pengguna

| Peran | Yang bisa dilakukan |
| --- | --- |
| **Tamu** | Melihat Home, Explore, detail, ulasan, dan trailer. Harus masuk untuk menonton. |
| **Terdaftar (Gratis)** | Menonton judul dan episode gratis, menyimpan favorit, daftar tonton, riwayat, koleksi sendiri, menulis ulasan dan rating, mengubah profil. |
| **Premium** | Semua hak akun Gratis, ditambah semua judul dan episode Premium. Premium adalah *hak akses* yang menempel di akun, bukan peran terpisah. |
| **Admin** | Dashboard, CRUD konten (termasuk episode), kurasi (unggulan dan Pilihan KELIR), kelola pengguna dan langganan, moderasi ulasan, riwayat pembayaran. Hanya di web. |

### Navigasi utama

**Home · Explore · Watch · Collection · Profile**, sama di web dan mobile.

- **Home**: Hero dengan tombol *Tonton Sekarang*, lalu *Lanjutkan Menonton*, *Trending di Nusantara*, *Jelajahi Cerita* (per wilayah), *Pilihan KELIR* (dengan catatan kurator), dan *Konten Premium*. Untuk pengguna yang masuk ada rekomendasi dari genre dan wilayah favorit.
- **Explore**: pencarian (judul, judul asli, kreator, pemeran, genre, album, detail daerah), filter wilayah, jenis, genre, bahasa, akses, asal (Indonesia/internasional), rentang tahun, rating minimal, punya trailer, dan urutan (populer, rating, terbaru, baru ditambahkan, judul).
- **Watch**: tontonan yang sedang berjalan dan pemutar video. Akses divalidasi di server sebelum URL video diberikan.
- **Collection**: Favorit, Tonton nanti, Riwayat, dan koleksi buatan sendiri.
- **Profile**: warna foto profil, nama, bio, genre dan wilayah favorit, tema terang/gelap, riwayat ulasan, status langganan, ubah kata sandi.

### Langganan

Status langganan: **FREE** (Gratis), **ACTIVE** (Premium aktif), **CANCELLED** (Dibatalkan, akses tetap sampai masa aktif habis), **EXPIRED** (Kedaluwarsa).

| Paket | Harga | Masa aktif |
| --- | --- | --- |
| Premium Bulanan | Rp49.000 | 30 hari |
| Premium Tahunan | Rp499.000 | 365 hari |

Checkout wajib mengirim `confirmSimulation: true` setelah pengguna mencentang pernyataan bahwa pembayarannya simulasi. Perpanjangan lebih awal menambah hari ke masa aktif yang tersisa. Setiap pembelian, pembatalan, dan perubahan oleh admin tercatat di koleksi `payments` dengan nomor referensi (`KLR-…`, `CNL-…`).

### Prioritas MVP dari brief

| Prioritas | Status |
| --- | --- |
| **P0**: akun dan login, katalog, detail, pemutaran dengan validasi akses, Freemium/Premium, pembayaran simulasi, favorit dan daftar tonton, ulasan dan rating, admin konten, pengguna, langganan, dan moderasi | Selesai |
| **P1**: jelajah per wilayah, koleksi buatan sendiri, filter lengkap | Selesai |
| **P2**: fitur lanjutan di brief | Belum dikerjakan, rencana pengembangan berikutnya |

---

## Struktur folder

```
kelir/
├── backend/                 REST API
│   ├── media/               klip demo milik KELIR (fallback pemutaran)
│   ├── src/
│   │   ├── app.js           susunan Express (helmet, CORS, rate limit, rute)
│   │   ├── server.js        titik masuk
│   │   ├── config.js, db.js
│   │   ├── media.js         daftar aset video demo
│   │   ├── regions.js       tujuh wilayah
│   │   ├── plans.js         paket Premium
│   │   ├── lib/             util query dan error
│   │   ├── middleware/      auth JWT, validasi zod, error handler
│   │   ├── models/          Content, User, Review, Collection, WatchProgress, Payment
│   │   ├── routes/          auth, home, contents, me, collections, subscription, admin
│   │   ├── services/        logika langganan
│   │   ├── scripts/         verify-trailers.js
│   │   └── seed/            catalog.js (42 judul), data.js (akun, ulasan, dll.), seed.js
│   └── tests/api.test.js    19 tes API (node:test + supertest)
├── web/                     React + Vite
│   └── src/
│       ├── api.js           klien API
│       ├── auth/            AuthContext
│       ├── components/      Navbar, ContentCard, Artwork, ui.jsx, …
│       ├── pages/           Home, Explore, Watch, Detail, Player, Collection, Profile, Premium, Login, Register, admin/*
│       └── styles/          tokens.css (dari design system), app.css
├── mobile/                  Expo
│   ├── App.js               font, tab bar, stack navigator
│   └── src/                 theme.js, api.js, components/, screens/
└── docs/screenshots/        tangkapan layar web dan mobile
```

---

## Menjalankan di laptop

Butuh **Node.js 20 atau lebih baru** dan MongoDB (lokal atau MongoDB Atlas).

### 1. Backend

```bash
cd backend
cp .env.example .env
# isi MONGODB_URI dan JWT_SECRET di .env
npm install
npm run seed      # isi database: 42 judul, 6 akun, ulasan, koleksi, progres
npm run dev       # API di http://localhost:4000
```

Cek di browser: http://localhost:4000/api/health

### 2. Web

```bash
cd web
cp .env.example .env.local    # VITE_API_URL=http://localhost:4000
npm install
npm run dev                   # http://localhost:5173
```

### 3. Mobile (Expo Go)

```bash
cd mobile
cp .env.example .env
# EXPO_PUBLIC_API_URL = IP laptop, misal http://192.168.1.10:4000
# (jangan localhost: di HP, "localhost" adalah HP itu sendiri)
# atau URL backend yang sudah di-deploy
npm install
npx expo start
```

Pindai QR yang muncul dengan aplikasi **Expo Go** (Android) atau kamera (iOS). HP dan laptop harus satu jaringan Wi-Fi, atau pakai `npx expo start --tunnel`.

### 4. Tes API

```bash
cd backend
npm test
```

Tes memakai database terpisah (`kelir_test`, bisa diganti lewat `MONGODB_URI`) dan mencakup: daftar/masuk, validasi input, filter katalog, gerbang Premium (401/403), checkout simulasi, pembatalan, ulasan, koleksi, progres tontonan, aturan dasar wilayah, dan proteksi rute admin.

### Akun demo (dibuat oleh `npm run seed`)

| Akun | Email | Kata sandi | Status |
| --- | --- | --- | --- |
| Sekar Demo | `demo@kelir.app` | `demo12345` | Premium Tahunan aktif |
| Bayu Gratis | `gratis@kelir.app` | `gratis12345` | Gratis |
| Admin KELIR | `admin@kelir.app` | `admin12345`, atau nilai `SEED_ADMIN_PASSWORD` | Admin |
| Alya Rahma | `alya@kelir.app` | `alya12345` | Premium Bulanan aktif |
| Bima Pratama | `bima@kelir.app` | `bima12345` | Kedaluwarsa |
| Citra Lestari | `citra@kelir.app` | `citra12345` | Gratis |
| Bobby | `bobby@kelir.com` | `bobby12345` | Gratis |
| Snape | `snape@kelir.com` | `snape12345` | Premium Tahunan aktif |

**Untuk deploy publik, isi `SEED_ADMIN_PASSWORD` sebelum menjalankan seed**, supaya akun admin tidak memakai kata sandi bawaan yang tertulis di README ini.

---

## Deploy gratis

Urutannya: database → backend → web → mobile.

### A. Database: MongoDB Atlas (M0, gratis)

1. Daftar di https://www.mongodb.com/cloud/atlas dan buat cluster **M0 (Free)**.
2. **Database Access** → buat user dan password.
3. **Network Access** → tambahkan `0.0.0.0/0` agar server Render bisa terhubung.
4. **Connect → Drivers** → salin connection string dan tambahkan nama database:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/kelir`
5. Isi data dari laptop:

```bash
cd backend
# MONGODB_URI di .env = connection string Atlas
# SEED_ADMIN_PASSWORD di .env = kata sandi admin yang kuat
npm run seed
```

### B. Backend: Render (gratis)

1. Upload project ke GitHub (file `.env` sudah diabaikan oleh `.gitignore`).
2. Di https://render.com → **New → Web Service** → pilih repo.
3. **Root Directory** `backend`, **Build Command** `npm install`, **Start Command** `npm start`, **Instance Type** Free.
4. **Environment variables**:
   - `MONGODB_URI` = connection string Atlas
   - `JWT_SECRET` = string acak panjang: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
   - `NODE_ENV` = `production`
   - `CORS_ORIGINS` = `*` dulu, nanti ganti dengan URL web dari Vercel
5. Buka `https://NAMA-APP.onrender.com/api/health`.

Server gratis Render tidur bila tidak dipakai, jadi request pertama bisa butuh sekitar 1 menit. Buka URL health sebelum demo.

### C. Web: Vercel (gratis)

1. Di https://vercel.com → **Add New → Project** → pilih repo.
2. **Root Directory** `web`, framework **Vite** (terdeteksi otomatis).
3. **Environment Variable**: `VITE_API_URL` = `https://NAMA-APP.onrender.com`
4. Deploy. `vercel.json` mengarahkan semua path ke `index.html`, jadi refresh di `/content/...` tidak 404. (Untuk Netlify sudah ada `public/_redirects`.)
5. Kembali ke Render dan ubah `CORS_ORIGINS` menjadi URL Vercel, misal `https://kelir.vercel.app`.

### D. Mobile: QR Expo Go dan APK

Isi `EXPO_PUBLIC_API_URL` di `mobile/.env` dengan URL Render, lalu pilih salah satu:

- **QR Expo Go cepat (laptop harus menyala):** `npx expo start --tunnel`, lalu screenshot QR-nya.
- **QR permanen lewat EAS Update:**

```bash
cd mobile
npx eas-cli@latest login
npx eas-cli@latest update:configure
npx eas-cli@latest update --branch preview --message "KELIR v1"
```

  Buka project di https://expo.dev, pilih update tersebut, lalu pakai QR *Preview* untuk dibuka di Expo Go.
- **APK Android:** ganti `EXPO_PUBLIC_API_URL` di `mobile/eas.json` dengan URL Render, lalu `npx eas-cli@latest build -p android --profile preview`. EAS memberi link unduhan `.apk` setelah build selesai.

---

## REST API

Basis URL: `/api`. Respons JSON. Rute bertanda 🔒 butuh header `Authorization: Bearer <token>`; 🛡️ khusus admin.

| Metode | Path | Keterangan |
| --- | --- | --- |
| GET | `/health` | Status server |
| POST | `/auth/register` | Daftar (nama, email, kata sandi ≥ 8) |
| POST | `/auth/login` | Masuk, mengembalikan token JWT |
| GET | `/auth/me` 🔒 | Pengguna saat ini dan status langganan |
| GET | `/home` | Data Home (hero, trending, wilayah, pilihan, premium; rekomendasi bila masuk) |
| GET | `/contents` | Katalog dengan filter: `q`, `type`, `region`, `genre`, `category`, `language`, `access`, `origin`, `yearFrom`, `yearTo`, `minRating`, `hasTrailer`, `pick`, `sort`, `page`, `limit` |
| GET | `/contents/filters` | Daftar nilai filter yang tersedia |
| GET | `/contents/regions` | Tujuh wilayah beserta jumlah judul |
| GET | `/contents/:idOrSlug` | Detail konten (tanpa URL video) |
| GET | `/contents/:id/related` | Judul serupa |
| GET | `/contents/:id/reviews` | Ulasan yang tidak disembunyikan |
| POST | `/contents/:id/reviews` 🔒 | Buat atau ubah ulasan sendiri (rating 1–5, komentar ≤ 1000) |
| DELETE | `/contents/:id/reviews/me` 🔒 | Hapus ulasan sendiri |
| GET | `/contents/:id/play?episode=n` | Validasi akses lalu beri sumber video. 401 `AUTH_REQUIRED` untuk tamu, 403 `PREMIUM_REQUIRED` bila belum Premium |
| PATCH | `/me` 🔒 | Ubah profil (nama, warna avatar, bio, genre dan wilayah favorit) |
| POST | `/me/password` 🔒 | Ubah kata sandi |
| GET | `/me/library` 🔒 | Favorit, daftar tonton, riwayat |
| PUT / DELETE | `/me/library/:list/:contentId` 🔒 | Tambah/hapus dari `favorites`, `watchlist`, `watched` |
| GET | `/me/reviews` 🔒 | Riwayat ulasan dan rating |
| GET | `/me/progress` 🔒 | Lanjutkan Menonton |
| PUT / DELETE | `/me/progress/:contentId` 🔒 | Simpan/hapus posisi tontonan (≥ 90% dianggap selesai) |
| GET | `/me/recommendations` 🔒 | Rekomendasi dari preferensi |
| GET / POST | `/collections` 🔒 | Daftar / buat koleksi |
| GET / PATCH / DELETE | `/collections/:id` 🔒 | Detail / ubah / hapus koleksi |
| PUT / DELETE | `/collections/:id/items/:contentId` 🔒 | Tambah/hapus judul di koleksi |
| GET | `/subscription/plans` | Paket Premium |
| GET | `/subscription` 🔒 | Status dan riwayat pembayaran |
| POST | `/subscription/checkout` 🔒 | Pembayaran simulasi `{ plan, confirmSimulation: true }` |
| POST | `/subscription/cancel` 🔒 | Batalkan (akses tetap sampai masa aktif habis) |
| GET | `/admin/stats` 🛡️ | Angka dashboard |
| GET / POST | `/admin/contents` 🛡️ | Daftar (termasuk draf) / tambah konten |
| GET / PATCH / DELETE | `/admin/contents/:id` 🛡️ | Detail / ubah / hapus konten (hapus ikut menghapus ulasan, progres, dan isi koleksi terkait) |
| GET | `/admin/users` 🛡️ | Daftar pengguna |
| PATCH | `/admin/users/:id` 🛡️ | Ubah peran atau status (admin tidak bisa menurunkan atau menangguhkan dirinya sendiri) |
| PATCH | `/admin/users/:id/subscription` 🛡️ | Atur langganan pengguna |
| GET | `/admin/payments` 🛡️ | Riwayat pembayaran |
| GET | `/admin/reviews` 🛡️ | Semua ulasan |
| PATCH / DELETE | `/admin/reviews/:id` 🛡️ | Sembunyikan (dengan alasan) / hapus ulasan |

Error memakai format `{ "error": { "message": "pesan dalam Bahasa Indonesia", "code"?: "PREMIUM_REQUIRED", "fields"?: [{ "field": "email", "message": "..." }] } }`.

---

## Struktur database (MongoDB)

| Koleksi | Isi utama | Relasi dan indeks |
| --- | --- | --- |
| `contents` | `slug`, `type` (film/series/documentary/music), `title`, `originalTitle`, `year`, `genres`, `synopsis`, `creator`, `cast`, `durationMinutes`, `language`, `country`, `region`, `regionDetail`, `regionBasis`, `access` (free/premium), `trailerYoutubeId`, `posterUrl`, `art`, `playback`, `episodes[]` (masing-masing dengan `access` dan `playback`), `featured`, `editorPick`, `editorNote`, `published`, `viewCount`, `ratingAvg`, `ratingCount` | `slug` unik; indeks pada `type`, `region`, `access`, `published`, `ratingAvg` |
| `users` | `name`, `email`, `passwordHash`, `role` (user/admin), `status` (active/suspended), `avatar`, `bio`, `favoriteGenres`, `favoriteRegions`, `favorites[]`, `watchlist[]`, `watched[]`, `subscription` (`plan`, `status`, `startedAt`, `expiresAt`, `cancelledAt`) | `email` unik; daftar pustaka berisi ObjectId ke `contents` |
| `reviews` | `content`, `user`, `rating` 1–5, `comment`, `hidden`, `hiddenReason` | unik per (`content`, `user`); rata-rata rating dihitung ulang tanpa ulasan tersembunyi |
| `collections` | `user`, `name`, `description`, `items[]` | `items` berisi ObjectId ke `contents` |
| `watchprogresses` | `user`, `content`, `episode`, `positionSeconds`, `durationSeconds`, `completed` | unik per (`user`, `content`) |
| `payments` | `user`, `kind` (purchase/cancel/admin_update), `plan`, `amount`, `currency`, `method` (`SIMULASI`), `status`, `reference`, `periodStart`, `periodEnd` | indeks pada `user` |

Brief produk menyebut *relational database*, sedangkan tugas mewajibkan MongoDB. KELIR memakai MongoDB dan menjaga relasi dengan ObjectId, indeks unik, dan validasi di sisi server. Tabel di atas bisa dipetakan langsung ke tabel relasional bila nanti dibutuhkan.

---

## Wilayah: metadata, bukan tebakan

Tujuh wilayah: Sumatra, Jawa, Kalimantan, Sulawesi, Bali & Nusa Tenggara, Maluku, Papua.

- Setiap judul yang diberi `region` wajib punya `regionBasis`, yaitu dasar penentuan daerah (latar cerita, lokasi syuting, atau asal lagu), minimal 10 karakter. Server menolak simpan bila kosong.
- `regionDetail` menyimpan lokasi yang lebih rinci, misal *Sumba, Nusa Tenggara Timur*.
- Judul tanpa dasar daerah yang jelas (misal album pop nasional) dibiarkan tanpa wilayah. Judul itu tetap muncul di pencarian dan filter lain, hanya tidak masuk peta wilayah.
- Karya internasional diberi `country` dan masuk filter *Asal: Internasional*.

---

## Video, trailer, dan artwork

KELIR tidak memegang hak atas judul-judul di katalog. Karena itu:

- **Pemutaran memakai aset demo berlisensi terbuka**, dan pemutar menampilkan kreditnya: film Blender Foundation (*Sintel*, *Tears of Steel*, *Big Buck Bunny* dengan CC BY 3.0, *Elephants Dream* dengan CC BY 2.5), diambil dari bucket contoh publik Google.
- Bila sumber itu gagal dimuat, pemutar otomatis memakai **klip demo buatan KELIR** di `backend/media/` (dibuat khusus untuk proyek ini, termasuk musik pentatoniknya).
- **Trailer** memakai embed resmi YouTube lewat `trailerYoutubeId`. Jalankan `npm run verify:trailers` di backend untuk mengecek apakah setiap ID masih bisa diputar.
- **Poster**: admin bisa mengisi `posterUrl` dengan poster resmi (URL https). Tanpa poster resmi, aplikasi menggambar artwork sementara dari palet KELIR, sesuai pedoman "gunakan poster asli atau artwork resmi".
- URL video tidak pernah ada di respons katalog atau detail. URL hanya diberikan oleh `/contents/:id/play` setelah akses divalidasi.

---

## Keamanan

- Kata sandi di-hash dengan **bcrypt**. Login memakai **JWT** dengan masa berlaku dari `JWT_EXPIRES_IN`.
- Semua input divalidasi dengan **zod**. Pesan error berbahasa Indonesia dan menjelaskan cara memperbaikinya.
- **Mongoose `sanitizeFilter`** menolak operator query dari input pengguna (mencegah NoSQL injection). Operator yang dibuat server ditandai `mongoose.trusted`. Teks pencarian di-escape sebelum dipakai sebagai regex.
- **helmet** untuk header keamanan, **CORS** dibatasi lewat `CORS_ORIGINS`, **rate limit** 20 percobaan per 15 menit di rute auth, dan body JSON dibatasi 200 KB.
- Akun yang ditangguhkan tidak bisa masuk. Rute admin dicek di server, tidak hanya disembunyikan di UI.
- URL poster wajib https, ID YouTube dicek formatnya, dan episode ganda ditolak.
- File `.env` tidak ikut zip maupun repo. Gunakan `.env.example` sebagai acuan.

---

## Catatan keputusan

- Bahasa UI: Bahasa Indonesia, dengan label navigasi dari brief (Home, Explore, Watch, Collection, Profile).
- Katalog awal berisi 42 judul: 29 dari Indonesia dan 13 internasional.
- Admin hanya tersedia di web. Aplikasi mobile ditujukan untuk penonton.
- Fitur P2 di brief belum dikerjakan dan menjadi pengembangan berikutnya.
