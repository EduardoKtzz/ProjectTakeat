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

  async listarPendentes(limit = 25) {
    const { data, error } = await supabase
      .from("fila_mensagens")
      .select("*")
      .eq("status", "pendente")
      .order("criado_em", { ascending: true })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async marcarEnviado(id: string) {
    const { error } = await supabase
      .from("fila_mensagens")
      .update({ status: "enviado", enviado_em: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  async marcarFalha(id: string, motivo?: string) {
    const { error } = await supabase
      .from("fila_mensagens")
      .update({
        status: "falha",
        erro: motivo ?? null,
        enviado_em: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw new Error(error.message);
  },
};
