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
  BarChart3,
  Clock,
  Download,
  LoaderCircle,
  Plus,
  Search,
  Shield,
  Users,
  Activity,
  Edit2,
  Mail,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react"

type OperatorRole = "admin" | "operador" | "supervisor"
type OperatorStatus = "ativo" | "inativo" | "afastado"
type OperatorShift = "manha" | "tarde" | "noite"

type Operator = {
  id: string
  nome: string
  email: string
  funcao: OperatorRole
  turno: OperatorShift
  status: OperatorStatus
  dataAdmissao: string
  dataAdmissaoISO: string
  movimentacoesHoje: number
  movimentacoesTotal: number
  acuraciaNota: number
  ultimaAtividade: string
  ultimaAtividadeISO: string
}

type OperatorApiDto = {
  id?: string
  nome?: string
  email?: string
  funcao?: string
  turno?: string
  status?: string
  data_admissao?: string
  dataAdmissao?: string
  movimentacoes_hoje?: number
  movimentacoesHoje?: number
  movimentacoes_total?: number
  movimentacoesTotal?: number
  acuracia_nota?: number
  acuraciaNota?: number
  ultima_atividade?: string
  ultimaAtividade?: string
}

const MOCK_OPERATORS: Operator[] = [
  {
    id: "OP-001",
    nome: "Ana Duarte",
    email: "ana.duarte@alimenta.com",
    funcao: "operador",
    turno: "manha",
    status: "ativo",
    dataAdmissao: "12/01/2024",
    dataAdmissaoISO: "2024-01-12",
    movimentacoesHoje: 18,
    movimentacoesTotal: 287,
    acuraciaNota: 9.8,
    ultimaAtividade: "15 min atras",
    ultimaAtividadeISO: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "OP-002",
    nome: "Carlos Melo",
    email: "carlos.melo@alimenta.com",
    funcao: "supervisor",
    turno: "tarde",
    status: "ativo",
    dataAdmissao: "08/03/2023",
    dataAdmissaoISO: "2023-03-08",
    movimentacoesHoje: 15,
    movimentacoesTotal: 512,
    acuraciaNota: 9.5,
    ultimaAtividade: "32 min atras",
    ultimaAtividadeISO: new Date(Date.now() - 32 * 60000).toISOString(),
  },
  {
    id: "OP-003",
    nome: "Livia Costa",
    email: "livia.costa@alimenta.com",
    funcao: "operador",
    turno: "manha",
    status: "ativo",
    dataAdmissao: "20/06/2024",
    dataAdmissaoISO: "2024-06-20",
    movimentacoesHoje: 13,
    movimentacoesTotal: 156,
    acuraciaNota: 9.2,
    ultimaAtividade: "2h atras",
    ultimaAtividadeISO: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "OP-004",
    nome: "Paula Braga",
    email: "paula.braga@alimenta.com",
    funcao: "operador",
    turno: "tarde",
    status: "ativo",
    dataAdmissao: "15/11/2023",
    dataAdmissaoISO: "2023-11-15",
    movimentacoesHoje: 10,
    movimentacoesTotal: 398,
    acuraciaNota: 8.9,
    ultimaAtividade: "4h atras",
    ultimaAtividadeISO: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: "OP-005",
    nome: "Roberto Silva",
    email: "roberto.silva@alimenta.com",
    funcao: "admin",
    turno: "manha",
    status: "ativo",
    dataAdmissao: "01/05/2022",
    dataAdmissaoISO: "2022-05-01",
    movimentacoesHoje: 6,
    movimentacoesTotal: 724,
    acuraciaNota: 9.9,
    ultimaAtividade: "1h atras",
    ultimaAtividadeISO: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: "OP-006",
    nome: "Marcia Ferreira",
    email: "marcia.ferreira@alimenta.com",
    funcao: "operador",
    turno: "noite",
    status: "afastado",
    dataAdmissao: "22/12/2023",
    dataAdmissaoISO: "2023-12-22",
    movimentacoesHoje: 0,
    movimentacoesTotal: 234,
    acuraciaNota: 8.7,
    ultimaAtividade: "2 dias atras",
    ultimaAtividadeISO: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
]

const API_BASE_URL = import.meta.env.VITE_API_URL

function mapApiDtoToOperator(dto: OperatorApiDto): Operator {
  const dataAdmissaoISO = dto.dataAdmissao ?? dto.data_admissao ?? new Date().toISOString().split("T")[0]
  const date = new Date(dataAdmissaoISO)

  return {
    id: dto.id ?? "OP-UNKN",
    nome: dto.nome ?? "Operador sem nome",
    email: dto.email ?? "nao-informado@localhost",
    funcao: (dto.funcao ?? "operador").toLowerCase() as OperatorRole,
    turno: (dto.turno ?? "manha").toLowerCase() as OperatorShift,
    status: (dto.status ?? "ativo").toLowerCase() as OperatorStatus,
    dataAdmissao: date.toLocaleString("pt-BR", { dateStyle: "short" }),
    dataAdmissaoISO,
    movimentacoesHoje: dto.movimentacoesHoje ?? dto.movimentacoes_hoje ?? 0,
    movimentacoesTotal: dto.movimentacoesTotal ?? dto.movimentacoes_total ?? 0,
    acuraciaNota: dto.acuraciaNota ?? dto.acuracia_nota ?? 0,
    ultimaAtividade: dto.ultimaAtividade ?? "Nao informado",
    ultimaAtividadeISO: dto.ultimaAtividade ?? new Date().toISOString(),
  }
}

async function getOperatorsFromApi(): Promise<Operator[]> {
  if (!API_BASE_URL) {
    return MOCK_OPERATORS
  }

  const response = await fetch(`${API_BASE_URL}/api/core/operadores`, {
    headers: {
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Falha ao carregar operadores")
  }

  const payload = await response.json() as OperatorApiDto[]
  return payload.map(mapApiDtoToOperator)
}

function getShiftLabel(shift: OperatorShift) {
  const labels = { manha: "Manha", tarde: "Tarde", noite: "Noite" }
  return labels[shift]
}

function getRoleIcon(role: OperatorRole) {
  if (role === "admin") return Shield
  if (role === "supervisor") return Users
  return Activity
}

function getRoleBadgeColor(role: OperatorRole) {
  if (role === "admin") return "bg-red-100 text-red-800"
  if (role === "supervisor") return "bg-blue-100 text-blue-800"
  return "bg-slate-100 text-slate-800"
}

export function DashboardOperadoresPage() {
  const [operators, setOperators] = useState<Operator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | OperatorStatus>("ativo")

  useEffect(() => {
    let isMounted = true

    const loadOperators = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const data = await getOperatorsFromApi()
        if (isMounted) {
          setOperators(data)
        }
      } catch {
        if (isMounted) {
          setError("Nao foi possivel carregar a lista de operadores.")
          setOperators(MOCK_OPERATORS)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadOperators()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredOperators = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return operators.filter((operator) => {
      const matchesSearch =
        search.length === 0 ||
        operator.nome.toLowerCase().includes(search) ||
        operator.email.toLowerCase().includes(search) ||
        operator.id.toLowerCase().includes(search)

      const matchesStatus = statusFilter === "all" || operator.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [operators, searchTerm, statusFilter])

  const dashboardStats = useMemo(() => {
    const totalOperators = filteredOperators.length
    const activeOperators = filteredOperators.filter((op) => op.status === "ativo").length
    const totalMovements = filteredOperators.reduce((sum, op) => sum + op.movimentacoesHoje, 0)
    const avgAccuracy = filteredOperators.length > 0
      ? (filteredOperators.reduce((sum, op) => sum + op.acuraciaNota, 0) / filteredOperators.length).toFixed(1)
      : "0"

    return [
      {
        label: "Total de Operadores",
        value: totalOperators.toString(),
        detail: `${activeOperators} ativos`,
        icon: Users,
        tone: "text-primary",
        bg: "bg-primary/10",
      },
      {
        label: "Movimentacoes Hoje",
        value: totalMovements.toString(),
        detail: "Registros do dia",
        icon: Activity,
        tone: "text-sky-700",
        bg: "bg-sky-100",
      },
      {
        label: "Acuracia Media",
        value: `${avgAccuracy}/10`,
        detail: "Qualidade de dados",
        icon: BarChart3,
        tone: "text-emerald-700",
        bg: "bg-emerald-100",
      },
      {
        label: "Turnos Ativos",
        value: new Set(filteredOperators.map((op) => op.turno)).size.toString(),
        detail: "Cobertura operacional",
        icon: Clock,
        tone: "text-amber-700",
        bg: "bg-amber-100",
      },
    ]
  }, [filteredOperators])

  const roleDistribution = useMemo(() => {
    const admins = filteredOperators.filter((op) => op.funcao === "admin").length
    const supervisors = filteredOperators.filter((op) => op.funcao === "supervisor").length
    const operadores = filteredOperators.filter((op) => op.funcao === "operador").length

    return [
      { label: "Administradores", count: admins, color: "bg-red-500" },
      { label: "Supervisores", count: supervisors, color: "bg-blue-500" },
      { label: "Operadores", count: operadores, color: "bg-slate-500" },
    ]
  }, [filteredOperators])

  const topPerformers = useMemo(() => {
    return [...filteredOperators]
      .sort((a, b) => b.acuraciaNota - a.acuraciaNota)
      .slice(0, 5)
  }, [filteredOperators])

  const operatorsByStatus = useMemo(() => {
    return {
      ativo: filteredOperators.filter((op) => op.status === "ativo"),
      inativo: filteredOperators.filter((op) => op.status === "inativo"),
      afastado: filteredOperators.filter((op) => op.status === "afastado"),
    }
  }, [filteredOperators])

  const getStatusIcon = (status: OperatorStatus) => {
    if (status === "ativo") return CheckCircle
    if (status === "inativo") return AlertCircle
    return XCircle
  }

  const getStatusColor = (status: OperatorStatus) => {
    if (status === "ativo") return "text-primary"
    if (status === "inativo") return "text-amber-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Operadores</h1>
          <p className="text-sm text-muted-foreground">Gerencie usuários, turnos, desempenho e acessos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Relatorio
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo operador
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            className="pl-10"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | OperatorStatus)}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
            <SelectItem value="afastado">Afastado</SelectItem>
          </SelectContent>
        </Select>
      </div>

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

      {isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-card p-8 text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Carregando operadores...
        </div>
      )}

      {!isLoading && filteredOperators.length === 0 && (
        <div className="rounded-lg border border-border/60 bg-card p-12 text-center text-muted-foreground">
          Nenhum operador encontrado para sua busca.
        </div>
      )}

      {!isLoading &&
        filteredOperators.length > 0 &&
        (["ativo", "inativo", "afastado"] as const).map((status) => {
          const operators = operatorsByStatus[status]
          if (operators.length === 0) return null

          const StatusIcon = getStatusIcon(status)
          const statusLabels = { ativo: "Ativos", inativo: "Inativos", afastado: "Afastados" }

          return (
            <div key={status} className="space-y-3">
              <div className="flex items-center gap-2">
                <StatusIcon className={`h-5 w-5 ${getStatusColor(status)}`} />
                <h2 className="text-lg font-semibold text-foreground">{statusLabels[status]}</h2>
                <Badge variant="secondary" className="ml-auto">{operators.length}</Badge>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {operators.map((operator) => {
                  const RoleIcon = getRoleIcon(operator.funcao)
                  const acuraciaColor =
                    operator.acuraciaNota >= 9
                      ? "text-primary"
                      : operator.acuraciaNota >= 8.5
                        ? "text-sky-600"
                        : "text-amber-600"

                  return (
                    <Card key={operator.id} className="border-border/60 hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-foreground">{operator.nome}</h3>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Mail className="h-3 w-3" />
                                  {operator.email}
                                </p>
                              </div>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className={`gap-1 ${getRoleBadgeColor(operator.funcao)}`}>
                              <RoleIcon className="h-3 w-3" />
                              {operator.funcao === "admin"
                                ? "Admin"
                                : operator.funcao === "supervisor"
                                  ? "Supervisor"
                                  : "Operador"}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="gap-1 bg-slate-100 text-slate-700"
                            >
                              <Clock className="h-3 w-3" />
                              {getShiftLabel(operator.turno)}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/30">
                            <div>
                              <p className="text-xs text-muted-foreground">Mov. Hoje</p>
                              <p className="text-lg font-semibold text-foreground">
                                {operator.movimentacoesHoje}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Acuracia</p>
                              <p className={`text-lg font-semibold ${acuraciaColor}`}>
                                {operator.acuraciaNota.toFixed(1)}
                              </p>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            Ativo há {operator.ultimaAtividade}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-foreground">Distribuicao de funcoes</CardTitle>
            <CardDescription>Todos os operadores</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {roleDistribution.map((role) => (
              <div key={role.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{role.label}</span>
                  <span className="text-muted-foreground">{role.count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className={`h-2 rounded-full ${role.color}`}
                    style={{
                      width: `${operators.length > 0 ? (role.count / operators.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-foreground">Turnos em operacao</CardTitle>
            <CardDescription>Cobertura do dia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(["manha", "tarde", "noite"] as const).map((shift) => {
              const count = operators.filter((op) => op.turno === shift && op.status === "ativo").length
              return (
                <div key={shift} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{getShiftLabel(shift)}</p>
                    <p className="text-xs text-muted-foreground">{count} operador(es) ativo(s)</p>
                  </div>
                  <div className="text-2xl font-semibold text-primary">{count}</div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-foreground">Melhor desempenho</CardTitle>
            <CardDescription>Maiores notas de acuracia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPerformers.length === 0 && (
              <p className="text-sm text-muted-foreground">Sem operadores para exibir.</p>
            )}

            {topPerformers.map((operator, index) => (
              <div
                key={operator.id}
                className="flex items-center justify-between rounded-lg border border-border/60 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{index + 1}. {operator.nome}</p>
                  <p className="text-xs text-muted-foreground">{getShiftLabel(operator.turno)}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`font-semibold ${
                    operator.acuraciaNota >= 9 ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {operator.acuraciaNota.toFixed(1)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          {error} Exibindo dados locais temporarios.
        </div>
      )}
    </div>
  )
}
