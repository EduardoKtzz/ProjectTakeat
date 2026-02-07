import { CartoesRepo } from "../repositories/cartoes.repo";
import { filaMensagensRepo } from "../repositories/filaMensagens.repo";
import { restaurantesRepo } from "../repositories/restaurantes.repo";
import { transacoesRepo } from "../repositories/transacoes.repo";

export class CartoesService {
  private repo = new CartoesRepo();

  async listarPorRestaurante(restauranteId: string) {
    return this.repo.listarPorRestaurante(restauranteId);
  }

  async criarCartaoManual(input: {
    restauranteId: string;
    valor: number;
    telefonePresenteado?: string;
    validadeEm: string; // YYYY-MM-DD
    status: "ativo" | "inativo";
  }) {
    const codigo = this.gerarCodigoCurto();

    const cartao = await this.repo.criarCartaoComEmissao({
      restauranteId: input.restauranteId,
      codigo,
      valor: input.valor,
      telefonePresenteado: input.telefonePresenteado,
      validadeEm: input.validadeEm,
      status: input.status,
    });

    // ✅ REGISTRAR EMISSÃO NO EXTRATO (AGORA CERTO)
    await transacoesRepo.registrarTransacao({
      cartaoId: cartao.id,
      tipo: "emissao",
      valor: input.valor,
    });

    if (input.telefonePresenteado) {
      await filaMensagensRepo.enqueue({
        restauranteId: input.restauranteId,
        evento: "giftcard_criado_manual_presenteado",
        destinoTelefone: input.telefonePresenteado,
        mensagem:
          `🎁 Você recebeu um Gift Card!\n` +
          `Código: ${cartao.codigo}\n` +
          `Saldo: R$ ${cartao.saldo}\n` +
          `Validade: ${input.validadeEm}`,
      });
    }

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
          `Validade: ${input.validadeEm}`,
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
  return transacoesRepo.listarPorCartao(cartaoId);
}
}
