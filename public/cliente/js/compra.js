/**
 * Ajuste estas duas constantes para o seu ambiente.
 * - API_BASE: se o frontend está sendo servido pelo mesmo servidor, pode ser "".
 * - RESTAURANTE_ID: no MVP, pode ser fixo.
 */
const API_BASE = "http://localhost:3001"; // ex: "http://localhost:3001"
const RESTAURANTE_ID = "0bab7d6b-ff79-4828-a28f-c9c57143d120"; // troque se necessário

// =========================
// Estado
// =========================
let compraAtual = null; // { id, status, ... }
let valorSelecionado = 0; // valor vindo dos botões
let timerInterval = null;
let expiraEmMs = 0;

// =========================
// Elementos - Compra (tela 1)
// =========================
const compraGrid = document.querySelector(".compra-grid");

const caixaAlerta = document.getElementById("alert"); // alerta da tela de compra (se existir)
const opcoesValor = Array.from(document.querySelectorAll(".opcao")); // botões de valor (novo layout)
const valorPersonalizado = document.getElementById("valorPersonalizado"); // input custom (novo layout)

const nomeComprador = document.getElementById("nomeComprador");
const nomePresenteado = document.getElementById("nomePresenteado");
const telefonePresenteado = document.getElementById("telefonePresenteado");

const botaoCriarCompra = document.getElementById("btnCriarCompra");

// Resumo (opcional)
const resumoValor = document.getElementById("resumoValor");
const resumoTotal = document.getElementById("resumoTotal");

// =========================
// Elementos - Pagamento (tela 2)
// =========================
const telaPagamento = document.getElementById("telaPagamento");
const timerPagamento = document.getElementById("timerPagamento");
const pagamentoValor = document.getElementById("pagamentoValor");
const pagamentoPresenteado = document.getElementById("pagamentoPresenteado");
const pagamentoTelefone = document.getElementById("pagamentoTelefone");

const botaoVoltar = document.getElementById("btnVoltar");
const botaoConfirmarPagamento = document.getElementById("btnConfirmarPagamento");
const pagamentoAlerta = document.getElementById("pagamentoAlerta");

// =========================
// Elementos - Sucesso (tela 3)
// =========================
const telaSucesso = document.getElementById("telaSucesso");
const resCompraId = document.getElementById("resCompraId");
const resStatus = document.getElementById("resStatus");
const resCodigo = document.getElementById("resCodigo");
const resSaldo = document.getElementById("resSaldo");
const botaoNovaCompra = document.getElementById("btnNovaCompra");

// =========================
// Helpers visuais
// =========================
function mostrarErro(el, mensagem, campo) {
  if (!el) return;
  el.textContent = mensagem;
  el.hidden = false;
  if (campo) campo.classList.add("input--error");
}

function limparErro(el) {
  if (el) {
    el.hidden = true;
    el.textContent = "";
  }
  document.querySelectorAll(".input--error").forEach((x) => x.classList.remove("input--error"));
}

