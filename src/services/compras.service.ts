import crypto from "crypto";
import { comprasRepo } from "../repositories/compras.repo";
import { cartoesRepo } from "../repositories/cartoes.repo";
import { transacoesRepo } from "../repositories/transacoes.repo";
import { filaMensagensRepo } from "../repositories/filaMensagens.repo";
import { normalizePhoneBR, isValidPhoneBR } from "../shared/utils/phone";

function adicionarDiasDataISO(dias: number): string {
   const data = new Date();
   data.setDate(data.getDate() + dias);
   return data.toISOString().slice(0, 10); // YYYY-MM-DD
}

async function gerarCodigoUnico(): Promise<string> {
   for (let i = 0; i < 10; i++) {
      const codigo = crypto.randomBytes(4).toString("hex").toUpperCase();
      const { data } = await cartoesRepo.buscarPorCodigo(codigo);
      if (!data || data.length === 0) return codigo;
   }
   throw new Error("Erro ao gerar código único do cartão.");
}

export const compraPublicaService = {
   async criarCompra(params: {
  restauranteId: string;
  valor: number;
  compradorNome?: string;
  nomePresenteado?: string;
  telefonePresenteado: string;
}) {
  if (!params.restauranteId) throw new Error("Restaurante inválido.");
  if (!params.valor || params.valor <= 0) throw new Error("Valor inválido.");

  const telefonePresenteado = normalizePhoneBR(params.telefonePresenteado);
  if (!isValidPhoneBR(telefonePresenteado))
    throw new Error("Telefone do presenteado inválido.");

  const recebedor = params.nomePresenteado ? params.nomePresenteado.trim() : null;
  const compradorNome = params.compradorNome ? params.compradorNome.trim() : null;

  // (opcional) validações simples de texto
  if (recebedor && recebedor.length > 80) throw new Error("Nome do recebedor muito longo.");
  if (compradorNome && compradorNome.length > 80) throw new Error("Nome do comprador muito longo.");

  const { data, error } = await comprasRepo.criarCompra({
    restauranteId: params.restauranteId,
    valor: params.valor,
    compradorNome,
    recebedor,
    telefonePresenteado,
  });

  if (error) throw new Error(error.message);
  return data;
},

   async confirmarPagamento(compraId: string) {
      const { data: compra, error } = await comprasRepo.buscarPorId(compraId);
      if (error || !compra) throw new Error("Compra não encontrada.");

      if (compra.status === "pago") {
         return { ok: true, compra, jaPago: true };
      }

      const { data: compraPaga } = await comprasRepo.marcarComoPaga(compraId);

      const codigo = await gerarCodigoUnico();
      const validadeEm = adicionarDiasDataISO(60);

      const { data: cartao } = await cartoesRepo.criarCartao({
         restauranteId: compraPaga.restaurante_id,
         codigo,
         valor: Number(compraPaga.valor),
         validadeEm,
         telefonePresenteado: compraPaga.telefone_presenteado,
      });

      await transacoesRepo.criarEmissao({
         cartaoId: cartao.id,
         valor: Number(compraPaga.valor),
      });

      await comprasRepo.vincularCartao(compraId, cartao.id);

      await filaMensagensRepo.enqueue({
         restauranteId: compraPaga.restaurante_id,
         evento: "compra_confirmada_presenteado",
         destinoTelefone: compraPaga.telefone_presenteado,
         mensagem: `🎁 Você recebeu um Gift Card!\nCódigo: ${cartao.codigo}\nSaldo: R$ ${cartao.saldo}\nValidade: ${cartao.validade_em}`,
      });

      if (compraPaga.comprador_telefone) {
         await filaMensagensRepo.enqueue({
            restauranteId: compraPaga.restaurante_id,
            evento: "compra_confirmada_comprador",
            destinoTelefone: compraPaga.comprador_telefone,
            mensagem: `✅ Compra confirmada!\nGift Card enviado para ${compraPaga.telefone_presenteado}\nValor: R$ ${compraPaga.valor}`,
         });
      }

      return { ok: true, cartao, compra: compraPaga };
   },
};
