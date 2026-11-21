const fs = require('fs/promises');
const path = require('path');

const LOG_FOLDER = path.join(__dirname, '..', '..', 'logs');
const LOG_FILE = path.join(LOG_FOLDER, 'audit.log');

async function writeAuditLog(event) {
  const entry = { timestamp: new Date().toISOString(), ...event };
  const line = JSON.stringify(entry) + '\n';

  try {
    await fs.mkdir(LOG_FOLDER, { recursive: true });
    await fs.appendFile(LOG_FILE, line);
  } catch (error) {
    console.error('Could not write to audit log:', error.message);
  }
}

module.exports = { writeAuditLog };
