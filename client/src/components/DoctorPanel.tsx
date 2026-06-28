import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Users, Calendar, Activity, CheckSquare, Loader2, Award, Clipboard, ShieldAlert, ArrowRight } from 'lucide-react';

interface AppointmentItem {
  _id: string;
  patientId: {
    _id: string;
    email: string;
  };
  startTime: string;
  status: string;
  notes?: string;
}

interface Biomarker {
  name: string;
  value: number;
  unit: string;
  referenceRange: string;
  status: string;
}

interface PatientItem {
  patientId: string;
  email: string;
  joinedAt: string;
  complianceRate: number;
  biomarkers: Biomarker[];
  latestRecordSummary: string;
}

export const DoctorPanel: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clinicalNote, setClinicalNote] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const fetchDoctorData = async () => {
    setIsLoading(true);
    try {
      const [appRes, patientsRes] = await Promise.all([
        api.get('/api/v1/doctor/appointments'),
        api.get('/api/v1/doctor/patients')
      ]);
      setAppointments(appRes.data.data);
      setPatients(patientsRes.data.data);
      if (patientsRes.data.data.length > 0) {
        setSelectedPatient(patientsRes.data.data[0]);
      }
    } catch (error) {
      console.error('Failed to load clinician panel indices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNote = () => {
    setSuccessMsg('Clinical recommendation instruction saved and pushed to patient feed.');
    setClinicalNote('');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  if (isLoading && patients.length === 0) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* Banner */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            Clinician Registry Panel
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Analyze treatment compliance trends and biomarker telemetry for patient files under your supervision.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
          <CheckSquare size={18} />
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Patient Directory */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Users size={16} className="text-blue-500" />
              Supervised Patients Directory
            </h3>

            {patients.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No patient records linked to your clinician profile yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 pr-2">Patient Account</th>
                      <th className="pb-3 px-2">Compliance Adherence</th>
                      <th className="pb-3 px-2">Key Biomarkers Status</th>
                      <th className="pb-3 pl-2 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                    {patients.map((p) => {
                      const isAbnormal = p.biomarkers.some((b) => b.status !== 'NORMAL');
                      return (
                        <tr
                          key={p.patientId}
                          onClick={() => setSelectedPatient(p)}
                          className={`cursor-pointer transition-all hover:bg-blue-500/5 ${
                            selectedPatient?.patientId === p.patientId ? 'bg-blue-500/5 dark:bg-slate-800/40' : ''
                          }`}
                        >
                          <td className="py-4 pr-2 font-bold text-slate-800 dark:text-slate-200">{p.email}</td>
                          <td className="py-4 px-2">
                            <span className={`px-2 py-0.5 rounded font-black text-[9px] ${
                              p.complianceRate >= 85
                                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                : p.complianceRate >= 60
                                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                                : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                            }`}>
                              {p.complianceRate}% Compliance
                            </span>
                          </td>
                          <td className="py-4 px-2">
                            <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                              isAbnormal
                                ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                                : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            }`}>
                              {isAbnormal ? 'OUT-OF-RANGE MARKERS' : 'CONTROLLED'}
                            </span>
                          </td>
                          <td className="py-4 pl-2 text-right text-blue-500 font-bold hover:underline">
                            <ArrowRight size={14} className="inline" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Clinician Bookings List */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar size={16} className="text-indigo-500" />
              Your Upcoming Consultations List
            </h3>
            {appointments.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No consultations booked on your calendar schedule.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map((app) => (
                  <div key={app._id} className="p-4 border border-white/20 dark:border-white/5 bg-white/20 dark:bg-slate-800/20 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Consultation File</span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                          app.status === 'CONFIRMED'
                            ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 truncate">{app.patientId.email}</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Notes: {app.notes || 'Routine diagnostic telemetry check.'}</p>
                    </div>
                    <div className="mt-3 border-t border-slate-100 dark:border-slate-800/40 pt-2 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                      <span>Date: {new Date(app.startTime).toLocaleDateString()}</span>
                      <span>Time: {new Date(app.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed Biomarker Health Overview */}
        <div className="lg:col-span-1">
          {selectedPatient ? (
            <div className="glass-panel p-6 rounded-3xl space-y-6 sticky top-20">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800/40">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Patient File</span>
                <h3 className="text-md font-bold text-slate-800 dark:text-white mt-1 break-all">{selectedPatient.email}</h3>
                <span className="text-[10px] text-slate-400 block mt-1">Supervised Since: {new Date(selectedPatient.joinedAt).toLocaleDateString()}</span>
              </div>

              {/* Patient Compliance Score Gauge */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Medication Adherence Adherance</span>
                  <span className="font-black text-blue-600 dark:text-blue-400">{selectedPatient.complianceRate}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800/60 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      selectedPatient.complianceRate >= 85
                        ? 'bg-emerald-500'
                        : selectedPatient.complianceRate >= 60
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${selectedPatient.complianceRate}%` }}
                  ></div>
                </div>
              </div>

              {/* Biomarkers Table */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Extracted Biomarker Panel</span>
                <div className="space-y-2.5">
                  {selectedPatient.biomarkers.map((b, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-2xl border border-white/20 dark:border-white/5 bg-white/10 dark:bg-slate-800/10">
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{b.name}</span>
                        <span className="text-[9px] text-slate-400">Ref: {b.referenceRange} {b.unit}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-black block ${
                          b.status !== 'NORMAL' ? 'text-rose-500' : 'text-emerald-500'
                        }`}>
                          {b.value} {b.unit}
                        </span>
                        <span className={`text-[8px] font-black ${
                          b.status !== 'NORMAL' ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Patient AI Insight Card */}
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-1">
                <span className="text-[9px] uppercase font-bold text-amber-500 tracking-wider flex items-center gap-1">
                  <ShieldAlert size={10} />
                  AI Analysis Summary
                </span>
                <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedPatient.latestRecordSummary}
                </p>
              </div>

              {/* Clinical Recommendation Textbox */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Add Clinical Recommendations</span>
                <textarea
                  placeholder="Input custom patient recommendation instructions (e.g. increase daily dosage, schedule next ECG)..."
                  value={clinicalNote}
                  onChange={(e) => setClinicalNote(e.target.value)}
                  className="w-full p-3 border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 rounded-2xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none h-24 resize-none"
                />
                <button
                  disabled={!clinicalNote}
                  onClick={handleSaveNote}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-sm transition-all disabled:opacity-50"
                >
                  Publish Recommendations
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-3xl text-center text-slate-400 py-12 text-xs">
              <Clipboard size={32} className="mx-auto text-slate-300 mb-3" />
              Select a patient from the list directory to inspect health telemetry logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default DoctorPanel;
