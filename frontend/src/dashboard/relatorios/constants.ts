import type { FieldOption, GraphConfig, Movement } from "./types"

export const CHART_TYPE_OPTIONS = [
  { value: "bar", label: "Grafico de barra" },
  { value: "line", label: "Grafico de linha" },
  { value: "donut", label: "Grafico de donut" },
  { value: "table", label: "Tabela" },
] as const

export const GRAPH_TYPE_PICKER_CARDS = [
  { value: "bar", label: "Grafico de barra", description: "Compara categorias lado a lado", disabled: false },
  { value: "line", label: "Grafico de linha", description: "Mostra tendencia ao longo do tempo", disabled: false },
  { value: "donut", label: "Grafico de donut", description: "Mostra distribuicao percentual", disabled: false },
  { value: "table", label: "Tabela", description: "Visualizacao detalhada de registros", disabled: false },
  { value: "area", label: "Grafico de area", description: "Em breve", disabled: true },
  { value: "funnel", label: "Grafico de funil", description: "Em breve", disabled: true },
  { value: "indicator", label: "Indicador", description: "Em breve", disabled: true },
  { value: "map", label: "Mapa", description: "Em breve", disabled: true },
] as const

export const AVAILABLE_FIELDS: FieldOption[] = [
  { name: "tipo", label: "Tipo" },
  { name: "categoria", label: "Categoria" },
  { name: "item", label: "Item" },
  { name: "responsavel", label: "Responsavel" },
  { name: "local", label: "Local" },
  { name: "origemDestino", label: "Origem / Destino" },
  { name: "quantidadeNumerica", label: "Quantidade" },
  { name: "data", label: "Data" },
]

export const X_AXIS_FIELDS = AVAILABLE_FIELDS.filter((field) => field.name !== "quantidade" && field.name !== "quantidadeNumerica")
export const Y_AXIS_FIELDS = AVAILABLE_FIELDS.filter((field) => field.name === "quantidadeNumerica")

export const MOCK_MOVEMENTS: Movement[] = [
  {
    codigo: "MOV-2487",
    item: "Arroz Tipo 1",
    categoria: "Graos",
    tipo: "entrada",
    quantidade: "200 kg",
    quantidadeNumerica: 200,
    unidade: "kg",
    responsavel: "Ana Duarte",
    local: "Dep. Central",
    data: "18/03/2026 09:42",
    dataISO: "2026-03-18T09:42:00",
    origemDestino: "Doacao - Mercado Bom Preco",
  },
  {
    codigo: "MOV-2486",
    item: "Leite UHT",
    categoria: "Laticinios",
    tipo: "saida",
    quantidade: "120 un",
    quantidadeNumerica: 120,
    unidade: "un",
    responsavel: "Carlos Melo",
    local: "Camara Fria",
    data: "18/03/2026 08:57",
    dataISO: "2026-03-18T08:57:00",
    origemDestino: "Distribuicao - Casa Esperanca",
  },
  {
    codigo: "MOV-2485",
    item: "Feijao Carioca",
    categoria: "Graos",
    tipo: "entrada",
    quantidade: "160 kg",
    quantidadeNumerica: 160,
    unidade: "kg",
    responsavel: "Livia Costa",
    local: "Dep. Seco A",
    data: "17/03/2026 16:08",
    dataISO: "2026-03-17T16:08:00",
    origemDestino: "Doacao - Cooperativa Unidos",
  },
  {
    codigo: "MOV-2484",
    item: "Macarrao",
    categoria: "Massas",
    tipo: "saida",
    quantidade: "85 kg",
    quantidadeNumerica: 85,
    unidade: "kg",
    responsavel: "Ana Duarte",
    local: "Dep. Seco B",
    data: "17/03/2026 14:33",
    dataISO: "2026-03-17T14:33:00",
    origemDestino: "Distribuicao - Centro Comunitario Sol",
  },
]

export function createGraphConfig(type: GraphConfig["type"], index: number): GraphConfig {
  return {
    id: crypto.randomUUID(),
    title: `Grafico ${index + 1}`,
    description: "",
    type,
    xAxis: "categoria",
    yAxis: "quantidadeNumerica",
    aggregation: "sum",
    color: "#22c55e",
    filters: {
      tipo: "all",
      categoria: "all",
      local: "all",
    },
    saved: false,
  }
}
