// ============================================================
// MERCADO PAGO — CLIENTE DE PAGAMENTOS
// ============================================================
// Cria cobranças Pix reais via API do Mercado Pago.

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const API_BASE = 'https://api.mercadopago.com';

function clienteMP() {
  return axios.create({
    baseURL: API_BASE,
    headers: {
      Authorization: `Bearer ${config.MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });
}

/**
 * Cria um pagamento Pix no Mercado Pago.
 * @returns {Promise<{ id, status, pixCodigo, pixQrcodeBase64, expiraEm }>}
 */
async function criarPagamentoPix({ valor, descricao, clienteEmail, clienteNome }) {
  const idempotencyKey = uuidv4();
  const expiraEm = new Date(Date.now() + config.EXPIRACAO_MINUTOS * 60 * 1000);

  const payload = {
    transaction_amount: Number(valor),
    description: descricao,
    payment_method_id: 'pix',
    date_of_expiration: expiraEm.toISOString(),
    payer: {
      email: clienteEmail || 'cliente@zerobugstudio.com',
      first_name: clienteNome || 'Cliente',
    },
  };

  const resposta = await clienteMP().post('/v1/payments', payload, {
    headers: { 'X-Idempotency-Key': idempotencyKey },
  });

  const dados = resposta.data;
  const transacao = dados.point_of_interaction?.transaction_data;

  return {
    id: String(dados.id),
    status: dados.status, // geralmente "pending" para Pix recém-criado
    pixCodigo: transacao?.qr_code || null,
    pixQrcodeBase64: transacao?.qr_code_base64 || null,
    expiraEm: expiraEm.toISOString(),
  };
}

/**
 * Consulta o status atual de um pagamento no Mercado Pago.
 * Usado como fallback caso o webhook não chegue (verificação manual).
 */
async function consultarPagamento(paymentId) {
  const resposta = await clienteMP().get(`/v1/payments/${paymentId}`);
  return resposta.data;
}

module.exports = {
  criarPagamentoPix,
  consultarPagamento,
};
