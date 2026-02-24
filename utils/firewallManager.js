const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const execFileAsync = promisify(execFile);

const SCRIPT_PATH = path.join(__dirname, '..', 'scripts', 'manage-firewall.sh');
const DB_PATH = path.join(__dirname, '..', 'database', 'coworkia.db');

/**
 * Sincroniza firewall con sesiones activas de la DB.
 * Estrategia unica: la base de datos define las MAC permitidas.
 * @returns {Promise<boolean>} - true si tuvo éxito
 */
async function syncFirewallWithDatabase() {
  try {
    const { stdout, stderr } = await execFileAsync('sudo', [SCRIPT_PATH, 'sync-db', DB_PATH]);
    if (stdout) console.log(stdout.trim());
    if (stderr) console.error(stderr.trim());
    return true;
  } catch (error) {
    console.error('❌ Error sincronizando firewall con DB:', error.message);
    return false;
  }
}

module.exports = {
  syncFirewallWithDatabase
};
