import crypto from "crypto";
import bcrypt from "bcrypt";
import { usuariosRepo } from "../repositories/usuarios.repo";
import { sessoesGestorRepo } from "../repositories/sessoesGestor.repo";

function minutesFromNow(min: number): string {
  return new Date(Date.now() + min * 60 * 1000).toISOString();
}

export const authGestorService = {
  async login(emailRaw: string, senha: string) {
    const email = String(emailRaw || "").trim().toLowerCase();
    if (!email || !senha) throw new Error("E-mail e senha são obrigatórios.");

    const { data: usuario, error } = await usuariosRepo.buscarPorEmail(email);
    if (error) throw new Error("Erro ao buscar usuário.");
    if (!usuario) throw new Error("Credenciais inválidas.");

    if (!usuario.ativo) throw new Error("Usuário desativado.");
    if (usuario.tipo !== "GESTOR") throw new Error("Acesso permitido apenas para gestor.");

    const ok = await bcrypt.compare(senha, usuario.senha_hash);
    if (!ok) throw new Error("Credenciais inválidas.");

    const token = crypto.randomBytes(24).toString("hex");
    const expiraEm = minutesFromNow(60); // 60min

    const { error: sessErr } = await sessoesGestorRepo.criarSessao({
      usuarioId: usuario.id,
      token,
      expiraEm,
    });
    if (sessErr) throw new Error("Erro ao criar sessão.");

    return {
      token,
      expiraEm,
      usuario: { id: usuario.id, email: usuario.email, nome: usuario.nome, tipo: usuario.tipo },
    };
  },
};
