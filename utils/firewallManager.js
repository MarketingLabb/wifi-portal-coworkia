const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const execAsync = promisify(exec);

const SCRIPT_PATH = path.join(__dirname, '..', 'scripts', 'manage-firewall.sh');

/**
 * Permite acceso a internet para una dirección MAC
 * @param {string} macAddress - Dirección MAC del cliente
 * @returns {Promise<boolean>} - true si tuvo éxito
 */
async function allowMAC(macAddress) {
  try {
    if (!macAddress) {
      console.error('❌ MAC address vacía');
      return false;
    }
    
    const { stdout, stderr } = await execAsync(`sudo ${SCRIPT_PATH} allow ${macAddress}`);
    
    if (stdout) console.log(stdout.trim());
    if (stderr) console.error(stderr.trim());
    
    return true;
  } catch (error) {
    console.error(`❌ Error permitiendo acceso a MAC ${macAddress}:`, error.message);
    return false;
  }
}

/**
 * Bloquea acceso a internet para una dirección MAC
 * @param {string} macAddress - Dirección MAC del cliente
 * @returns {Promise<boolean>} - true si tuvo éxito
 */
async function denyMAC(macAddress) {
  try {
    if (!macAddress) {
      console.error('❌ MAC address vacía');
      return false;
    }
    
    const { stdout, stderr } = await execAsync(`sudo ${SCRIPT_PATH} deny ${macAddress}`);
    
    if (stdout) console.log(stdout.trim());
    if (stderr) console.error(stderr.trim());
    
    return true;
  } catch (error) {
    console.error(`❌ Error bloqueando acceso a MAC ${macAddress}:`, error.message);
    return false;
  }
}

/**
 * Lista todas las MACs con acceso permitido
 * @returns {Promise<string[]>} - Array de direcciones MAC
 */
async function listAllowedMACs() {
  try {
    const { stdout } = await execAsync(`sudo ${SCRIPT_PATH} list`);
    
    // Parsear salida y extraer solo las MACs
    const lines = stdout.split('\n').filter(line => line.match(/([0-9a-f]{2}[:-]){5}[0-9a-f]{2}/i));
    
    return lines;
  } catch (error) {
    console.error('❌ Error listando MACs permitidas:', error.message);
    return [];
  }
}

/**
 * Regenera las reglas del firewall basándose en la base de datos
 * @param {object} db - Instancia de la base de datos
 * @returns {Promise<boolean>} - true si tuvo éxito
 */
async function syncFirewallWithDatabase(db) {
  try {
    console.log('🔄 Sincronizando firewall con base de datos...');
    
    // Obtener todas las sesiones activas
    const activeSessions = db.prepare(`
      SELECT DISTINCT mac_address 
      FROM sessions 
      WHERE mac_address IS NOT NULL
      AND disconnected_at IS NULL 
      AND datetime(expires_at) > datetime('now')
    `).all();
    
    // Crear archivo temporal con las MACs válidas
    const fs = require('fs');
    const macs = activeSessions.map(s => s.mac_address).filter(Boolean);
    
    fs.writeFileSync('/tmp/coworkia-allowed-macs.txt', macs.join('\n') + '\n');
    
    // Regenerar reglas
    const { stdout, stderr } = await execAsync(`sudo ${SCRIPT_PATH} regenerate`);
    
    if (stdout) console.log(stdout.trim());
    if (stderr) console.error(stderr.trim());
    
    console.log(`✅ Firewall sincronizado: ${macs.length} MACs con acceso`);
    
    return true;
  } catch (error) {
    console.error('❌ Error sincronizando firewall:', error.message);
    return false;
  }
}

module.exports = {
  allowMAC,
  denyMAC,
  listAllowedMACs,
  syncFirewallWithDatabase
};
