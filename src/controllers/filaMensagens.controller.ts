import { Request, Response } from "express";
import { filaMensagensService } from "../services/filaMensagens.service";

export class FilaMensagensController {
  async processar(req: Request, res: Response) {
    const limit = req.query.limit ? Number(req.query.limit) : 25;
    const resultado = await filaMensagensService.processarPendentes(
      Number.isFinite(limit) ? limit : 25
    );
    return res.json({ ok: true, ...resultado });
  }
}
