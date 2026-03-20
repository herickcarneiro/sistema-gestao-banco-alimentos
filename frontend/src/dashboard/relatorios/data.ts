import type { ChartPoint, GraphConfig, Movement, MovementApiDto } from "./types"
import { MOCK_MOVEMENTS } from "./constants"

const API_BASE_URL = import.meta.env.VITE_API_URL

export function mapApiDtoToMovement(dto: MovementApiDto): Movement {
  const quantidadeNumerica = Number(dto.quantidade ?? 0)
  const unidade = dto.unidade === "un" ? "un" : "kg"
  const dataISO = dto.data ?? new Date().toISOString()
  const parsedDate = new Date(dataISO)

  return {
    codigo: dto.codigo ?? "MOV-SEM-COD",
    item: dto.item ?? "Item sem nome",
    categoria: dto.categoria ?? "Sem categoria",
    tipo: dto.tipo === "saida" ? "saida" : "entrada",
    quantidade: `${quantidadeNumerica} ${unidade}`,
    quantidadeNumerica,
    unidade,
    responsavel: dto.responsavel ?? "Nao informado",
    local: dto.local ?? "Nao informado",
    data: parsedDate.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
    dataISO,
    origemDestino: dto.origemDestino ?? dto.origem_destino ?? "Nao informado",
  }
}

export async function getMovementsFromApi(): Promise<Movement[]> {
  if (!API_BASE_URL) {
    return MOCK_MOVEMENTS
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/demand/movimentacoes`, {
      headers: { Accept: "application/json" },
    })

    if (!response.ok) {
      return MOCK_MOVEMENTS
    }

    const payload = (await response.json()) as MovementApiDto[]
    return payload.map(mapApiDtoToMovement)
  } catch {
    return MOCK_MOVEMENTS
  }
}

export function getCategoryOptions(movements: Movement[]): string[] {
  return Array.from(new Set(movements.map((movement) => movement.categoria))).sort()
}

export function getLocalOptions(movements: Movement[]): string[] {
  return Array.from(new Set(movements.map((movement) => movement.local))).sort()
}

export function buildGraphData(graph: GraphConfig, movements: Movement[]): ChartPoint[] {
  const filtered = movements.filter((movement) => {
    const matchesTipo = graph.filters.tipo === "all" || movement.tipo === graph.filters.tipo
    const matchesCategoria = graph.filters.categoria === "all" || movement.categoria === graph.filters.categoria
    const matchesLocal = graph.filters.local === "all" || movement.local === graph.filters.local
    return matchesTipo && matchesCategoria && matchesLocal
  })

  if (graph.type === "table") {
    return filtered.slice(0, 12).map((movement) => ({
      codigo: movement.codigo,
      item: movement.item,
      categoria: movement.categoria,
      tipo: movement.tipo,
      quantidade: movement.quantidade,
      local: movement.local,
      responsavel: movement.responsavel,
      data: movement.data,
    }))
  }

  if (!graph.xAxis || !graph.yAxis) {
    return []
  }

  const grouped = new Map<string, number[]>()

  for (const movement of filtered) {
    const rawKey = movement[graph.xAxis]
    const key = String(rawKey || "Nao informado")
    const values = grouped.get(key) ?? []
    values.push(Number(movement[graph.yAxis] ?? 0))
    grouped.set(key, values)
  }

  return Array.from(grouped.entries()).map(([key, values]) => {
    const sum = values.reduce((acc, value) => acc + value, 0)
    const resultValue =
      graph.aggregation === "count"
        ? values.length
        : graph.aggregation === "avg"
          ? Number((sum / Math.max(values.length, 1)).toFixed(2))
          : sum

    return {
      [graph.xAxis]: key,
      value: resultValue,
    }
  })
}
