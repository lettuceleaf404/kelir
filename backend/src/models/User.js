import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['user', 'admin'];
export const SUB_STATUSES = ['FREE', 'ACTIVE', 'EXPIRED', 'CANCELLED'];
export const AVATARS = ['coral', 'mango', 'turquoise', 'lilac', 'ink', 'peach', 'mint', 'lavender'];

const subscriptionSchema = new mongoose.Schema(
  {
    status: { type: String, enum: SUB_STATUSES, default: 'FREE' },
    plan: { type: String, enum: ['monthly', 'annual', null], default: null },
    startedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { _id: false },
);

const ref = { type: mongoose.Schema.Types.ObjectId, ref: 'Content' };

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'user' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    avatar: { type: String, enum: AVATARS, default: 'coral' },
    bio: { type: String, trim: true, maxlength: 160, default: '' },
    favoriteGenres: [{ type: String, trim: true }],
    favoriteRegions: [{ type: String, trim: true }],
    favorites: [ref],
    watchlist: [ref],
    watched: [ref],
    subscription: { type: subscriptionSchema, default: () => ({}) },
  },
  { timestamps: true },
);

userSchema.methods.checkPassword = function checkPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
};

/**
 * Subscription as it stands right now. ACTIVE and CANCELLED keep Premium until expiresAt
 * (cancelling stops renewal, it does not cut access short); after that the status reads EXPIRED.
 */
userSchema.methods.currentSubscription = function currentSubscription(now = new Date()) {
  const sub = this.subscription?.toObject ? this.subscription.toObject() : { ...(this.subscription || {}) };
  sub.status ||= 'FREE';
  if (['ACTIVE', 'CANCELLED'].includes(sub.status) && sub.expiresAt && sub.expiresAt <= now) sub.status = 'EXPIRED';
  sub.isPremium = ['ACTIVE', 'CANCELLED'].includes(sub.status) && Boolean(sub.expiresAt) && sub.expiresAt > now;
  return sub;
};

userSchema.methods.isPremium = function isPremium() {
  return this.currentSubscription().isPremium;
};

userSchema.methods.toPublic = function toPublic() {
  const ids = (list) => (list || []).map((id) => id.toString());
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    status: this.status,
    avatar: this.avatar,
    bio: this.bio,
    favoriteGenres: this.favoriteGenres || [],
    favoriteRegions: this.favoriteRegions || [],
    favorites: ids(this.favorites),
    watchlist: ids(this.watchlist),
    watched: ids(this.watched),
    subscription: this.currentSubscription(),
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);
