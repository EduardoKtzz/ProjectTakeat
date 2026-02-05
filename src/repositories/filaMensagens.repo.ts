import { supabase } from "../config/supabase";

export const filaMensagensRepo = {
   async enqueue(params: {
      restauranteId?: string | null;
      evento: string;
      destinoTelefone: string;
      mensagem: string;
   }) {
      return supabase.from("fila_mensagens").insert({
         restaurante_id: params.restauranteId ?? null,
         evento: params.evento,
         destino_telefone: params.destinoTelefone,
         mensagem: params.mensagem,
         status: "pendente",
      });
   },
};
