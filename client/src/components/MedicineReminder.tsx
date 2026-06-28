import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Pill, Plus, Trash2, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

interface MedicineReminder {
  _id: string;
  medicineName: string;
  dosage: string;
  times: string[];
  startDate: string;
  endDate: string;
}

interface MedicationLog {
  _id: string;
  reminderId?: {
    medicineName: string;
    dosage: string;
  };
  scheduledTime: string;
  status: 'PENDING' | 'TAKEN' | 'MISSED';
}

export const MedicineReminderComponent: React.FC = () => {
  const [reminders, setReminders] = useState<MedicineReminder[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [timesList, setTimesList] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchReminders();
    fetchLogs();
  }, []);

  const fetchReminders = async () => {
    try {
      const response = await api.get('/api/v1/reminders');
      setReminders(response.data.data);
    } catch (err) {
      console.error('Failed to fetch reminders:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await api.get('/api/v1/reminders/logs');
      setLogs(response.data.data);
    } catch (err) {
      console.error('Failed to fetch medication logs:', err);
    }
  };

  const addTime = () => {
    if (timeInput && !timesList.includes(timeInput)) {
      setTimesList([...timesList, timeInput]);
      setTimeInput('');
    }
  };

  const removeTime = (val: string) => {
    setTimesList(timesList.filter((t) => t !== val));
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dosage || timesList.length === 0 || !startDate || !endDate) return;

    setIsLoading(true);
    try {
      await api.post('/api/v1/reminders', {
        medicineName: name,
        dosage,
        times: timesList,
        startDate,
        endDate,
      });

      setName('');
      setDosage('');
      setTimesList([]);
      setStartDate('');
      setEndDate('');
      
      fetchReminders();
      fetchLogs();
    } catch (err) {
      console.error('Failed to create reminder:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await api.delete(`/api/v1/reminders/${id}`);
      setReminders(reminders.filter((r) => r._id !== id));
      fetchLogs();
    } catch (err) {
      console.error('Failed to delete reminder:', err);
    }
  };

  const handleToggleLogStatus = async (logId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'TAKEN' ? 'PENDING' : 'TAKEN';
    try {
      await api.post(`/api/v1/reminders/logs/${logId}/status`, { status: nextStatus });
      setLogs(logs.map((log) => (log._id === logId ? { ...log, status: nextStatus as any } : log)));
    } catch (err) {
      console.error('Failed to update medication log status:', err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            Medication Scheduler
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Configure dosage triggers and log your daily treatment compliance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Create Scheduler (2 Cols Width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Create Reminder Form */}
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Pill className="text-blue-500" size={18} />
              Add Medication Reminder
            </h3>
            
            <form onSubmit={handleCreateReminder} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Medicine Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Lipitor"
                    className="w-full mt-1.5 px-3 py-3 rounded-2xl glass-input text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Dosage Size</label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g. 1 pill (10mg)"
                    className="w-full mt-1.5 px-3 py-3 rounded-2xl glass-input text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full mt-1.5 px-3 py-3 rounded-2xl glass-input text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full mt-1.5 px-3 py-3 rounded-2xl glass-input text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Daily Schedule Times</label>
                <div className="flex gap-3 mt-1.5">
                  <input
                    type="time"
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    className="px-3 py-2.5 rounded-xl glass-input text-slate-800 dark:text-white focus:outline-none text-xs transition-all"
                  />
                  <button
                    type="button"
                    onClick={addTime}
                    className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs transition-all"
                  >
                    + Add Time
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {timesList.map((t) => (
                    <span key={t} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-[10px] font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                      <Clock size={10} />
                      {t}
                      <button type="button" onClick={() => removeTime(t)} className="hover:text-rose-500 font-extrabold ml-1">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || timesList.length === 0}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-2xl font-bold shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-sm"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Save Medication Reminder'}
              </button>
            </form>
          </div>

          {/* Active Reminders List */}
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">Active Schedules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reminders.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center col-span-2">No active reminders found. Schedule one above.</p>
              ) : (
                reminders.map((rem) => (
                  <div key={rem._id} className="p-4 rounded-2xl border border-white/20 dark:border-white/5 bg-white/20 dark:bg-slate-800/20 flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">{rem.medicineName}</h4>
                      <p className="text-xs text-slate-400 mt-1">Dosage: {rem.dosage}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {rem.times.map((t) => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] text-slate-500 dark:text-slate-400 font-bold border border-white/10">{t}</span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteReminder(rem._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Medication Logs (1 Col Width) */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Today's Intake Schedule</h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No logs scheduled for today.</p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log._id}
                    onClick={() => handleToggleLogStatus(log._id, log.status)}
                    className="p-4 rounded-2xl border border-white/20 dark:border-white/5 bg-white/20 dark:bg-slate-800/20 flex items-center justify-between cursor-pointer hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">{log.reminderId?.medicineName || 'Medication'}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Dosage: {log.reminderId?.dosage || ''}</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2 font-semibold">
                        <Clock size={12} className="text-blue-500" />
                        <span>{new Date(log.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <button className="p-1 rounded-full">
                      {log.status === 'TAKEN' ? (
                        <CheckCircle2 className="text-emerald-500" size={24} />
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-slate-300 dark:border-slate-700 hover:border-blue-500 transition-all"></div>
                      )}
                    </button>
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
export default MedicineReminderComponent;
