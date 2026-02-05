import crypto from "crypto";
import { authClienteRepo } from "../repositories/authCliente.repo";
import { filaMensagensRepo } from "../repositories/filaMensagens.repo";
import { isValidPhoneBR, normalizePhoneBR } from "../shared/utils/phone";

function generateOtp(): string {
   return Math.floor(100000 + Math.random() * 900000).toString();
}

function minutesFromNow(min: number): string {
   return new Date(Date.now() + min * 60 * 1000).toISOString();
}

export const authClienteService = {
   async requestOtp(rawTelefone: string) {
      const telefone = normalizePhoneBR(rawTelefone);
      if (!isValidPhoneBR(telefone)) {
         throw new Error("Telefone inválido.");
      }

      const otp = generateOtp();
      const expiraEm = minutesFromNow(5);

      const { error: otpErr } = await authClienteRepo.createOtp({
         telefone,
         otp,
         expiraEm,
      });
      if (otpErr) {
         throw new Error(otpErr.message || "Erro ao gerar OTP.");
      }

      // WhatsApp simulado -> fila_mensagens
      const mensagem = `Seu código de acesso é: ${otp}. Válido por 5 minutos.`;
      const { error: filaErr } = await filaMensagensRepo.enqueue({
         restauranteId: null,
         evento: "otp_login",
         destinoTelefone: telefone,
         mensagem,
      });
      if (filaErr) {
         throw new Error(filaErr.message || "Erro ao enfileirar mensagem.");
      }

      // 🔑 DEV vs PROD
      const showOtp =
         process.env.SHOW_OTP === "true" ||
         process.env.NODE_ENV !== "production";

      return showOtp ? { ok: true, otp } : { ok: true };
   },

   async verifyOtp(rawTelefone: string, otp: string) {
      const telefone = normalizePhoneBR(rawTelefone);
      if (!isValidPhoneBR(telefone)) throw new Error("Telefone inválido.");

      const { data, error } = await authClienteRepo.findValidOtp({
         telefone,
         otp,
      });
      if (error) throw new Error("Erro ao validar OTP.");
      const record = data?.[0];
      if (!record) throw new Error("OTP inválido.");

      // expiração
      const expira = new Date(record.expira_em).getTime();
      if (Date.now() > expira) throw new Error("OTP expirado.");

      await authClienteRepo.markOtpUsed(record.id);

      const token = crypto.randomBytes(24).toString("hex");
      const expiraEm = minutesFromNow(30);

      const { error: sessErr } = await authClienteRepo.createSession({
         telefone,
         token,
         expiraEm,
      });
      if (sessErr) throw new Error("Erro ao criar sessão.");

      return { token, expiraEm };
   },
};
