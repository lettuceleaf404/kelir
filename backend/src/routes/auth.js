import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { User } from '../models/User.js';
import { REGION_KEYS } from '../regions.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { HttpError } from '../middleware/errors.js';
import { config } from '../config.js';

const router = Router();

// Slow down password guessing: 20 attempts per 15 minutes per IP (relaxed in tests).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.nodeEnv === 'test' ? 1000 : 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { message: 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.' } },
});

export const passwordRule = z
  .string()
  .min(8, 'Kata sandi minimal 8 karakter.')
  .max(72, 'Kata sandi maksimal 72 karakter.')
  .regex(/[A-Za-z]/, 'Kata sandi harus mengandung huruf.')
  .regex(/[0-9]/, 'Kata sandi harus mengandung angka.');

const emailRule = z.string().trim().toLowerCase().pipe(z.email('Format email belum benar.'));

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter.').max(60, 'Nama maksimal 60 karakter.'),
  email: emailRule,
  password: passwordRule,
  favoriteGenres: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  favoriteRegions: z.array(z.enum(REGION_KEYS)).max(7).optional(),
});

const loginSchema = z.object({
  email: emailRule,
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
});

router.post('/register', authLimiter, validateBody(registerSchema), async (req, res) => {
  const { name, email, password, favoriteGenres = [], favoriteRegions = [] } = req.body;
  if (await User.exists({ email })) throw new HttpError(409, 'Email ini sudah terdaftar. Coba masuk.');

  const user = await User.create({
    name,
    email,
    passwordHash: await User.hashPassword(password),
    favoriteGenres,
    favoriteRegions,
  });
  res.status(201).json({ token: signToken(user), user: user.toPublic() });
});

router.post('/login', authLimiter, validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');

  // One message for unknown email and wrong password, so accounts cannot be probed.
  if (!user || !(await user.checkPassword(password))) throw new HttpError(401, 'Email atau kata sandi salah.');
  if (user.status === 'suspended') throw new HttpError(403, 'Akun ini sedang dinonaktifkan.', { code: 'ACCOUNT_SUSPENDED' });

  res.json({ token: signToken(user), user: user.toPublic() });
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user.toPublic() });
});

export default router;
