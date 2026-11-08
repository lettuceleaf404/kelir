import mongoose from 'mongoose';

// Reject query operators (e.g. {"$gt": ""}) that arrive inside user input,
// a common NoSQL injection vector.
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

export async function connectDatabase(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  return mongoose.connection;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
