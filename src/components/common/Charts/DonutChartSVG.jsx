import { useMemo } from "react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function DonutChartSVG({ data = [], size = 180 }) {
  const chartData = useMemo(() => {
    if (data.length === 0) return [];
    return data;
  }, [data]);

  const totalVal = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.value, 0);
  }, [chartData]);

  const slices = useMemo(() => {
    if (chartData.length === 0 || totalVal === 0) return [];

    let accumulatedAngle = 0;
    const center = size / 2;
    const radius = size * 0.35;
    const strokeWidth = size * 0.16;

    return chartData.map((d, index) => {
      const percentage = d.value / totalVal;
      const angle = percentage * 360;
      const strokeDasharray = `${(percentage * 2 * Math.PI * radius).toFixed(1)} ${(2 * Math.PI * radius).toFixed(1)}`;
      const strokeDashoffset = `${(-accumulatedAngle * 2 * Math.PI * radius / 360).toFixed(1)}`;

      accumulatedAngle += angle;

      return {
        label: d.label,
        value: d.value,
        percentage: Math.round(percentage * 100),
        strokeDasharray,
        strokeDashoffset,
        color: d.color || COLORS[index % COLORS.length],
        cx: center,
        cy: center,
        r: radius,
        strokeWidth,
      };
    });
  }, [chartData, totalVal, size]);

  if (chartData.length === 0 || totalVal === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-slate-500 bg-slate-900/10 rounded-2xl border border-slate-900">
        No share distribution available.
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-2">
      {/* Svg Circle */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          {slices.map((slice, idx) => (
            <circle
              key={idx}
              cx={slice.cx}
              cy={slice.cy}
              r={slice.r}
              fill="none"
              stroke={slice.color}
              strokeWidth={slice.strokeWidth}
              strokeDasharray={slice.strokeDasharray}
              strokeDashoffset={slice.strokeDashoffset}
              className="transition-all duration-300 cursor-pointer hover:opacity-85"
            />
          ))}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-2xl font-black text-white">{totalVal.toLocaleString()}</span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2 text-xs">
        {slices.map((slice, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
            <span className="text-slate-400 font-medium whitespace-nowrap">{slice.label}</span>
            <span className="font-bold text-white">
              {slice.value} ({slice.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
