import { Request, Response, NextFunction } from "express";
import { sessoesGestorRepo } from "../../repositories/sessoesGestor.repo";

export async function authGestor(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

    if (!token) return res.status(401).json({ message: "Não autenticado." });

    const { data, error } = await sessoesGestorRepo.buscarPorToken(token);
    if (error || !data) return res.status(401).json({ message: "Sessão inválida." });

    const expira = new Date((data as any).expira_em).getTime();
    if (Date.now() > expira) return res.status(401).json({ message: "Sessão expirada." });

    const usuarioRelacao = (data as any).usuarios;
    const usuario = Array.isArray(usuarioRelacao) ? usuarioRelacao[0] : usuarioRelacao;

    if (!usuario) return res.status(401).json({ message: "Sessão inválida." });
    if (!usuario.ativo) return res.status(403).json({ message: "Usuário desativado." });
    if (usuario.tipo !== "GESTOR") return res.status(403).json({ message: "Acesso negado." });

    (req as any).gestor = { id: usuario.id, email: usuario.email, tipo: usuario.tipo };

    return next();
  } catch {
    return res.status(500).json({ message: "Erro inesperado." });
  }
}
