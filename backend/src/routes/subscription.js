import { Router } from 'express';
import { z } from 'zod';
import { Payment } from '../models/Payment.js';
import { PLANS } from '../plans.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { HttpError } from '../middleware/errors.js';
import { cancel, purchase } from '../services/subscription.js';

const router = Router();

/** GET /api/subscription/plans: public price list. */
router.get('/plans', (req, res) => {
  res.json({ plans: Object.values(PLANS), simulated: true });
});

router.use(requireAuth);

/** GET /api/subscription: current status and history. */
router.get('/', async (req, res) => {
  const history = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20);
  res.json({ subscription: req.user.currentSubscription(), plans: Object.values(PLANS), history: history.map((p) => p.toPublic()) });
});

const checkoutSchema = z.object({
  plan: z.enum(Object.keys(PLANS), 'Pilih paket Bulanan atau Tahunan.'),
  // The client must show that this is a simulation and send this flag after the user confirms.
  confirmSimulation: z.literal(true, 'Konfirmasi bahwa ini pembayaran simulasi.'),
});

/** POST /api/subscription/checkout: simulated payment, activates or extends Premium. */
router.post('/checkout', validateBody(checkoutSchema), async (req, res) => {
  const payment = await purchase(req.user, req.body.plan);
  res.status(201).json({ subscription: req.user.currentSubscription(), payment: payment.toPublic(), user: req.user.toPublic() });
});

/** POST /api/subscription/cancel */
router.post('/cancel', async (req, res) => {
  if (req.user.currentSubscription().status !== 'ACTIVE') throw new HttpError(400, 'Tidak ada langganan aktif untuk dibatalkan.');
  const record = await cancel(req.user);
  res.json({ subscription: req.user.currentSubscription(), record: record.toPublic(), user: req.user.toPublic() });
});

export default router;
