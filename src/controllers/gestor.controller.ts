import { Request, Response } from "express";
import { CartoesService } from "../services/cartoes.service";
import { RestaurantesService } from "../services/restaurantes.service";
import { DashboardRepository } from "../repositories/dashboard.repository";

const cartoesService = new CartoesService();
const restaurantesService = new RestaurantesService();

export class GestorController {
    private dashboardRepo = new DashboardRepository();

  async listarCartoesPorRestaurante(req: Request, res: Response) {
    const restauranteId = req.params.id;
    const cartoes = await cartoesService.listarPorRestaurante(restauranteId);
    return res.json(cartoes);
  }

  async criarCartaoManual(req: Request, res: Response) {
    const restauranteId = req.params.id;
    const { valor, telefonePresenteado, validadeEm, status } = req.body;

    if (typeof valor !== "number" || valor <= 0) {
      return res.status(400).json({
        error: "Campo 'valor' inválido. Envie um número maior que 0.",
      });
    }

    if (telefonePresenteado !== undefined && typeof telefonePresenteado !== "string") {
      return res.status(400).json({
        error: "Campo 'telefonePresenteado' deve ser string.",
      });
    }

    if (status !== "ativo" && status !== "inativo") {
      return res.status(400).json({
        error: "Campo 'status' inválido. Use 'ativo' ou 'inativo'.",
      });
    }

    // ✅ usa validadeFinal SEMPRE
    let validadeFinal = String(validadeEm ?? "").trim();

    // se não veio, define padrão 60 dias à frente
    if (!validadeFinal) {
      const d = new Date();
      d.setDate(d.getDate() + 60);
      validadeFinal = d.toISOString().slice(0, 10); // YYYY-MM-DD
    }

    // valida formato YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(validadeFinal)) {
      return res.status(400).json({
        error: "Campo 'validadeEm' deve estar no formato YYYY-MM-DD.",
      });
    }

    // valida se é data real e não no passado (local)
    const [y, m, d] = validadeFinal.split("-").map(Number);
    const dataVal = new Date(y, m - 1, d, 0, 0, 0, 0);
    if (Number.isNaN(dataVal.getTime())) {
      return res.status(400).json({
        error: "Campo 'validadeEm' não é uma data válida.",
      });
    }

    const hoje = new Date();
    const hojeZerado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    if (dataVal < hojeZerado) {
      return res.status(400).json({
        error: "Campo 'validadeEm' não pode ser no passado.",
      });
    }

    const cartao = await cartoesService.criarCartaoManual({
      restauranteId,
      valor,
      telefonePresenteado,
      validadeEm: validadeFinal, // ✅ YYYY-MM-DD
      status,
    });

    return res.status(201).json(cartao);
  }

  async alterarStatusCartao(req: Request, res: Response) {
    const cartaoId = req.params.id;
    const { status } = req.body;

    if (status !== "ativo" && status !== "inativo") {
      return res.status(400).json({
        error: "Campo 'status' inválido. Use 'ativo' ou 'inativo'.",
      });
    }

    const cartaoAtualizado = await cartoesService.alterarStatus(cartaoId, status);
    return res.json(cartaoAtualizado);
  }

  async abaterCartao(req: Request, res: Response) {
    const cartaoId = req.params.id;
    const { valor } = req.body;

    if (typeof valor !== "number" || valor <= 0) {
      return res.status(400).json({
        error: "Campo 'valor' inválido. Envie um número maior que 0.",
      });
    }

    const resultado = await cartoesService.abater(cartaoId, valor);
    return res.json(resultado);
  }

  async listarTransacoes(req: Request, res: Response) {
    const cartaoId = req.params.id;
    const transacoes = await cartoesService.listarTransacoes(cartaoId);
    return res.json(transacoes);
  }

  async atualizarWhatsappRestaurante(req: Request, res: Response) {
    const restauranteId = req.params.id;
    const { whatsappNumero } = req.body;

    if (typeof whatsappNumero !== "string") {
      return res.status(400).json({ error: "Campo 'whatsappNumero' deve ser string." });
    }

    const apenasDigitos = whatsappNumero.replace(/\D/g, "");
    if (apenasDigitos.length < 10 || apenasDigitos.length > 15) {
      return res.status(400).json({
        error: "whatsappNumero inválido. Envie apenas números (DDI+DDD+numero). Ex: 5511999999999",
      });
    }

    const restauranteAtualizado =
      await restaurantesService.atualizarWhatsappRestaurante(restauranteId, apenasDigitos);

    return res.json(restauranteAtualizado);
  }

  async listarRestaurantes(req: Request, res: Response) {
    const restaurantes = await restaurantesService.listarTodos();
    return res.json(restaurantes);
  }
async dashboardRestaurante(req: Request, res: Response) {
    try {
      const restauranteId = req.params.id;

      if (!restauranteId) {
        return res
          .status(400)
          .json({ error: "Parâmetro :id (restauranteId) é obrigatório." });
      }

      const metrics = await this.dashboardRepo.getMetricsByRestauranteId(restauranteId);
      return res.json(metrics);
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || "Erro interno." });
    }
  }

}
