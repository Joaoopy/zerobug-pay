// ============================================================
// VERIFICAÇÃO DE PERMISSÕES (STAFF)
// ============================================================

const config = require('../config');

function ehStaff(membro) {
  if (!config.CARGOS_STAFF || config.CARGOS_STAFF.length === 0) return false;
  return membro.roles.cache.some((cargo) => config.CARGOS_STAFF.includes(cargo.id));
}

module.exports = { ehStaff };
