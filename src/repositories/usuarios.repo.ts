import { supabase } from "../config/supabase";

export const usuariosRepo = {
  buscarPorEmail(email: string) {
    return supabase
      .from("usuarios")
      .select("id,nome,email,senha_hash,tipo,ativo")
      .eq("email", email)
      .maybeSingle();
  },

  criarUsuario(params: {
    nome?: string | null;
    email: string;
    senhaHash: string;
    tipo: "CLIENTE" | "GESTOR";
  }) {
    return supabase.from("usuarios").insert({
      nome: params.nome ?? null,
      email: params.email,
      senha_hash: params.senhaHash,
      tipo: params.tipo,
    });
  },
};
