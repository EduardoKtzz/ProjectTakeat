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

  async criarCartaoComEmissao(input: {
  restauranteId: string;
  codigo: string;
  valor: number;
  telefonePresenteado: string | null;
  validadeEm: string; // obrigatório
  status: "ativo" | "inativo"; // obrigatório
}) {
  const { data: cartao, error: e1 } = await supabase
    .from("cartoes_presente")
    .insert({
      restaurante_id: input.restauranteId,
      codigo: input.codigo,
      valor_inicial: input.valor,
      saldo: input.valor,
      status: input.status,
      validade_em: input.validadeEm,
      telefone_presenteado: input.telefonePresenteado
    })
    .select("*")
    .single();

  if (e1) throw new Error(e1.message);

  const { error: e2 } = await supabase
    .from("transacoes_cartao_presente")
    .insert({
      cartao_presente_id: cartao.id,
      tipo: "emissao",
      valor: input.valor
    });

  if (e2) throw new Error(e2.message);

  return cartao;
}
}

