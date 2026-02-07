# MVP — Sistema de Gift Cards Digitais (Takeat)

Este projeto foi desenvolvido como um **MVP de Gift Cards Digitais**, com foco em validação rápida para restaurantes, seguindo o desafio técnico proposto pela Takeat.

O sistema permite:

- Restaurantes criarem e gerenciarem gift cards
- Clientes comprarem gift cards digitais
- Clientes consultarem Gift Cards com autenticação via WhatsApp
- Automação de mensagens via fila de eventos (simulação de WhatsApp)

---

# 🚀 Como rodar o projeto

## Pré-requisitos

- Node.js 18+
- Conta no Supabase (PostgreSQL)
- Git instalado (opcional)

## 1. Instalar dependências

Dentro da pasta do projeto:

```bash```
npm install

## 2. Configurar variáveis de ambiente
-PORT=3001
-SUPABASE_URL=SEU_URL_SUPABASE
-SUPABASE_ANON_KEY=SUA_ANON_KEY
-NODE_ENV=development
-SHOW_OTP=true

## 3. Rodar o projeto
npm run dev

Servidor disponível em:
-API: http://localhost:3001
-Gestor: http://localhost:3001/gestor
-Cliente Compra: http://localhost:3001/cliente/compra
-Cliente Consulta: http://localhost:3001/cliente/consulta

---

## ✅ Requisitos do desafio - Takeat

### 1. Interface Gestor
O gestor consegue criar, ativar/desativar e abater saldo de gift cards.

![Gestor — Login](public/docs/images/gestor-login.png)
![Gestor — Lista de Gift Cards](public/docs/images/gestor-listaGiftCard.png)


### 2. Interface Cliente — Consulta
### 3. Interface Cliente — Compra
### 4. Automações / WhatsApp
### 5. Uso de IA / Vibe Code
