import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis } from "recharts";
import type { BatchView } from "@/lib/stock";

interface LoteSparklineProps {
  data: BatchView[];
}

export default function LoteSparkline({ data }: LoteSparklineProps) {
  const chartData = data.map((l) => ({
    name: format(l.data_entrada, "dd/MM", { locale: ptBR }),
    qty: l.quantidade_disponivel,
  }));

  const chartConfig = {
    qty: {
      label: "Quantidade",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-16 w-full aspect-auto">
      <BarChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
        />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Bar
          dataKey="qty"
          fill="hsl(var(--primary))"
          radius={[3, 3, 0, 0]}
          maxBarSize={24}
        />
      </BarChart>
    </ChartContainer>
  );
}
