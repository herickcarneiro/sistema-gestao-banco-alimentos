export type ChartType = "bar" | "line" | "table" | "donut"

export type Aggregation = "sum" | "count" | "avg"

export type Movement = {
  codigo: string
  item: string
  categoria: string
  tipo: "entrada" | "saida"
  quantidade: string
  quantidadeNumerica: number
  unidade: "kg" | "un"
  responsavel: string
  local: string
  data: string
  dataISO: string
  origemDestino: string
}

export type MovementApiDto = {
  codigo?: string
  item?: string
  categoria?: string
  tipo?: string
  quantidade?: number
  unidade?: string
  responsavel?: string
  local?: string
  data?: string
  origem_destino?: string
  origemDestino?: string
}

export type GraphFilters = {
  tipo: "all" | "entrada" | "saida"
  categoria: string
  local: string
}

export type FieldOption = {
  name: keyof Movement
  label: string
}

export type GraphConfig = {
  id: string
  title: string
  description: string
  type: ChartType
  xAxis: keyof Movement | ""
  yAxis: keyof Movement | ""
  aggregation: Aggregation
  color: string
  filters: GraphFilters
  saved: boolean
}

export type ChartPoint = Record<string, string | number>
