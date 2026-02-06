import { supabase } from "../config/supabase";

export class RestaurantesRepo {
  async atualizarWhatsapp(restauranteId: string, whatsappNumero: string) {
    const { data, error } = await supabase
      .from("restaurantes")
      .update({ whatsapp_numero: whatsappNumero })
      .eq("id", restauranteId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    return data;
  }

  async listarTodos() {
    const { data, error } = await supabase
      .from("restaurantes")
      .select("id, nome")
      .order("nome", { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async buscarPorId(restauranteId: string) {
  const { data, error } = await supabase
    .from("restaurantes")
    .select("id, nome, whatsapp_numero")
    .eq("id", restauranteId)
    .single();

  if (error) throw new Error(error.message);

  return data;
}
}


export const restaurantesRepo = new RestaurantesRepo();

