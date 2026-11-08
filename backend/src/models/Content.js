import mongoose from 'mongoose';
import { REGION_KEYS, regionName } from '../regions.js';

export const CONTENT_TYPES = ['film', 'series', 'documentary', 'music'];
export const VIDEO_TYPES = ['film', 'series', 'documentary'];
export const ACCESS_TYPES = ['free', 'premium'];
export const ART_TONES = ['coral', 'mango', 'turquoise', 'lilac', 'ink'];

const playbackSchema = new mongoose.Schema(
  {
    src: { type: String, required: true },
    fallbackSrc: { type: String, default: null },
    credit: { type: String, default: '' },
    isDemo: { type: Boolean, default: true },
  },
  { _id: false },
);

const episodeSchema = new mongoose.Schema(
  {
    season: { type: Number, default: 1, min: 1 },
    number: { type: Number, required: true, min: 1 },
    title: { type: String, required: true, trim: true },
    synopsis: { type: String, default: '' },
    durationMinutes: { type: Number, default: null },
    access: { type: String, enum: ACCESS_TYPES, default: 'premium' },
    playback: { type: playbackSchema, required: true },
  },
  { _id: false },
);

const contentSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    type: { type: String, required: true, enum: CONTENT_TYPES, index: true },
    title: { type: String, required: true, trim: true },
    originalTitle: { type: String, default: null },
    year: { type: Number, default: null }, // null for traditional songs
    genres: [{ type: String, trim: true }],
    categories: [{ type: String, trim: true }], // e.g. "budaya"
    synopsis: { type: String, required: true },
    creator: { type: String, required: true }, // director, show creator, or artist
    cast: [{ type: String, trim: true }],
    durationMinutes: { type: Number, default: null },
    language: { type: String, default: null },
    country: { type: String, default: null },
    network: { type: String, default: null },
    album: { type: String, default: null },
    // Region is only set when there is a stated basis for it (setting, filming location, song origin).
    region: { type: String, enum: [...REGION_KEYS, null], default: null, index: true },
    regionDetail: { type: String, default: null },
    regionBasis: { type: String, default: null },
    access: { type: String, enum: ACCESS_TYPES, default: 'free', index: true },
    trailerYoutubeId: { type: String, default: null },
    officialWatch: { type: new mongoose.Schema({ label: String, url: String }, { _id: false }), default: null },
    posterUrl: { type: String, default: null }, // official artwork added by an admin
    art: { type: String, enum: ART_TONES, default: 'coral' }, // palette for generated artwork
    playback: { type: playbackSchema, default: null }, // films, documentaries, music
    episodes: { type: [episodeSchema], default: [] }, // series (and documentary series)
    featured: { type: Boolean, default: false }, // hero on Home
    editorPick: { type: Boolean, default: false }, // "Pilihan KELIR"
    editorNote: { type: String, default: null },
    published: { type: Boolean, default: true, index: true },
    viewCount: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

contentSchema.index({ genres: 1 });
contentSchema.index({ ratingAvg: -1 });
contentSchema.index({ viewCount: -1 });

const youtubeSearch = (content) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${content.title} ${content.type === 'music' ? `${content.creator} official` : 'official trailer'}`,
  )}`;

/** Card-sized view for lists. */
contentSchema.methods.toCard = function toCard() {
  return {
    id: this._id.toString(),
    slug: this.slug,
    type: this.type,
    title: this.title,
    year: this.year,
    genres: this.genres,
    categories: this.categories,
    creator: this.creator,
    durationMinutes: this.durationMinutes,
    region: this.region,
    regionName: regionName(this.region),
    access: this.access,
    posterUrl: this.posterUrl,
    art: this.art,
    episodeCount: this.episodes?.length || 0,
    hasFreeEpisode: (this.episodes || []).some((e) => e.access === 'free'),
    ratingAvg: Math.round((this.ratingAvg || 0) * 10) / 10,
    ratingCount: this.ratingCount || 0,
    viewCount: this.viewCount || 0,
    featured: this.featured,
    editorPick: this.editorPick,
    editorNote: this.editorNote,
    published: this.published,
    createdAt: this.createdAt,
  };
};

/** Full view for the detail page. Playback URLs are never included: they come from the play endpoint. */
contentSchema.methods.toPublic = function toPublic() {
  return {
    ...this.toCard(),
    originalTitle: this.originalTitle,
    synopsis: this.synopsis,
    cast: this.cast,
    language: this.language,
    country: this.country,
    network: this.network,
    album: this.album,
    regionDetail: this.regionDetail,
    regionBasis: this.regionBasis,
    trailerYoutubeId: this.trailerYoutubeId,
    trailerSearchUrl: youtubeSearch(this),
    officialWatch: this.officialWatch,
    playable: Boolean(this.playback) || (this.episodes || []).length > 0,
    episodes: (this.episodes || []).map((e) => ({
      season: e.season,
      number: e.number,
      title: e.title,
      synopsis: e.synopsis,
      durationMinutes: e.durationMinutes,
      access: e.access,
    })),
  };
};

/** Admin view includes playback sources so they can be edited. */
contentSchema.methods.toAdmin = function toAdmin() {
  return {
    ...this.toPublic(),
    playback: this.playback,
    episodes: (this.episodes || []).map((e) => e.toObject()),
    updatedAt: this.updatedAt,
  };
};

export const Content = mongoose.model('Content', contentSchema);
