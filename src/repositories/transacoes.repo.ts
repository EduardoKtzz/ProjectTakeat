import { supabase } from "../config/supabase";

class TransacoesRepo {
  /**
   * Registra uma transação no extrato do gift card
   * Tipos permitidos:
   * - emissao
   * - abatimento
   */
  async registrarTransacao(input: {
    cartaoId: string;
    tipo: "emissao" | "abatimento";
    valor: number;
  }) {
    const { data, error } = await supabase
      .from("transacoes_cartao_presente")
      .insert([
        {
          // ✅ COLUNA CERTA DO SEU BANCO
          cartao_presente_id: input.cartaoId,

          tipo: input.tipo,
          valor: input.valor,
        },
      ])
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Lista extrato completo de um cartão
   */
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
