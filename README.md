# ProjectTakeat — MVP Gift Cards (Cliente + Gestor)

MVP de **Gift Cards para restaurantes**, com fluxo completo de:
- autenticação do **cliente via OTP (WhatsApp simulado via fila)**,
- **painel do gestor** (login, restaurantes, criação e gestão de cartões),
- **compra pública** e **consulta** com confirmação de pagamento simulada,
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
```

## ⚙️ Como rodar?

# instalar dependências
npm install

# rodar em dev (ajuste conforme seu package.json)
npm run dev

## 🧪 Roteiro de demo (3–5 minutos)

Abrir o cliente
Acessar http://localhost:3001/cliente/compra (ou telas em public/cliente)
Solicitar OTP com telefone
Em dev, o backend retorna o otp (ou você pode consultar a fila)
Validar OTP
Enviar OTP e obter token
Listar gift cards do telefone autenticado
Abrir o gestor
Acessar http://localhost:3001/gestor
Logar
Listar restaurantes
Criar gift card para um restaurante
Voltar ao cliente
Atualizar listagem e ver o cartão
(Opcional) testar abatimento e ver transações

