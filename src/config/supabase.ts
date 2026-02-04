// importações do projeto
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config' // carrega o .env

// puxando a chave do supabase do env
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

// verifica se as chaves estão corretas
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis de ambiente do Supabase não encontradas!')
}

//faz o export para uso externo
export const supabase = createClient(supabaseUrl, supabaseKey)