const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Obtiene la dirección MAC de un dispositivo dado su IP
 * @param {string} ipAddress - Dirección IP del cliente
 * @returns {Promise<string|null>} - Dirección MAC o null si no se encuentra
 */
async function getMacAddress(ipAddress) {
  try {
    // Ejecutar comando arp para obtener la tabla ARP
    const { stdout } = await execAsync(`arp -n ${ipAddress}`);
    
    // Buscar la MAC en la salida (formato: aa:bb:cc:dd:ee:ff o aa-bb-cc-dd-ee-ff)
    const macMatch = stdout.match(/([0-9a-f]{1,2}[:-]){5}([0-9a-f]{1,2})/i);
    
    if (macMatch) {
      return macMatch[0].toLowerCase();
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error obteniendo MAC para IP ${ipAddress}:`, error.message);
    return null;
  }
}

/**
 * Obtiene la IP del cliente desde el objeto request
 * @param {object} req - Objeto request de Express
 * @returns {string} - Dirección IP del cliente
 */
function getClientIP(req) {
  // Intentar obtener la IP real del cliente (considerando proxies)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Obtener IP directa
  return req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.connection.socket.remoteAddress;
}

/**
 * Obtiene IP y MAC del cliente
 * @param {object} req - Objeto request de Express
 * @returns {Promise<{ip: string, mac: string|null}>}
 */
async function getClientInfo(req) {
  const ip = getClientIP(req);
  
  // Limpiar IPv6 localhost (::1 o ::ffff:192.168.x.x)
  let cleanIP = ip.replace('::ffff:', '');
  
  const mac = await getMacAddress(cleanIP);
  
  return { ip: cleanIP, mac };
}

module.exports = {
  getMacAddress,
  getClientIP,
  getClientInfo
};
