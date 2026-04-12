import { differenceInCalendarDays } from "date-fns";

export interface CategoriaOption {
  id_categoria: string;
  nome_categoria: string;
}

export interface StockApiItem {
  id_produto: string;
  produto: string;
  categoria: string;
  unidade_medida: string;
  quantidade_total: number;
}

export interface BatchApiItem {
  id_lote: string;
  id_produto: string;
  quantidade_disponivel: number;
  data_validade: string;
  data_entrada?: string | null;
  esta_valido?: boolean;
}

export type BatchStatus = "valido" | "proximo_vencimento" | "vencido";

export interface BatchView {
  id_lote: string;
  id_produto: string;
  quantidade_disponivel: number;
  data_validade: Date;
  data_entrada: Date;
  esta_valido?: boolean;
  status_validade: BatchStatus;
}

export interface StockViewItem extends StockApiItem {
  lotes: BatchView[];
  historico: BatchView[];
}

export function getBatchStatus(dataValidade: Date, now = new Date()): BatchStatus {
  const diasParaVencer = differenceInCalendarDays(dataValidade, now);

  if (diasParaVencer < 0) {
    return "vencido";
  }
  if (diasParaVencer <= 30) {
    return "proximo_vencimento";
  }
  return "valido";
}

export function parseBatch(batch: BatchApiItem): BatchView {
  const dataValidade = new Date(batch.data_validade);
  const dataEntrada = new Date(batch.data_entrada ?? batch.data_validade);

  return {
    id_lote: batch.id_lote,
    id_produto: batch.id_produto,
    quantidade_disponivel: batch.quantidade_disponivel,
    data_validade: dataValidade,
    data_entrada: dataEntrada,
    esta_valido: batch.esta_valido,
    status_validade: getBatchStatus(dataValidade),
  };
}

export function formatStockTotal(quantidade: number, unidade: string): string {
  return `${quantidade.toLocaleString("pt-BR")} ${unidade}`;
}
