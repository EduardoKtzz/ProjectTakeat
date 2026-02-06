

const API = {
  URL_BASE: "http://localhost:3001",
  PREFIXO: "/api/gestor",

  LISTAR_RESTAURANTES: "/restaurantes",
  LISTAR_CARTOES: (restId) => `/restaurantes/${restId}/cartoes`,

  ALTERAR_STATUS: (cartaoId) => `/cartoes/${cartaoId}/status`,
  ABATER: (cartaoId) => `/cartoes/${cartaoId}/abater`,
  TRANSACOES: (cartaoId) => `/cartoes/${cartaoId}/transacoes`,
};

const CHAVES = {
  token: "gestor_token",
  expiraEm: "gestor_expira_em",
  email: "gestor_email",
};

const URL_LOGIN = "../cliente/compra.html";

const el = {
  // cards
  cardSelect: document.getElementById("cardSelect"),
  cardResultado: document.getElementById("cardResultado"),

  // select
  selectRestaurante: document.getElementById("selectRestaurante"),
  restInfo: document.getElementById("restInfo"),
  btnContinuar: document.getElementById("btnContinuar"),

  // resultado
  nomeRestSelecionado: document.getElementById("nomeRestSelecionado"),
  btnTrocarRest: document.getElementById("btnTrocarRest"),

  listaCartoes: document.getElementById("listaCartoes"),
  listaVazia: document.getElementById("listaVazia"),
  loading: document.getElementById("loading"),
  alert: document.getElementById("alert"),
  alertSelect: document.getElementById("alertSelect"),

  // sair
  btnSair: document.getElementById("btnSair"),

  buscaCodigo: document.getElementById("buscaCodigo"),


  // MODAL ABATER
  modalAbater: document.getElementById("modalAbater"),
  abaterSub: document.getElementById("abaterSub"),
  abaterValor: document.getElementById("abaterValor"),
  abaterAlert: document.getElementById("abaterAlert"),
  btnConfirmarAbater: document.getElementById("btnConfirmarAbater"),

  // MODAL EXTRATO
  modalExtrato: document.getElementById("modalExtrato"),
  extratoSub: document.getElementById("extratoSub"),
  extratoLoading: document.getElementById("extratoLoading"),
  extratoVazio: document.getElementById("extratoVazio"),
  extratoAlert: document.getElementById("extratoAlert"),
  extratoLista: document.getElementById("extratoLista"),
};

let cacheRestaurantes = [];
let restauranteAtualId = null;
let cartoesAtuais = [];

let cartaoSelecionado = null; // pro modal abater/extrato

function limparSessao() {
  localStorage.removeItem(CHAVES.token);
  localStorage.removeItem(CHAVES.expiraEm);
  localStorage.removeItem(CHAVES.email);
}

function obterTokenValido() {
  const token = localStorage.getItem(CHAVES.token);
  const expiraEm = localStorage.getItem(CHAVES.expiraEm);
  if (!token || !expiraEm) return null;

  const exp = /^\d+$/.test(expiraEm) ? Number(expiraEm) : new Date(expiraEm).getTime();
  if (!Number.isFinite(exp)) {
    limparSessao();
    return null;
  }
  if (Date.now() > exp) {
    limparSessao();
    return null;
  }
  return token;
}

function irParaLogin() {
  window.location.href = URL_LOGIN;
}

function mostrarSelecao() {
  el.cardSelect.hidden = false;
  el.cardResultado.hidden = true;

  clearAlert();
  setEmptyVisible(false);
  setListVisible(false);
  el.nomeRestSelecionado.textContent = "—";

  restauranteAtualId = null;
  cartoesAtuais = [];
}

function mostrarResultado() {
  el.cardSelect.hidden = true;
  el.cardResultado.hidden = false;
}

function setLoading(isLoading) {
  el.loading.hidden = !isLoading;
  el.btnContinuar.disabled = isLoading || !el.selectRestaurante.value;
  el.selectRestaurante.disabled = isLoading;
}

function setAlert(msg) {
  el.alert.textContent = msg;
  el.alert.hidden = false;
}
function clearAlert() {
  el.alert.hidden = true;
  el.alert.textContent = "";
  el.alertSelect.hidden = true;
  el.alertSelect.textContent = "";
}

