import { Request, Response } from "express";
import { CartoesService } from "../services/cartoes.service";
import { RestaurantesService } from "../services/restaurantes.service";

const service = new CartoesService();
const restaurantesService = new RestaurantesService();

export class GestorController {
  async listarCartoesPorRestaurante(req: Request, res: Response) {
    const restauranteId = req.params.id;

    const cartoes = await service.listarPorRestaurante(restauranteId);

    return res.json(cartoes);
  }

  async criarCartaoManual(req: Request, res: Response) {
    const restauranteId = req.params.id;

    const { valor, telefonePresenteado, validadeEm, status } = req.body;

    if (typeof valor !== "number" || valor <= 0) {
      return res.status(400).json({ error: "Campo 'valor' inválido. Envie um número maior que 0." });
    }

    if (telefonePresenteado !== undefined && typeof telefonePresenteado !== "string") {
      return res.status(400).json({ error: "Campo 'telefonePresenteado' deve ser string." });
    }

    // status obrigatório
    if (status !== "ativo" && status !== "inativo") {
      return res.status(400).json({ error: "Campo 'status' inválido. Use 'ativo' ou 'inativo'." });
    }

    // validadeEm obrigatório (YYYY-MM-DD)
    if (typeof validadeEm !== "string") {
      return res.status(400).json({ error: "Campo 'validadeEm' é obrigatório no formato YYYY-MM-DD." });
    }

    // validação simples de data (MVP)
    const regexData = /^\d{4}-\d{2}-\d{2}$/;
    if (!regexData.test(validadeEm)) {
      return res.status(400).json({ error: "Campo 'validadeEm' deve estar no formato YYYY-MM-DD." });
    }

    const dataValid = new Date(validadeEm + "T00:00:00");
    if (Number.isNaN(dataValid.getTime())) {
      return res.status(400).json({ error: "Campo 'validadeEm' não é uma data válida." });
    }

    // não permitir data no passado (recomendado)
    const hoje = new Date();
    const hojeZerado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    if (dataValid < hojeZerado) {
      return res.status(400).json({ error: "Campo 'validadeEm' não pode ser no passado." });
    }

    const cartao = await service.criarCartaoManual({
      restauranteId,
      valor,
      telefonePresenteado,
      validadeEm,
      status
    });

    return res.status(201).json(cartao);
  }

  async alterarStatusCartao(req: Request, res: Response) {
    const cartaoId = req.params.id;
    const { status } = req.body;

    if (status !== "ativo" && status !== "inativo") {
      return res.status(400).json({ error: "Campo 'status' inválido. Use 'ativo' ou 'inativo'." });
    }

    const cartaoAtualizado = await service.alterarStatus(cartaoId, status);

    return res.json(cartaoAtualizado);
  }

  async abaterCartao(req: Request, res: Response) {
    const cartaoId = req.params.id;
    const { valor } = req.body;

    if (typeof valor !== "number" || valor <= 0) {
      return res.status(400).json({ error: "Campo 'valor' inválido. Envie um número maior que 0." });
    }

    const resultado = await service.abater(cartaoId, valor);

    return res.json(resultado);
  }

  async listarTransacoes(req: Request, res: Response) {
    const cartaoId = req.params.id;

    const transacoes = await service.listarTransacoes(cartaoId);

    return res.json(transacoes);
}

async atualizarWhatsappRestaurante(req: Request, res: Response) {
  const restauranteId = req.params.id;
  const { whatsappNumero } = req.body;

  // validação mínima (MVP)
  if (typeof whatsappNumero !== "string") {
    return res.status(400).json({ error: "Campo 'whatsappNumero' deve ser string." });
  }

  // validação simples: só dígitos, tamanho entre 10 e 15
  const apenasDigitos = whatsappNumero.replace(/\D/g, "");
  if (apenasDigitos.length < 10 || apenasDigitos.length > 15) {
    return res
      .status(400)
      .json({ error: "whatsappNumero inválido. Envie apenas números (DDI+DDD+numero). Ex: 5511999999999" });
  }

  const restauranteAtualizado = await restaurantesService.atualizarWhatsappRestaurante(restauranteId, apenasDigitos);

  return res.json(restauranteAtualizado);
}

}