import mongoose from 'mongoose';
import { Content } from './Content.js';

const reviewSchema = new mongoose.Schema(
  {
    content: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000, default: '' },
    // Moderation: hidden reviews are kept for the record but left out of public lists and averages.
    hidden: { type: Boolean, default: false, index: true },
    hiddenReason: { type: String, default: null },
  },
  { timestamps: true },
);

// One review (and so one active rating) per user per content item
reviewSchema.index({ content: 1, user: 1 }, { unique: true });

/** Recalculate the visible average rating and store it on the content for cheap sorting. */
reviewSchema.statics.refreshContentRating = async function refreshContentRating(contentId) {
  const reviews = await this.find({ content: contentId, hidden: false }).select('rating').lean();
  const ratingCount = reviews.length;
  const ratingAvg = ratingCount ? reviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount : 0;
  await Content.updateOne({ _id: contentId }, { $set: { ratingAvg, ratingCount } });
  return { ratingAvg: Math.round(ratingAvg * 10) / 10, ratingCount };
};

reviewSchema.methods.toPublic = function toPublic() {
  const user = this.user && this.user.name ? this.user : null;
  const content = this.content && this.content.title ? this.content : null;
  return {
    id: this._id.toString(),
    contentId: content ? content._id.toString() : this.content.toString(),
    content: content ? { id: content._id.toString(), slug: content.slug, title: content.title, type: content.type, art: content.art, posterUrl: content.posterUrl } : undefined,
    rating: this.rating,
    comment: this.comment,
    user: user ? { id: user._id.toString(), name: user.name, avatar: user.avatar } : { id: this.user.toString() },
    hidden: this.hidden,
    hiddenReason: this.hiddenReason,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Review = mongoose.model('Review', reviewSchema);