function setEmptyVisible(v) {
  el.listaVazia.hidden = !v;
}
function setListVisible(v) {
  el.listaCartoes.hidden = !v;
}

function formatBRL(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "-";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarDataHoraBR(valor) {
  if (!valor) return "—";

  const s = String(valor).trim();

  // ✅ Se vier como DATE do Supabase ("YYYY-MM-DD"), NÃO usa Date()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return formatarDataBR(s);
  }

  // ✅ Se vier ISO com hora (created_at etc), aí sim usa Date()
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarDataBR(dataYMD) {
  if (!dataYMD) return "—";

  // aceita "YYYY-MM-DD"
  const s = String(dataYMD).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "—";

  const [ano, mes, dia] = s.split("-");
  return `${dia}/${mes}/${ano}`;
}

/**
 * Requisição padrão (com suporte a body)
 */
async function requisicaoApi(caminho, { metodo = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API.URL_BASE}${API.PREFIXO}${caminho}`, {
    method: metodo,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || data?.message || "Erro ao carregar.");

  return data;
}

function getNomeRestaurante(restauranteId) {
  const r = cacheRestaurantes.find((x) => x.id === restauranteId);
  return r?.nome || restauranteId;
}

/**
 * Render com botões por gift card (Abater / Extrato / Status)
 */
function renderizarCartoes(cartoes) {
  el.listaCartoes.innerHTML = "";

  cartoes.forEach((c) => {

    const statusRaw = String(c.status || "").toLowerCase().trim();
    const isAtivo = statusRaw === "ativo";

    const card = document.createElement("div");
    card.className = "gcard";

    card.innerHTML = `
      <div class="gcard__top">
        <div class="gcard__code">${c.codigo || "—"}</div>
        <div class="gcard__status" data-status="${statusRaw}">${c.status || "—"}</div>
      </div>

      <div class="gcard__body">
        <div>
          <div class="gcard__label">Saldo</div>
          <div class="gcard__value">${formatBRL(c.saldo ?? 0)}</div>
        </div>

        <div>
          <div class="gcard__label">Validade</div>
          <div class="gcard__value">${formatarDataHoraBR(c.validade_em || c.validadeEm || c.validade)}</div>
        </div>

        <div class="gcard__actions">
          <button class="gbtn" type="button" data-acao="abater" data-id="${c.id}">
            <i class="fa-solid fa-minus"></i> Abater
          </button>

          <button class="gbtn gbtn--ghost" type="button" data-acao="extrato" data-id="${c.id}">
            <i class="fa-solid fa-receipt"></i> Extrato
          </button>

            <button class="gbtn gbtn--danger" type="button" data-acao="status" data-id="${c.id}">
            <i class="fa-solid fa-power-off"></i> ${isAtivo ? "Desativar" : "Ativar"}
            </button>
        </div>
      </div>
    `;

    el.listaCartoes.appendChild(card);
  });
}

/**
 * Carrega restaurantes
 */
async function carregarRestaurantes() {
  const token = obterTokenValido();
  if (!token) return irParaLogin();

  clearAlert();
  setLoading(true);

  try {
    const restaurantes = await requisicaoApi(API.LISTAR_RESTAURANTES, { token });
    cacheRestaurantes = Array.isArray(restaurantes) ? restaurantes : [];

    el.selectRestaurante.innerHTML = `<option value="">Selecione um restaurante...</option>`;

    cacheRestaurantes.forEach((r) => {
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = r.nome || r.id;
      el.selectRestaurante.appendChild(opt);
    });

    el.restInfo.textContent = `${cacheRestaurantes.length} restaurante(s) encontrado(s).`;
  } catch (e) {
    el.alertSelect.textContent = e.message || "Erro ao carregar restaurantes.";
    el.alertSelect.hidden = false;
    el.selectRestaurante.innerHTML = `<option value="">Erro ao carregar</option>`;
  } finally {
    setLoading(false);
  }
}

/**
 * Carrega cartões do restaurante selecionado
 */
async function carregarCartoesDoRestaurante(restauranteId) {
  const token = obterTokenValido();
  if (!token) return irParaLogin();

  clearAlert();
  setEmptyVisible(false);
  setListVisible(false);
  setLoading(true);

  try {
    const cartoes = await requisicaoApi(API.LISTAR_CARTOES(restauranteId), { token });
    const lista = Array.isArray(cartoes) ? cartoes : (cartoes.data || cartoes.cartoes || []);

    restauranteAtualId = restauranteId;
    cartoesAtuais = lista;

    if (el.buscaCodigo) el.buscaCodigo.value = "";

    el.nomeRestSelecionado.textContent = `${getNomeRestaurante(restauranteId)}`;

    if (!lista.length) {
      setEmptyVisible(true);
      setListVisible(false);
    } else {
      renderizarCartoes(lista);
      setListVisible(true);
      setEmptyVisible(false);
    }
  } catch (e) {
    setAlert(e.message || "Erro ao carregar cartões.");
  } finally {
    setLoading(false);
  }
}

/* =======================
   MODAL: ABATER
======================= */
function abrirModalAbater(cartao) {
  cartaoSelecionado = cartao;
  el.abaterAlert.hidden = true;
  el.abaterAlert.textContent = "";
  el.abaterValor.value = "";

  el.abaterSub.textContent = `${cartao.codigo || "—"} • Saldo atual: ${formatBRL(cartao.saldo ?? 0)}`;
  el.modalAbater.hidden = false;
}

function fecharModalAbater() {
  el.modalAbater.hidden = true;
  cartaoSelecionado = null;
}

async function confirmarAbater() {
  const token = obterTokenValido();
  if (!token) return irParaLogin();

  const valor = Number(el.abaterValor.value);
  if (!valor || valor <= 0) {
    el.abaterAlert.textContent = "Digite um valor válido para abater.";
    el.abaterAlert.hidden = false;
    return;
  }

  try {
    el.btnConfirmarAbater.disabled = true;

    // rota real: POST /cartoes/:id/abater
    await requisicaoApi(API.ABATER(cartaoSelecionado.id), {
      metodo: "POST",
      token,
      body: { valor },
    });

    fecharModalAbater();

    // Recarrega lista do restaurante
    if (restauranteAtualId) await carregarCartoesDoRestaurante(restauranteAtualId);
  } catch (e) {
    el.abaterAlert.textContent = e.message || "Erro ao abater.";
    el.abaterAlert.hidden = false;
  } finally {
    el.btnConfirmarAbater.disabled = false;
  }
}

/* =======================
   MODAL: EXTRATO
======================= */
function abrirModalExtrato(cartao) {
  cartaoSelecionado = cartao;
  el.extratoAlert.hidden = true;
  el.extratoAlert.textContent = "";
  el.extratoLista.hidden = true;
  el.extratoLista.innerHTML = "";
  el.extratoVazio.hidden = true;

  el.extratoSub.textContent = `${cartao.codigo || "—"} • Saldo atual: ${formatBRL(cartao.saldo ?? 0)}`;
  el.modalExtrato.hidden = false;
}

function fecharModalExtrato() {
  el.modalExtrato.hidden = true;
  cartaoSelecionado = null;
}

async function carregarExtrato(cartaoId) {
  const token = obterTokenValido();
  if (!token) return irParaLogin();

  el.extratoLoading.hidden = false;

  try {
    // rota real: GET /cartoes/:id/transacoes
    const transacoes = await requisicaoApi(API.TRANSACOES(cartaoId), { token });

    const lista = Array.isArray(transacoes)
      ? transacoes
      : (transacoes.data || transacoes.transacoes || []);

    el.extratoLoading.hidden = true;

    if (!lista.length) {
      el.extratoVazio.hidden = false;
      el.extratoLista.hidden = true;
      return;
    }

    el.extratoLista.innerHTML = lista
      .map((t) => {
        // tenta mapear campos comuns
        const data = formatarDataHoraBR(
          t.created_at || t.criado_em || t.data
        );        
        let valor = Number(t.valor ?? t.amount ?? 0);

        // regra: abatimento sempre aparece como negativo
        const tipoRaw = String(t.tipo || "").toLowerCase();

        if (tipoRaw.includes("abat")) {
          valor = -Math.abs(valor);
        }

        if (tipoRaw.includes("emis")) {
          valor = Math.abs(valor);
        }
        const classe = valor >= 0 ? "positivo" : "negativo";
        const valorFmt = formatBRL(Math.abs(valor));

      const titulo =t.tipo ||t.descricao ||(ehEmissao ? "Emissão" : ehAbatimento ? "Abatimento" : valor >= 0 ? "Crédito" : "Débito");        
      const detalhe = t.referencia || t.pedido_id || t.pedidoId || "";

        return `
          <div class="extrato__row">
            <div class="extrato__left">
              <strong>${titulo}</strong>
              <small>${data}${detalhe ? ` • ${detalhe}` : ""}</small>
            </div>
            <div class="extrato__right ${classe}">
              ${valor < 0 ? "-" : "+"} ${valorFmt}
            </div>
          </div>
        `;
      })
      .join("");

    el.extratoLista.hidden = false;
  } catch (e) {
    el.extratoLoading.hidden = true;
    el.extratoAlert.textContent = e.message || "Erro ao carregar extrato.";
    el.extratoAlert.hidden = false;
  }
}

/* =======================
   STATUS: ATIVAR/DESATIVAR
======================= */
async function alternarStatus(cartao) {
  const token = obterTokenValido();
  if (!token) return irParaLogin();

  try {
    // rota real: PATCH /cartoes/:id/status
    // OBS: não sei se seu controller espera body (ex: {status:"ativo"}), então mando o status desejado.
    const statusAtual = String(cartao.status || "").toLowerCase().trim();
    const novoStatus = statusAtual === "ativo" ? "inativo" : "ativo";

    await requisicaoApi(API.ALTERAR_STATUS(cartao.id), {
      metodo: "PATCH",
      token,
      body: { status: novoStatus },
    });

    if (restauranteAtualId) await carregarCartoesDoRestaurante(restauranteAtualId);
  } catch (e) {
    setAlert(e.message || "Erro ao alterar status.");
  }
}

/* =======================
   EVENTOS
======================= */

if (el.buscaCodigo) {
  el.buscaCodigo.addEventListener("input", () => {
    const termo = el.buscaCodigo.value.trim().toLowerCase();

    const filtrados = termo
      ? cartoesAtuais.filter((c) => String(c.codigo || "").toLowerCase().includes(termo))
      : cartoesAtuais;

    if (!filtrados.length) {
      setEmptyVisible(true);
      setListVisible(false);
    } else {
      renderizarCartoes(filtrados);
      setListVisible(true);
      setEmptyVisible(false);
    }
  });
}

// seleção restaurante
el.selectRestaurante.addEventListener("change", () => {
  const id = el.selectRestaurante.value;
  el.btnContinuar.disabled = !id;
});

el.btnContinuar.addEventListener("click", async () => {
  const id = el.selectRestaurante.value;
  if (!id) return;

  mostrarResultado();
  await carregarCartoesDoRestaurante(id);
});

el.btnTrocarRest.addEventListener("click", () => {
  mostrarSelecao();
});

el.btnSair.addEventListener("click", () => {
  limparSessao();
  irParaLogin();
});

/**
 * Delegação de clique nos botões do card
 */
el.listaCartoes.addEventListener("click", async (ev) => {
  const btn = ev.target.closest("button[data-acao]");
  if (!btn) return;

  const acao = btn.getAttribute("data-acao");
  const id = btn.getAttribute("data-id");

  const cartao = cartoesAtuais.find((c) => String(c.id) === String(id));
  if (!cartao) return;

  if (acao === "abater") {
    abrirModalAbater(cartao);
  }

  if (acao === "extrato") {
    abrirModalExtrato(cartao);
    await carregarExtrato(cartao.id);
    console.log("TRANSACOES:", lista);

  }

  if (acao === "status") {
    await alternarStatus(cartao);
  }
});

/**
 * Modal closes (overlay + botões)
 */
document.addEventListener("click", (ev) => {
  const close = ev.target.closest("[data-close]");
  if (!close) return;

  const type = close.getAttribute("data-close");
  if (type === "abater") fecharModalAbater();
  if (type === "extrato") fecharModalExtrato();
});

el.btnConfirmarAbater.addEventListener("click", confirmarAbater);

/* INIT */
document.addEventListener("DOMContentLoaded", async () => {
  const token = obterTokenValido();
  if (!token) return irParaLogin();

  mostrarSelecao();
  await carregarRestaurantes();
});
