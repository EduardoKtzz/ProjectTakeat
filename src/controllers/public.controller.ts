import { Request, Response } from "express";
import { authClienteService } from "../services/authCliente.service";
import { supabase } from "../config/supabase";

export const clienteController = {
   async requestOtp(req: Request, res: Response) {
      try {
         const { telefone } = req.body;
         const result = await authClienteService.requestOtp(telefone);
         return res.json(result);
      } catch (e: any) {
         return res.status(400).json({ message: e.message || "Erro" });
      }
   },

   async verifyOtp(req: Request, res: Response) {
      try {
         const { telefone, otp } = req.body;
         const result = await authClienteService.verifyOtp(telefone, otp);
         return res.json(result);
      } catch (e: any) {
         return res.status(400).json({ message: e.message || "Erro" });
      }
   },

   async listarCartoes(req: Request, res: Response) {
      try {
         const telefone = (req as any).cliente?.telefone;
         if (!telefone)
            return res.status(401).json({ message: "Não autenticado." });

         const { data, error } = await supabase
            .from("cartoes_presente")
            .select(
               "id,codigo,valor_inicial,saldo,status,validade_em,criado_em,restaurante_id",
            )
            .eq("telefone_presenteado", telefone)
            .order("criado_em", { ascending: false });

         if (error)
            return res.status(500).json({ message: "Erro ao buscar cartões." });

         return res.json({ telefone, cartoes: data || [] });
      } catch {
         return res.status(500).json({ message: "Erro inesperado." });
      }
   },
};
