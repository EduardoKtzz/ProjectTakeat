import { Router } from "express";
import { GestorController } from "../controllers/gestor.controller";

export const gestorRoutes = Router();
const controller = new GestorController();

gestorRoutes.get("/restaurantes/:id/cartoes", controller.listarCartoesPorRestaurante);
