import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { differenceInDays } from "date-fns";
import { useState } from "react";
import ExpiryBadge from "@/components/shared/ExpiryBadge";
import LoteSparkline from "@/components/stock/LoteSparkline";
import { formatStockTotal, type StockViewItem } from "@/lib/stock";

interface DataStripProps {
  item: StockViewItem;
}

export default function DataStrip({ item }: DataStripProps) {
  const [open, setOpen] = useState(false);
  const hasNearExpiry = item.lotes.some(
    (l) => l.status_validade === "proximo_vencimento"
  );

  return (
    <motion.div layout className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-3 px-4 active:bg-surface-hover transition-colors text-left"
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[14px] font-medium tracking-tight text-foreground truncate">
            {item.produto}
          </span>
          <span className="text-[11px] text-muted-foreground uppercase tracking-widest">
            {item.categoria}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          {hasNearExpiry && (
            <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
          )}
          <div className="text-right">
            <span className="font-mono text-lg tabular-nums text-foreground block leading-tight">
              {formatStockTotal(item.quantidade_total, item.unidade_medida)}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {item.quantidade_total} {item.unidade_medida}
            </span>
          </div>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={14} className="text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Lots */}
              {item.lotes.length === 0 ? (
                <div className="py-4 text-sm text-muted-foreground text-center rounded-md bg-secondary">
                  Nenhum lote disponível para este produto.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {item.lotes.map((lote) => {
                    const daysLeft = differenceInDays(lote.data_validade, new Date());
                    return (
                      <div
                        key={lote.id_lote}
                        className={`flex items-center justify-between py-2 px-3 rounded-md text-sm ${
                          lote.status_validade === "proximo_vencimento"
                            ? "bg-expiry-near border border-expiry-near-border"
                            : "bg-secondary"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ExpiryBadge date={lote.data_validade} />
                          <span className="text-xs text-muted-foreground">
                            {daysLeft >= 0
                              ? `Vence em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}`
                              : `Vencido há ${Math.abs(daysLeft)} dias`}
                          </span>
                        </div>
                        <span className="font-mono text-sm tabular-nums text-foreground">
                          {lote.quantidade_disponivel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sparkline micro-chart */}
              {item.historico.length > 1 && (
                <div className="pt-2 border-t border-border">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 block">
                    Entradas de lotes
                  </span>
                  <LoteSparkline data={item.historico} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
