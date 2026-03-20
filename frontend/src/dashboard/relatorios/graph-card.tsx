"use client"

import { MoreHorizontal, Pencil, Trash2, Copy } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChartRenderer } from "./chart-renderer"
import type { ChartPoint, GraphConfig } from "./types"

type Props = {
  graph: GraphConfig
  data: ChartPoint[]
  onEdit: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}

export function GraphCard({ graph, data, onEdit, onDuplicate, onDelete }: Props) {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-foreground">{graph.title}</CardTitle>
          <CardDescription>
            {graph.description || `Tipo: ${graph.type}`} • {data.length} pontos
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {graph.saved && <Badge variant="secondary">Salvo</Badge>}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Acoes do grafico">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(graph.id)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(graph.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(graph.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="min-h-80">
        <ChartRenderer graph={graph} data={data} />
      </CardContent>
    </Card>
  )
}
