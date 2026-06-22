// ============================================================
// COMANDO /painel-pagamento
// ============================================================
// Posta o painel de botões (Gerar Cobrança, Cobrança Personalizada,
// Notificar Cliente, Ver Dados do Pedido) dentro do ticket atual.
// Deve ser usado pela equipe de vendas dentro do canal do ticket
// já criado pelo bot externo (Ticket Tool).

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const config = require('../config');
const { ehStaff } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('painel-pagamento')
    .setDescription('Posta o painel de cobrança do ZeroBug Pay neste ticket.'),

  async execute(interaction) {
    if (!ehStaff(interaction.member)) {
      return interaction.reply({
        content: '🚫 Apenas a equipe pode abrir o painel de pagamento.',
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('💼 ZeroBug Pay')
      .setColor(config.CORES.ROXO_ESCURO)
      .setDescription('Selecione uma ação abaixo para gerenciar o pagamento deste pedido.');

    const linha1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('gerar_cobranca')
        .setLabel('Gerar Cobrança')
        .setEmoji('💳')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('cobranca_personalizada')
        .setLabel('Cobrança Personalizada')
        .setEmoji('💰')
        .setStyle(ButtonStyle.Secondary),
    );

    const linha2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('notificar_cliente')
        .setLabel('Notificar Cliente')
        .setEmoji('🔔')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('ver_dados_pedido')
        .setLabel('Ver Dados do Pedido')
        .setEmoji('📄')
        .setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({
      embeds: [embed],
      components: [linha1, linha2],
    });
  },
};
