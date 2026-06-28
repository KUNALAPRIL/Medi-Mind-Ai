import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { LineChart, BarChart2, Brain, Loader2, Sparkles, TrendingUp, Info } from 'lucide-react';

interface BiomarkerDataPoint {
  date: string;
  glucose?: number;
  cholesterol?: number;
  a1c?: number;
}

interface ComplianceDataPoint {
  weekName: string;
  rate: number;
}

interface AnalyticsPayload {
  biomarkerHistory: BiomarkerDataPoint[];
  weeklyCompliance: ComplianceDataPoint[];
  forecast: string;
}

// Sleek Custom SVG Line Chart Component
const SVGLineChart: React.FC<{ data: BiomarkerDataPoint[]; dataKey: 'glucose' | 'cholesterol' | 'a1c'; color: string; label: string; unit: string }> = ({ data, dataKey, color, label, unit }) => {
  const points = data.filter((d) => d[dataKey] !== undefined);
  if (points.length === 0) {
    return <p className="text-xs text-slate-400 py-12 text-center">No trend data logged yet.</p>;
  }

  const values = points.map((d) => Number(d[dataKey]));
  const minVal = Math.min(...values) * 0.9;
  const maxVal = Math.max(...values) * 1.1;
  const valRange = maxVal - minVal || 10;

  const width = 450;
  const height = 180;
  const padding = 25;

  const coords = points.map((d, idx) => {
    const x = padding + (idx / (points.length - 1 || 1)) * (width - padding * 2);
    const val = Number(d[dataKey]);
    const y = height - padding - ((val - minVal) / valRange) * (height - padding * 2);
    return { x, y, val, date: d.date };
  });

  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');

  // Create area path under the line for gradient fill
  const areaPathPoints = coords.length > 0
    ? `${coords[0].x},${height - padding} ${polylinePoints} ${coords[coords.length - 1].x},${height - padding}`
    : '';

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs font-bold">
        <span className="text-slate-700 dark:text-slate-300">{label} Trends</span>
        <span style={{ color }}>Latest: {values[values.length - 1]} {unit}</span>
      </div>
      <div className="relative border border-slate-100 dark:border-slate-800/40 rounded-2xl bg-white/20 dark:bg-slate-900/20 p-2 overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="currentColor" className="text-slate-100 dark:text-slate-800/40" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="currentColor" className="text-slate-100 dark:text-slate-800/40" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" className="text-slate-100 dark:text-slate-800/40" />

          {/* Area Fill */}
          {areaPathPoints && (
            <polygon points={areaPathPoints} fill={`url(#grad-${dataKey})`} />
          )}

          {/* Polyline Path */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {/* Interactive nodes */}
          {coords.map((c, idx) => (
            <g key={idx}>
              <circle
                cx={c.x}
                cy={c.y}
                r="4.5"
                fill={color}
                stroke="white"
                strokeWidth="1.5"
                className="cursor-pointer hover:r-6 transition-all"
              />
              {/* Tooltip text displayed above the node */}
              <text
                x={c.x}
                y={c.y - 10}
                textAnchor="middle"
                className="text-[8px] font-black fill-slate-700 dark:fill-slate-300 opacity-0 hover:opacity-100 transition-opacity bg-white"
              >
                {c.val}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export const HealthAnalytics: React.FC = () => {
  const { data, isLoading, error } = useQuery<AnalyticsPayload>({
    queryKey: ['healthAnalytics'],
    queryFn: async () => {
      const res = await api.get('/api/v1/clinical/analytics');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center space-y-4">
        <Info className="mx-auto text-rose-500" size={36} />
        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Failed to compile predictive analytics</h3>
        <p className="text-xs text-slate-400">Ensure the backend server is active and clinical reports are uploaded to generate trends.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            Predictive Health Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Review biomarker telemetry projections, adherence graphs, and AI Wellness Forecasts.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line Charts (2 Columns width) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-6">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <LineChart size={16} className="text-blue-500" />
            Biomaker Projection Trends
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SVGLineChart
              data={data.biomarkerHistory}
              dataKey="glucose"
              color="#3b82f6"
              label="Blood Glucose"
              unit="mg/dL"
            />
            <SVGLineChart
              data={data.biomarkerHistory}
              dataKey="cholesterol"
              color="#ec4899"
              label="Total Cholesterol"
              unit="mg/dL"
            />
          </div>
        </div>

        {/* Weekly Adherence & Forecast (1 Column width) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Adherence Bar Chart */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart2 size={16} className="text-indigo-500" />
              Weekly Adherence Rates
            </h3>
            
            <div className="flex justify-between items-end h-32 px-4 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800/40">
              {data.weeklyCompliance.map((w, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 w-12">
                  <span className="text-[9px] font-black text-slate-500">{w.rate}%</span>
                  <div className="w-6 bg-slate-100 dark:bg-slate-800 rounded-lg h-24 flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-lg transition-all duration-500 ${
                        w.rate >= 85
                          ? 'bg-emerald-500'
                          : w.rate >= 60
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ height: `${w.rate}%` }}
                    ></div>
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 whitespace-nowrap">{w.weekName}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Wellness Forecast Box */}
          <div className="glass-panel p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Brain size={16} className="text-purple-500 animate-pulse" />
              AI Wellness Projection
            </h3>
            
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
              {data.forecast}
            </p>

            <div className="flex gap-2 p-3 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-white/20 dark:border-white/5 text-[10px] text-slate-500">
              <Sparkles size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <span>Predictions are calculated by comparing treatment compliance rate fluctuations with clinical biomarker telemetry over the last 30 days.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default HealthAnalytics;
