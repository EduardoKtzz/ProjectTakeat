import { Request, Response, NextFunction } from "express";

export function authGestor(req: Request, res: Response, next: NextFunction) {
  const token = req.header("x-gestor-token");
  const expected = process.env.GESTOR_TOKEN;

  if (!expected) {
    return res.status(500).json({ error: "GESTOR_TOKEN não configurado no servidor" });
  }

  if (!token || token !== expected) {
    return res.status(401).json({ error: "Acesso restrito ao gestor" });
  }

  return next();
}
