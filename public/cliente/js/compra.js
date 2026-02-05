/**
 * Ajuste estas duas constantes para o seu ambiente.
 * - API_BASE: se o frontend está sendo servido pelo mesmo servidor, pode ser "".
 * - RESTAURANTE_ID: no MVP, pode ser fixo.
 */
const API_BASE = ""; // ex: "http://localhost:3001"
const RESTAURANTE_ID = "0bab7d6b-ff79-4828-a28f-c9c57143d120"; // troque se necessário

// Estado da tela
let compraAtual = null;

// Elementos
const formulario = document.getElementById("form-compra");
const caixaAlerta = document.getElementById("alert");

const opcoesValor = Array.from(document.querySelectorAll(".value-card"));
const valorPersonalizado = document.getElementById("valorCustom");

const nomeComprador = document.getElementById("compradorNome");
const nomeRecebedor = document.getElementById("recebedorNome");
const telefonePresenteado = document.getElementById("telefonePresenteado");

const botaoCriarCompra = document.getElementById("btnCriarCompra");
const botaoConfirmarPagamento = document.getElementById("btnConfirmarPagamento");

const secaoResultado = document.getElementById("resultado");
const resCompraId = document.getElementById("resCompraId");
const resStatus = document.getElementById("resStatus");
const resCodigo = document.getElementById("resCodigo");
const resSaldo = document.getElementById("resSaldo");
const botaoNovaCompra = document.getElementById("btnNovaCompra");

/**
 * Helpers visuais
 */
function mostrarErro(mensagem, campo) {
  caixaAlerta.textContent = mensagem;
  caixaAlerta.hidden = false;

  // marca só o campo que realmente errou
  if (campo) campo.classList.add("input--error");
}

function limparErro() {
  caixaAlerta.hidden = true;
  caixaAlerta.textContent = "";

  // remove erro de todos os inputs (inclusive se tiver mais no futuro)
  document.querySelectorAll(".input--error").forEach((el) => {
    el.classList.remove("input--error");
  });
}

function definirCarregando(estaCarregando) {
  botaoCriarCompra.disabled = estaCarregando;
  if (!compraAtual) botaoConfirmarPagamento.disabled = true;
  botaoCriarCompra.textContent = estaCarregando ? "Processando..." : "Criar compra";
}

/**
 * Normaliza telefone para somente dígitos.
 * Isso evita mismatch com o backend/banco.
 */
function normalizarTelefone(valor) {
  return String(valor || "").replace(/\D/g, "");
}

/**
 * Lê o valor do gift card:
 * - se tem opção selecionada, usa ela
 * - se o usuário digitou valor personalizado, ele sobrescreve
 */
function obterValorSelecionado() {
  const opcaoAtiva = opcoesValor.find((c) => c.classList.contains("is-active"));
  const valorDaOpcao = opcaoAtiva ? Number(opcaoAtiva.dataset.value) : null;

  const textoDigitado = String(valorPersonalizado.value || "").replace(",", ".").trim();
  const valorDigitado = textoDigitado ? Number(textoDigitado) : null;

  if (textoDigitado && (Number.isNaN(valorDigitado) || valorDigitado <= 0)) {
    return { ok: false, erro: "Valor digitado inválido. Use um número maior que 0." };
  }

  const valorFinal = textoDigitado ? valorDigitado : valorDaOpcao;

  if (!valorFinal || valorFinal <= 0) {
    return { ok: false, erro: "Selecione um valor (ou digite um valor válido)." };
  }

  return { ok: true, valor: valorFinal };
}

/**
 * Seleção de opções de valor (cards)
 */
opcoesValor.forEach((opcao) => {
  opcao.addEventListener("click", () => {
    // desmarca todos
    opcoesValor.forEach((c) => c.classList.remove("is-active"));

    // marca o clicado
    opcao.classList.add("is-active");

    // reflete o valor no input
    valorPersonalizado.value = opcao.dataset.value;
  });
});

valorPersonalizado.addEventListener("input", () => {
  opcoesValor.forEach((c) => c.classList.remove("is-active"));
});

/**
 * 1) Criar compra (pendente)
 */
formulario.addEventListener("submit", async (e) => {
  e.preventDefault();
  limparErro();

  const resultadoValor = obterValorSelecionado();
  if (!resultadoValor.ok) {
    mostrarErro(resultadoValor.erro, valorPersonalizado);
    return;
  }

  const telPresente = normalizarTelefone(telefonePresenteado.value);

  if (!telPresente || telPresente.length < 10) {
    mostrarErro("Telefone do presenteado inválido. Envie DDI+DDD+número. Ex: 5511999999999", telefonePresenteado);
    return;
  }

  if (!recebedorNome.value.trim()) {
  mostrarErro("Informe o nome de quem está recebendo.", recebedorNome);
  return;
}

  definirCarregando(true);

  try {
    const payload = {
      restauranteId: RESTAURANTE_ID,
      valor: resultadoValor.valor,
      compradorNome: nomeComprador.value.trim() || undefined,
      telefonePresenteado: telPresente
    };

    const resposta = await fetch(`${API_BASE}/api/public/compras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados?.error || "Falha ao criar compra");
    }

    compraAtual = dados;

    // habilita o botão de confirmar pagamento
    botaoConfirmarPagamento.disabled = false;

    // mostra resultado parcial
    secaoResultado.hidden = false;
    resCompraId.textContent = compraAtual.id || "-";
    resStatus.textContent = compraAtual.status || "pendente";
    resCodigo.textContent = "-";
    resSaldo.textContent = "-";
  } catch (erro) {
    mostrarErro(erro.message || "Erro ao criar compra");
  } finally {
    definirCarregando(false);
  }
});


/**
 * 2) Confirmar pagamento (simulado)
 * Esperado: backend marca pago, gera gift card e devolve algo com cartao/codigo.
 */
botaoConfirmarPagamento.addEventListener("click", async () => {
  limparErro();

  if (!compraAtual?.id) {
    mostrarErro("Nenhuma compra criada ainda.");
    return;
  }

  botaoConfirmarPagamento.disabled = true;
  botaoConfirmarPagamento.textContent = "Confirmando...";

  try {
    const resposta = await fetch(`${API_BASE}/api/public/compras/${compraAtual.id}/confirmar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pago: true })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados?.error || "Falha ao confirmar pagamento");
    }

    const status = dados?.status || dados?.compra?.status || "pago";
    resStatus.textContent = status;

    const codigo = dados?.cartao?.codigo || dados?.cartao_codigo || dados?.codigo || "-";
    const saldo = dados?.cartao?.saldo ?? dados?.saldo ?? "-";

    resCodigo.textContent = codigo;
    resSaldo.textContent = saldo === "-" ? "-" : `R$ ${Number(saldo).toFixed(2)}`;
  } catch (erro) {
    mostrarErro(erro.message || "Erro ao confirmar pagamento");
    botaoConfirmarPagamento.disabled = false;
  } finally {
    botaoConfirmarPagamento.textContent = "Confirmar pagamento (simulado)";
  }
});

/**
 * Reset da tela para nova compra
 */
botaoNovaCompra.addEventListener("click", () => {
  compraAtual = null;

  // limpa inputs
  opcoesValor.forEach((c) => c.classList.remove("is-active"));
  valorPersonalizado.value = "";
  nomeComprador.value = "";
  nomeRecebedor.value = "";
  telefonePresenteado.value = "";

  // estado
  botaoConfirmarPagamento.disabled = true;
  secaoResultado.hidden = true;
  limparErro();
});
