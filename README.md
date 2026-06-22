# 💼 ZeroBug Pay

Sistema financeiro completo da ZeroBug Studio: cobrança Pix real via Mercado Pago, detecção automática de pagamento via webhook, log financeiro e controle de status de pedidos — tudo dentro de tickets criados por um bot externo (ex: Ticket Tool).

## ⚠️ O que este bot NÃO faz

- Não cria tickets
- Não gerencia canais
- Não é bot de suporte/moderação

Ele **atua dentro** de tickets já existentes, criados por outro bot.

---

## 📋 Funcionalidades

- `/painel-pagamento` — posta o painel de botões dentro do ticket
- **💳 Gerar Cobrança** — lê o ticket automaticamente (produto, valor, cliente) e cria um Pix real
- **💰 Cobrança Personalizada** — staff abre um modal e insere valor/descrição manualmente
- **🔔 Notificar Cliente** — menciona o cliente avisando do pagamento pendente
- **📄 Ver Dados do Pedido** — mostra o status atual do pedido
- **Webhook do Mercado Pago** — confirma pagamento automaticamente e:
  - Atualiza o status do pedido
  - Avisa no ticket (mencionando o atendente responsável)
  - Registra no canal de log financeiro
  - Registra no canal de comprovantes
- **Proteções**: impede cobrança duplicada no mesmo ticket, impede processar o mesmo pagamento duas vezes

---

## 🗂️ Estrutura

```
zerobug-pay/
├── src/
│   ├── commands/
│   │   └── painelPagamento.js
│   ├── buttons/
│   │   ├── gerarCobranca.js
│   │   ├── cobrancaPersonalizada.js
│   │   ├── modalCobrancaPersonalizada.js
│   │   ├── notificarCliente.js
│   │   └── verDadosPedido.js
│   ├── payments/
│   │   └── mercadopago.js
│   ├── webhooks/
│   │   └── mercadopago.webhook.js
│   ├── events/
│   │   ├── interactionCreate.js
│   │   └── ready.js
│   ├── database/
│   │   └── db.js
│   ├── utils/
│   │   ├── logger.js
│   │   ├── permissions.js
│   │   └── ticketParser.js
│   └── config.js
├── index.js
├── deploy-commands.js
├── package.json
├── .env.example
└── .gitignore
```

---

## ⚙️ Passo a passo de instalação

### 1. Bot do Discord

Igual ao projeto anterior — Discord Developer Portal → criar aplicação → copiar `DISCORD_TOKEN` e `CLIENT_ID` → ativar **Server Members Intent** e **Message Content Intent** (esse último é novo e obrigatório, pois o bot lê mensagens do ticket para extrair produto/valor).

Convide o bot com os scopes `bot` + `applications.commands` e as permissões: `Send Messages`, `Embed Links`, `Read Message History`, `Attach Files`, `Use Slash Commands`.

### 2. Mercado Pago

1. Acesse https://www.mercadopago.com.br/developers/panel
2. Crie uma aplicação (Pagamentos / Checkout API / Pix)
3. Comece com as **credenciais de TESTE** (sandbox) — copie `Access Token` e `Public Key`
4. Quando tudo estiver validado, troque pelas **credenciais de produção** no `.env`

### 3. Configurar o Webhook no Mercado Pago

O Mercado Pago precisa de uma **URL pública** para enviar as notificações de pagamento.

1. No painel do Mercado Pago, vá em sua aplicação → **Webhooks**
2. Configure a URL: `https://SEU_DOMINIO_OU_IP:PORTA/webhook/mercadopago`
   - Esse domínio/IP depende de onde o bot está hospedado (Wispbyte vai te dar um endereço)
3. Selecione o evento: **Pagamentos** (`payment`)
4. Salve

> ⚠️ Se a sua hospedagem não expuser uma porta HTTP pública, o webhook não vai conseguir chegar até o bot. Verifique isso na configuração de "Allocations/Ports" do seu painel de hospedagem antes de prosseguir.

### 4. Variáveis de ambiente

```bash
cp .env.example .env
```

Preencha o `.env` com:
- Token e IDs do Discord
- IDs dos cargos de staff
- IDs dos canais de log financeiro e comprovantes
- Credenciais do Mercado Pago
- A porta que sua hospedagem liberou para o webhook

### 5. Instalar dependências

```bash
npm install
```

### 6. Registrar os slash commands

```bash
npm run deploy
```

### 7. Iniciar

```bash
npm start
```

Se tudo estiver certo, vai aparecer:

```
✅ Banco de dados SQLite inicializado com sucesso.
📦 Comando carregado: /painel-pagamento
🔘 Botão/Modal carregado: gerar_cobranca
🔘 Botão/Modal carregado: cobranca_personalizada
🔘 Botão/Modal carregado: modal_cobranca_personalizada
🔘 Botão/Modal carregado: notificar_cliente
🔘 Botão/Modal carregado: ver_dados_pedido
🎯 Evento carregado: interactionCreate
🎯 Evento carregado: ready
✅ ZeroBug Pay#0000 está online e operacional.
🌐 Servidor de webhook rodando na porta 3000
```

---

## ☁️ Deploy

### Wispbyte

1. Suba o projeto (zip ou git) e extraia na raiz do servidor criado
2. Configure o **Startup** para `npm install && npm start` (ou deixe o padrão que já faz isso)
3. Preencha o `.env` direto no gerenciador de arquivos
4. Verifique nas configurações do servidor se existe uma porta alocada que você possa apontar como `WEBHOOK_PORT` — alguns planos free só liberam a porta usada pelo processo principal
5. Configure essa mesma porta (e o domínio/IP fornecido) no painel de Webhooks do Mercado Pago

### Se a Wispbyte não liberar porta HTTP pública

Nesse caso, você vai precisar rodar **só o servidor de webhook** em outro lugar que aceite (ex: Render Web Service, que tem free tier voltado exatamente para isso). O bot do Discord continua na Wispbyte normalmente; só o `webhooks/mercadopago.webhook.js` precisaria rodar separado, com os dois processos compartilhando o mesmo banco de dados (ou se comunicando via uma API simples). Se chegar nesse ponto, me avise para adaptarmos a arquitetura.

---

## 🔐 Segurança e regras de negócio

- Cobrança personalizada e notificação de cliente: restritas a `CARGOS_STAFF`
- Webhook sempre **confirma o pagamento consultando a API do Mercado Pago diretamente** (nunca confia só no corpo da notificação recebida) — evita fraude por webhook falso
- Cobrança duplicada no mesmo ticket é bloqueada enquanto houver uma pendente e não expirada
- Pagamento confirmado duas vezes (reenvio de webhook) é ignorado se já estiver marcado como pago

---

## 🔄 Fluxo completo

1. Cliente escolhe produto na loja → ticket é criado pelo bot externo
2. Equipe de vendas usa `/painel-pagamento` dentro do ticket
3. Clica em **💳 Gerar Cobrança** → bot lê o ticket, cria o Pix no Mercado Pago, mostra QR Code + código copia-e-cola
4. Cliente paga
5. Mercado Pago notifica o webhook → bot confirma, atualiza status, avisa o atendente no ticket, registra log e comprovante
6. Projeto pode começar
