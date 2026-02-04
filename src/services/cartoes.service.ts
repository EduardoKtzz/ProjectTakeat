import { CartoesRepo } from "../repositories/cartoes.repo";

export class CartoesService {
  private repo = new CartoesRepo();

  async listarPorRestaurante(restauranteId: string) {
    return this.repo.listarPorRestaurante(restauranteId);
  }

  async criarCartaoManual(input: {
    restauranteId: string;
    valor: number;
    telefonePresenteado?: string;
    validadeEm: string; // obrigatório agora
    status: "ativo" | "inativo"; // obrigatório agora
  }) {
    const codigo = this.gerarCodigoCurto();

    return this.repo.criarCartaoComEmissao({
      restauranteId: input.restauranteId,
      codigo,
      valor: input.valor,
      telefonePresenteado: input.telefonePresenteado ?? null,
      validadeEm: input.validadeEm,
      status: input.status
    });
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

}
