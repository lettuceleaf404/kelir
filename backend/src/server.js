import { createApp } from './app.js';
import { config } from './config.js';
import { connectDatabase } from './db.js';

async function start() {
  await connectDatabase(config.mongoUri);
  console.log('Connected to MongoDB');

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`KELIR API running on http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
