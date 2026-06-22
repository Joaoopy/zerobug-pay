// ============================================================
// CONFIGURAÇÃO CENTRAL — ZEROBUG PAY
// ============================================================

module.exports = {
  // Cargos que podem usar cobrança personalizada e ver botões de staff
  CARGOS_STAFF: process.env.CARGOS_STAFF
    ? process.env.CARGOS_STAFF.split(',')
    : [],

  // Canal de log financeiro (#log-financeiro)
  CANAL_LOG_FINANCEIRO: process.env.CANAL_LOG_FINANCEIRO || '',

  // Canal de comprovantes
  CANAL_COMPROVANTES: process.env.CANAL_COMPROVANTES || '',

  // Mercado Pago
  MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN || '',
  MP_PUBLIC_KEY: process.env.MP_PUBLIC_KEY || '',

  // Tempo de expiração da cobrança em minutos
  EXPIRACAO_MINUTOS: parseInt(process.env.EXPIRACAO_MINUTOS || '30', 10),

  // Porta do servidor de webhook
  WEBHOOK_PORT: parseInt(process.env.WEBHOOK_PORT || '3000', 10),

  // Cores do embed
  CORES: {
    AZUL_TECNOLOGICO: 0x2563EB,
    VERDE_SUCESSO: 0x22C55E,
    VERMELHO_ERRO: 0xEF4444,
    ROXO_ESCURO: 0x6D28D9,
    AMARELO_AVISO: 0xFACC15,
  },
};
