// ============================================================
// EXTRATOR DE DADOS DO TICKET
// ============================================================
// Lê o canal do ticket (criado por um bot externo, ex: Ticket Tool)
// e tenta extrair: produto, valor e cliente.
//
// Como cada bot de ticket formata as informações de um jeito
// diferente, esta função busca por padrões comuns nas primeiras
// mensagens do canal. Caso não consiga detectar automaticamente,
// retorna null e o staff deve usar a Cobrança Personalizada.

const REGEX_VALOR = /R\$\s?([\d.,]+)/i;
const REGEX_PRODUTO = /(?:produto|serviço|item)\s*:\s*([^\n]+)/i;
const REGEX_PEDIDO_ID = /(?:pedido|id do pedido|order)\s*:?\s*#?([a-zA-Z0-9-]+)/i;

/**
 * Tenta extrair os dados do pedido lendo as últimas mensagens do canal.
 * @param {TextChannel} canal
 * @returns {Promise<{ produto, produtoId, valor, clienteId, clienteTag } | null>}
 */
async function extrairDadosDoTicket(canal) {
  try {
    const mensagens = await canal.messages.fetch({ limit: 20 });
    const lista = Array.from(mensagens.values()).reverse(); // ordem cronológica

    let produto = null;
    let produtoId = null;
    let valor = null;

    for (const msg of lista) {
      const texto = msg.content || '';

      if (!produto) {
        const matchProduto = texto.match(REGEX_PRODUTO);
        if (matchProduto) produto = matchProduto[1].trim();
      }

      if (!valor) {
        const matchValor = texto.match(REGEX_VALOR);
        if (matchValor) {
          valor = parseFloat(matchValor[1].replace(/\./g, '').replace(',', '.'));
        }
      }

      if (!produtoId) {
        const matchId = texto.match(REGEX_PEDIDO_ID);
        if (matchId) produtoId = matchId[1].trim();
      }

      // Também verifica embeds (muitos bots de ticket usam embed em vez de texto puro)
      for (const embed of msg.embeds) {
        const blocoTexto = [embed.title, embed.description, ...(embed.fields || []).map((f) => `${f.name}: ${f.value}`)].join('\n');

        if (!produto) {
          const matchProduto = blocoTexto.match(REGEX_PRODUTO);
          if (matchProduto) produto = matchProduto[1].trim();
        }
        if (!valor) {
          const matchValor = blocoTexto.match(REGEX_VALOR);
          if (matchValor) valor = parseFloat(matchValor[1].replace(/\./g, '').replace(',', '.'));
        }
        if (!produtoId) {
          const matchId = blocoTexto.match(REGEX_PEDIDO_ID);
          if (matchId) produtoId = matchId[1].trim();
        }
      }
    }

    // Cliente: heurística — primeiro membro não-bot que enviou mensagem no canal,
    // ou o autor da primeira mensagem do ticket.
    const autorTicket = lista.find((msg) => !msg.author.bot);
    const clienteId = autorTicket?.author?.id || null;
    const clienteTag = autorTicket?.author?.tag || null;

    if (!produto || !valor || !clienteId) {
      return null;
    }

    return { produto, produtoId, valor, clienteId, clienteTag };
  } catch (erro) {
    console.error('❌ Erro ao extrair dados do ticket:', erro.message);
    return null;
  }
}

module.exports = { extrairDadosDoTicket };
