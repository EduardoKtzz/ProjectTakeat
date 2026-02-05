export function normalizePhoneBR(input: string): string {
   const digits = (input || "").replace(/\D/g, "");

   // Sem DDI: 10/11 dígitos (DDD + número)
   if (digits.length === 10 || digits.length === 11) return "55" + digits;

   // Com DDI: 12/13 dígitos (55 + DDD + número)
   if (digits.length === 12 || digits.length === 13) return digits;

   throw new Error("Telefone inválido. Use DDD + número (ex: 11999999999).");
}

export function isValidPhoneBR(normalized: string): boolean {
   return /^55\d{10,11}$/.test(normalized);
}
