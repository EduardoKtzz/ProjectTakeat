import { filaMensagensRepo } from "../repositories/filaMensagens.repo";

export const filaMensagensService = {
  async processarPendentes(limit = 25) {
    const pendentes = await filaMensagensRepo.listarPendentes(limit);

    let enviados = 0;
    let falhas = 0;

    for (const msg of pendentes) {
      try {
        // ✅ Simulação de envio (MVP)
        console.log(
          `[FILA] Enviando (${msg.evento}) para ${msg.destino_telefone}: ${msg.mensagem}`
        );

        // aqui no futuro entra integração real WhatsApp
        await filaMensagensRepo.marcarEnviado(msg.id);
        enviados++;
      } catch (e: any) {
        await filaMensagensRepo.marcarFalha(msg.id, e?.message || "Falha ao enviar");
        falhas++;
      }
    }

    return { total: pendentes.length, enviados, falhas };
  },
};
