/**
 * CONFIGURAÇÃO DA API (AJUSTE PARA O SEU BACKEND)
 */
const API = {
  URL_BASE: "http://localhost:3001",
  PREFIXO: "/api/cliente",

  ENDPOINT_ENVIAR_CODIGO: "/auth/request-otp",
  ENDPOINT_VALIDAR_CODIGO: "/auth/verify-otp",
  ENDPOINT_LISTAR_GIFTCARDS: "/cartoes",
};

const elementos = {
  formularioTelefone: document.getElementById("form-telefone"),
  formularioCodigo: document.getElementById("form-codigo"),
  areaLogada: document.getElementById("area-logada"),
  otpDev: document.getElementById("otp-dev"),


  telefone: document.getElementById("telefone"),
  codigo: document.getElementById("codigo"),

  botaoEnviar: document.getElementById("botao-enviar"),
  botaoValidar: document.getElementById("botao-validar"),
  botaoVoltar: document.getElementById("botao-voltar"),
  botaoReenviar: document.getElementById("botao-reenviar"),
  botaoSair: document.getElementById("botao-sair"),

  dicaTemporizador: document.getElementById("dica-temporizador"),
  toast: document.getElementById("toast"),
  estado: document.getElementById("estado"),
  lista: document.getElementById("lista"),
  telefoneUsuario: document.getElementById("telefone-usuario"),
  ano: document.getElementById("ano"),
};

elementos.ano.textContent = new Date().getFullYear();

const ARMAZENAMENTO = {
  telefone: "gc_telefone",
  token: "gc_token",
};

let tempoReenvio = 0;
let temporizadorReenvio = null;

function aplicarMascaraTelefone(valor) {
  const digitos = (valor || "").replace(/\D/g, "").slice(0, 11);
  const d1 = digitos.slice(0, 2);
  const d2 = digitos.slice(2, 7);
  const d3 = digitos.slice(7, 11);

  let saida = "";
  if (d1) saida += `(${d1}`;
  if (d1.length === 2) saida += ") ";
  if (d2) saida += d2;
  if (d2.length === 5) saida += "-";
  if (d3) saida += d3;

  return saida;
}

function normalizarTelefoneE164BR(valor) {
  // simples: assume Brasil (55) quando necessário
  const digitos = (valor || "").replace(/\D/g, "");
  if (!digitos) return "";

  if (digitos.startsWith("55")) return `+${digitos}`;
  if (digitos.length === 10 || digitos.length === 11) return `+55${digitos}`;

  return `+${digitos}`;
}

function mostrarToast(mensagem) {
  elementos.toast.textContent = mensagem;
  elementos.toast.classList.remove("escondido");
  window.clearTimeout(mostrarToast._t);
  mostrarToast._t = window.setTimeout(() => {
    elementos.toast.classList.add("escondido");
  }, 4500);
}

function definirEstado(mensagem) {
  if (!mensagem) {
    elementos.estado.classList.add("escondido");
    elementos.estado.textContent = "";
    return;
  }
  elementos.estado.textContent = mensagem;
  elementos.estado.classList.remove("escondido");
}

function definirCarregando(botao, carregando) {
  botao.disabled = carregando;
  botao.style.opacity = carregando ? "0.7" : "1";
  botao.textContent = carregando ? "Aguarde..." : botao.dataset.rotulo;
}

