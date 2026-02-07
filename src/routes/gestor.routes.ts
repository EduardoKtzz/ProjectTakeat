import { Router } from "express";
import { authGestor } from "../shared/middlewares/authGestor";
import { authGestorService } from "../services/authGestor.service";
import { GestorController } from "../controllers/gestor.controller";

export const gestorRoutes = Router();
const controller = new GestorController();

gestorRoutes.post("/auth/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    const result = await authGestorService.login(email, senha);
    return res.json(result);
  } catch (e: any) {
    return res.status(400).json({ message: e.message || "Erro" });
  }
});

gestorRoutes.use(authGestor);

// listar todos restaurantes
gestorRoutes.get("/restaurantes", controller.listarRestaurantes);

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

gestorRoutes.get("/restaurantes/:id/dashboard", controller.dashboardRestaurante);
