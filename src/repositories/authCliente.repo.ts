import { supabase } from "../config/supabase";

export const authClienteRepo = {
   async createOtp(params: {
      telefone: string;
      otp: string;
      expiraEm: string;
   }) {
      return supabase.from("otp_codes").insert({
         telefone: params.telefone,
         otp: params.otp,
         expira_em: params.expiraEm,
      });
   },

   async findValidOtp(params: { telefone: string; otp: string }) {
      // pega o último OTP não usado do telefone
      return supabase
         .from("otp_codes")
         .select("*")
         .eq("telefone", params.telefone)
         .eq("otp", params.otp)
         .is("usado_em", null)
         .order("criado_em", { ascending: false })
         .limit(1);
   },

   async markOtpUsed(id: string) {
      return supabase
         .from("otp_codes")
         .update({ usado_em: new Date().toISOString() })
         .eq("id", id);
   },

   async createSession(params: {
      telefone: string;
      token: string;
      expiraEm: string;
   }) {
      return supabase.from("sessoes_cliente").insert({
         telefone: params.telefone,
         token: params.token,
         expira_em: params.expiraEm,
      });
   },

   async findSessionByToken(token: string) {
      return supabase
         .from("sessoes_cliente")
         .select("*")
         .eq("token", token)
         .limit(1);
   },
};
