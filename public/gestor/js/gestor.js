const API = {
  URL_BASE: "http://localhost:3001",
  PREFIXO: "/api/gestor",

  LOGIN: "/auth/login",

  LISTAR_CARTOES_RESTAURANTE: (restId) => `/restaurantes/${restId}/cartoes`,
  CRIAR_CARTAO_RESTAURANTE: (restId) => `/restaurantes/${restId}/cartoes`,
  ALTERAR_STATUS: (cartaoId) => `/cartoes/${cartaoId}/status`,
  ABATER: (cartaoId) => `/cartoes/${cartaoId}/abater`,
  TRANSACOES: (cartaoId) => `/cartoes/${cartaoId}/transacoes`,
  ATUALIZAR_WHATSAPP: (restId) => `/restaurantes/${restId}/whatsapp`,
};

const CHAVES = {
  token: "gestor_token",
  expiraEm: "gestor_expira_em",
  email: "gestor_email",
  restauranteId: "gestor_restaurante_id",
};

const el = {
  telaLogin: document.getElementById("tela-login"),
  telaPainel: document.getElementById("tela-painel"),

  formLogin: document.getElementById("form-login"),
  email: document.getElementById("email"),
  senha: document.getElementById("senha"),
  mensagem: document.getElementById("mensagem"),
  gestorInfo: document.getElementById("gestor-info"),
  botaoSair: document.getElementById("botao-sair"),

  restauranteId: document.getElementById("restaurante-id"),
  botaoCarregar: document.getElementById("botao-carregar"),
  botaoRecarregar: document.getElementById("botao-recarregar"),

  formCriar: document.getElementById("form-criar"),
  telefonePresenteado: document.getElementById("telefone-presenteado"),
  valorInicial: document.getElementById("valor-inicial"),
  validadeEm: document.getElementById("validade-em"),
  codigo: document.getElementById("codigo"),
  mensagemCriar: document.getElementById("mensagem-criar"),

  formWhatsapp: document.getElementById("form-whatsapp"),
  whatsapp: document.getElementById("whatsapp"),
  mensagemWhatsapp: document.getElementById("mensagem-whatsapp"),

  lista: document.getElementById("lista"),
  toast: document.getElementById("toast"),
};

function mostrarToast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.remove("escondido");
  clearTimeout(mostrarToast._t);
  mostrarToast._t = setTimeout(() => el.toast.classList.add("escondido"), 4000);
}

async function requisicaoApi(caminho, { metodo = "GET", corpo, token } = {}) {
  const cabecalhos = { "Content-Type": "application/json" };
  if (token) cabecalhos.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API.URL_BASE}${API.PREFIXO}${caminho}`, {
    method: metodo,
    headers: cabecalhos,
    body: corpo ? JSON.stringify(corpo) : undefined,
  });

  let dados = null;
  const tipo = res.headers.get("content-type") || "";
  if (tipo.includes("application/json")) dados = await res.json().catch(() => null);
  else dados = await res.text().catch(() => null);

  if (!res.ok) {
    const msg =
      (dados && typeof dados === "object" && (dados.message || dados.error)) ||
      (typeof dados === "string" && dados) ||
      `Erro HTTP ${res.status}`;
    throw new Error(msg);
  }

  return dados;
}

function obterTokenValido() {
  const token = localStorage.getItem(CHAVES.token);
  const expiraEm = localStorage.getItem(CHAVES.expiraEm);
  if (!token || !expiraEm) return null;
  if (Date.now() > new Date(expiraEm).getTime()) return null;
  return token;
}

function definirLogado(logado) {
  el.telaLogin.classList.toggle("escondido", logado);
  el.telaPainel.classList.toggle("escondido", !logado);
}

function obterRestauranteId() {
  const id = (el.restauranteId.value || "").trim() || localStorage.getItem(CHAVES.restauranteId) || "";
  return String(id).trim();
}

function salvarRestauranteId(id) {
  localStorage.setItem(CHAVES.restauranteId, String(id));
}

function formatarMoeda(valor) {
  const n = Number(valor ?? 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function limparLista() {
  el.lista.innerHTML = "";
}

function renderizarCartoes(cartoes) {
  limparLista();

  if (!Array.isArray(cartoes) || cartoes.length === 0) {
    el.lista.innerHTML = `<div class="item">Nenhum cartão encontrado.</div>`;
    return;
  }

  cartoes.forEach((c) => {
    const id = c.id;
    const codigo = c.codigo || "—";
    const status = c.status || "—";
    const saldo = c.saldo ?? c.valor_restante ?? c.valorRestante ?? 0;
    const validade = c.validade_em || c.validadeEm || c.validade || null;

    const div = document.createElement("div");
    div.className = "item";
    div.style.border = "1px solid rgba(0,0,0,.10)";
    div.style.borderRadius = "16px";
    div.style.padding = "12px";
    div.style.background = "#fff";

    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
        <div style="font-weight:900;">${codigo}</div>
        <div class="badge ${String(status).toLowerCase().includes("expir") ? "badge--alerta" : ""}">${status}</div>
      </div>

      <div class="dica" style="margin-top:6px;">
        Saldo: <strong>${formatarMoeda(saldo)}</strong>
        ${validade ? ` • Validade: <strong>${new Date(validade).toLocaleDateString("pt-BR")}</strong>` : ""}
      </div>

      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">
        <button class="botao botao--fantasma" data-acao="status" data-id="${id}">Alterar status</button>
        <button class="botao botao--fantasma" data-acao="abater" data-id="${id}">Abater</button>
        <button class="botao botao--fantasma" data-acao="transacoes" data-id="${id}">Transações</button>
      </div>

      <div class="dica" id="saida-${id}" style="margin-top:10px;"></div>
    `;

    el.lista.appendChild(div);
  });
}

