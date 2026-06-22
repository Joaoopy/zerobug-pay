// ============================================================
// EVENTO: ready
// ============================================================

const { Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`✅ ${client.user.tag} está online e operacional.`);
    console.log(`📊 Servidores conectados: ${client.guilds.cache.size}`);

    client.user.setPresence({
      activities: [{ name: 'ZeroBug Pay | Financeiro' }],
      status: 'online',
    });
  },
};
