import mongoose from 'mongoose';

/** Record of a (simulated) subscription purchase or an admin change. No card data is ever stored. */
const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: ['purchase', 'cancel', 'admin_update'], required: true },
    plan: { type: String, enum: ['monthly', 'annual', null], default: null },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'IDR' },
    method: { type: String, default: 'SIMULASI' },
    status: { type: String, enum: ['PAID', 'NONE'], default: 'NONE' },
    reference: { type: String, required: true },
    periodStart: { type: Date, default: null },
    periodEnd: { type: Date, default: null },
    note: { type: String, default: null },
  },
  { timestamps: true },
);

paymentSchema.methods.toPublic = function toPublic() {
  const user = this.user && this.user.email ? this.user : null;
  return {
    id: this._id.toString(),
    user: user ? { id: user._id.toString(), name: user.name, email: user.email } : { id: this.user.toString() },
    kind: this.kind,
    plan: this.plan,
    amount: this.amount,
    currency: this.currency,
    method: this.method,
    status: this.status,
    reference: this.reference,
    periodStart: this.periodStart,
    periodEnd: this.periodEnd,
    note: this.note,
    createdAt: this.createdAt,
  };
};

export const Payment = mongoose.model('Payment', paymentSchema);
