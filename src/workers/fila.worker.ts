import { filaMensagensService } from "../services/filaMensagens.service";

const INTERVALO_MS = 5000; // 5s

let rodando = false;

async function tick() {
  if (rodando) return; // evita rodar duas vezes ao mesmo tempo
  rodando = true;

  try {
    const r = await filaMensagensService.processarPendentes(25);
    if (r.total > 0) {
      console.log(`[WORKER] Processou fila: ${r.enviados} enviados, ${r.falhas} falhas.`);
    }
  } catch (e: any) {
    console.error("[WORKER] Erro ao processar fila:", e?.message || e);
  } finally {
    rodando = false;
  }
}

export function iniciarWorkerFila() {
  console.log(`[WORKER] Iniciado. Intervalo: ${INTERVALO_MS}ms`);
  tick(); // roda uma vez na subida
  setInterval(tick, INTERVALO_MS);
}
