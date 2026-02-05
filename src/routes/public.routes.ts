import { Router } from "express";
import { clienteController } from "../controllers/public.controller";
import { authCliente } from "../shared/middlewares/authCliente";

const router = Router();

router.post("/auth/request-otp", clienteController.requestOtp);
router.post("/auth/verify-otp", clienteController.verifyOtp);

router.get("/cartoes", authCliente, clienteController.listarCartoes);

export default router;
