import { supabase } from "../config/supabase";

export class CartoesRepo {
  async listarPorRestaurante(restauranteId: string) {
    const { data, error } = await supabase
      .from("cartoes_presente")
      .select("*")
      .eq("restaurante_id", restauranteId)
      .order("criado_em", { ascending: false });

    if (error) throw new Error(error.message);

    return data ?? [];
  }
}
