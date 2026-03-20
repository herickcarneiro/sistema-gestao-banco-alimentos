"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { GRAPH_TYPE_PICKER_CARDS } from "./constants"
import type { ChartType } from "./types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (type: ChartType) => void
}

export function GraphTypePickerDialog({ open, onOpenChange, onPick }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Configurar Grafico</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {GRAPH_TYPE_PICKER_CARDS.map((card) => (
            <button
              key={card.value}
              type="button"
              disabled={Boolean(card.disabled)}
              onClick={() => {
                if (!card.disabled) {
                  onPick(card.value as ChartType)
                  onOpenChange(false)
                }
              }}
              className="group rounded-xl border border-border/70 bg-card p-4 text-left transition hover:border-primary/40 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
            >
              <div className="mb-3 h-20 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50" />
              <p className="text-sm font-semibold text-foreground">{card.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
