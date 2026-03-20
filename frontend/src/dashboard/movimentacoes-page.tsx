"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  LoaderCircle,
  Package,
  Plus,
  Search,
  Users,
} from "lucide-react"

type MovementType = "entrada" | "saida"
type PeriodFilter = "today" | "7d" | "30d" | "all"

type Movement = {
  codigo: string
  item: string
  categoria: string
  tipo: MovementType
  quantidade: string
  quantidadeNumerica: number
  unidade: "kg" | "un"
  responsavel: string
  local: string
  data: string
  dataISO: string
  origemDestino: string
}

type MovementApiDto = {
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

const MOCK_MOVEMENTS: Movement[] = [
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
  {
    codigo: "MOV-2483",
    item: "Oleo de Soja",
    categoria: "Enlatados",
    tipo: "entrada",
    quantidade: "90 un",
    quantidadeNumerica: 90,
    unidade: "un",
    responsavel: "Carlos Melo",
    local: "Dep. Central",
    data: "17/03/2026 11:20",
    dataISO: "2026-03-17T11:20:00",
    origemDestino: "Doacao - Rede Alimentar BH",
  },
  {
    codigo: "MOV-2482",
    item: "Acucar Refinado",
    categoria: "Graos",
    tipo: "saida",
    quantidade: "70 kg",
    quantidadeNumerica: 70,
    unidade: "kg",
    responsavel: "Paula Braga",
    local: "Dep. Seco A",
    data: "17/03/2026 10:02",
    dataISO: "2026-03-17T10:02:00",
    origemDestino: "Distribuicao - Instituto Viver",
  },
]

const API_BASE_URL = import.meta.env.VITE_API_URL

const formatMass = (value: number) => `${new Intl.NumberFormat("pt-BR").format(value)} kg`

function mapApiDtoToMovement(dto: MovementApiDto): Movement {
  const quantidadeNumerica = Number(dto.quantidade ?? 0)
  const unidade = dto.unidade === "un" ? "un" : "kg"
  const dataISO = dto.data ?? new Date().toISOString()
  const date = new Date(dataISO)

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
    data: date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
    dataISO,
    origemDestino: dto.origemDestino ?? dto.origem_destino ?? "Nao informado",
  }
}

