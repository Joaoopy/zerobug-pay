// ============================================================
// WEBHOOK SERVER — MERCADO PAGO
// ============================================================
// Recebe notificações do Mercado Pago quando o status de um
// pagamento muda. Quando aprovado, atualiza o pedido, notifica
// o ticket e registra nos canais de log/comprovante.

const express = require('express');
const config = require('../config');
const db = require('../database/db');
const mercadopago = require('../payments/mercadopago');
const { EmbedBuilder } = require('discord.js');
const { registrarLogFinanceiro, registrarComprovante } = require('../utils/logger');

function criarServidorWebhook(discordClient) {
  const app = express();
  app.use(express.json());

  // Mercado Pago envia notificações aqui.
  app.post('/webhook/mercadopago', async (req, res) => {
    // Responde rápido — o MP exige resposta em poucos segundos.
    res.sendStatus(200);

    try {
      const { type, data } = req.body;

      if (type !== 'payment') return;

      const paymentId = data?.id;
      if (!paymentId) return;

      // Busca o pagamento real na API (nunca confia só no payload do webhook)
      const pagamento = await mercadopago.consultarPagamento(paymentId);

      if (pagamento.status !== 'approved') return; // só processa se realmente aprovado

      const cobranca = db.buscarCobrancaPorMpId(String(paymentId));
      if (!cobranca) {
        console.warn(`⚠️ Webhook recebido para pagamento desconhecido: ${paymentId}`);
        return;
      }

      // --- Evita processar pagamento duplicado ---
      if (cobranca.status === 'pago') {
        console.log(`ℹ️ Pagamento ${paymentId} já estava marcado como pago. Ignorando.`);
        return;
      }

      db.marcarCobrancaComoPaga(cobranca.id);
      db.atualizarStatusPedido(cobranca.pedido_id, 'pago');

      const pedido = db.db.prepare('SELECT * FROM pedidos WHERE id = ?').get(cobranca.pedido_id);
      if (!pedido) return;

      const valorFormatado = cobranca.valor.toFixed(2).replace('.', ',');

      // --- Notifica no ticket ---
      try {
        const canal = await discordClient.channels.fetch(pedido.canal_id);

        const embed = new EmbedBuilder()
          .setTitle('✅ Pagamento Confirmado')
          .setColor(config.CORES.VERDE_SUCESSO)
          .addFields(
            { name: '👤 Cliente', value: `<@${pedido.cliente_id}>`, inline: true },
            { name: '📦 Produto', value: pedido.produto, inline: true },
            { name: '💰 Valor', value: `R$ ${valorFormatado}`, inline: true },
            { name: '🧾 ID Transação', value: String(paymentId), inline: false },
          )
          .setTimestamp();

        // Notifica apenas o atendente responsável, se houver
        const menção = pedido.atendente_id ? `<@${pedido.atendente_id}> ` : '';

        await canal.send({ content: `${menção}`.trim(), embeds: [embed] });
      } catch (erro) {
        console.error('❌ Erro ao notificar ticket sobre pagamento:', erro.message);
      }

      // --- Log financeiro e comprovante ---
      await registrarLogFinanceiro(discordClient, {
        cliente: pedido.cliente_tag,
        produto: pedido.produto,
        valor: valorFormatado,
        pedidoId: pedido.id,
        mpTransactionId: String(paymentId),
      });

      await registrarComprovante(discordClient, {
        cliente: pedido.cliente_tag,
        produto: pedido.produto,
        valor: valorFormatado,
        pedidoId: pedido.id,
      });

      console.log(`✅ Pagamento ${paymentId} processado com sucesso (Pedido #${pedido.id}).`);
    } catch (erro) {
      console.error('❌ Erro ao processar webhook do Mercado Pago:', erro.message);
    }
  });

  // Rota simples de healthcheck — útil pra confirmar que o servidor está de pé.
  app.get('/', (req, res) => {
    res.send('ZeroBug Pay webhook server está rodando.');
  });

  app.listen(config.WEBHOOK_PORT, () => {
    console.log(`🌐 Servidor de webhook rodando na porta ${config.WEBHOOK_PORT}`);
  });

  return app;
}

module.exports = { criarServidorWebhook };
