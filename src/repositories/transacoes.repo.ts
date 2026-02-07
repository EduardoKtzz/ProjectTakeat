import { supabase } from "../config/supabase";

export type TipoTransacao = "emissao" | "abatimento";

export class TransacoesRepo {
  async registrarTransacao(params: { cartaoId: string; tipo: TipoTransacao; valor: number }) {
    const valorPositivo = Math.abs(params.valor);

    const { data, error } = await supabase
      .from("transacoes_cartao_presente")
      .insert({
        cartao_presente_id: params.cartaoId,
        tipo: params.tipo,
        valor: valorPositivo, // ⚠️ no seu schema valor precisa ser > 0
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async criarEmissao(params: { cartaoId: string; valor: number }) {
    return this.registrarTransacao({
      cartaoId: params.cartaoId,
      tipo: "emissao",
      valor: params.valor,
    });
  }

  async criarAbatimento(params: { cartaoId: string; valor: number }) {
    return this.registrarTransacao({
      cartaoId: params.cartaoId,
      tipo: "abatimento",
      valor: params.valor,
    });
  }

  async listarPorCartao(cartaoId: string) {
    const { data, error } = await supabase
      .from("transacoes_cartao_presente")
      .select("*")
      .eq("cartao_presente_id", cartaoId)
      .order("criado_em", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  }
}

export const transacoesRepo = new TransacoesRepo();
