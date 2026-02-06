import { supabase } from "../config/supabase";

export const comprasRepo = {
   async criarCompra(params: {
      restauranteId: string;
      valor: number;
      compradorNome?: string | null;
      recebedor?: string | null;
      telefonePresenteado: string;
   }) {
      return supabase
         .from("compras")
         .insert({
            restaurante_id: params.restauranteId,
            valor: params.valor,
            status: "pendente",
            comprador_nome: params.compradorNome ?? null,
            recebedor: params.recebedor ?? null,
            telefone_presenteado: params.telefonePresenteado,
         })
         .select("*")
         .single();
   },

   async buscarPorId(id: string) {
      return supabase.from("compras").select("*").eq("id", id).single();
   },

   async marcarComoPaga(id: string) {
      return supabase
         .from("compras")
         .update({
            status: "pago",
            pago_em: new Date().toISOString(),
         })
         .eq("id", id)
         .select("*")
         .single();
   },

   async vincularCartao(compraId: string, cartaoId: string) {
      return supabase
         .from("compras")
         .update({ cartao_presente_id: cartaoId })
         .eq("id", compraId);
   },
};
