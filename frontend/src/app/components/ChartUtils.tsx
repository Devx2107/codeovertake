import { useState } from "react";

export const platformColors: Record<string, string> = {
  github: "#4ade80",
  leetcode: "#f59e0b",
  codeforces: "#60a5fa",
  codechef: "#a78bfa",
  gfg: "#22c55e",
};

export const engagementColors = ["#FF8594", "#f59e0b", "#60a5fa", "#a78bfa", "#4ade80"];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  activeLine?: string | null;
  isRank?: boolean;
  labelFormatter?: (label: any) => string;
  valueFormatter?: (value: any, payload: any) => string;
}

export function CustomChartTooltip({ 
  active, 
  payload, 
  label, 
  activeLine, 
  isRank = false, 
  labelFormatter,
  valueFormatter 
}: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const filtered = activeLine
      ? payload.filter((p: any) => p.dataKey === activeLine)
      : payload;

    if (filtered.length === 0) return null;

    return (
      <div className="rounded border border-[#1e1e1e] bg-[#111111] p-3 shadow-2xl">
        <p className="mb-2 font-['JetBrains_Mono'] text-xs text-[#888888]">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
        <div className="space-y-1">
          {filtered.map((item: any) => (
            <div 
              key={item.dataKey || item.name} 
              className="flex items-center gap-2 font-['JetBrains_Mono'] text-xs" 
              style={{ color: item.color || item.stroke }}
            >
              <span className="opacity-80">{item.name}:</span>
              <span className="font-bold">
                {isRank 
                  ? (item.value ? `#${item.value}` : "—") 
                  : (valueFormatter ? valueFormatter(item.value, item.payload) : item.value?.toLocaleString())}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export const formatChartDate = (d: string | number) => {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export function useChartFocus() {
  const [activeLine, setActiveLine] = useState<string | null>(null);

  const handleLegendClick = (payload: any) => {
    const { dataKey } = payload;
    setActiveLine(prev => prev === dataKey ? null : dataKey);
  };

  const legendFormatter = (value: string, entry: any) => {
    const isActive = !activeLine || entry.dataKey === activeLine;
    return (
      <span 
        style={{ 
          color: isActive ? entry.color || entry.stroke : "#444444", 
          cursor: "pointer",
          transition: "color 0.2s" 
        }}
      >
        {value}
      </span>
    );
  };

  return { activeLine, setActiveLine, handleLegendClick, legendFormatter };
}
