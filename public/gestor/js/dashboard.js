const API = {
  URL_BASE: "http://localhost:3001",
  PREFIXO: "/api/gestor",

  LISTAR_RESTAURANTES: "/restaurantes",
  DASHBOARD: (restId) => `/restaurantes/${restId}/dashboard`,
};

const CHAVES = {
  token: "gestor_token",
  expiraEm: "gestor_expira_em",
  email: "gestor_email",
};

const URL_LOGIN = "../cliente/compra.html"; // mantenho igual seus outros
// se seu login do gestor for outro, troca aqui.

const el = {
  // telas
  cardSelect: document.getElementById("cardSelect"),
  cardDashboard: document.getElementById("cardDashboard"),

  // select
  selectRestaurante: document.getElementById("selectRestaurante"),
  restInfo: document.getElementById("restInfo"),
  alertSelect: document.getElementById("alertSelect"),
  btnContinuar: document.getElementById("btnContinuar"),

  // dashboard
  nomeRestSelecionado: document.getElementById("nomeRestSelecionado"),
  btnTrocarRest: document.getElementById("btnTrocarRest"),
  btnRecarregar: document.getElementById("btnRecarregar"),

  alert: document.getElementById("alert"),
  loading: document.getElementById("loading"),
  metricsGrid: document.getElementById("metricsGrid"),
  empty: document.getElementById("empty"),

  // métricas
  mCards: document.getElementById("m_cards"),
  mPurchases: document.getElementById("m_purchases"),
  mWhatsapp: document.getElementById("m_whatsapp"),
  mUses: document.getElementById("m_uses"),

  // sair
  btnSair: document.getElementById("btnSair"),
};

let cacheRestaurantes = [];
let restauranteAtualId = null;

/* =========================
   SESSÃO / AUTH (igual seus arquivos)
   ========================= */
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

/* =========================
   UI helpers
   ========================= */
function clearAlerts() {
  el.alert.hidden = true;
  el.alert.textContent = "";
  el.alert.classList.remove("alert--sucesso", "alert--erro");

  el.alertSelect.hidden = true;
  el.alertSelect.textContent = "";
  el.alertSelect.classList.remove("alert--sucesso", "alert--erro");
}

function setAlert(msg) {
  el.alert.classList.remove("alert--sucesso");
  el.alert.classList.add("alert--erro");
  el.alert.textContent = msg;
  el.alert.hidden = false;
}

function setAlertSelect(msg) {
  el.alertSelect.classList.remove("alert--sucesso");
  el.alertSelect.classList.add("alert--erro");
  el.alertSelect.textContent = msg;
  el.alertSelect.hidden = false;
}

function setLoading(v) {
  el.loading.hidden = !v;
  el.selectRestaurante.disabled = v;
  el.btnContinuar.disabled = v || !el.selectRestaurante.value;
  el.btnRecarregar.disabled = v;
}

function setMetricsVisible(v) {
  el.metricsGrid.hidden = !v;
  el.empty.hidden = true;
}

function setEmptyVisible(v) {
  el.empty.hidden = !v;
  el.metricsGrid.hidden = true;
}

function mostrarSelecao() {
  el.cardSelect.hidden = false;
  el.cardDashboard.hidden = true;
  restauranteAtualId = null;
  clearAlerts();
}

function mostrarDashboard() {
  el.cardSelect.hidden = true;
  el.cardDashboard.hidden = false;
  clearAlerts();
}

function getNomeRestaurante(id) {
  const r = cacheRestaurantes.find((x) => String(x.id) === String(id));
  return r?.nome || id;
}

/* =========================
   API
   ========================= */
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

/* =========================
   RESTAURANTES
   ========================= */
async function carregarRestaurantes() {
  const token = obterTokenValido();
  if (!token) return irParaLogin();

  clearAlerts();
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
    setAlertSelect(e.message || "Erro ao carregar restaurantes.");
    el.selectRestaurante.innerHTML = `<option value="">Erro ao carregar</option>`;
  } finally {
    setLoading(false);
  }
}

/* =========================
   DASHBOARD
   Esperado do backend:
   {
     totalGiftCards: number,
     totalPurchases: number,
     totalWhatsappMessages: number,
     totalUses: number
   }
   ========================= */
function setMetrics(d) {
  el.mCards.textContent = String(d?.totalGiftCards ?? 0);
  el.mPurchases.textContent = String(d?.totalPurchases ?? 0);
  el.mWhatsapp.textContent = String(d?.totalWhatsappMessages ?? 0);
  el.mUses.textContent = String(d?.totalUses ?? 0);
}

async function carregarDashboard(restauranteId) {
  const token = obterTokenValido();
  if (!token) return irParaLogin();

  clearAlerts();
  setLoading(true);
  setMetricsVisible(false);

  try {
    const data = await requisicaoApi(API.DASHBOARD(restauranteId), { token });

    // se o backend retornar vazio/nulo
    if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
      setEmptyVisible(true);
      return;
    }

    setMetrics(data);
    setMetricsVisible(true);
  } catch (e) {
    setAlert(e.message || "Erro ao carregar dashboard.");
    setEmptyVisible(true);
  } finally {
    setLoading(false);
  }
}

/* =========================
   EVENTOS
   ========================= */
el.selectRestaurante.addEventListener("change", () => {
  el.btnContinuar.disabled = !el.selectRestaurante.value;
});

el.btnContinuar.addEventListener("click", async () => {
  const id = el.selectRestaurante.value;
  if (!id) return;

  restauranteAtualId = id;
  el.nomeRestSelecionado.textContent = getNomeRestaurante(id);

  mostrarDashboard();
  await carregarDashboard(id);
});

el.btnTrocarRest.addEventListener("click", () => {
  mostrarSelecao();
});

el.btnRecarregar.addEventListener("click", async () => {
  if (!restauranteAtualId) return;
  await carregarDashboard(restauranteAtualId);
});

el.btnSair.addEventListener("click", () => {
  limparSessao();
  irParaLogin();
});

/* INIT */
document.addEventListener("DOMContentLoaded", async () => {
  const token = obterTokenValido();
  if (!token) return irParaLogin();

  mostrarSelecao();
  await carregarRestaurantes();
});
