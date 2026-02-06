import { CartoesRepo } from "../repositories/cartoes.repo";
import { filaMensagensRepo } from "../repositories/filaMensagens.repo";
import { restaurantesRepo } from "../repositories/restaurantes.repo";

export class CartoesService {
  private repo = new CartoesRepo();

  async listarPorRestaurante(restauranteId: string) {
    return this.repo.listarPorRestaurante(restauranteId);
  }

async criarCartaoManual(input: {
  restauranteId: string;
  valor: number;
  telefonePresenteado: string;
  validadeEm?: string;
  status: "ativo" | "inativo";
}) {
  const codigo = this.gerarCodigoCurto();

  const validadeEm =
    typeof input.validadeEm === "string" && input.validadeEm.trim() !== ""
      ? input.validadeEm.trim()
      : adicionarDiasDataISO(60);

  // 1. cria cartão
  const cartao = await this.repo.criarCartaoComEmissao({
    restauranteId: input.restauranteId,
    codigo,
    valor: input.valor,
    telefonePresenteado: input.telefonePresenteado,
    validadeEm,
    status: input.status,
  });

  // 2. mensagem para presenteado
  await filaMensagensRepo.enqueue({
    restauranteId: input.restauranteId,
    evento: "giftcard_criado_manual_presenteado",
    destinoTelefone: input.telefonePresenteado,
    mensagem:
      `🎁 Você recebeu um Gift Card!\n` +
      `Código: ${cartao.codigo}\n` +
      `Saldo: R$ ${cartao.saldo}\n` +
      `Validade: ${validadeEm}`,
  });

  // 3. mensagem para restaurante (gestor)
  const restaurante = await restaurantesRepo.buscarPorId(input.restauranteId);

  if (restaurante?.whatsapp_numero) {
    await filaMensagensRepo.enqueue({
      restauranteId: input.restauranteId,
      evento: "giftcard_criado_manual_restaurante",
      destinoTelefone: restaurante.whatsapp_numero,
      mensagem:
        `✅ Gift Card criado manualmente!\n` +
        `Código: ${cartao.codigo}\n` +
        `Valor: R$ ${input.valor}\n` +
        `Presenteado: ${input.telefonePresenteado}\n` +
        `Validade: ${validadeEm}`,
    });
  }

  return cartao;
}

  private gerarCodigoCurto(): string {
    const parte = () => Math.random().toString(36).slice(2, 6).toUpperCase();
    return `GC-${parte()}-${parte()}`;
  }

  async alterarStatus(cartaoId: string, status: "ativo" | "inativo") {
    return this.repo.atualizarStatus(cartaoId, status);
}

  async abater(cartaoId: string, valor: number) {
    return this.repo.abaterPorFuncaoSQL(cartaoId, valor);
  }

  async listarTransacoes(cartaoId: string) {
    return this.repo.listarTransacoes(cartaoId);
}

}

function adicionarDiasDataISO(dias: number): string {
   const data = new Date();
   data.setDate(data.getDate() + dias);
   return data.toISOString().slice(0, 10); // YYYY-MM-DD
}