// ============================================================
// BANCO DE DADOS — SQLite (better-sqlite3)
// ============================================================
// Roda no container Linux da hospedagem (Wispbyte) — sem
// problema de compatibilidade ARM/Android, já que não passa
// pelo Termux nessa camada.

const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'zerobugpay.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function inicializarBanco() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      canal_id TEXT NOT NULL UNIQUE,
      produto TEXT NOT NULL,
      produto_id TEXT,
      valor REAL NOT NULL,
      cliente_id TEXT NOT NULL,
      cliente_tag TEXT NOT NULL,
      atendente_id TEXT,
      atendente_tag TEXT,
      status TEXT NOT NULL DEFAULT 'aguardando_pagamento',
      criado_em TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cobrancas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      canal_id TEXT NOT NULL,
      mp_payment_id TEXT NOT NULL UNIQUE,
      valor REAL NOT NULL,
      descricao TEXT NOT NULL,
      pix_codigo TEXT,
      pix_qrcode_base64 TEXT,
      status TEXT NOT NULL DEFAULT 'pendente',
      criado_por_id TEXT NOT NULL,
      criado_por_tag TEXT NOT NULL,
      criado_em TEXT NOT NULL,
      expira_em TEXT NOT NULL,
      pago_em TEXT,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    );

    CREATE INDEX IF NOT EXISTS idx_cobrancas_canal ON cobrancas(canal_id);
    CREATE INDEX IF NOT EXISTS idx_cobrancas_status ON cobrancas(status);
  `);

  console.log('✅ Banco de dados SQLite inicializado com sucesso.');
}

// --- Pedidos ---

function criarOuAtualizarPedido({ canalId, produto, produtoId, valor, clienteId, clienteTag, atendenteId, atendenteTag }) {
  const existente = db.prepare('SELECT * FROM pedidos WHERE canal_id = ?').get(canalId);

  if (existente) {
    db.prepare(`
      UPDATE pedidos
      SET produto = ?, produto_id = ?, valor = ?, cliente_id = ?, cliente_tag = ?,
          atendente_id = ?, atendente_tag = ?
      WHERE canal_id = ?
    `).run(produto, produtoId, valor, clienteId, clienteTag, atendenteId, atendenteTag, canalId);

    return db.prepare('SELECT * FROM pedidos WHERE canal_id = ?').get(canalId);
  }

  const resultado = db.prepare(`
    INSERT INTO pedidos (canal_id, produto, produto_id, valor, cliente_id, cliente_tag, atendente_id, atendente_tag, status, criado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aguardando_pagamento', ?)
  `).run(canalId, produto, produtoId, valor, clienteId, clienteTag, atendenteId, atendenteTag, new Date().toISOString());

  return db.prepare('SELECT * FROM pedidos WHERE id = ?').get(resultado.lastInsertRowid);
}

function buscarPedidoPorCanal(canalId) {
  return db.prepare('SELECT * FROM pedidos WHERE canal_id = ?').get(canalId) || null;
}

function atualizarStatusPedido(pedidoId, status) {
  db.prepare('UPDATE pedidos SET status = ? WHERE id = ?').run(status, pedidoId);
}

// --- Cobranças ---

function buscarCobrancaAtivaPorCanal(canalId) {
  return db.prepare(`
    SELECT * FROM cobrancas
    WHERE canal_id = ? AND status = 'pendente' AND expira_em > ?
  `).get(canalId, new Date().toISOString()) || null;
}

function criarCobranca({ pedidoId, canalId, mpPaymentId, valor, descricao, pixCodigo, pixQrcodeBase64, criadoPorId, criadoPorTag, expiraEm }) {
  const resultado = db.prepare(`
    INSERT INTO cobrancas
      (pedido_id, canal_id, mp_payment_id, valor, descricao, pix_codigo, pix_qrcode_base64,
       status, criado_por_id, criado_por_tag, criado_em, expira_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente', ?, ?, ?, ?)
  `).run(
    pedidoId, canalId, mpPaymentId, valor, descricao, pixCodigo, pixQrcodeBase64,
    criadoPorId, criadoPorTag, new Date().toISOString(), expiraEm,
  );

  return db.prepare('SELECT * FROM cobrancas WHERE id = ?').get(resultado.lastInsertRowid);
}

function buscarCobrancaPorMpId(mpPaymentId) {
  return db.prepare('SELECT * FROM cobrancas WHERE mp_payment_id = ?').get(mpPaymentId) || null;
}

function marcarCobrancaComoPaga(cobrancaId) {
  db.prepare(`
    UPDATE cobrancas SET status = 'pago', pago_em = ? WHERE id = ?
  `).run(new Date().toISOString(), cobrancaId);
}

function marcarCobrancaComoExpirada(cobrancaId) {
  db.prepare(`UPDATE cobrancas SET status = 'expirado' WHERE id = ?`).run(cobrancaId);
}

module.exports = {
  db,
  inicializarBanco,
  criarOuAtualizarPedido,
  buscarPedidoPorCanal,
  atualizarStatusPedido,
  buscarCobrancaAtivaPorCanal,
  criarCobranca,
  buscarCobrancaPorMpId,
  marcarCobrancaComoPaga,
  marcarCobrancaComoExpirada,
};
