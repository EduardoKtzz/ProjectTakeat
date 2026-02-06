const API = {
  URL_BASE: "http://localhost:3001",
  PREFIXO: "/api/gestor",
  LOGIN: "/auth/login",
};

const CHAVES = {
  token: "gestor_token",
  expiraEm: "gestor_expira_em",
  email: "gestor_email",
};

// >>> troque aqui se seu painel tiver outro nome/caminho:
const DESTINO_POS_LOGIN = "todosCartoes.html";

const el = {
  form: document.getElementById("form-login"),
  email: document.getElementById("email"),
  senha: document.getElementById("senha"),
  msg: document.getElementById("mensagem"),
  btn: document.getElementById("botao-entrar"),
};

function setMsg(texto, isError = false) {
  if (!el.msg) return;
  el.msg.textContent = texto || "";
  el.msg.style.color = isError ? "#9b0d1c" : "#6b7280";
}

function setLoading(loading) {
  if (!el.btn) return;
  el.btn.disabled = !!loading;
  el.btn.textContent = loading ? "Entrando..." : "Entrar";
}

async function requisicaoApi(caminho, { metodo = "GET", corpo } = {}) {
  const res = await fetch(`${API.URL_BASE}${API.PREFIXO}${caminho}`, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });

  const tipo = res.headers.get("content-type") || "";
  const dados = tipo.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    const msg =
      (dados && typeof dados === "object" && (dados.message || dados.error)) ||
      (typeof dados === "string" && dados) ||
      `Erro HTTP ${res.status}`;
    throw new Error(msg);
  }

  return dados;
}

function limparSessao() {
  localStorage.removeItem(CHAVES.token);
  localStorage.removeItem(CHAVES.expiraEm);
  localStorage.removeItem(CHAVES.email);
}

function obterTokenValido() {
  const token = localStorage.getItem(CHAVES.token);
  const expiraEm = localStorage.getItem(CHAVES.expiraEm);
  if (!token || !expiraEm) return null;

  // aceita ISO (2026-02-06T...) e também epoch millis como string
  const exp =
    /^\d+$/.test(expiraEm) ? Number(expiraEm) : new Date(expiraEm).getTime();

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

localStorage.removeItem("gestor_token");
localStorage.removeItem("gestor_expira_em");
localStorage.removeItem("gestor_email");

// INIT: se já está logado, mostra uma mensagem e NÃO redireciona automaticamente
(function init() {
  setMsg("");

  const token = obterTokenValido();
  if (token) {
    setMsg("Sessão ainda está ativa. Redirecionando...", false);
    setTimeout(irParaPainel, 600);
  }
})();

// SUBMIT LOGIN
el.form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg("");

  const email = String(el.email?.value || "").trim().toLowerCase();
  const senha = String(el.senha?.value || "").trim();

  if (!email || !senha) {
    setMsg("Informe e-mail e senha.", true);
    return;
  }

  setLoading(true);
  try {
    const dados = await requisicaoApi(API.LOGIN, {
      metodo: "POST",
      corpo: { email, senha },
    });

    // Esperado: { token, expiraEm, usuario: { tipo: "GESTOR" } }
    if (!dados?.token || !dados?.expiraEm) {
      throw new Error("Token não retornado pelo backend.");
    }

    if (dados?.usuario?.tipo && dados.usuario.tipo !== "GESTOR") {
      throw new Error("Acesso permitido apenas para gestor.");
    }

    localStorage.setItem(CHAVES.token, dados.token);
    localStorage.setItem(CHAVES.expiraEm, dados.expiraEm);
    localStorage.setItem(CHAVES.email, email);

    irParaPainel();
  } catch (err) {
    setMsg(err?.message || "Erro ao entrar.", true);
  } finally {
    setLoading(false);
  }
});

function irParaPainel() {
  window.location.href = DESTINO_POS_LOGIN;
}
