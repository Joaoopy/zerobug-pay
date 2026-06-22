// ============================================================
// SISTEMA DE LOGS — FINANCEIRO E COMPROVANTES
// ============================================================

const { EmbedBuilder } = require('discord.js');
const config = require('../config');

async function enviarParaCanal(client, canalId, payload) {
  if (!canalId) return;
  try {
    const canal = await client.channels.fetch(canalId);
    if (canal) await canal.send(payload);
  } catch (erro) {
    console.error(`❌ Erro ao enviar mensagem para canal ${canalId}:`, erro.message);
  }
}

async function registrarLogFinanceiro(client, { cliente, produto, valor, pedidoId, mpTransactionId }) {
  const embed = new EmbedBuilder()
    .setTitle('💰 Nova Transação')
    .setColor(config.CORES.ROXO_ESCURO)
    .addFields(
      { name: '👤 Cliente', value: cliente, inline: true },
      { name: '📦 Produto', value: produto, inline: true },
      { name: '💰 Valor', value: `R$ ${valor}`, inline: true },
      { name: '🆔 Pedido', value: `#${pedidoId}`, inline: true },
      { name: '🧾 Transação MP', value: mpTransactionId, inline: true },
    )
    .setTimestamp();

  await enviarParaCanal(client, config.CANAL_LOG_FINANCEIRO, { embeds: [embed] });
}

async function registrarComprovante(client, { cliente, produto, valor, pedidoId }) {
  const embed = new EmbedBuilder()
    .setTitle('📄 Comprovante')
    .setColor(config.CORES.VERDE_SUCESSO)
    .addFields(
      { name: 'Cliente', value: cliente, inline: true },
      { name: 'Produto', value: produto, inline: true },
      { name: 'Valor', value: `R$ ${valor}`, inline: true },
      { name: 'Status', value: 'Pago', inline: true },
      { name: 'ID', value: `#${pedidoId}`, inline: true },
    )
    .setTimestamp();

  await enviarParaCanal(client, config.CANAL_COMPROVANTES, { embeds: [embed] });
}

module.exports = { registrarLogFinanceiro, registrarComprovante };
