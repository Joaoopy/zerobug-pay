// ============================================================
// BOTÃO: 📄 Ver Dados do Pedido
// ============================================================

const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const db = require('../database/db');

const STATUS_LABEL = {
  aguardando_pagamento: '🕓 Aguardando pagamento',
  pago: '✅ Pago',
  em_desenvolvimento: '🚀 Em desenvolvimento',
  em_revisao: '🔍 Em revisão',
  concluido: '✅ Concluído',
};

module.exports = {
  customId: 'ver_dados_pedido',

  async execute(interaction) {
    const canal = interaction.channel;
    const pedido = db.buscarPedidoPorCanal(canal.id);

    if (!pedido) {
      return interaction.reply({
        content: '⚠️ Nenhum pedido registrado para este ticket ainda. Use **💳 Gerar Cobrança** ou **💰 Cobrança Personalizada** primeiro.',
        ephemeral: true,
      });
    }

    const cobranca = db.buscarCobrancaAtivaPorCanal(canal.id);
    const valorFormatado = pedido.valor.toFixed(2).replace('.', ',');

    const embed = new EmbedBuilder()
      .setTitle('📄 Dados do Pedido')
      .setColor(config.CORES.AZUL_TECNOLOGICO)
      .addFields(
        { name: '🆔 Pedido', value: `#${pedido.id}`, inline: true },
        { name: '📦 Produto', value: pedido.produto, inline: true },
        { name: '💰 Valor', value: `R$ ${valorFormatado}`, inline: true },
        { name: '👤 Cliente', value: `<@${pedido.cliente_id}>`, inline: true },
        { name: '🧾 Status', value: STATUS_LABEL[pedido.status] || pedido.status, inline: true },
        { name: '💳 Cobrança ativa', value: cobranca ? 'Sim' : 'Não', inline: true },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
