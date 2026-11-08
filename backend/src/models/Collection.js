import mongoose from 'mongoose';

/** A user's own named collection ("Koleksi kustom"). */
const collectionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 200, default: '' },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
  },
  { timestamps: true },
);

collectionSchema.methods.toPublic = function toPublic() {
  const items = (this.items || []).map((c) => (c && c.toCard ? c.toCard() : c.toString()));
  return {
    id: this._id.toString(),
    name: this.name,
    description: this.description,
    itemCount: items.length,
    items,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Collection = mongoose.model('Collection', collectionSchema);
