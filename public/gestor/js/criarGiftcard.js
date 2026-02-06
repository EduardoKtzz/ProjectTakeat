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

function setAlert(msg) {
  el.alert.classList.remove("alert--sucesso");
  el.alert.classList.add("alert--erro");

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

function normalizarTelefone(v) {
  const dig = String(v || "").replace(/\D/g, "");
  return dig || "";
}

function validarFormulario() {
  const valor = Number(el.valor.value);
  if (!Number.isFinite(valor) || valor <= 0)
    return "Informe um valor válido (maior que 0).";

    const validade = String(el.validadeEm.value || "").trim();
  if (validade) {
  // só valida se foi preenchida
  if (!/^\d{4}-\d{2}-\d{2}$/.test(validade))
    return "Validade inválida. Use o formato YYYY-MM-DD.";

  const d = new Date(validade + "T00:00:00");
  if (Number.isNaN(d.getTime()))
    return "Validade inválida.";

  const hoje = new Date();
  const hojeZerado = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate()
  );

  if (d < hojeZerado)
    return "A validade não pode ser no passado.";
}

  const d = new Date(validade + "T00:00:00");
  const hoje = new Date();
  const hojeZerado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  if (d < hojeZerado)
    return "A validade não pode ser no passado.";

  const tel = normalizarTelefone(el.telefonePresenteado.value);
  if (!tel)
    return "Informe o telefone do presenteado.";
  if (tel.length < 10)
    return "Telefone inválido. Use DDI+DDD+número.";

  const status = String(el.status.value || "").trim();
  if (status !== "ativo" && status !== "inativo")
    return "Status inválido (ativo/inativo).";

  return null;
}

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

    const payload = {
    valor: Number(el.valor.value),
    status: String(el.status.value).trim(),
    telefonePresenteado: normalizarTelefone(el.telefonePresenteado.value),
    };

    // validade só entra se preenchida
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

    // sucesso
    el.alert.classList.remove("alert--erro");
    el.alert.classList.add("alert--sucesso");

    el.alert.hidden = false;
    el.alert.textContent = `Gift card criado com sucesso, foi enviado uma confirmação no whatsapp da loja e do recebedor! Código: ${result?.codigo || "—"}`;
    el.alert.scrollIntoView({ behavior: "smooth", block: "start" });

    limparForm();
  } catch (e) {
    setAlert(e.message || "Erro ao criar gift card.");
  } finally {
    setLoading(false);
  }
}

/* EVENTOS */
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

document.addEventListener("DOMContentLoaded", async () => {
  const token = obterTokenValido();
  if (!token) return irParaLogin();

  mostrarSelecao();
  await carregarRestaurantes();
});
