import { Router } from "express";
import {
   clienteController,
   compraPublicaController,
} from "../controllers/public.controller";
import { authCliente } from "../shared/middlewares/authCliente";

const router = Router();

router.post("/auth/request-otp", clienteController.requestOtp);
router.post("/auth/verify-otp", clienteController.verifyOtp);

router.get("/cartoes", authCliente, clienteController.listarCartoes);

router.post("/compras", compraPublicaController.criarCompra);
router.post(
   "/compras/:id/confirmar",
   compraPublicaController.confirmarPagamento,
);

export default router;
