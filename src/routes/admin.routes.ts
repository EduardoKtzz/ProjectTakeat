import { Router } from "express";
import { FilaMensagensController } from "../controllers/filaMensagens.controller";

const router = Router();
const controller = new FilaMensagensController();

router.post("/fila/processar", (req, res) => controller.processar(req, res));

export default router;
