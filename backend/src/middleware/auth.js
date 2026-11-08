import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../models/User.js';
import { HttpError } from './errors.js';

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

async function loadUserFromRequest(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new HttpError(401, 'Sesi kamu sudah berakhir. Silakan masuk lagi.', { code: 'SESSION_EXPIRED' });
  }
  const user = await User.findById(payload.sub);
  if (!user) throw new HttpError(401, 'Akun tidak ditemukan. Silakan masuk lagi.', { code: 'SESSION_EXPIRED' });
  if (user.status === 'suspended') throw new HttpError(403, 'Akun ini sedang dinonaktifkan.', { code: 'ACCOUNT_SUSPENDED' });
  return user;
}

/** Rejects the request unless a valid Bearer token for an active account is present. */
export async function requireAuth(req, res, next) {
  const user = await loadUserFromRequest(req);
  if (!user) throw new HttpError(401, 'Masuk dulu untuk melanjutkan.', { code: 'AUTH_REQUIRED' });
  req.user = user;
  next();
}

/** Attaches req.user when a valid token is present, but never rejects. */
export async function optionalAuth(req, res, next) {
  try {
    req.user = await loadUserFromRequest(req);
  } catch {
    req.user = null;
  }
  next();
}

/** Admin-only routes. Run after requireAuth. */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') throw new HttpError(403, 'Halaman ini khusus admin.', { code: 'ADMIN_ONLY' });
  next();
}
