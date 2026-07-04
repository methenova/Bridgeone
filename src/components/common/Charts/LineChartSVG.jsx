import { useMemo } from "react";

export default function LineChartSVG({ data = [], height = 200 }) {
  const chartData = useMemo(() => {
    if (data.length === 0) return [];
    return data;
  }, [data]);

  const maxVal = useMemo(() => {
    if (chartData.length === 0) return 1;
    const values = chartData.map((d) => d.value);
    return Math.max(...values, 100);
  }, [chartData]);

  // SVG parameters
  const padding = 30;
  const svgWidth = 500;
  const svgHeight = height;

  const points = useMemo(() => {
    if (chartData.length === 0) return "";
    const w = svgWidth - padding * 2;
    const h = svgHeight - padding * 2;

    return chartData.map((d, index) => {
      const x = padding + (index / (chartData.length - 1)) * w;
      const y = svgHeight - padding - (d.value / maxVal) * h;
      return { x, y, label: d.label, value: d.value };
    });
  }, [chartData, maxVal, svgHeight]);

  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    return points.map((p, index) => `${index === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  }, [points]);

  const fillD = useMemo(() => {
    if (points.length === 0) return "";
    const first = points[0];
    const last = points[points.length - 1];
    return `${pathD} L ${last.x} ${svgHeight - padding} L ${first.x} ${svgHeight - padding} Z`;
  }, [points, pathD, svgHeight]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-slate-500 bg-slate-900/10 rounded-2xl border border-slate-900">
        No sales data available.
      </div>
    );
  }

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full overflow-visible"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
          const y = padding + p * (svgHeight - padding * 2);
          const gridVal = Math.round(maxVal * (1 - p));

          return (
            <g key={idx}>
              <line
                x1={padding}
                y1={y}
                x2={svgWidth - padding}
                y2={y}
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray="4"
              />
              <text
                x={padding - 8}
                y={y + 4}
                className="fill-slate-600 text-[10px] text-right font-medium"
                textAnchor="end"
              >
                ₹{gridVal}
              </text>
            </g>
          );
        })}

        {/* Gradient fill */}
        <path d={fillD} fill="url(#chartGradient)" />

        {/* Chart line */}
        <path
          d={pathD}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots on line */}
        {points.map((p, idx) => (
          <g key={idx} className="group cursor-pointer">
            <circle
              cx={p.x}
              cy={p.y}
              r="4.5"
              className="fill-slate-950 stroke-blue-500 stroke-[2] transition hover:r-6"
            />
            {/* Tooltip on hover */}
            <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <rect
                x={p.x - 35}
                y={p.y - 32}
                width="70"
                height="22"
                rx="6"
                className="fill-slate-900 stroke-slate-800"
              />
              <text
                x={p.x}
                y={p.y - 17}
                className="fill-white text-[9px] font-bold text-center"
                textAnchor="middle"
              >
                ₹{p.value.toLocaleString()}
              </text>
            </g>
          </g>
        ))}

        {/* X Axis Labels */}
        {points.map((p, idx) => {
          // Show every Nth label if dataset is large, or all if small
          const showLabel = points.length <= 7 || idx % Math.round(points.length / 7) === 0;
          if (!showLabel) return null;

          return (
            <text
              key={idx}
              x={p.x}
              y={svgHeight - padding + 16}
              className="fill-slate-500 text-[10px] font-medium"
              textAnchor="middle"
            >
              {p.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
