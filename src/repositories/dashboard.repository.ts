import { supabase } from "../config/supabase";

export type DashboardMetrics = {
  totalGiftCards: number;
  totalPurchases: number;
  totalWhatsappMessages: number;
  totalUses: number;
};

export class DashboardRepository {
  async getMetricsByRestauranteId(restauranteId: string): Promise<DashboardMetrics> {
    // 1) total gift cards
    const totalGiftCardsQ = supabase
      .from("cartoes_presente")
      .select("id", { count: "exact", head: true })
      .eq("restaurante_id", restauranteId);

    // 2) total compras (se quiser só pagas: .eq("status","pago"))
    const totalPurchasesQ = supabase
      .from("compras")
      .select("id", { count: "exact", head: true })
      .eq("restaurante_id", restauranteId);

    // 3) total mensagens (se quiser só enviadas: .eq("status","enviado"))
    const totalWhatsappMessagesQ = supabase
      .from("fila_mensagens")
      .select("id", { count: "exact", head: true })
      .eq("restaurante_id", restauranteId);

    // 4) total usos (abatimentos): transacoes_cartao_presente.tipo='abatimento'
    // Como não tem restaurante_id em transacoes, pegamos ids dos cartões do restaurante
    const cartoesIdsRes = await supabase
      .from("cartoes_presente")
      .select("id")
      .eq("restaurante_id", restauranteId);

    if (cartoesIdsRes.error) {
      throw new Error(cartoesIdsRes.error.message);
    }

    const cartoesIds = (cartoesIdsRes.data || []).map((c: any) => c.id);

    const totalUsesQ = cartoesIds.length
      ? supabase
          .from("transacoes_cartao_presente")
          .select("id", { count: "exact", head: true })
          .in("cartao_presente_id", cartoesIds)
          .eq("tipo", "abatimento")
      : null;

    const [giftR, comprasR, msgR, usesR] = await Promise.all([
      totalGiftCardsQ,
      totalPurchasesQ,
      totalWhatsappMessagesQ,
      totalUsesQ ? totalUsesQ : Promise.resolve({ count: 0, error: null } as any),
    ]);

    if (giftR.error) throw new Error(giftR.error.message);
    if (comprasR.error) throw new Error(comprasR.error.message);
    if (msgR.error) throw new Error(msgR.error.message);
    if (usesR.error) throw new Error(usesR.error.message);

    return {
      totalGiftCards: giftR.count ?? 0,
      totalPurchases: comprasR.count ?? 0,
      totalWhatsappMessages: msgR.count ?? 0,
      totalUses: usesR.count ?? 0,
    };
  }
}
