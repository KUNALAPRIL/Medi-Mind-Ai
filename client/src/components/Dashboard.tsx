import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, Calendar, FileText, Pill, Brain, Loader2, Heart, ArrowRight, Clipboard, ChevronRight, Activity, TrendingUp, Upload } from 'lucide-react';

interface DashboardData {
  healthScore: number;
  complianceRate: number;
  appointments: Array<{
    id: string;
    doctorName: string;
    specialty: string;
    startTime: string;
    status: string;
  }>;
  medications: Array<{
    id: string;
    name: string;
    dosage: string;
    scheduledTime: string;
    status: 'PENDING' | 'TAKEN' | 'MISSED';
  }>;
  recentReports: Array<{
    id: string;
    name: string;
    parsedAt: string;
    biomarkerCount: number;
  }>;
  aiSuggestions: string[];
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const response = await api.get('/api/v1/dashboard/summary');
      return response.data.data;
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={36} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
          Failed to load dashboard metrics summary. Ensure the database connection is active.
        </div>
      </div>
    );
  }

  // Generate SVG Coordinates for Compliance Rate Trend Graph with filled gradient area
  const mockComplianceTrend = [75, 80, 72, 85, 90, 88, data.complianceRate];
  const paddingX = 20;
  const spacingX = 46;
  const chartHeight = 140;

  const points = mockComplianceTrend.map((val, idx) => {
    const x = paddingX + idx * spacingX;
    const y = chartHeight - (val / 100) * 100;
    return { x, y };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPathPoints = points.length > 0
    ? `${points[0].x},${chartHeight} ${polylinePoints} ${points[points.length - 1].x},${chartHeight}`
    : '';

  // Calculate Health Rating category
  const getHealthStatus = (score: number) => {
    if (score >= 85) return { text: 'Optimal Adherence', color: 'text-emerald-500 bg-emerald-500/10' };
    if (score >= 60) return { text: 'Controlled Control', color: 'text-amber-500 bg-amber-500/10' };
    return { text: 'Suboptimal Compliance', color: 'text-rose-500 bg-rose-500/10' };
  };

  const statusObj = getHealthStatus(data.healthScore);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            {t('healthHub')}
            <ShieldCheck className="text-emerald-500" size={24} />
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('compilationMsg')}</p>
        </div>
      </div>

      {/* Quick Action Shortcuts Toolbar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('/triage')}
          className="p-4 glass-panel hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/5 transition-all text-left rounded-2xl flex items-center gap-3 group"
        >
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
            <Activity size={18} />
          </div>
          <div>
            <span className="text-xs font-black text-slate-800 dark:text-white block">{t('symptomTitle')}</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">{t('symptomSub')}</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/chat')}
          className="p-4 glass-panel hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/5 transition-all text-left rounded-2xl flex items-center gap-3 group"
        >
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500 group-hover:scale-110 transition-transform">
            <Brain size={18} />
          </div>
          <div>
            <span className="text-xs font-black text-slate-800 dark:text-white block">{t('chatTitle')}</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">{t('chatSub')}</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/scanner')}
          className="p-4 glass-panel hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/5 transition-all text-left rounded-2xl flex items-center gap-3 group"
        >
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
            <Upload size={18} />
          </div>
          <div>
            <span className="text-xs font-black text-slate-800 dark:text-white block">{t('scanTitle')}</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">{t('scanSub')}</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/analytics')}
          className="p-4 glass-panel hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/5 transition-all text-left rounded-2xl flex items-center gap-3 group"
        >
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
            <TrendingUp size={18} />
          </div>
          <div>
            <span className="text-xs font-black text-slate-800 dark:text-white block">{t('analyticsTitle')}</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">{t('analyticsSub')}</span>
          </div>
        </button>
      </div>

      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Widget 1: Health Score Circular Dial */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-between text-center hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 w-full text-left">{t('healthIndex')}</h3>
          
          <div className="relative w-36 h-36 flex items-center justify-center my-3">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(226, 232, 240, 0.15)" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="url(#blueGradient)"
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * data.healthScore) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-black text-slate-800 dark:text-white leading-none">{data.healthScore}</span>
              <span className="text-[8px] text-slate-400 uppercase tracking-widest font-black mt-1">{t('score')}</span>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusObj.color}`}>
            {statusObj.text}
          </span>
        </div>

        {/* Widget 2: Adherence Trend SVG Chart */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('treatmentAdherence')}</h3>
            <span className="text-xs font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">{data.complianceRate}% Rate</span>
          </div>

          <div className="h-32 w-full mt-4 relative overflow-hidden">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 320 150">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Reference Gridlines */}
              <line x1="20" y1="40" x2="300" y2="40" stroke="currentColor" className="text-slate-100 dark:text-slate-800/40" strokeDasharray="3 3" />
              <line x1="20" y1="90" x2="300" y2="90" stroke="currentColor" className="text-slate-100 dark:text-slate-800/40" strokeDasharray="3 3" />
              <line x1="20" y1="140" x2="300" y2="140" stroke="currentColor" className="text-slate-200 dark:text-slate-800/60" />

              {/* Chart Gradient Area */}
              {areaPathPoints && (
                <polygon points={areaPathPoints} fill="url(#chartGrad)" />
              )}

              {/* Line Graph */}
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3.5"
                points={polylinePoints}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Highlight Nodes */}
              {points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="#ffffff"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
              ))}
            </svg>
          </div>

          <div className="flex justify-between items-center mt-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
            <span>{t('weeksAgo')}</span>
            <span>{t('currentRate')}: {data.complianceRate}%</span>
          </div>
        </div>

        {/* Widget 3: AI Suggestions Box */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-blue-500">
            <Brain size={120} />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            {t('aiAdvisoryNotes')}
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping"></span>
          </h3>

          <div className="space-y-2 z-10 flex-1 flex flex-col justify-center">
            {Array.isArray(data.aiSuggestions) ? (
              data.aiSuggestions.map((tip, idx) => (
                <div key={idx} className="p-2 border border-slate-100 dark:border-slate-800/40 bg-white/20 dark:bg-slate-900/10 rounded-xl flex gap-2 text-[10px] text-slate-600 dark:text-slate-300 leading-normal">
                  <span className="text-blue-500 font-extrabold shrink-0">•</span>
                  <p className="font-semibold">{tip}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No suggestions currently available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Medications & Reports (2 Columns width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Medications Due Today */}
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Pill className="text-blue-500" size={18} />
              {t('upcomingMeds')}
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {data.medications.length === 0 ? (
                <div className="text-center py-6">
                  <Pill size={24} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs text-slate-400">{t('noMedsScheduled')}</p>
                </div>
              ) : (
                data.medications.map((med) => (
                  <div key={med.id} className="flex items-center justify-between py-3.5">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">{med.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Dosage: {med.dosage} | Scheduled: {new Date(med.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-xl uppercase tracking-wider ${
                      med.status === 'TAKEN' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' :
                      med.status === 'MISSED' ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold'
                    }`}>
                      {med.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Diagnostic Reports */}
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="text-cyan-500" size={18} />
              {t('recentReports')}
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {data.recentReports.length === 0 ? (
                <div className="text-center py-6">
                  <FileText size={24} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs text-slate-400">{t('noReportsScanned')}</p>
                </div>
              ) : (
                data.recentReports.map((rec) => (
                  <div key={rec.id} className="flex items-center justify-between py-3.5">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">{rec.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Parsed on: {new Date(rec.parsedAt).toLocaleDateString()} | Extracted markers: {rec.biomarkerCount}</p>
                    </div>
                    <button
                      onClick={() => navigate('/records')}
                      className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                    >
                      {t('viewMetrics')}
                      <ChevronRight size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Appointments (1 Column width) */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="text-indigo-500" size={18} />
              {t('upcomingVisits')}
            </h3>
            <div className="space-y-4">
              {data.appointments.length === 0 ? (
                <div className="text-center py-6">
                  <Calendar size={24} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs text-slate-400">{t('noVisitsScheduled')}</p>
                </div>
              ) : (
                data.appointments.map((app) => (
                  <div key={app.id} className="p-4 rounded-2xl border border-white/20 dark:border-white/5 bg-white/30 dark:bg-slate-800/30 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">{app.specialty}</h4>
                        <h5 className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{app.doctorName}</h5>
                      </div>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 uppercase">
                        {app.status}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                      {new Date(app.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
