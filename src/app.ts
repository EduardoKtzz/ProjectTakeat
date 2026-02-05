import express from "express";
import path from "path";
import cors from "cors";
import { gestorRoutes } from "./routes/gestor.routes";
import clienteRoutes from "./routes/public.routes";
import publicCompraRoutes from "./routes/public.routes";

export const app = express();

const publicDir = path.resolve(__dirname, "..", "public");
app.use(express.static(publicDir));

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
   res.json({ ok: true });
});

app.use("/api/gestor", gestorRoutes);

app.use("/api/cliente", clienteRoutes);

app.use("/api/public", publicCompraRoutes);


/**
 * Rotas amigáveis (opcional, mas ajuda no demo)
 */
app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.get("/cliente/compra", (_req, res) => {
  res.sendFile(path.join(publicDir, "cliente", "compra.html"));
});

app.get("/gestor", (_req, res) => {
  res.sendFile(path.join(publicDir, "gestor", "index.html"));
});
