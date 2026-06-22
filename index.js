// ============================================================
// ZEROBUG PAY — index.js
// ============================================================
// Sistema financeiro completo para Discord: cobrança Pix via
// Mercado Pago, webhook de confirmação automática, log e
// controle de status de pedidos.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const { inicializarBanco } = require('./src/database/db');
const { criarServidorWebhook } = require('./src/webhooks/mercadopago.webhook');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
client.buttons = new Collection();

// --- Carrega comandos ---
const commandsPath = path.join(__dirname, 'src', 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    console.log(`📦 Comando carregado: /${command.data.name}`);
  }
}

// --- Carrega botões e modals (todos exportam { customId, execute }) ---
const buttonsPath = path.join(__dirname, 'src', 'buttons');
for (const file of fs.readdirSync(buttonsPath).filter((f) => f.endsWith('.js'))) {
  const botao = require(path.join(buttonsPath, file));
  if (botao.customId && botao.execute) {
    client.buttons.set(botao.customId, botao);
    console.log(`🔘 Botão/Modal carregado: ${botao.customId}`);
  }
}

// --- Carrega eventos ---
const eventsPath = path.join(__dirname, 'src', 'events');
for (const file of fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'))) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
  console.log(`🎯 Evento carregado: ${event.name}`);
}

// --- Inicialização ---
(async () => {
  try {
    inicializarBanco();
    await client.login(process.env.DISCORD_TOKEN);
    criarServidorWebhook(client);
  } catch (erro) {
    console.error('❌ Erro fatal ao iniciar o bot:', erro);
    process.exit(1);
  }
})();
