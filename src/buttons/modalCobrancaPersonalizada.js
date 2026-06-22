// ============================================================
// MODAL SUBMIT: Cobrança Personalizada
// ============================================================

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const config = require('../config');
const db = require('../database/db');
const mercadopago = require('../payments/mercadopago');

module.exports = {
  customId: 'modal_cobranca_personalizada',

  async execute(interaction) {
    await interaction.deferReply();

    const canal = interaction.channel;
    const valorTexto = interaction.fields.getTextInputValue('valor');
    const descricao = interaction.fields.getTextInputValue('descricao');

    const valor = parseFloat(valorTexto.replace(',', '.'));

    if (isNaN(valor) || valor <= 0) {
      return interaction.editReply({
        content: '⚠️ Valor inválido. Use um número como `150.00`.',
      });
    }

    // --- Impede cobrança duplicada ativa no mesmo ticket ---
    const cobrancaAtiva = db.buscarCobrancaAtivaPorCanal(canal.id);
    if (cobrancaAtiva) {
      return interaction.editReply({
        content: '⚠️ Já existe uma cobrança ativa neste ticket. Aguarde o pagamento ou a expiração antes de gerar outra.',
      });
    }

    // --- Pega ou cria o pedido vinculado a este canal ---
    let pedido = db.buscarPedidoPorCanal(canal.id);
    if (!pedido) {
      pedido = db.criarOuAtualizarPedido({
        canalId: canal.id,
        produto: descricao,
        produtoId: null,
        valor,
        clienteId: interaction.user.id, // fallback: quem clicou, ajustável manualmente se necessário
        clienteTag: interaction.user.tag,
        atendenteId: interaction.user.id,
        atendenteTag: interaction.user.tag,
      });
    }

    // --- Cria a cobrança no Mercado Pago ---
    let pagamento;
    try {
      pagamento = await mercadopago.criarPagamentoPix({ valor, descricao });
    } catch (erro) {
      console.error('❌ Erro ao criar pagamento personalizado no Mercado Pago:', erro.response?.data || erro.message);
      return interaction.editReply({
        content: '⚠️ Erro ao gerar a cobrança no Mercado Pago. Tente novamente.',
      });
    }

    db.criarCobranca({
      pedidoId: pedido.id,
      canalId: canal.id,
      mpPaymentId: pagamento.id,
      valor,
      descricao,
      pixCodigo: pagamento.pixCodigo,
      pixQrcodeBase64: pagamento.pixQrcodeBase64,
      criadoPorId: interaction.user.id,
      criadoPorTag: interaction.user.tag,
      expiraEm: pagamento.expiraEm,
    });

    const valorFormatado = valor.toFixed(2).replace('.', ',');

    const embed = new EmbedBuilder()
      .setTitle('💰 Cobrança Personalizada Gerada')
      .setColor(config.CORES.ROXO_ESCURO)
      .addFields(
        { name: '📦 Descrição', value: descricao, inline: false },
        { name: '💰 Valor', value: `R$ ${valorFormatado}`, inline: true },
        { name: '⏰ Expira em', value: `${config.EXPIRACAO_MINUTOS} minutos`, inline: true },
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
