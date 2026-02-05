import express from "express";
import cors from "cors";
import { gestorRoutes } from "./routes/gestor.routes";
import clienteRoutes from "./routes/public.routes";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
   res.json({ ok: true });
});

app.use("/api/gestor", gestorRoutes);

app.use("/api/cliente", clienteRoutes);
