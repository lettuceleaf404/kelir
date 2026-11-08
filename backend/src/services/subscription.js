import crypto from 'node:crypto';
import { Payment } from '../models/Payment.js';
import { PLANS } from '../plans.js';

const DAY = 24 * 60 * 60 * 1000;
const reference = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

/**
 * Simulated checkout. If Premium is still running, the new period is added on top of it,
 * so renewing early never loses paid days.
 */
export async function purchase(user, planKey, now = new Date()) {
  const plan = PLANS[planKey];
  const current = user.currentSubscription(now);
  const start = current.isPremium ? new Date(current.expiresAt) : now;
  const end = new Date(start.getTime() + plan.days * DAY);

  user.subscription = {
    status: 'ACTIVE',
    plan: plan.key,
    startedAt: current.isPremium ? current.startedAt : now,
    expiresAt: end,
    cancelledAt: null,
  };
  await user.save();
  const payment = await Payment.create({
    user: user._id,
    kind: 'purchase',
    plan: plan.key,
    amount: plan.price,
    status: 'PAID',
    reference: reference('KLR'),
    periodStart: start,
    periodEnd: end,
    note: 'Pembayaran simulasi, tidak ada transaksi nyata.',
  });
  return payment;
}

/** Cancelling stops renewal; Premium stays until the paid period ends. */
export async function cancel(user, now = new Date()) {
  const current = user.currentSubscription(now);
  user.subscription.status = 'CANCELLED';
  user.subscription.cancelledAt = now;
  await user.save();
  return Payment.create({
    user: user._id,
    kind: 'cancel',
    plan: current.plan,
    reference: reference('CNL'),
    periodEnd: current.expiresAt,
    note: 'Perpanjangan otomatis dihentikan.',
  });
}

/** Admin override (grant, extend, revoke). Recorded in the same history. */
export async function adminUpdate(user, { status, plan, expiresAt }, admin, now = new Date()) {
  const sub = user.subscription;
  sub.status = status;
  if (status === 'FREE') {
    Object.assign(sub, { plan: null, startedAt: null, expiresAt: null, cancelledAt: null });
  } else {
    sub.plan = plan ?? sub.plan ?? 'monthly';
    sub.startedAt = sub.startedAt ?? now;
    if (expiresAt) sub.expiresAt = expiresAt;
    if (status === 'ACTIVE' && (!sub.expiresAt || sub.expiresAt <= now)) sub.expiresAt = new Date(now.getTime() + PLANS[sub.plan].days * DAY);
    if (status === 'EXPIRED' && (!sub.expiresAt || sub.expiresAt > now)) sub.expiresAt = now;
    if (status === 'CANCELLED') sub.cancelledAt = now;
    if (status === 'ACTIVE') sub.cancelledAt = null;
  }
  user.markModified('subscription');
  await user.save();
  return Payment.create({
    user: user._id,
    kind: 'admin_update',
    plan: sub.plan,
    reference: reference('ADM'),
    periodEnd: sub.expiresAt,
    note: `Diubah admin ${admin.email} menjadi ${status}.`,
  });
}
