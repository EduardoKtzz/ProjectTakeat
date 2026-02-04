import { Request, Response } from "express";
import { CartoesService } from "../services/cartoes.service";

const service = new CartoesService();

export class GestorController {
  async listarCartoesPorRestaurante(req: Request, res: Response) {
    const restauranteId = req.params.id;

    const cartoes = await service.listarPorRestaurante(restauranteId);

    return res.json(cartoes);
  }
}
