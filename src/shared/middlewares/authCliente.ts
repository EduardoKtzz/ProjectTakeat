import { Request, Response, NextFunction } from "express";
import { authClienteRepo } from "../../repositories/authCliente.repo";

export async function authCliente(
   req: Request,
   res: Response,
   next: NextFunction,
) {
   try {
      const header = req.headers.authorization || "";
      const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

      if (!token) return res.status(401).json({ message: "Token ausente." });

      const { data, error } = await authClienteRepo.findSessionByToken(token);
      if (error)
         return res.status(500).json({ message: "Erro ao validar sessão." });

      const sess = data?.[0];
      if (!sess) return res.status(401).json({ message: "Sessão inválida." });

      const exp = new Date(sess.expira_em).getTime();
      if (Date.now() > exp)
         return res.status(401).json({ message: "Sessão expirada." });

      // anexar no req (MVP)
      (req as any).cliente = { telefone: sess.telefone };

      return next();
   } catch {
      return res.status(500).json({ message: "Erro inesperado." });
   }
}
