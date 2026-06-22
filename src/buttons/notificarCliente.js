// ============================================================
// BOTÃO: 🔔 Notificar Cliente
// ============================================================

const config = require('../config');
const db = require('../database/db');
const { ehStaff } = require('../utils/permissions');

module.exports = {
  customId: 'notificar_cliente',

  async execute(interaction) {
    if (!ehStaff(interaction.member)) {
      return interaction.reply({
        content: '🚫 Apenas a equipe pode notificar o cliente.',
        ephemeral: true,
      });
    }

    const canal = interaction.channel;
    const pedido = db.buscarPedidoPorCanal(canal.id);

    if (!pedido) {
      return interaction.reply({
        content: '⚠️ Nenhum pedido encontrado para este ticket.',
        ephemeral: true,
      });
    }

    const cobranca = db.buscarCobrancaAtivaPorCanal(canal.id);

    if (!cobranca) {
      await interaction.reply({
        content: `🔔 <@${pedido.cliente_id}>, este ticket está aguardando geração de cobrança.`,
      });
      return;
    }

    const valorFormatado = cobranca.valor.toFixed(2).replace('.', ',');

    await interaction.reply({
      content:
        `🔔 <@${pedido.cliente_id}>, você tem um pagamento pendente de **R$ ${valorFormatado}** ` +
        `para **${pedido.produto}**. Use o botão de copiar código Pix acima para finalizar.`,
    });
  },
};
