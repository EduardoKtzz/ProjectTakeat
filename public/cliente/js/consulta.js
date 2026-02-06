/**
 * =========================
 * CONFIGURAÇÃO DA API
 * =========================
 */
const API = {
  URL_BASE: "http://localhost:3001",
  PREFIXO: "/api/cliente",

  ENDPOINT_ENVIAR_CODIGO: "/auth/request-otp",
  ENDPOINT_VALIDAR_CODIGO: "/auth/verify-otp",
  ENDPOINT_LISTAR_GIFTCARDS: "/cartoes",
};

/**
 * =========================
 * ELEMENTOS DA TELA
 * =========================
 */
const elTelefone = document.getElementById("telefone");
const elOtp = document.getElementById("otp");

const btnEnviarCodigo = document.getElementById("btnEnviarCodigo");
const btnValidarCodigo = document.getElementById("btnValidarCodigo");
const btnReenviar = document.getElementById("btnReenviar");
const btnSair = document.getElementById("btnSair");
const mainGrid = document.querySelector(".consulta-grid");


const blocoOtp = document.getElementById("blocoOtp");

const alertBox = document.getElementById("alert");
const loading = document.getElementById("loading");

const listaCartoes = document.getElementById("listaCartoes");
const listaVazia = document.getElementById("listaVazia");

const cardLogin = document.getElementById("cardLogin");
const cardCartoes = document.getElementById("cardCartoes");

const LS_TOKEN = "cliente_token";

/**
 * =========================
 * HELPERS UI
 * =========================
 */


function mostrarLogin() {
  cardLogin.hidden = false;
  cardCartoes.hidden = true;

  mainGrid?.classList.add("login-central");
  mainGrid?.classList.remove("result-central");
}

function mostrarCartoes() {
  cardLogin.hidden = true;
  cardCartoes.hidden = false;

  mainGrid?.classList.remove("login-central");
  mainGrid?.classList.add("result-central");
}

function setAlert(msg, inputFocus) {
  alertBox.textContent = msg;
  alertBox.hidden = false;

  if (inputFocus) inputFocus.classList.add("input--error");

  alertBox.scrollIntoView({ behavior: "smooth", block: "center" });
}

function clearAlert() {
  alertBox.hidden = true;
  alertBox.textContent = "";

  document.querySelectorAll(".input--error").forEach((el) => {
    el.classList.remove("input--error");
  });
}

function setLoading(isLoading) {
  loading.hidden = !isLoading;

  btnEnviarCodigo.disabled = isLoading;
  btnValidarCodigo.disabled = isLoading;
  btnReenviar.disabled = isLoading;
}

function showOtp(show) {
  blocoOtp.hidden = !show;
}

function setLoggedIn(isLoggedIn) {
  if (btnSair) btnSair.disabled = !isLoggedIn;

  if (!isLoggedIn) {
    localStorage.removeItem(LS_TOKEN);
  }
}

function setListVisible(visible) {
  listaCartoes.hidden = !visible;
}

function setEmptyVisible(visible) {
  listaVazia.hidden = !visible;
}

/**
 * =========================
 * FORMATAÇÕES
 * =========================
 */

