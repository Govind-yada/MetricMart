require('dotenv').config();
const connectDB = require('./config/db');
const createApp = require('./app');

const PORT = process.env.PORT || 4000;

async function main() {
  await connectDB();
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`[server] Listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('[server] Fatal startup error:', err);
  process.exit(1);
});
