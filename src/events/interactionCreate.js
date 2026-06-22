// ============================================================
// EVENTO: interactionCreate
// ============================================================
// Roteia slash commands, cliques de botão e submits de modal.

const { Events } = require('discord.js');
const config = require('../config');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      // --- Slash Commands ---
      if (interaction.isChatInputCommand()) {
        const comando = interaction.client.commands.get(interaction.commandName);
        if (!comando) return;
        return comando.execute(interaction);
      }

      // --- Botão "Copiar código Pix" (dinâmico, gerado por cobrança) ---
      if (interaction.isButton() && interaction.customId.startsWith('copiar_pix_')) {
        const mpPaymentId = interaction.customId.replace('copiar_pix_', '');
        const db = require('../database/db');
        const cobranca = db.buscarCobrancaPorMpId(mpPaymentId);

        if (!cobranca || !cobranca.pix_codigo) {
          return interaction.reply({
            content: '⚠️ Código Pix não encontrado ou expirado.',
            ephemeral: true,
          });
        }

        return interaction.reply({
          content: `\`\`\`\n${cobranca.pix_codigo}\n\`\`\``,
          ephemeral: true,
        });
      }

      // --- Botões fixos do painel (gerar_cobranca, cobranca_personalizada, etc) ---
      if (interaction.isButton()) {
        const botao = interaction.client.buttons.get(interaction.customId);
        if (botao) return botao.execute(interaction);
      }

      // --- Modal submits ---
      if (interaction.isModalSubmit()) {
        const modal = interaction.client.buttons.get(interaction.customId);
        if (modal) return modal.execute(interaction);
      }
    } catch (erro) {
      console.error('❌ Erro ao processar interação:', erro);

      const mensagemErro = {
        content: '⚠️ Ocorreu um erro ao processar esta ação. Tente novamente.',
        ephemeral: true,
      };

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(mensagemErro);
        } else {
          await interaction.reply(mensagemErro);
        }
      } catch (_) {
        // interação pode já ter expirado, ignora
      }
    }
  },
};
