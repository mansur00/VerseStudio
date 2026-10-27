'use client';

import React from 'react';
import { cn } from '../../utils/cn';

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChartLineProps {
  data: ChartDataPoint[];
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  showPoints?: boolean;
  className?: string;
  unit?: string;
}

export const ChartLine: React.FC<ChartLineProps> = ({
  data,
  height = 140,
  strokeColor = 'var(--color-brand-default)',
  fillColor = 'var(--color-brand-subtle)',
  showPoints = true,
  className,
  unit = '',
}) => {
  if (!data || data.length === 0) return null;

  const width = 400;
  const paddingX = 20;
  const paddingY = 20;

  const values = data.map((d) => d.value);
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(...values, 10);
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(1, data.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((d.value - minVal) / range) * (height - paddingY * 2);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div className={cn('w-full flex flex-col', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible"
        style={{ height }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor || strokeColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={fillColor || strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        <line
          x1={paddingX}
          y1={paddingY}
          x2={width - paddingX}
          y2={paddingY}
          stroke="var(--color-border-subtle)"
          strokeDasharray="3 3"
        />
        <line
          x1={paddingX}
          y1={height / 2}
          x2={width - paddingX}
          y2={height / 2}
          stroke="var(--color-border-subtle)"
          strokeDasharray="3 3"
        />
        <line
          x1={paddingX}
          y1={height - paddingY}
          x2={width - paddingX}
          y2={height - paddingY}
          stroke="var(--color-border-subtle)"
        />

        {/* Gradient fill */}
        <path d={areaD} fill="url(#chartGradient)" />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {showPoints &&
          points.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r="4"
                fill="var(--color-bg-surface)"
                stroke={strokeColor}
                strokeWidth="2"
              />
              <title>{`${p.label}: ${p.value}${unit}`}</title>
            </g>
          ))}
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between items-center text-[10px] text-[var(--color-text-tertiary)] px-2 mt-1">
        {data.map((d, i) => (
          <span key={i} className="truncate max-w-[50px] text-center">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export interface ChartBarsProps {
  data: ChartDataPoint[];
  height?: number;
  barColor?: string;
  className?: string;
  unit?: string;
}

export const ChartBars: React.FC<ChartBarsProps> = ({
  data,
  height = 140,
  barColor = 'var(--color-accent-laser)',
  className,
  unit = '',
}) => {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.value), 10);

  return (
    <div className={cn('w-full flex flex-col', className)}>
      <div
        className="w-full flex items-end justify-between gap-2 px-2 pb-1 border-b border-[var(--color-border-subtle)]"
        style={{ height }}
      >
        {data.map((d, idx) => {
          const pct = Math.max(4, Math.round((d.value / maxVal) * 100));
          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
            >
              <div
                className="w-full rounded-t-md transition-all duration-300 group-hover:brightness-110"
                style={{
                  height: `${pct}%`,
                  backgroundColor: barColor,
                }}
              />
              <span className="opacity-0 group-hover:opacity-100 absolute -top-6 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[10px] font-mono px-1.5 py-0.5 rounded text-[var(--color-text-primary)] pointer-events-none transition-opacity whitespace-nowrap shadow-sm z-10">
                {d.value}
                {unit}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center text-[10px] text-[var(--color-text-tertiary)] px-2 mt-1.5">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center truncate">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
};