function formatarBRL(valor) {
  const v = Number(valor || 0);
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function definirCarregando(estaCarregando) {
  if (!botaoCriarCompra) return;
  botaoCriarCompra.disabled = estaCarregando;
  botaoCriarCompra.textContent = estaCarregando ? "Processando..." : "Comprar";
}

// =========================
// Normalizações / validação
// =========================
function normalizarTelefone(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function obterValorFinal() {
  const textoDigitado = String(valorPersonalizado?.value || "").replace(",", ".").trim();
  const valorDigitado = textoDigitado ? Number(textoDigitado) : null;

  if (textoDigitado && (Number.isNaN(valorDigitado) || valorDigitado <= 0)) {
    return { ok: false, erro: "Valor digitado inválido. Use um número maior que 0." };
  }

  const valorFinal = textoDigitado ? valorDigitado : valorSelecionado;

  if (!valorFinal || valorFinal <= 0) {
    return { ok: false, erro: "Selecione um valor (ou digite um valor válido)." };
  }

  return { ok: true, valor: valorFinal };
}

function validarCampos() {
  const valor = obterValorFinal();
  if (!valor.ok) return valor;

  const comprador = (nomeComprador?.value || "").trim();
  const presenteado = (nomePresenteado?.value || "").trim();
  const telefone = normalizarTelefone(telefonePresenteado?.value);

  if (!presenteado) {
    return { ok: false, erro: "Informe o nome de quem está recebendo.", campo: nomePresenteado };
  }

  if (!telefone || telefone.length < 10) {
    return {
      ok: false,
      erro: "Telefone do presenteado inválido. Envie DDI+DDD+número. Ex: 5511999999999",
      campo: telefonePresenteado
    };
  }

  return { ok: true, valor: valor.valor, comprador, presenteado, telefone };
}

// =========================
// Seleção de valores (botões)
// =========================
function atualizarResumo(valor) {
  if (resumoValor) resumoValor.textContent = formatarBRL(valor);
  if (resumoTotal) resumoTotal.textContent = formatarBRL(valor);
}

opcoesValor.forEach((btn) => {
  btn.addEventListener("click", () => {
    // marca ativo
    opcoesValor.forEach((b) => b.classList.remove("ativa"));
    btn.classList.add("ativa");

    valorSelecionado = Number(btn.dataset.valor || 0);

    // limpa valor digitado
    if (valorPersonalizado) valorPersonalizado.value = "";

    atualizarResumo(valorSelecionado);
  });
});

if (valorPersonalizado) {
  valorPersonalizado.addEventListener("input", () => {
    // se digitar, desmarca opções
    opcoesValor.forEach((b) => b.classList.remove("ativa"));
    valorSelecionado = 0;

    const v = Number(String(valorPersonalizado.value || "").replace(",", ".") || 0);
    atualizarResumo(v);
  });
}

// =========================
// Troca de telas
// =========================
function mostrarTelaCompra() {
  if (timerInterval) clearInterval(timerInterval);

  if (telaPagamento) telaPagamento.hidden = true;
  if (telaSucesso) telaSucesso.hidden = true;
  if (compraGrid) compraGrid.hidden = false;

  compraGrid?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function iniciarTimer5Min() {
  expiraEmMs = Date.now() + 5 * 60 * 1000;

  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    const resto = expiraEmMs - Date.now();

    if (resto <= 0) {
      clearInterval(timerInterval);
      if (timerPagamento) timerPagamento.textContent = "00:00";
      if (botaoConfirmarPagamento) botaoConfirmarPagamento.disabled = true;
      mostrarErro(pagamentoAlerta, "Tempo expirado. Volte e gere um novo pagamento.");
      return;
    }

    const totalSeg = Math.floor(resto / 1000);
    const mm = String(Math.floor(totalSeg / 60)).padStart(2, "0");
    const ss = String(totalSeg % 60).padStart(2, "0");
    if (timerPagamento) timerPagamento.textContent = `${mm}:${ss}`;
  }, 250);
}

function mostrarTelaPagamentoComDados({ valor, presenteado, telefone }) {
  if (!telaPagamento) return;

  // preenche info
  if (pagamentoValor) pagamentoValor.textContent = formatarBRL(valor);
  if (pagamentoPresenteado) pagamentoPresenteado.textContent = presenteado || "-";
  if (pagamentoTelefone) pagamentoTelefone.textContent = telefone || "-";

  // habilita confirmar
  if (botaoConfirmarPagamento) botaoConfirmarPagamento.disabled = false;

  // troca telas
  limparErro(caixaAlerta);
  limparErro(pagamentoAlerta);

  if (compraGrid) compraGrid.hidden = true;
  if (telaSucesso) telaSucesso.hidden = true;
  telaPagamento.hidden = false;

  iniciarTimer5Min();
  telaPagamento.scrollIntoView({ behavior: "smooth", block: "start" });
}

function mostrarTelaSucessoComResultado(dados) {
  if (!telaSucesso) return;

  if (timerInterval) clearInterval(timerInterval);

  // Tenta mapear retorno de vários formatos
  const status = dados?.status || dados?.compra?.status || "pago";
  const codigo = dados?.cartao?.codigo || dados?.cartao_codigo || dados?.codigo || "-";
  const saldo = dados?.cartao?.saldo ?? dados?.saldo ?? null;

  if (resCompraId) resCompraId.textContent = compraAtual?.id || dados?.id || "-";
  if (resStatus) resStatus.textContent = status;
  if (resCodigo) resCodigo.textContent = codigo;
  if (resSaldo) resSaldo.textContent = saldo == null ? "-" : formatarBRL(Number(saldo));

  // troca telas
  if (telaPagamento) telaPagamento.hidden = true;
  telaSucesso.hidden = false;

  telaSucesso.scrollIntoView({ behavior: "smooth", block: "start" });
}

// =========================
// 1) Criar compra (pendente) -> mostra tela pagamento
// =========================
async function criarCompra() {
  limparErro(caixaAlerta);

  const valid = validarCampos();
  if (!valid.ok) {
    mostrarErro(caixaAlerta, valid.erro, valid.campo || valorPersonalizado);
    return;
  }

  definirCarregando(true);

  try {
    const payload = {
      restauranteId: RESTAURANTE_ID,
      valor: valid.valor,
      compradorNome: valid.comprador || undefined,
      nomePresenteado: valid.presenteado, // ✅ agora bate com o service
      telefonePresenteado: valid.telefone
    };

    const resposta = await fetch(`${API_BASE}/api/public/compras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      throw new Error(dados?.error || "Falha ao criar compra");
    }

    compraAtual = dados; // esperado: { id, status, ... }
    if (!compraAtual?.id) {
      throw new Error("Compra criada, mas não veio o ID.");
    }

    // Mostra tela de pagamento simulada
    mostrarTelaPagamentoComDados({
      valor: valid.valor,
      presenteado: valid.presenteado,
      telefone: valid.telefone
    });

  } catch (erro) {
    mostrarErro(caixaAlerta, erro.message || "Erro ao criar compra");
  } finally {
    definirCarregando(false);
  }
}

// Clique no botão Comprar
if (botaoCriarCompra) {
  botaoCriarCompra.addEventListener("click", (e) => {
    e.preventDefault();
    criarCompra();
  });
}

// =========================
// 2) Confirmar pagamento (simulado) -> gera giftcard
// =========================
async function confirmarPagamentoSimulado() {
  limparErro(pagamentoAlerta);

  if (!compraAtual?.id) {
    mostrarErro(pagamentoAlerta, "Nenhuma compra criada ainda.");
    return;
  }

  // se expirou, bloqueia
  if (Date.now() > expiraEmMs) {
    if (botaoConfirmarPagamento) botaoConfirmarPagamento.disabled = true;
    mostrarErro(pagamentoAlerta, "Tempo expirado. Volte e gere um novo pagamento.");
    return;
  }

  if (botaoConfirmarPagamento) {
    botaoConfirmarPagamento.disabled = true;
    botaoConfirmarPagamento.textContent = "Confirmando...";
  }

  try {
    const resposta = await fetch(`${API_BASE}/api/public/compras/${compraAtual.id}/confirmar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pago: true, simulado: true })
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      throw new Error(dados?.error || "Falha ao confirmar pagamento");
    }

    mostrarTelaSucessoComResultado(dados);

  } catch (erro) {
    mostrarErro(pagamentoAlerta, erro.message || "Erro ao confirmar pagamento");
    if (botaoConfirmarPagamento) botaoConfirmarPagamento.disabled = false;
  } finally {
    if (botaoConfirmarPagamento) {
      botaoConfirmarPagamento.textContent = "Confirmar pagamento";
    }
  }
}

