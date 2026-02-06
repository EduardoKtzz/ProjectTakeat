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
    validadeEm?: string; // obrigatório agora
    status: "ativo" | "inativo"; // obrigatório agora
  }) {
    const codigo = this.gerarCodigoCurto();

    const validadeEm =input.validadeEm ?? adicionarDiasDataISO(60); // usa helper

    return this.repo.criarCartaoComEmissao({
      restauranteId: input.restauranteId,
      codigo,
      valor: input.valor,
      telefonePresenteado: input.telefonePresenteado ?? null,
      validadeEm,
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

  async listarTransacoes(cartaoId: string) {
    return this.repo.listarTransacoes(cartaoId);
}

}

function adicionarDiasDataISO(dias: number): string {
   const data = new Date();
   data.setDate(data.getDate() + dias);
   return data.toISOString().slice(0, 10); // YYYY-MM-DD
}