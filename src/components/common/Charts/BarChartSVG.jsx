import { useMemo } from "react";

export default function BarChartSVG({ data = [], height = 200 }) {
  const chartData = useMemo(() => {
    if (data.length === 0) return [];
    return data;
  }, [data]);

  const maxVal = useMemo(() => {
    if (chartData.length === 0) return 1;
    const values = chartData.map((d) => d.value);
    return Math.max(...values, 10);
  }, [chartData]);

  // SVG parameters
  const padding = 30;
  const svgWidth = 500;
  const svgHeight = height;

  const bars = useMemo(() => {
    if (chartData.length === 0) return [];
    const w = svgWidth - padding * 2;
    const h = svgHeight - padding * 2;
    const count = chartData.length;

    const barWidth = Math.min((w / count) * 0.6, 40);
    const step = w / count;

    return chartData.map((d, index) => {
      const x = padding + index * step + (step - barWidth) / 2;
      const barHeight = (d.value / maxVal) * h;
      const y = svgHeight - padding - barHeight;

      return {
        x,
        y,
        width: barWidth,
        height: Math.max(barHeight, 2), // Keep minimal height visible
        label: d.label,
        value: d.value,
      };
    });
  }, [chartData, maxVal, svgHeight]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-slate-500 bg-white shadow-sm/10 rounded-2xl border border-slate-200">
        No comparative data available.
      </div>
    );
  }

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full overflow-visible"
      >
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
                {gridVal}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {bars.map((bar, idx) => (
          <g key={idx} className="group cursor-pointer">
            {/* Main Bar */}
            <rect
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              rx="4"
              className="fill-blue-500 hover:fill-blue-400 transition-colors duration-200"
            />
            {/* Tooltip on hover */}
            <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <rect
                x={bar.x + bar.width / 2 - 30}
                y={bar.y - 28}
                width="60"
                height="20"
                rx="6"
                className="fill-slate-900 stroke-slate-800"
              />
              <text
                x={bar.x + bar.width / 2}
                y={bar.y - 15}
                className="fill-white text-[9px] font-bold text-center"
                textAnchor="middle"
              >
                {bar.value.toLocaleString()}
              </text>
            </g>

            {/* X Axis Label */}
            <text
              x={bar.x + bar.width / 2}
              y={svgHeight - padding + 16}
              className="fill-slate-500 text-[10px] font-medium"
              textAnchor="middle"
            >
              {bar.label.length > 8 ? `${bar.label.slice(0, 7)}...` : bar.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