async function listarCartoes() {
  const token = obterTokenValido();
  if (!token) return definirLogado(false);

  const restauranteId = obterRestauranteId();
  if (!restauranteId) {
    mostrarToast("Informe o ID do restaurante.");
    return;
  }

  salvarRestauranteId(restauranteId);

  try {
    const dados = await requisicaoApi(API.LISTAR_CARTOES_RESTAURANTE(restauranteId), { token });
    // seu controller pode retornar direto array ou {cartoes:[]}
    const cartoes = Array.isArray(dados) ? dados : (dados.cartoes || dados.data || []);
    renderizarCartoes(cartoes);
  } catch (e) {
    mostrarToast(e.message || "Erro ao listar cartões.");
  }
}

// ---------- AÇÕES POR CARTÃO ----------

async function alterarStatus(cartaoId) {
  const token = obterTokenValido();
  if (!token) return definirLogado(false);

  const novoStatus = prompt("Novo status (ex: ATIVO / INATIVO / EXPIRADO):");
  if (!novoStatus) return;

  // ⚠️ Ajuste o nome do campo se seu controller usar outro (ex: {status: "..."} é o mais comum)
  try {
    await requisicaoApi(API.ALTERAR_STATUS(cartaoId), {
      metodo: "PATCH",
      token,
      corpo: { status: novoStatus },
    });
    mostrarToast("Status atualizado!");
    await listarCartoes();
  } catch (e) {
    mostrarToast(e.message || "Erro ao alterar status.");
  }
}

async function abaterValor(cartaoId) {
  const token = obterTokenValido();
  if (!token) return definirLogado(false);

  const valorStr = prompt("Valor para abater (ex: 10.50):");
  if (!valorStr) return;

  const valor = Number(valorStr.replace(",", "."));
  if (!Number.isFinite(valor) || valor <= 0) {
    mostrarToast("Valor inválido.");
    return;
  }

  // ⚠️ Ajuste o nome do campo se seu controller usar outro (ex: {valor})
  try {
    await requisicaoApi(API.ABATER(cartaoId), {
      metodo: "POST",
      token,
      corpo: { valor },
    });
    mostrarToast("Abatimento realizado!");
    await listarCartoes();
  } catch (e) {
    mostrarToast(e.message || "Erro ao abater.");
  }
}

async function verTransacoes(cartaoId) {
  const token = obterTokenValido();
  if (!token) return definirLogado(false);

  const saida = document.getElementById(`saida-${cartaoId}`);
  if (!saida) return;

  saida.textContent = "Carregando transações...";

  try {
    const dados = await requisicaoApi(API.TRANSACOES(cartaoId), { token });
    const transacoes = Array.isArray(dados) ? dados : (dados.transacoes || dados.data || []);
    if (!transacoes.length) {
      saida.textContent = "Sem transações.";
      return;
    }

    // lista simples (mais recente -> mais antiga)
    saida.innerHTML = transacoes
      .slice(0, 10)
      .map((t) => {
        const valor = t.valor ?? t.valor_abater ?? t.valorAbatido ?? "";
        const quando = t.criado_em || t.data || t.criadoEm || "";
        const desc = t.descricao || t.tipo || "Transação";
        return `• ${desc} — <strong>${valor !== "" ? formatarMoeda(valor) : "-"}</strong> — ${quando ? new Date(quando).toLocaleString("pt-BR") : ""}`;
      })
      .join("<br/>");
  } catch (e) {
    saida.textContent = e.message || "Erro ao carregar transações.";
  }
}

// ---------- FORM: CRIAR CARTÃO ----------

