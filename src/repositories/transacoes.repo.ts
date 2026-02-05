import { supabase } from "../config/supabase";

export const transacoesRepo = {
   async criarEmissao(params: { cartaoId: string; valor: number }) {
      return supabase.from("transacoes_cartao_presente").insert({
         cartao_presente_id: params.cartaoId,
         tipo: "emissao",
         valor: params.valor,
      });
   },
};