async function getMovementsFromApi(): Promise<Movement[]> {
  if (!API_BASE_URL) {
    return MOCK_MOVEMENTS
  }

  const response = await fetch(`${API_BASE_URL}/api/demand/movimentacoes`, {
    headers: {
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Falha ao carregar movimentacoes")
  }

  const payload = await response.json() as MovementApiDto[]
  return payload.map(mapApiDtoToMovement)
}

function inPeriod(dateISO: string, period: PeriodFilter) {
  if (period === "all") return true

  const current = new Date()
  const movementDate = new Date(dateISO)
  const diffMs = current.getTime() - movementDate.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (period === "today") {
    return current.toDateString() === movementDate.toDateString()
  }

  if (period === "7d") {
    return diffDays <= 7
  }

  return diffDays <= 30
}

export function DashboardMovimentacoesPage() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | MovementType>("all")
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("7d")
  const [localFilter, setLocalFilter] = useState<string>("all")

  useEffect(() => {
    let isMounted = true

    const loadMovements = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const data = await getMovementsFromApi()
        if (isMounted) {
          setMovements(data)
        }
      } catch {
        if (isMounted) {
          setError("Nao foi possivel carregar a lista de movimentacoes.")
          setMovements(MOCK_MOVEMENTS)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadMovements()

    return () => {
      isMounted = false
    }
  }, [])

  const localOptions = useMemo(() => {
    return ["all", ...Array.from(new Set(movements.map((movement) => movement.local)))]
  }, [movements])

  const filteredMovements = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return movements.filter((movement) => {
      const matchesSearch =
        search.length === 0 ||
        movement.codigo.toLowerCase().includes(search) ||
        movement.item.toLowerCase().includes(search) ||
        movement.categoria.toLowerCase().includes(search) ||
        movement.responsavel.toLowerCase().includes(search) ||
        movement.origemDestino.toLowerCase().includes(search)

      const matchesType = typeFilter === "all" || movement.tipo === typeFilter
      const matchesPeriod = inPeriod(movement.dataISO, periodFilter)
      const matchesLocal = localFilter === "all" || movement.local === localFilter

      return matchesSearch && matchesType && matchesPeriod && matchesLocal
    })
  }, [movements, searchTerm, typeFilter, periodFilter, localFilter])

  const dashboardStats = useMemo(() => {
    const entries = filteredMovements.filter((movement) => movement.tipo === "entrada")
    const exits = filteredMovements.filter((movement) => movement.tipo === "saida")

    const entriesKg = entries
      .filter((movement) => movement.unidade === "kg")
      .reduce((sum, movement) => sum + movement.quantidadeNumerica, 0)

    const exitsKg = exits
      .filter((movement) => movement.unidade === "kg")
      .reduce((sum, movement) => sum + movement.quantidadeNumerica, 0)

    const uniqueItems = new Set(filteredMovements.map((movement) => movement.item)).size
    const uniqueOperators = new Set(filteredMovements.map((movement) => movement.responsavel)).size

    return [
      {
        label: "Entradas",
        value: formatMass(entriesKg),
        detail: `${entries.length} registros`,
        icon: ArrowDownRight,
        tone: "text-primary",
        bg: "bg-primary/10",
      },
      {
        label: "Saidas",
        value: formatMass(exitsKg),
        detail: `${exits.length} registros`,
        icon: ArrowUpRight,
        tone: "text-amber-700",
        bg: "bg-amber-100",
      },
      {
        label: "Itens Movimentados",
        value: uniqueItems.toString(),
        detail: `${new Set(filteredMovements.map((movement) => movement.categoria)).size} categorias`,
        icon: Package,
        tone: "text-sky-700",
        bg: "bg-sky-100",
      },
      {
        label: "Operadores Ativos",
        value: uniqueOperators.toString(),
        detail: "Com base nos filtros",
        icon: Users,
        tone: "text-emerald-700",
        bg: "bg-emerald-100",
      },
    ]
  }, [filteredMovements])

  const typeDistribution = useMemo(() => {
    const total = filteredMovements.length || 1
    const entriesCount = filteredMovements.filter((movement) => movement.tipo === "entrada").length
    const exitsCount = filteredMovements.filter((movement) => movement.tipo === "saida").length

    return [
      {
        label: "Entradas",
        percent: Math.round((entriesCount / total) * 100),
        amount: `${entriesCount} mov.`,
        color: "bg-primary",
      },
      {
        label: "Saidas",
        percent: Math.round((exitsCount / total) * 100),
        amount: `${exitsCount} mov.`,
        color: "bg-amber-500",
      },
    ]
  }, [filteredMovements])

  const activeOperators = useMemo(() => {
    const countByOperator = new Map<string, number>()

    for (const movement of filteredMovements) {
      countByOperator.set(movement.responsavel, (countByOperator.get(movement.responsavel) ?? 0) + 1)
    }

    return Array.from(countByOperator.entries())
      .map(([name, actions]) => ({ name, actions }))
      .sort((a, b) => b.actions - a.actions)
      .slice(0, 4)
  }, [filteredMovements])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Movimentacoes</h1>
          <p className="text-sm text-muted-foreground">Acompanhe entradas e saidas com rastreio por item, local e responsavel.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nova movimentacao
          </Button>
        </div>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-foreground">Filtros rapidos</CardTitle>
          <CardDescription>Refine por codigo, item, categoria ou operador.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por codigo, item, categoria..."
                className="pl-10"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as "all" | MovementType)}>
              <SelectTrigger className="w-full lg:w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saida</SelectItem>
              </SelectContent>
            </Select>

            <Select value={periodFilter} onValueChange={(value) => setPeriodFilter(value as PeriodFilter)}>
              <SelectTrigger className="w-full lg:w-[160px]">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="7d">Ultimos 7 dias</SelectItem>
                <SelectItem value="30d">Ultimos 30 dias</SelectItem>
                <SelectItem value="all">Todo periodo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={localFilter} onValueChange={setLocalFilter}>
              <SelectTrigger className="w-full lg:w-[170px]">
                <SelectValue placeholder="Local" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os locais</SelectItem>
                {localOptions.filter((option) => option !== "all").map((local) => (
                  <SelectItem key={local} value={local}>
                    {local}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.detail}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.tone}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="border-border/60 xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground">Historico de movimentacoes</CardTitle>
            <CardDescription>
              {isLoading
                ? "Carregando movimentacoes..."
                : `${filteredMovements.length} registros encontrados com os filtros aplicados.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left font-medium text-muted-foreground">Codigo</th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">Item</th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">Tipo</th>
                    <th className="hidden pb-3 text-left font-medium text-muted-foreground lg:table-cell">Qtd</th>
                    <th className="hidden pb-3 text-left font-medium text-muted-foreground lg:table-cell">Responsavel</th>
                    <th className="hidden pb-3 text-left font-medium text-muted-foreground xl:table-cell">Origem/Destino</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={6} className="py-6">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Carregando dados...
                        </div>
                      </td>
                    </tr>
                  )}

                  {!isLoading && filteredMovements.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-muted-foreground">
                        Nenhuma movimentacao encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  )}

                  {!isLoading && filteredMovements.map((movement) => (
                    <tr key={movement.codigo} className="border-b border-border/50 align-top last:border-0">
                      <td className="py-3 pr-2 font-medium text-foreground">{movement.codigo}</td>
                      <td className="py-3 pr-2">
                        <div className="font-medium text-foreground">{movement.item}</div>
                        <div className="text-xs text-muted-foreground">{movement.categoria} - {movement.local}</div>
                        <div className="text-xs text-muted-foreground">{movement.data}</div>
                      </td>
                      <td className="py-3 pr-2">
                        {movement.tipo === "entrada" ? (
                          <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary">
                            <ArrowDownRight className="h-3 w-3" />
                            Entrada
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800">
                            <ArrowUpRight className="h-3 w-3" />
                            Saida
                          </Badge>
                        )}
                      </td>
                      <td className="hidden py-3 pr-2 text-muted-foreground lg:table-cell">{movement.quantidade}</td>
                      <td className="hidden py-3 pr-2 text-muted-foreground lg:table-cell">{movement.responsavel}</td>
                      <td className="hidden py-3 text-muted-foreground xl:table-cell">{movement.origemDestino}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {error && (
              <p className="mt-3 text-xs text-amber-700">{error} Exibindo dados locais temporarios.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-foreground">Volume por tipo</CardTitle>
              <CardDescription>Consolidado dos ultimos 7 dias.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {typeDistribution.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="text-muted-foreground">{item.amount}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">{item.percent}% do total movimentado</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-foreground">Operadores mais ativos</CardTitle>
              <CardDescription>Quantidade de registros por operador.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeOperators.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem operadores para os filtros atuais.</p>
              )}

              {activeOperators.map((operator, index) => (
                <div key={operator.name} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{index + 1}. {operator.name}</p>
                    <p className="text-xs text-muted-foreground">Maior volume no periodo filtrado</p>
                  </div>
                  <Badge variant="outline" className="font-semibold">
                    {operator.actions} mov.
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}