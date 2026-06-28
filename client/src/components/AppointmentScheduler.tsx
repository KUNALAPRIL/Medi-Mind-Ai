import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Calendar, User, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  specialty: string;
}

interface Appointment {
  _id: string;
  doctorId: Doctor;
  startTime: string;
  notes?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}

export const AppointmentScheduler: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctors();
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDoctorId, selectedDate]);

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/api/v1/appointments/doctors');
      setDoctors(response.data.data);
    } catch (err) {
      console.error('Failed to fetch doctors list:', err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/api/v1/appointments');
      setAppointments(response.data.data);
    } catch (err) {
      console.error('Failed to fetch user bookings:', err);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const response = await api.get(`/api/v1/appointments/doctors/${selectedDoctorId}/available-slots`, {
        params: { date: selectedDate },
      });
      setAvailableSlots(response.data.data);
    } catch (err) {
      console.error('Failed to query available slots:', err);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !selectedDate || !selectedSlot) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await api.post('/api/v1/appointments', {
        doctorId: selectedDoctorId,
        date: selectedDate,
        time: selectedSlot,
        notes,
      });

      setSuccessMsg('Appointment booked successfully!');
      setSelectedSlot('');
      setNotes('');
      fetchAppointments();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to book slot.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (id: string) => {
    try {
      await api.post(`/api/v1/appointments/${id}/cancel`);
      setAppointments((prev) =>
        prev.map((app) => (app._id === id ? { ...app, status: 'CANCELLED' } : app))
      );
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            Schedule Appointment
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Select a medical practitioner and book secure virtual consultations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Booking Wizard (2 Cols Width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6">Booking Wizard</h3>
            
            {successMsg && (
              <div className="p-4 mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
                <CheckCircle size={18} />
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="p-4 mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
                <AlertCircle size={18} />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Select Doctor</label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full mt-1.5 px-3 py-3 rounded-2xl glass-input text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all appearance-none"
                  >
                    <option value="">Choose a practitioner...</option>
                    {doctors.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        Dr. {doc.firstName} {doc.lastName} ({doc.specialty})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Consultation Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full mt-1.5 px-3 py-3 rounded-2xl glass-input text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                  />
                </div>
              </div>

              {selectedDoctorId && selectedDate && (
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-2 block">Available Slots</label>
                  {availableSlots.length === 0 ? (
                    <p className="text-xs text-slate-400 p-3 bg-slate-100/10 border border-white/10 rounded-2xl">No open slots available for the selected date.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                            selectedSlot === slot
                              ? 'bg-blue-600 border-blue-700 text-white shadow-md'
                              : 'bg-white/40 dark:bg-slate-800/40 border-white/20 dark:border-white/5 text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedSlot && (
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Notes / Reason for Visit</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Briefly state symptoms or clinical concerns..."
                    className="w-full mt-1.5 px-4 py-3 rounded-2xl glass-input text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all h-24"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !selectedSlot}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-2xl font-bold shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-sm"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Book Appointment'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Appointment Log History (1 Col Width) */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Upcoming & Past Bookings</h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {appointments.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No appointments booked yet.</p>
              ) : (
                appointments.map((app) => (
                  <div key={app._id} className="p-4 rounded-2xl border border-white/20 dark:border-white/5 bg-white/20 dark:bg-slate-800/20 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{app.doctorId.specialty}</span>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">Dr. {app.doctorId.firstName} {app.doctorId.lastName}</h4>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                        app.status === 'CONFIRMED' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' :
                        app.status === 'CANCELLED' ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-blue-500" />
                        <span>{new Date(app.startTime).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-cyan-500" />
                        <span>{new Date(app.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {app.notes && (
                      <p className="text-xs text-slate-400 leading-normal border-t border-white/10 pt-2">{app.notes}</p>
                    )}

                    {app.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleCancelBooking(app._id)}
                        className="w-full mt-2 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-600 rounded-xl font-semibold text-[10px] transition-all"
                      >
                        Cancel Booking
                      </button>
                    )}
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
export default AppointmentScheduler;