async function requisicaoApi(caminho, { metodo = "GET", corpo, token } = {}) {
  const cabecalhos = { "Content-Type": "application/json" };
  if (token) cabecalhos.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API.URL_BASE}${API.PREFIXO}${caminho}`, {
    method: metodo,
    headers: cabecalhos,
    body: corpo ? JSON.stringify(corpo) : undefined,
  });

  // tenta interpretar resposta como JSON, se não der, cai pra texto
  let dados = null;
  const tipoConteudo = res.headers.get("content-type") || "";

  if (tipoConteudo.includes("application/json")) {
    dados = await res.json().catch(() => null);
  } else {
    dados = await res.text().catch(() => null);
  }

  if (!res.ok) {
  let mensagem = `Erro HTTP ${res.status}`;

  if (dados && typeof dados === "object") {
    mensagem =
      dados.message ||
      dados.error ||
      (Array.isArray(dados.errors) ? dados.errors.join(", ") : null) ||
      JSON.stringify(dados);
  }

  if (typeof dados === "string" && dados.trim()) {
    mensagem = dados;
  }

  throw new Error(mensagem);
}

  return dados;
}

function definirEtapa(etapa) {
  // etapa: "telefone" | "codigo" | "logado"
  elementos.formularioTelefone.classList.toggle("escondido", etapa !== "telefone");
  elementos.formularioCodigo.classList.toggle("escondido", etapa !== "codigo");
  elementos.areaLogada.classList.toggle("escondido", etapa !== "logado");
}

function iniciarTempoReenvio(segundos = 30) {
  tempoReenvio = segundos;
  elementos.botaoReenviar.disabled = true;
  elementos.dicaTemporizador.textContent = `Você poderá reenviar em ${tempoReenvio}s.`;

  if (temporizadorReenvio) window.clearInterval(temporizadorReenvio);

  temporizadorReenvio = window.setInterval(() => {
    tempoReenvio -= 1;

    if (tempoReenvio <= 0) {
      window.clearInterval(temporizadorReenvio);
      temporizadorReenvio = null;
      elementos.botaoReenviar.disabled = false;
      elementos.dicaTemporizador.textContent = "Se não recebeu, você pode reenviar o código.";
      return;
    }

    elementos.dicaTemporizador.textContent = `Você poderá reenviar em ${tempoReenvio}s.`;
  }, 1000);
}

function formatarMoedaBRL(valor) {
  const n = Number(valor || 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarDataBR(valor) {
  if (!valor) return "-";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return String(valor);
  return data.toLocaleDateString("pt-BR");
}

function textoStatus(status) {
  const s = String(status || "").toLowerCase();

  // ajuste conforme seu backend
  if (["ativo", "ativa", "valid", "valido", "válido"].includes(s)) return "Ativo";
  if (["usado", "consumido", "redeemed"].includes(s)) return "Usado";
  if (["expirado", "expired"].includes(s)) return "Expirado";

  return status || "—";
}

function classeStatus(status) {
  const s = String(status || "").toLowerCase();
  if (["expirado", "expired"].includes(s)) return "selo-status selo-status--alerta";
  return "selo-status selo-status--ok";
}

function limparLista() {
  elementos.lista.innerHTML = "";
}

function renderizarLista(giftcards) {
  limparLista();

  if (!Array.isArray(giftcards) || giftcards.length === 0) {
    definirEstado("Nenhum gift card encontrado para este número.");
    return;
  }

  definirEstado("");

  giftcards.forEach((gc) => {
    // mapeamento flexível (para bater com diferentes nomes vindos do backend)
    const codigo = gc.codigo || gc.code || gc.numero || "Gift Card";
    const saldo = gc.valorRestante ?? gc.saldo ?? gc.restante ?? gc.balance ?? 0;
    const status = gc.status || gc.situacao || gc.state || "—";
    const validade = gc.validade || gc.expiraEm || gc.dataValidade || gc.expiresAt || null;

    const item = document.createElement("div");
    item.className = "item-giftcard";

    item.innerHTML = `
      <div class="item-giftcard__topo">
        <div class="item-giftcard__codigo">${codigo}</div>
        <div class="${classeStatus(status)}">${textoStatus(status)}</div>
      </div>

      <div class="item-giftcard__grid">
        <div class="indicador">
          <div class="indicador__rotulo">Valor restante</div>
          <div class="indicador__valor">${formatarMoedaBRL(saldo)}</div>
        </div>

        <div class="indicador">
          <div class="indicador__rotulo">Status</div>
          <div class="indicador__valor">${textoStatus(status)}</div>
        </div>

        <div class="indicador">
          <div class="indicador__rotulo">Validade</div>
          <div class="indicador__valor">${formatarDataBR(validade)}</div>
        </div>
      </div>
    `;

    elementos.lista.appendChild(item);
  });
}

async function listarGiftcards() {
  const token = localStorage.getItem(ARMAZENAMENTO.token);
  const telefone = localStorage.getItem(ARMAZENAMENTO.telefone);

  if (!token || !telefone) {
    definirEtapa("telefone");
    return;
  }

  definirEtapa("logado");
  elementos.telefoneUsuario.textContent = telefone;

  try {
    definirEstado("Carregando seus gift cards...");
    const dados = await requisicaoApi(API.ENDPOINT_LISTAR_GIFTCARDS, { token });

    // aceite comum: API retorna { data: [...] } ou retorna direto [...]
const lista = Array.isArray(dados)
  ? dados
  : (dados?.cartoes || dados?.data || dados?.giftcards || []);    renderizarLista(lista);
  } catch (erro) {
    definirEstado("");
    mostrarToast(erro.message || "Não foi possível carregar seus gift cards.");
  }
}

/**
 * EVENTOS
 */
elementos.telefone.addEventListener("input", (e) => {
  e.target.value = aplicarMascaraTelefone(e.target.value);
});

elementos.botaoEnviar.dataset.rotulo = elementos.botaoEnviar.textContent;
elementos.botaoValidar.dataset.rotulo = elementos.botaoValidar.textContent;

elementos.formularioTelefone.addEventListener("submit", async (e) => {
  e.preventDefault();

  const telefoneDigitado = elementos.telefone.value;
  const telefoneE164 = normalizarTelefoneE164BR(telefoneDigitado);

  if (!telefoneE164) {
    mostrarToast("Informe um telefone válido.");
    return;
  }

  try {
    definirCarregando(elementos.botaoEnviar, true);
    const resposta = await requisicaoApi(API.ENDPOINT_ENVIAR_CODIGO, {
    metodo: "POST",
    corpo: { telefone: telefoneE164 },
    });

    localStorage.setItem(ARMAZENAMENTO.telefone, telefoneE164);
    definirEtapa("codigo");
    iniciarTempoReenvio(30);

    // ✅ Se estiver em DEV e backend devolveu otp:
    const otpDev = document.getElementById("otp-dev");
    if (resposta?.otp) {
    otpDev.textContent = `⚠️ Ambiente DEV: código gerado = ${resposta.otp}`;
    otpDev.classList.remove("escondido");
    elementos.codigo.value = resposta.otp;
    } else {
    otpDev.classList.add("escondido");
    }

    elementos.codigo.focus();
  } catch (erro) {
    mostrarToast(erro.message || "Não foi possível enviar o código.");
  } finally {
    definirCarregando(elementos.botaoEnviar, false);
  }
});

elementos.formularioCodigo.addEventListener("submit", async (e) => {
  e.preventDefault();

  const telefone = localStorage.getItem(ARMAZENAMENTO.telefone);
  const codigo = (elementos.codigo.value || "").trim();

  if (!telefone) {
    definirEtapa("telefone");
    return;
  }

  if (!codigo || codigo.length < 4) {
    mostrarToast("Informe o código recebido.");
    return;
  }

  try {
    definirCarregando(elementos.botaoValidar, true);

    const resposta = await requisicaoApi(API.ENDPOINT_VALIDAR_CODIGO, {
      metodo: "POST",
      corpo: { telefone, otp: codigo },
    });

    // aceite comum: { token: "..." } ou { data: { token } }
    const token = resposta?.token || resposta?.data?.token || resposta?.access_token;

    if (!token) {
      throw new Error("Token não retornado pela API. Verifique o endpoint de validação.");
    }

    localStorage.setItem(ARMAZENAMENTO.token, token);

    mostrarToast("Acesso liberado! Carregando seus gift cards...");
    await listarGiftcards();
  } catch (erro) {
    mostrarToast(erro.message || "Código inválido ou expirado.");
  } finally {
    definirCarregando(elementos.botaoValidar, false);
  }
});

elementos.botaoVoltar.addEventListener("click", () => {
  elementos.codigo.value = "";
  definirEtapa("telefone");
});

elementos.botaoReenviar.addEventListener("click", async () => {
  if (tempoReenvio > 0) return;

  const telefone = localStorage.getItem(ARMAZENAMENTO.telefone);
  if (!telefone) {
    definirEtapa("telefone");
    return;
  }

  try {
    elementos.botaoReenviar.disabled = true;
    await requisicaoApi(API.ENDPOINT_ENVIAR_CODIGO, {
      metodo: "POST",
      corpo: { telefone },
    });

    iniciarTempoReenvio(30);
    mostrarToast("Código reenviado! Verifique seu WhatsApp.");
  } catch (erro) {
    elementos.botaoReenviar.disabled = false;
    mostrarToast(erro.message || "Não foi possível reenviar o código.");
  }
});

elementos.botaoSair.addEventListener("click", () => {
  localStorage.removeItem(ARMAZENAMENTO.token);
  localStorage.removeItem(ARMAZENAMENTO.telefone);
  elementos.telefone.value = "";
  elementos.codigo.value = "";
  limparLista();
  definirEstado("");
  definirEtapa("telefone");
  mostrarToast("Você saiu.");
});

/**
 * INÍCIO
 */
listarGiftcards();
