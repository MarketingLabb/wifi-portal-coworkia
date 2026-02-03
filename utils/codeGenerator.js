/**
 * Genera códigos alfanuméricos únicos para acceso WiFi
 * Formato: XXXX-XXXX (8 caracteres divididos por guión)
 */

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin caracteres ambiguos (0,O,1,I)
  let code = '';
  
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i === 3) code += '-'; // Agregar guión en la mitad
  }
  
  return code;
}

/**
 * Genera múltiples códigos únicos
 */
function generateBatch(quantity) {
  const codes = new Set();
  
  while (codes.size < quantity) {
    codes.add(generateCode());
  }
  
  return Array.from(codes);
}

/**
 * Valida formato de código
 */
function validateFormat(code) {
  const pattern = /^[A-Z2-9]{4}-[A-Z2-9]{4}$/;
  return pattern.test(code);
}

module.exports = {
  generateCode,
  generateBatch,
  validateFormat
};
