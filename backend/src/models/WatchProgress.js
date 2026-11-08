import mongoose from 'mongoose';

/** Where a user stopped in a title (and which episode), for "Lanjutkan Menonton". */
const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
    episode: { type: Number, default: null },
    positionSeconds: { type: Number, default: 0, min: 0 },
    durationSeconds: { type: Number, default: 0, min: 0 },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

progressSchema.index({ user: 1, content: 1 }, { unique: true });
progressSchema.index({ user: 1, updatedAt: -1 });

progressSchema.methods.toPublic = function toPublic() {
  const ratio = this.durationSeconds ? Math.min(1, this.positionSeconds / this.durationSeconds) : 0;
  return {
    contentId: this.content?._id ? this.content._id.toString() : this.content.toString(),
    content: this.content?.toCard ? this.content.toCard() : undefined,
    episode: this.episode,
    positionSeconds: Math.round(this.positionSeconds),
    durationSeconds: Math.round(this.durationSeconds),
    progress: Math.round(ratio * 1000) / 1000,
    remainingSeconds: Math.max(0, Math.round(this.durationSeconds - this.positionSeconds)),
    completed: this.completed,
    updatedAt: this.updatedAt,
  };
};

export const WatchProgress = mongoose.model('WatchProgress', progressSchema);