function formatBRL(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "-";

  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarTelefone(valor) {
  let digits = valor.replace(/\D/g, "");
  digits = digits.slice(0, 11);

  if (digits.length <= 2) return digits;

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function normalizarTelefone(valor) {
  const digits = String(valor || "").replace(/\D/g, "");

  // Usuário digitou já com DDI (55) -> 13 dígitos
  if (digits.length === 13 && digits.startsWith("55")) return digits;

  // Usuário digitou só DDD + número -> 11 dígitos
  if (digits.length === 11) return "55" + digits;

  return null;
}

/**
 * =========================
 * RENDERIZAÇÃO DOS CARTÕES
 * =========================
 */

function renderCartoes(cartoes) {
  listaCartoes.innerHTML = "";

  cartoes.forEach((c, idx) => {
    const codigo = c.codigo ?? c.code ?? "-";
    const saldo = c.saldo ?? c.balance ?? 0;
    const status = (c.status ?? "ativo").toString();
    const validade = c.validade ?? c.expiresAt ?? "—";

    const card = document.createElement("div");
    card.className = "cartao";

    card.innerHTML = `
      <div class="cartao__top">
        <p class="cartao__titulo">Gift Card #${idx + 1}</p>

        <span class="cartao__status">
          <i class="fa-solid fa-circle-check"></i>
          ${status}
        </span>
      </div>

      <div class="cartao__grid">
        <div class="kv">
          <div class="kv__k">Código</div>
          <div class="kv__v kv__mono">${codigo}</div>
        </div>

        <div class="kv">
          <div class="kv__k">Saldo</div>
          <div class="kv__v">${formatBRL(saldo)}</div>
        </div>

        <div class="kv">
          <div class="kv__k">Validade</div>
          <div class="kv__v">${validade}</div>
        </div>

        <div class="kv">
          <div class="kv__k">Uso</div>
          <div class="kv__v">WhatsApp</div>
        </div>
      </div>
    `;

    listaCartoes.appendChild(card);
  });
}

/**
 * =========================
 * API REQUESTS
 * =========================
 */

async function requestOtp(telefone) {
  const resp = await fetch(
    `${API.URL_BASE}${API.PREFIXO}${API.ENDPOINT_ENVIAR_CODIGO}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telefone }),
    }
  );

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    throw new Error(data?.error || "Erro ao enviar OTP.");
  }

  // DEV: mostrar OTP se backend devolver
  const otpDev = document.getElementById("otp-dev");
  if (otpDev && data?.otp) {
    otpDev.hidden = false;
    otpDev.textContent = `⚠️ OTP Simulado: ${data.otp}`;
    elOtp.value = data.otp;
  }

  return data;
}

async function verifyOtp(telefone, otp) {
  const resp = await fetch(
    `${API.URL_BASE}${API.PREFIXO}${API.ENDPOINT_VALIDAR_CODIGO}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telefone, otp }),
    }
  );

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    throw new Error(data?.error || "Código inválido.");
  }

  return data.token || data.access_token;
}

async function listarCartoes() {
  const token = localStorage.getItem(LS_TOKEN);

  const resp = await fetch(
    `${API.URL_BASE}${API.PREFIXO}${API.ENDPOINT_LISTAR_GIFTCARDS}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    throw new Error(data?.error || "Erro ao carregar cartões.");
  }

  return Array.isArray(data) ? data : data.cartoes || [];
}

/**
 * =========================
 * EVENTOS
 * =========================
 */

btnEnviarCodigo.addEventListener("click", async () => {
  clearAlert();

  const telefone = normalizarTelefone(elTelefone.value);

  if (!telefone) {
    setAlert("Digite um WhatsApp válido.", elTelefone);
    return;
  }

  setLoading(true);

  try {
    await requestOtp(telefone);

    showOtp(true);
    elOtp.focus();
  } catch (e) {
    setAlert(e.message);
  } finally {
    setLoading(false);
  }
});

btnValidarCodigo.addEventListener("click", async () => {
  clearAlert();

  const telefone = normalizarTelefone(elTelefone.value);
  const otp = String(elOtp.value || "").trim();

  if (!telefone) {
    setAlert("WhatsApp inválido.", elTelefone);
    return;
  }

  if (!otp) {
    setAlert("Digite o código OTP.", elOtp);
    return;
  }

  setLoading(true);

  try {
    // valida OTP
    const token = await verifyOtp(telefone, otp);

    localStorage.setItem(LS_TOKEN, token);
    setLoggedIn(true);

    // carrega cartões
    const cartoes = await listarCartoes();

    // troca tela
    mostrarCartoes();

    if (!cartoes.length) {
      setEmptyVisible(true);
    } else {
      renderCartoes(cartoes);
      setListVisible(true);
    }
  } catch (e) {
    setAlert(e.message);
    setLoggedIn(false);
  } finally {
    setLoading(false);
  }
});

btnReenviar.addEventListener("click", async () => {
  btnEnviarCodigo.click();
});

if (btnSair) {
  btnSair.addEventListener("click", () => {
    clearAlert();

    setLoggedIn(false);
    showOtp(false);

    elOtp.value = "";
    elTelefone.value = "";

    setListVisible(false);
    setEmptyVisible(false);

    mostrarLogin();
  });
}

/**
 * =========================
 * INIT
 * =========================
 */

document.addEventListener("DOMContentLoaded", () => {
  mostrarLogin();
  showOtp(false);

  // máscara telefone
  elTelefone.addEventListener("input", () => {
    elTelefone.value = formatarTelefone(elTelefone.value);
  });
});
