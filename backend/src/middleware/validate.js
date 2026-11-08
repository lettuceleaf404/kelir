import mongoose from 'mongoose';
import { HttpError } from './errors.js';

/** Parse req.body with a zod schema and replace it with the clean result. */
export const validateBody = (schema) => (req, res, next) => {
  req.body = schema.parse(req.body ?? {});
  next();
};

/** Ensure the named route params are valid MongoDB ObjectIds. */
export const validateObjectIds =
  (...names) =>
  (req, res, next) => {
    for (const name of names) {
      if (!mongoose.isValidObjectId(req.params[name])) {
        throw new HttpError(400, `${name} tidak valid.`);
      }
    }
    next();
  };
