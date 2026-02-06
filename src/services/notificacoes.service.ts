import { filaMensagensRepo } from "../repositories/filaMensagens.repo";

export async function enfileirarMsgPresenteado(params: {
  restauranteId: string;
  telefonePresenteado: string;
  codigo: string;
  saldo: number;
  validadeEm: string;
}) {
  await filaMensagensRepo.enqueue({
    restauranteId: params.restauranteId,
    evento: "giftcard_criado_presenteado",
    destinoTelefone: params.telefonePresenteado,
    mensagem:
      `🎁 Você recebeu um Gift Card!\n` +
      `Código: ${params.codigo}\n` +
      `Saldo: R$ ${params.saldo}\n` +
      `Validade: ${params.validadeEm}`,
  });
}

export async function enfileirarMsgRestaurante(params: {
  restauranteId: string;
  telefoneRestaurante: string;
  codigo: string;
  valor: number;
  telefonePresenteado: string;
  validadeEm: string;
}) {
  await filaMensagensRepo.enqueue({
    restauranteId: params.restauranteId,
    evento: "giftcard_criado_gestor",
    destinoTelefone: params.telefoneRestaurante,
    mensagem:
      `✅ Gift Card criado manualmente!\n` +
      `Código: ${params.codigo}\n` +
      `Valor: R$ ${params.valor}\n` +
      `Presenteado: ${params.telefonePresenteado}\n` +
      `Validade: ${params.validadeEm}`,
  });
}
