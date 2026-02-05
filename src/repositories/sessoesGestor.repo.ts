import { supabase } from "../config/supabase";

export const sessoesGestorRepo = {
  criarSessao(params: {
    usuarioId: string;
    token: string;
    expiraEm: string;
  }) {
    return supabase.from("sessoes_gestor").insert({
      usuario_id: params.usuarioId,
      token: params.token,
      expira_em: params.expiraEm,
    });
  },

  buscarPorToken(token: string) {
    return supabase
      .from("sessoes_gestor")
      .select("id,token,expira_em,usuario_id,usuarios(id,email,tipo,ativo)")
      .eq("token", token)
      .maybeSingle();
  },
};
