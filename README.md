# ProjectTakeat — MVP Gift Cards (Cliente + Gestor)

MVP de **Gift Cards para restaurantes**, com fluxo completo de:
- autenticação do **cliente via OTP (WhatsApp simulado via fila)**,
- **painel do gestor** (login, restaurantes, criação e gestão de cartões),
- **compra pública** com confirmação de pagamento simulada,
- persistência em **Supabase**.

> Objetivo: demonstrar entrega ponta-a-ponta e arquitetura organizada (routes → controllers → services → repositories).

---

## 📌 Funcionalidades

### Cliente (público)
- Solicitar OTP por telefone (BR)
- Validar OTP e gerar sessão (token Bearer)
- Listar gift cards do telefone autenticado

### Compra (pública)
- Criar compra
- Confirmar pagamento (simulado)

### Gestor (admin)
- Login com e-mail e senha (bcrypt)
- Listar restaurantes
- Listar gift cards por restaurante
- Criar gift card manualmente
- Alterar status (ativo/inativo)
- Abater saldo do gift card (parcial ou total)
- Listar transações do cartão
- Atualizar WhatsApp do restaurante

---

## 🧱 Stack
- Node.js + Express + TypeScript
- Supabase (DB)
- bcrypt (hash de senha)
- Autenticação por token Bearer (sessões)
- Frontend simples em HTML/CSS/JS (pasta `public/`)

---

## 🗂️ Estrutura
- `src/app.ts` → app Express + rotas + estáticos
- `src/server.ts` → start do servidor
- `src/routes/` → rotas do gestor e público/cliente
- `src/controllers/` → controllers
- `src/services/` → regras de negócio
- `src/repositories/` → acesso ao Supabase
- `public/` → páginas do cliente e gestor (HTML/CSS/JS)

---

## 🧾 Tabelas no Supabase (referência)
Este projeto utiliza tabelas como:
- `usuarios`
- `restaurantes`
- `cartoes_presente`
- `transacoes_cartao_presente`
- `otp_codes`
- `sessoes_cliente`
- `sessoes_gestor`
- `fila_mensagens`
- `compras`

---

## ⚙️ Variáveis de ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
PORT=3001
SUPABASE_URL=
SUPABASE_ANON_KEY=
NODE_ENV=development
SHOW_OTP=true
