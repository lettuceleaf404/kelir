import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { config } from '../config.js';

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function notFound(req, res) {
  res.status(404).json({ error: { message: `Rute tidak ditemukan: ${req.method} ${req.originalUrl}` } });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: 'Ada isian yang belum benar.',
        fields: err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
      },
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { message: err.message, ...(err.details || {}) } });
  }
  if (Number.isInteger(err?.status) && err.status >= 400 && err.status < 500 && err.type !== 'entity.parse.failed') {
    return res.status(err.status).json({ error: { message: err.status === 404 ? 'Berkas tidak ditemukan.' : 'Permintaan tidak valid.' } });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: { message: 'Format ID tidak valid.' } });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ error: { message: 'Data ini sudah ada.' } });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'Isi permintaan bukan JSON yang valid.' } });
  }

  console.error(err);
  return res.status(500).json({
    error: {
      message: 'Terjadi kesalahan di server.',
      ...(config.isProduction ? {} : { detail: err?.message }),
    },
  });
}