el.formCriar?.addEventListener("submit", async (e) => {
  e.preventDefault();
  el.mensagemCriar.textContent = "";

  const token = obterTokenValido();
  if (!token) return definirLogado(false);

  const restauranteId = obterRestauranteId();
  if (!restauranteId) return mostrarToast("Informe o ID do restaurante.");

  const telefone = (el.telefonePresenteado.value || "").trim();
  const valorInicial = Number(String(el.valorInicial.value || "").replace(",", "."));
  const validadeEm = (el.validadeEm.value || "").trim();
  const codigo = (el.codigo.value || "").trim();

  if (!telefone) return mostrarToast("Telefone do presenteado é obrigatório.");
  if (!Number.isFinite(valorInicial) || valorInicial <= 0) return mostrarToast("Valor inicial inválido.");

  // ⚠️ Ajuste o payload conforme seu controller espera.
  // Aqui é um payload “provável”:
  const corpo = {
    telefonePresenteado: telefone,
    valorInicial,
    validadeEm: validadeEm || null,
    codigo: codigo || null,
  };

  try {
    await requisicaoApi(API.CRIAR_CARTAO_RESTAURANTE(restauranteId), {
      metodo: "POST",
      token,
      corpo,
    });
    el.mensagemCriar.textContent = "Cartão criado!";
    mostrarToast("Cartão criado!");
    await listarCartoes();
  } catch (err) {
    el.mensagemCriar.textContent = err.message || "Erro ao criar cartão.";
  }
});

// ---------- FORM: WHATSAPP RESTAURANTE ----------

el.formWhatsapp?.addEventListener("submit", async (e) => {
  e.preventDefault();
  el.mensagemWhatsapp.textContent = "";

  const token = obterTokenValido();
  if (!token) return definirLogado(false);

  const restauranteId = obterRestauranteId();
  if (!restauranteId) return mostrarToast("Informe o ID do restaurante.");

  const whatsapp = (el.whatsapp.value || "").trim();
  if (!whatsapp) return mostrarToast("WhatsApp é obrigatório.");

  // ⚠️ Ajuste o campo conforme seu controller espera (provável: {whatsapp})
  try {
    await requisicaoApi(API.ATUALIZAR_WHATSAPP(restauranteId), {
      metodo: "PATCH",
      token,
      corpo: { whatsapp },
    });
    el.mensagemWhatsapp.textContent = "WhatsApp atualizado!";
    mostrarToast("WhatsApp atualizado!");
  } catch (e2) {
    el.mensagemWhatsapp.textContent = e2.message || "Erro ao atualizar WhatsApp.";
  }
});

// ---------- BOTÕES ----------
el.botaoCarregar?.addEventListener("click", listarCartoes);
el.botaoRecarregar?.addEventListener("click", listarCartoes);

// Delegação de eventos para ações nos cartões
el.lista?.addEventListener("click", (e) => {
  const alvo = e.target;
  if (!(alvo instanceof HTMLElement)) return;
  const acao = alvo.getAttribute("data-acao");
  const id = alvo.getAttribute("data-id");
  if (!acao || !id) return;

  if (acao === "status") alterarStatus(id);
  if (acao === "abater") abaterValor(id);
  if (acao === "transacoes") verTransacoes(id);
});

// ---------- LOGIN / SAIR (mantém seu fluxo anterior) ----------
function sair() {
  localStorage.removeItem(CHAVES.token);
  localStorage.removeItem(CHAVES.expiraEm);
  localStorage.removeItem(CHAVES.email);
  definirLogado(false);
  mostrarToast("Você saiu.");
}

el.botaoSair?.addEventListener("click", sair);

el.formLogin?.addEventListener("submit", async (e) => {
  e.preventDefault();
  el.mensagem.textContent = "";

  const email = (el.email.value || "").trim().toLowerCase();
  const senha = (el.senha.value || "").trim();

  try {
    const dados = await requisicaoApi(API.LOGIN, {
      metodo: "POST",
      corpo: { email, senha },
    });

    if (!dados?.token || !dados?.expiraEm) throw new Error("Token não retornado.");
    if (dados?.usuario?.tipo !== "GESTOR") throw new Error("Acesso permitido apenas para gestor.");

    localStorage.setItem(CHAVES.token, dados.token);
    localStorage.setItem(CHAVES.expiraEm, dados.expiraEm);
    localStorage.setItem(CHAVES.email, email);

    definirLogado(true);
    el.gestorInfo.textContent = `Logado como ${email}`;
    mostrarToast("Acesso liberado!");

    // restaura restauranteId salvo (se tiver)
    const rid = localStorage.getItem(CHAVES.restauranteId);
    if (rid && el.restauranteId) el.restauranteId.value = rid;

  } catch (err) {
    el.mensagem.textContent = err.message || "Erro ao entrar.";
  }
});

// init
(function init() {
  const token = obterTokenValido();
  if (token) {
    definirLogado(true);
    const email = localStorage.getItem(CHAVES.email) || "";
    el.gestorInfo.textContent = email ? `Logado como ${email}` : "Sessão ativa";
    const rid = localStorage.getItem(CHAVES.restauranteId);
    if (rid && el.restauranteId) el.restauranteId.value = rid;
  } else {
    definirLogado(false);
  }
})();
