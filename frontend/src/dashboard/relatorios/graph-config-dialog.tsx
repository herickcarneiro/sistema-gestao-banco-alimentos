"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CHART_TYPE_OPTIONS, X_AXIS_FIELDS, Y_AXIS_FIELDS } from "./constants"
import type { GraphConfig } from "./types"

type Props = {
  graph: GraphConfig | null
  open: boolean
  categorias: string[]
  locais: string[]
  onOpenChange: (open: boolean) => void
  onSave: (graph: GraphConfig) => void
}

export function GraphConfigDialog({
  graph,
  open,
  categorias,
  locais,
  onOpenChange,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<GraphConfig | null>(graph)

  useEffect(() => {
    setDraft(graph)
  }, [graph])

  if (!draft) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden p-0">
        <DialogHeader className="border-b border-border/70 px-6 py-4">
          <DialogTitle>Selecione o tipo de grafico</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="h-fit rounded-xl border border-border/70 bg-muted/30 p-3">
              <p className="mb-2 text-xs text-muted-foreground">Preview rapido</p>
              <div className="h-40 rounded-lg bg-gradient-to-b from-fuchsia-100 via-violet-100 to-sky-100" />
            </div>

            <div className="min-w-0 space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Titulo do grafico</label>
                <Input
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value, saved: false })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                <Select
                  value={draft.type}
                  onValueChange={(value) =>
                    setDraft({ ...draft, type: value as GraphConfig["type"], saved: false })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHART_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Descricao</label>
                <Input
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value, saved: false })}
                  placeholder="Descreva o objetivo do grafico"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Agrupar por</label>
                <Select
                  value={draft.xAxis || ""}
                  onValueChange={(value) => setDraft({ ...draft, xAxis: value as GraphConfig["xAxis"], saved: false })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Campo" />
                  </SelectTrigger>
                  <SelectContent>
                    {X_AXIS_FIELDS.map((field) => (
                      <SelectItem key={field.name} value={field.name}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Valor</label>
                <Select
                  value={draft.yAxis || ""}
                  onValueChange={(value) => setDraft({ ...draft, yAxis: value as GraphConfig["yAxis"], saved: false })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Campo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Y_AXIS_FIELDS.map((field) => (
                      <SelectItem key={field.name} value={field.name}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Agregacao</label>
                <Select
                  value={draft.aggregation}
                  onValueChange={(value) =>
                    setDraft({ ...draft, aggregation: value as GraphConfig["aggregation"], saved: false })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sum">Soma</SelectItem>
                    <SelectItem value="count">Contagem</SelectItem>
                    <SelectItem value="avg">Media</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Cor</label>
                <div className="flex h-10 items-center gap-2 rounded-md border border-input px-3">
                  <input
                    type="color"
                    value={draft.color}
                    onChange={(event) => setDraft({ ...draft, color: event.target.value, saved: false })}
                    className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span className="text-xs text-muted-foreground">{draft.color.toUpperCase()}</span>
                </div>
              </div>
            </div>

              <div className="rounded-lg border border-border/70 p-3">
                <p className="mb-3 text-xs font-semibold text-muted-foreground">Filtro para trazer dados mais especificos</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                  <Select
                    value={draft.filters.tipo}
                    onValueChange={(value) =>
                      setDraft({
                        ...draft,
                        filters: { ...draft.filters, tipo: value as GraphConfig["filters"]["tipo"] },
                        saved: false,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                  <Select
                    value={draft.filters.categoria}
                    onValueChange={(value) =>
                      setDraft({
                        ...draft,
                        filters: { ...draft.filters, categoria: value },
                        saved: false,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Local</label>
                  <Select
                    value={draft.filters.local}
                    onValueChange={(value) =>
                      setDraft({
                        ...draft,
                        filters: { ...draft.filters, local: value },
                        saved: false,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {locais.map((local) => (
                        <SelectItem key={local} value={local}>
                          {local}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                </div>
              </div>

              <div className="sticky bottom-0 z-10 -mx-1 mt-2 flex justify-end gap-2 border-t border-border/70 bg-background/95 px-1 pt-3 backdrop-blur">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    onSave(draft)
                    onOpenChange(false)
                  }}
                >
                  Salvar grafico
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
