
const API = {
  URL_BASE: "http://localhost:3001",
  PREFIXO: "/api/gestor",

  LISTAR_RESTAURANTES: "/restaurantes",
  CRIAR_CARTAO: (restId) => `/restaurantes/${restId}/cartoes`,
};

const CHAVES = {
  token: "gestor_token",
  expiraEm: "gestor_expira_em",
  email: "gestor_email",
};

const URL_LOGIN = "./todosCartoes.html";

const el = {
  cardSelect: document.getElementById("cardSelect"),
  cardForm: document.getElementById("cardForm"),

  selectRestaurante: document.getElementById("selectRestaurante"),
  restInfo: document.getElementById("restInfo"),
  alertSelect: document.getElementById("alertSelect"),
  btnContinuar: document.getElementById("btnContinuar"),

  nomeRestSelecionado: document.getElementById("nomeRestSelecionado"),
  btnTrocarRest: document.getElementById("btnTrocarRest"),

  alert: document.getElementById("alert"),
  loading: document.getElementById("loading"),

  valor: document.getElementById("valor"),
  validadeEm: document.getElementById("validadeEm"),
  telefonePresenteado: document.getElementById("telefonePresenteado"),
  status: document.getElementById("status"),

  btnCriar: document.getElementById("btnCriar"),
  btnLimpar: document.getElementById("btnLimpar"),

  btnSair: document.getElementById("btnSair"),
};

let cacheRestaurantes = [];
let restauranteAtualId = null;

/* =========================================================
   SESSÃO / AUTH
========================================================= */
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

/* =========================================================
   ALERT / LOADING
========================================================= */
function setAlert(msg) {
  el.alert.classList.remove("alert--sucesso");
  el.alert.classList.add("alert--erro");
  el.alert.textContent = msg;
  el.alert.hidden = false;
}

function setAlertSucesso(msg) {
  el.alert.classList.remove("alert--erro");
  el.alert.classList.add("alert--sucesso");
  el.alert.textContent = msg;
  el.alert.hidden = false;
}

function clearAlert() {
  el.alert.hidden = true;
  el.alert.textContent = "";
  el.alertSelect.hidden = true;
  el.alertSelect.textContent = "";
  el.alert.classList.remove("alert--sucesso", "alert--erro");
}

function setLoading(v) {
  el.loading.hidden = !v;
  el.btnCriar.disabled = v;
  el.btnContinuar.disabled = v || !el.selectRestaurante.value;
  el.selectRestaurante.disabled = v;
}

/* =========================================================
   TELAS
========================================================= */
function mostrarSelecao() {
  el.cardSelect.hidden = false;
  el.cardForm.hidden = true;
  restauranteAtualId = null;
  clearAlert();
}

function mostrarForm() {
  el.cardSelect.hidden = true;
  el.cardForm.hidden = false;
  clearAlert();
}

function getNomeRestaurante(id) {
  const r = cacheRestaurantes.find((x) => x.id === id);
  return r?.nome || id;
}

/* =========================================================
   TELEFONE: MÁSCARA + FORMATO WHATSAPP (E.164)
   Usuário digita: (11) 91234-5678
   API recebe:     5511912345678
========================================================= */
function aplicarMascaraTelefone(valor) {
  let v = String(valor || "").replace(/\D/g, "");

  // se colar 55+DDD+numero, remove 55 do input
  if (v.startsWith("55") && v.length >= 12) v = v.slice(2);

  // limita em 11 dígitos (DDD + celular)
  if (v.length > 11) v = v.slice(0, 11);

  // fixo: (DD) 9999-9999
  if (v.length <= 10) {
    return v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, "($1) $2-$3");
  }

  // celular: (DD) 99999-9999
  return v.replace(/^(\d{2})(\d{5})(\d{0,4})$/, "($1) $2-$3");
}

function formatarTelefoneParaWhatsApp(valorMascara) {
  const numeros = String(valorMascara || "").replace(/\D/g, "");
  if (!(numeros.length === 10 || numeros.length === 11)) return null;
  return `55${numeros}`; // ✅ com +
}

