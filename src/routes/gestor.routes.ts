import { Router } from "express";
import { authGestor } from "../shared/middlewares/authGestor";
import { GestorController } from "../controllers/gestor.controller";

export const gestorRoutes = Router();
const controller = new GestorController();

gestorRoutes.use(authGestor);

// listar giftcards de um restaurante - gestor
gestorRoutes.get("/restaurantes/:id/cartoes", controller.listarCartoesPorRestaurante);

// inserir um novo giftcard em um restaurante - gestor
gestorRoutes.post("/restaurantes/:id/cartoes", controller.criarCartaoManual);

// atualizar o status de um giftcard - gestor
gestorRoutes.patch("/cartoes/:id/status", controller.alterarStatusCartao);

// abater um valor do giftcard, parcial ou total - gestor
gestorRoutes.post("/cartoes/:id/abater", controller.abaterCartao);

// lista ordenada da mais recente para mais antiga 
gestorRoutes.get("/cartoes/:id/transacoes", controller.listarTransacoes);

// atualizar o número de whatsapp do restaurante
gestorRoutes.patch("/restaurantes/:id/whatsapp", controller.atualizarWhatsappRestaurante);


