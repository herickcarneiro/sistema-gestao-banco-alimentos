"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint, GraphConfig } from "./types";

type Props = {
  graph: GraphConfig;
  data: ChartPoint[];
};

type TooltipContentProps = {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
  coordinate?: { x: number; y: number };
};

function CustomTooltipContent({
  active,
  payload,
  label,
  coordinate,
}: TooltipContentProps) {
  if (!active || !payload || payload.length === 0 || !coordinate) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: `${coordinate.y + 10}px`,
        left: `${coordinate.x + 15}px`,
        pointerEvents: "none",
        backgroundColor: "oklch(0.98 0.003 60)",
        border: "0.5px solid oklch(0.88 0.01 90)",
        borderRadius: "8px",
        padding: "12px",
        boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
        zIndex: 100,
        maxWidth: "220px",
        wordBreak: "break-word",
      }}
    >
      <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "oklch(0.50 0.02 60)" }}>
        {label}
      </p>
      {payload.map((entry, index) => (
        <p key={index} style={{ margin: "0", fontSize: "14px", fontWeight: "500" }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

const BASE_COLORS = [
  "#22c55e",
  "#f97316",
  "#0ea5e9",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
];

function lightenHex(hex: string, amount = 0.42) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return hex;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  const mix = (channel: number) =>
    Math.round(channel + (255 - channel) * amount);

  const rr = mix(r).toString(16).padStart(2, "0");
  const gg = mix(g).toString(16).padStart(2, "0");
  const bb = mix(b).toString(16).padStart(2, "0");

  return `#${rr}${gg}${bb}`;
}

export function ChartRenderer({ graph, data }: Props) {
  if (graph.type === "table") {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                Codigo
              </th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                Item
              </th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                Categoria
              </th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                Tipo
              </th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                Quantidade
              </th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                Local
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  Sem dados para os filtros selecionados.
                </td>
              </tr>
            )}
            {data.map((row, index) => (
              <tr
                key={`${String(row.codigo)}-${index}`}
                className="border-b border-border/60"
              >
                <td className="px-3 py-2">{String(row.codigo ?? "-")}</td>
                <td className="px-3 py-2">{String(row.item ?? "-")}</td>
                <td className="px-3 py-2">{String(row.categoria ?? "-")}</td>
                <td className="px-3 py-2">{String(row.tipo ?? "-")}</td>
                <td className="px-3 py-2">{String(row.quantidade ?? "-")}</td>
                <td className="px-3 py-2">{String(row.local ?? "-")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!graph.xAxis) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Selecione os campos para visualizar.
      </div>
    );
  }

  if (graph.type === "bar") {
    const gradientId = `barGradient-${graph.id}`;
    const lighterColor = lightenHex(graph.color);
    const chartData = data.map((point) => ({
      label: String(point[graph.xAxis] ?? "-"),
      value: Number(point.value ?? 0),
    }));

    return (
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={lighterColor} stopOpacity={1} />
              <stop offset="100%" stopColor={graph.color} stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="label"
            className="text-xs"
            tick={{ fill: "oklch(0.50 0.02 60)" }}
          />
          <YAxis className="text-xs" tick={{ fill: "oklch(0.50 0.02 60)" }} />
          <Tooltip
            content={(props) => {
              const mappedPayload = props.payload
                ? (props.payload as Array<{ value: number; name: string }>).map(
                    (p) => ({
                      value: p.value,
                      name: p.name || graph.title || "Valor",
                    })
                  )
                : [];
              return (
                <CustomTooltipContent
                  active={props.active}
                  payload={mappedPayload}
                  label={props.label}
                  coordinate={props.coordinate as { x: number; y: number }}
                />
              );
            }}
            cursor={{ fill: "transparent" }}
          />
          <Legend />
          <Bar
            dataKey="value"
            name={graph.title || "Valor"}
            fill={`url(#${gradientId})`}
            radius={[8, 8, 2, 2]}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (graph.type === "line") {
    const chartData = data.map((point) => ({
      label: String(point[graph.xAxis] ?? "-"),
      value: Number(point.value ?? 0),
    }));

    return (
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="label"
            className="text-xs"
            tick={{ fill: "oklch(0.50 0.02 60)" }}
          />
          <YAxis className="text-xs" tick={{ fill: "oklch(0.50 0.02 60)" }} />
          <Tooltip
            content={(props) => {
              const mappedPayload = props.payload
                ? (props.payload as Array<{ value: number; name: string }>).map(
                    (p) => ({
                      value: p.value,
                      name: p.name || graph.title || "Valor",
                    })
                  )
                : [];
              return (
                <CustomTooltipContent
                  active={props.active}
                  payload={mappedPayload}
                  label={props.label}
                  coordinate={props.coordinate as { x: number; y: number }}
                />
              );
            }}
            cursor={{ stroke: "transparent" }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            name={graph.title || "Valor"}
            stroke={graph.color}
            strokeWidth={3}
            dot={{ r: 3, fill: graph.color, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            animationDuration={750}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey={graph.xAxis}
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  index === 0
                    ? graph.color
                    : BASE_COLORS[index % BASE_COLORS.length]
                }
              />
            ))}
          </Pie>
          <Tooltip cursor={false} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
