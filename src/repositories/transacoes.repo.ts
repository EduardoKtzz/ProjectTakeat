import { supabase } from "../config/supabase";

export class TransacoesRepo {
  async criarEmissao(params: { cartaoId: string; valor: number }) {
    return supabase.from("transacoes").insert({
      cartao_id: params.cartaoId,
      tipo: "emissao",
      valor: params.valor,
    });
  }

  async criarAbatimento(params: { cartaoId: string; valor: number }) {
    return supabase.from("transacoes").insert({
      cartao_id: params.cartaoId,
      tipo: "abatimento",
      valor: -Math.abs(params.valor),
    });
  }

  async listarPorCartao(cartaoId: string) {
    return supabase
      .from("transacoes")
      .select("*")
      .eq("cartao_id", cartaoId)
      .order("created_at", { ascending: false });
  }
}

export const transacoesRepo = new TransacoesRepo();
