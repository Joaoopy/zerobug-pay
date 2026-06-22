// ============================================================
// BOTÃO: 💳 Gerar Cobrança (automática)
// ============================================================

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const config = require('../config');
const db = require('../database/db');
const mercadopago = require('../payments/mercadopago');
const { extrairDadosDoTicket } = require('../utils/ticketParser');

module.exports = {
  customId: 'gerar_cobranca',

  async execute(interaction) {
    await interaction.deferReply();

    const canal = interaction.channel;

    // --- Impede cobrança duplicada ativa no mesmo ticket ---
    const cobrancaAtiva = db.buscarCobrancaAtivaPorCanal(canal.id);
    if (cobrancaAtiva) {
      return interaction.editReply({
        content: '⚠️ Já existe uma cobrança ativa neste ticket. Aguarde o pagamento ou a expiração antes de gerar outra.',
      });
    }

    // --- Extrai dados do ticket ---
    const dados = await extrairDadosDoTicket(canal);

    if (!dados) {
      return interaction.editReply({
        content:
          '⚠️ Não foi possível identificar automaticamente o produto/valor/cliente deste ticket.\n' +
          'Use **💰 Cobrança Personalizada** para inserir os dados manualmente.',
      });
    }

    const { produto, produtoId, valor, clienteId, clienteTag } = dados;

    // --- Cria/atualiza o pedido no banco ---
    const pedido = db.criarOuAtualizarPedido({
      canalId: canal.id,
      produto,
      produtoId,
      valor,
      clienteId,
      clienteTag,
      atendenteId: interaction.user.id,
      atendenteTag: interaction.user.tag,
    });

    // --- Cria a cobrança no Mercado Pago ---
    let pagamento;
    try {
      pagamento = await mercadopago.criarPagamentoPix({
        valor,
        descricao: `${produto} — Pedido #${pedido.id}`,
      });
    } catch (erro) {
      console.error('❌ Erro ao criar pagamento no Mercado Pago:', erro.response?.data || erro.message);
      return interaction.editReply({
        content: '⚠️ Erro ao gerar a cobrança no Mercado Pago. Verifique as credenciais ou tente novamente.',
      });
    }

    // --- Salva a cobrança no banco ---
    db.criarCobranca({
      pedidoId: pedido.id,
      canalId: canal.id,
      mpPaymentId: pagamento.id,
      valor,
      descricao: produto,
      pixCodigo: pagamento.pixCodigo,
      pixQrcodeBase64: pagamento.pixQrcodeBase64,
      criadoPorId: interaction.user.id,
      criadoPorTag: interaction.user.tag,
      expiraEm: pagamento.expiraEm,
    });

    const valorFormatado = valor.toFixed(2).replace('.', ',');

    // --- Monta o embed de cobrança ---
    const embed = new EmbedBuilder()
      .setTitle('💳 Pagamento Gerado')
      .setColor(config.CORES.ROXO_ESCURO)
      .addFields(
        { name: '📦 Produto', value: produto, inline: true },
        { name: '👤 Cliente', value: `<@${clienteId}>`, inline: true },
        { name: '💰 Valor', value: `R$ ${valorFormatado}`, inline: true },
        { name: '⏰ Expira em', value: `${config.EXPIRACAO_MINUTOS} minutos`, inline: false },
      )
      .setFooter({ text: `Pedido #${pedido.id} • ZeroBug Studio` })
      .setTimestamp();

    const botaoCopiar = new ButtonBuilder()
      .setCustomId(`copiar_pix_${pagamento.id}`)
      .setLabel('Copiar Código')
      .setEmoji('📋')
      .setStyle(ButtonStyle.Secondary);

    const linha = new ActionRowBuilder().addComponents(botaoCopiar);

    const arquivos = [];
    if (pagamento.pixQrcodeBase64) {
      const buffer = Buffer.from(pagamento.pixQrcodeBase64, 'base64');
      arquivos.push(new AttachmentBuilder(buffer, { name: 'qrcode-pix.png' }));
      embed.setImage('attachment://qrcode-pix.png');
    }

    await interaction.editReply({
      embeds: [embed],
      components: [linha],
      files: arquivos,
    });
  },
};
