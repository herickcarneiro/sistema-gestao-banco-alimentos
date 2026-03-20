"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, LoaderCircle, Plus, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GraphCard } from "./relatorios/graph-card"
import { GraphTypePickerDialog } from "./relatorios/graph-type-picker-dialog"
import { GraphConfigDialog } from "./relatorios/graph-config-dialog"
import { createGraphConfig } from "./relatorios/constants"
import { buildGraphData, getCategoryOptions, getLocalOptions, getMovementsFromApi } from "./relatorios/data"
import type { ChartType, GraphConfig, Movement } from "./relatorios/types"

const API_BASE_URL = import.meta.env.VITE_API_URL

export function DashboardRelatoriosPage() {
  const [graphs, setGraphs] = useState<GraphConfig[]>([createGraphConfig("bar", 0)])
  const [movements, setMovements] = useState<Movement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editingGraphId, setEditingGraphId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getMovementsFromApi()
        setMovements(data)
      } catch {
        setError("Nao foi possivel carregar dados remotos. Exibindo fallback local.")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const categorias = useMemo(() => getCategoryOptions(movements), [movements])
  const locais = useMemo(() => getLocalOptions(movements), [movements])

  const editingGraph = useMemo(
    () => graphs.find((graph) => graph.id === editingGraphId) ?? null,
    [graphs, editingGraphId]
  )

  const graphDataMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof buildGraphData>>()
    for (const graph of graphs) {
      map.set(graph.id, buildGraphData(graph, movements))
    }
    return map
  }, [graphs, movements])

  const handlePickType = (type: ChartType) => {
    const newGraph = createGraphConfig(type, graphs.length)
    setGraphs((prev) => [...prev, newGraph])
    setEditingGraphId(newGraph.id)
  }

  const handleSaveGraphConfig = (updated: GraphConfig) => {
    setGraphs((prev) => prev.map((graph) => (graph.id === updated.id ? { ...updated, saved: false } : graph)))
  }

  const handleDuplicateGraph = (id: string) => {
    const current = graphs.find((graph) => graph.id === id)
    if (!current) {
      return
    }

    const duplicated: GraphConfig = {
      ...current,
      id: crypto.randomUUID(),
      title: `${current.title} (copia)`,
      saved: false,
    }

    setGraphs((prev) => [...prev, duplicated])
  }

  const handleDeleteGraph = (id: string) => {
    setGraphs((prev) => prev.filter((graph) => graph.id !== id))
    if (editingGraphId === id) {
      setEditingGraphId(null)
    }
  }

  const handleSaveAll = async () => {
    setIsSaving(true)
    setError(null)

    try {
      if (!API_BASE_URL) {
        setGraphs((prev) => prev.map((graph) => ({ ...graph, saved: true })))
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/relatorios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          nome: `Relatorio ${new Date().toLocaleDateString("pt-BR")}`,
          descricao: "Relatorio customizavel de movimentacoes",
          configuracao: {
            graphs,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Falha ao salvar relatorio")
      }

      setGraphs((prev) => prev.map((graph) => ({ ...graph, saved: true })))
    } catch {
      setError("Nao foi possivel salvar no backend agora. Tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Relatorios</h1>
          <p className="text-sm text-muted-foreground">
            Monte graficos customizaveis, defina agrupamentos, filtros e escolha a cor por visualizacao.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Grafico
          </Button>
          <Button size="sm" onClick={handleSaveAll} disabled={isSaving || graphs.length === 0}>
            {isSaving ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar graficos
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-card p-8 text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Carregando dados...
        </div>
      )}

      {!isLoading && movements.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Nenhuma movimentacao disponivel para gerar relatorios.
        </div>
      )}

      {!isLoading && graphs.length === 0 && (
        <div className="rounded-lg border border-border/70 bg-card p-6 text-center text-muted-foreground">
          Sem graficos ainda. Clique em "Novo Grafico" para comecar.
        </div>
      )}

      {!isLoading && graphs.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {graphs.map((graph) => (
            <GraphCard
              key={graph.id}
              graph={graph}
              data={graphDataMap.get(graph.id) ?? []}
              onEdit={setEditingGraphId}
              onDuplicate={handleDuplicateGraph}
              onDelete={handleDeleteGraph}
            />
          ))}
        </div>
      )}

      <GraphTypePickerDialog open={pickerOpen} onOpenChange={setPickerOpen} onPick={handlePickType} />

      <GraphConfigDialog
        graph={editingGraph}
        open={Boolean(editingGraph)}
        categorias={categorias}
        locais={locais}
        onOpenChange={(open) => {
          if (!open) {
            setEditingGraphId(null)
          }
        }}
        onSave={handleSaveGraphConfig}
      />
    </div>
  )
}
