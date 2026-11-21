require('dotenv').config();
const app = require('./app');
const pool = require('./config/database');
const queue = require('./services/queue');

const port = process.env.PORT || 3000;

async function startServer() {
  try {
    await pool.query('SELECT 1');
    console.log('Connected to MySQL');
  } catch (error) {
    console.error('Could not connect to MySQL:', error.message);
    process.exit(1);
  }

  queue
    .connectQueue()
    .then(() => console.log('Connected to Redis'))
    .catch((error) => console.error('Could not connect to Redis:', error.message));

  app.listen(port, () => {
    console.log(`MediBook API listening on http://localhost:${port}`);
  });
}

startServer();