if (botaoConfirmarPagamento) {
  botaoConfirmarPagamento.addEventListener("click", confirmarPagamentoSimulado);
}

// =========================
// Voltar (da tela de pagamento)
// =========================
if (botaoVoltar) {
  botaoVoltar.addEventListener("click", () => {
    mostrarTelaCompra();
  });
}

// =========================
// Nova compra (reset geral)
// =========================
function resetarTudo() {
  compraAtual = null;
  valorSelecionado = 0;

  // inputs
  opcoesValor.forEach((b) => b.classList.remove("ativa"));
  if (valorPersonalizado) valorPersonalizado.value = "";
  if (nomeComprador) nomeComprador.value = "";
  if (nomePresenteado) nomePresenteado.value = "";
  if (telefonePresenteado) telefonePresenteado.value = "";

  atualizarResumo(0);

  // limpa alertas
  limparErro(caixaAlerta);
  limparErro(pagamentoAlerta);

  // reset timer
  if (timerInterval) clearInterval(timerInterval);
  expiraEmMs = 0;
  if (timerPagamento) timerPagamento.textContent = "05:00";

  // reset botão confirmar
  if (botaoConfirmarPagamento) {
    botaoConfirmarPagamento.disabled = true;
    botaoConfirmarPagamento.textContent = "Confirmar pagamento";
  }

  mostrarTelaCompra();
}

if (botaoNovaCompra) {
  botaoNovaCompra.addEventListener("click", resetarTudo);
}

// Inicial: confirmar pagamento desabilitado
if (botaoConfirmarPagamento) botaoConfirmarPagamento.disabled = true;
