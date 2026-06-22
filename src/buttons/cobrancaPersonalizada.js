// ============================================================
// BOTÃO: 💰 Cobrança Personalizada (somente staff)
// ============================================================
// Abre um modal para inserir valor e descrição manualmente.

const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { ehStaff } = require('../utils/permissions');

module.exports = {
  customId: 'cobranca_personalizada',

  async execute(interaction) {
    if (!ehStaff(interaction.member)) {
      return interaction.reply({
        content: '🚫 Apenas a equipe pode usar a cobrança personalizada.',
        ephemeral: true,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('modal_cobranca_personalizada')
      .setTitle('Cobrança Personalizada');

    const inputValor = new TextInputBuilder()
      .setCustomId('valor')
      .setLabel('Valor (ex: 150.00)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('150.00')
      .setRequired(true);

    const inputDescricao = new TextInputBuilder()
      .setCustomId('descricao')
      .setLabel('Descrição do serviço/produto')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Ex: Bot de tickets personalizado')
      .setRequired(true)
      .setMaxLength(200);

    modal.addComponents(
      new ActionRowBuilder().addComponents(inputValor),
      new ActionRowBuilder().addComponents(inputDescricao),
    );

    await interaction.showModal(modal);
  },
};
