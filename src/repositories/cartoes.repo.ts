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
  telefonePresenteado?: string | null;
  validadeEm: string; // YYYY-MM-DD se você fez Opção A (DATE)
  status: "ativo" | "inativo";
}) {
  const { data, error } = await supabase
    .from("cartoes_presente")
    .insert([
      {
        restaurante_id: input.restauranteId,
        codigo: input.codigo,

        // ✅ CORREÇÃO DO ERRO: coluna NOT NULL
        valor_inicial: input.valor,

        // ✅ normalmente o saldo começa igual ao valor inicial
        saldo: input.valor,

        telefone_presenteado: input.telefonePresenteado ?? null,
        validade_em: input.validadeEm, // DATE (YYYY-MM-DD) ou timestamp
        status: input.status,
      },
    ])
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

   async atualizarStatus(cartaoId: string, status: "ativo" | "inativo") {
      const { data, error } = await supabase
         .from("cartoes_presente")
         .update({ status })
         .eq("id", cartaoId)
         .select("*")
         .single();

      if (error) throw new Error(error.message);

      return data;
   }

   async abaterPorFuncaoSQL(cartaoId: string, valor: number) {
      const { data, error } = await supabase.rpc(
         "abater_cartao_presente_por_id",
         {
            p_cartao_id: cartaoId,
            p_valor: valor,
         },
      );

      if (error) {
         // a função lança exception e o Supabase devolve como erro
         throw new Error(error.message);
      }

      // data costuma vir como array com 1 linha (porque returns table)
      const linha = Array.isArray(data) ? data[0] : data;

      return {
         cartaoId: linha.cartao_id,
         saldoAtual: linha.saldo_atual,
      };
   }

   async listarTransacoes(cartaoId: string) {
      const { data, error } = await supabase
         .from("transacoes_cartao_presente")
         .select("*")
         .eq("cartao_presente_id", cartaoId)
         .order("criado_em", { ascending: false });

      if (error) throw new Error(error.message);

      return data ?? [];
   }
   async buscarPorCodigo(codigo: string) {
      return supabase
         .from("cartoes_presente")
         .select("id")
         .eq("codigo", codigo)
         .limit(1);
   }

   async criarCartao(params: {
      restauranteId: string;
      codigo: string;
      valor: number;
      validadeEm: string;
      telefonePresenteado: string;
   }) {
      return supabase
         .from("cartoes_presente")
         .insert({
            restaurante_id: params.restauranteId,
            codigo: params.codigo,
            valor_inicial: params.valor,
            saldo: params.valor,
            status: "ativo",
            validade_em: params.validadeEm,
            telefone_presenteado: params.telefonePresenteado,
         })
         .select("*")
         .single();
   }
}

export const cartoesRepo = new CartoesRepo();
