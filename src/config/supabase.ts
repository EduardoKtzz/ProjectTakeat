// importações do projeto
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// importando as chaves do supabase do .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// validação para casoo não ache as chaves
if (!supabaseUrl || !supabaseAnonKey) {
   throw new Error(
      "SUPABASE_URL ou SUPABASE_ANON_KEY não foram carregadas do .env",
   );
}

// export para outros arquivos poderem usar
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
