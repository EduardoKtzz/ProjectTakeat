// ======================================================
// TELA DE COMPRA - MVP GIFT CARDS
// - Cria compra (pendente)
// - Mostra tela de pagamento (simulado)
// - Confirma pagamento (simulado) e exibe sucesso
//
// MELHORIAS APLICADAS NESTA VERSÃO:
// ✅ Máscara de telefone no campo telefonePresenteado
// ✅ Normalização e envio do telefone no padrão WhatsApp (E.164): +55DDDNÚMERO
// ✅ Correção de bug: "campoTelefone" não existia no seu código
// ✅ Validação coerente (usuário digita (DD) 9XXXX-XXXX e sistema envia +55...)
// ✅ Evita erro de duplicar 55 (se usuário colar 5511... nós tratamos)
// ======================================================


// =========================
// VARIAVEIS DA API
// =========================
const API_BASE = "http://localhost:3001";
const RESTAURANTE_ID = "0bab7d6b-ff79-4828-a28f-c9c57143d120"; // AQUI VAI DEPENDER DO RESTAURANTE

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

// ======================================================
// TELEFONE: MÁSCARA + NORMALIZAÇÃO (WhatsApp / E.164)
// ======================================================

/**
 * Aplica máscara brasileira:
 * - Fixo:    (11) 3232-3232
 * - Celular: (11) 91234-5678
 *
 * Obs: Aqui a pessoa digita apenas DDD + número.
 * O +55 não entra no input (ideal).
 */
function aplicarMascaraTelefone(valor) {
  valor = String(valor || "").replace(/\D/g, ""); // remove tudo que não é número

  // se usuário colar "55..." no começo, removemos para manter só DDD+numero no input
  // Isso evita que a pessoa digite "551199..." e fique estranho com a máscara.
  if (valor.startsWith("55") && valor.length >= 12) {
    valor = valor.slice(2);
  }

  // limita em 11 dígitos (DDD + celular)
  if (valor.length > 11) {
    valor = valor.slice(0, 11);
  }

  // Telefone fixo: (11) 3232-3232 (10 dígitos)
  if (valor.length <= 10) {
    return valor.replace(/^(\d{2})(\d{4})(\d{0,4})$/, "($1) $2-$3");
  }

  // Celular: (11) 91234-5678 (11 dígitos)
  return valor.replace(/^(\d{2})(\d{5})(\d{0,4})$/, "($1) $2-$3");
}

/**
 * Converte o valor do input mascarado para o padrão WhatsApp (E.164):
 * - Entrada: "(11) 91234-5678"
 * - Saída:   "+5511912345678"
 *
 * Aceita 10 ou 11 dígitos após limpeza:
 * - 10 dígitos: DDD + fixo
 * - 11 dígitos: DDD + celular
 */
function formatarTelefoneParaWhatsApp(valorMascara) {
  const numeros = String(valorMascara || "").replace(/\D/g, "");

  // aceita somente 10 ou 11 dígitos (DDD + número)
  if (!(numeros.length === 10 || numeros.length === 11)) {
    return null;
  }

  return `+55${numeros}`;
}

/**
 * Usado para validar e padronizar telefone antes de enviar.
 * Retorna:
 *  - { ok: true, telefoneE164: "+55..." }
 *  - { ok: false, erro: "..." }
 */
function validarEFormatarTelefone(telefoneDigitado) {
  const telefoneE164 = formatarTelefoneParaWhatsApp(telefoneDigitado);

  if (!telefoneE164) {
    return {
      ok: false,
      erro: "Telefone inválido. Digite no formato (DD) 9XXXX-XXXX ou (DD) XXXX-XXXX."
    };
  }

  return { ok: true, telefoneE164 };
}

// =========================
// Normalizações / validação
// =========================
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

  // Aqui, o usuário digita com máscara. Nós validamos e convertemos para +55...
  const telCheck = validarEFormatarTelefone(telefonePresenteado?.value || "");

  if (!presenteado) {
    return { ok: false, erro: "Informe o nome de quem está recebendo.", campo: nomePresenteado };
  }

  if (!telCheck.ok) {
    return { ok: false, erro: telCheck.erro, campo: telefonePresenteado };
  }

  return {
    ok: true,
    valor: valor.valor,
    comprador,
    presenteado,
    telefone: telCheck.telefoneE164 // ✅ já vai no formato +55...
  };
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

  // Se quiser mostrar o telefone com máscara na tela de pagamento, dá para mascarar de volta:
  // (mas como agora ele vem em +55..., fazemos um ajuste simples)
  if (pagamentoTelefone) {
    const telSoNumeros = String(telefone || "").replace(/\D/g, "");
    // telSoNumeros esperado: 55 + DDD + número -> remove 55 para exibir como BR
    const sem55 = telSoNumeros.startsWith("55") ? telSoNumeros.slice(2) : telSoNumeros;
    pagamentoTelefone.textContent = aplicarMascaraTelefone(sem55);
  }

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
      nomePresenteado: valid.presenteado, // ✅ bate com o service
      telefonePresenteado: valid.telefone  // ✅ agora vai como +55...
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

// ======================================================
// EVENTO: máscara aplicada no input REAL (telefonePresenteado)
// ======================================================
if (telefonePresenteado) {
  telefonePresenteado.addEventListener("input", (evento) => {
    evento.target.value = aplicarMascaraTelefone(evento.target.value);
  });
}