/* =========================================================
   VALIDAÇÃO FORM
========================================================= */
function validarFormulario() {
  const valor = Number(el.valor.value);
  if (!Number.isFinite(valor) || valor <= 0) {
    return "Informe um valor válido (maior que 0).";
  }

  // validade (opcional) - o backend exige "YYYY-MM-DD"
  const validade = String(el.validadeEm.value || "").trim();
  if (validade) {
    // valida formato
    if (!/^\d{4}-\d{2}-\d{2}$/.test(validade)) {
      return "Validade inválida. Use o formato YYYY-MM-DD.";
    }

    // valida data local (sem UTC) só pra checar "passado"
    const [ano, mes, dia] = validade.split("-").map(Number);
    const d = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
    if (Number.isNaN(d.getTime())) return "Validade inválida.";

    const hoje = new Date();
    const hojeZerado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    if (d < hojeZerado) return "A validade não pode ser no passado.";
  }

  // telefone (obrigatório)
  const telE164 = formatarTelefoneParaWhatsApp(el.telefonePresenteado.value);
  if (!telE164) {
    return "Telefone inválido. Digite no formato (DD) 9XXXX-XXXX ou (DD) XXXX-XXXX.";
  }

  const status = String(el.status.value || "").trim();
  if (status !== "ativo" && status !== "inativo") {
    return "Status inválido (ativo/inativo).";
  }

  return null;
}

/* =========================================================
   API
========================================================= */
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

/* =========================================================
   CARREGAR RESTAURANTES
========================================================= */
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

/* =========================================================
   FORM
========================================================= */
function limparForm() {
  el.valor.value = "";
  el.validadeEm.value = "";
  el.telefonePresenteado.value = "";
  el.status.value = "ativo";
}

async function criarGiftCard() {
  const token = obterTokenValido();
  if (!token) return irParaLogin();

  clearAlert();

  if (!restauranteAtualId) {
    return setAlert("Selecione um restaurante primeiro.");
  }

  const erro = validarFormulario();
  if (erro) return setAlert(erro);

  // payload final (aqui sim, payload existe)
  const payload = {
    valor: Number(el.valor.value),
    status: String(el.status.value).trim(),
    telefonePresenteado: formatarTelefoneParaWhatsApp(el.telefonePresenteado.value),
  };

  // validade: enviar como YYYY-MM-DD (formato aceito pelo backend)
  const validade = String(el.validadeEm.value || "").trim();
  if (validade) {
    payload.validadeEm = validade;
  }

  setLoading(true);

  try {
    const result = await requisicaoApi(API.CRIAR_CARTAO(restauranteAtualId), {
      metodo: "POST",
      token,
      body: payload,
    });

    setAlertSucesso(`Você presenteou um GiftCard com sucesso! Código: ${result?.codigo || "—"}`);
    el.alert.scrollIntoView({ behavior: "smooth", block: "start" });

    limparForm();
  } catch (e) {
    setAlert(e.message || "Erro ao criar gift card.");
  } finally {
    setLoading(false);
  }
}

/* =========================================================
   EVENTOS
========================================================= */
el.selectRestaurante.addEventListener("change", () => {
  el.btnContinuar.disabled = !el.selectRestaurante.value;
});

el.btnContinuar.addEventListener("click", () => {
  const id = el.selectRestaurante.value;
  if (!id) return;

  restauranteAtualId = id;
  el.nomeRestSelecionado.textContent = `${getNomeRestaurante(id)}`;
  mostrarForm();
});

el.btnTrocarRest.addEventListener("click", () => {
  limparForm();
  mostrarSelecao();
});

el.btnCriar.addEventListener("click", criarGiftCard);

el.btnLimpar.addEventListener("click", () => {
  clearAlert();
  limparForm();
});

el.btnSair.addEventListener("click", () => {
  limparSessao();
  irParaLogin();
});

// Máscara no input do telefone
if (el.telefonePresenteado) {
  el.telefonePresenteado.addEventListener("input", (e) => {
    e.target.value = aplicarMascaraTelefone(e.target.value);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const token = obterTokenValido();
  if (!token) return irParaLogin();

  mostrarSelecao();
  await carregarRestaurantes();
});
