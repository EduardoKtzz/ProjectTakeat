import { Router } from "express";
import { GestorController } from "../controllers/gestor.controller";

export const gestorRoutes = Router();
const controller = new GestorController();

// listar giftcards de um restaurante - gestor
gestorRoutes.get("/restaurantes/:id/cartoes", controller.listarCartoesPorRestaurante);

// inserir um novo giftcard em um restaurante - gestor
gestorRoutes.post("/restaurantes/:id/cartoes", controller.criarCartaoManual);

// atualizar o status de um giftcard - gestor
gestorRoutes.patch("/cartoes/:id/status", controller.alterarStatusCartao);

// abater um valor do giftcard, parcial ou total - gestor
gestorRoutes.post("/cartoes/:id/abater", controller.abaterCartao);
