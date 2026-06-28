import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Upload, Pill, FileText, CheckCircle2, AlertCircle, Loader2, CheckSquare } from 'lucide-react';

interface MedicineInput {
  name: string;
  dosage: string;
  frequency: string;
}

interface Prescription {
  _id: string;
  originalFileName: string;
  fileUrl: string;
  doctorName?: string;
  hospitalName?: string;
  prescriptionDate?: string;
  medicines: MedicineInput[];
  status: 'PENDING_VERIFICATION' | 'VERIFIED';
  createdAt: string;
}

export const PrescriptionScanner: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activePrescription, setActivePrescription] = useState<Prescription | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await api.get('/api/v1/prescriptions');
      setPrescriptions(response.data.data);
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/v1/prescriptions/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newPres = response.data.data;
      setPrescriptions((prev) => [newPres, ...prev]);
      setActivePrescription(newPres);
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Failed to scan prescription. Ensure PDF or Image format.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    if (!activePrescription) return;
    setActivePrescription({
      ...activePrescription,
      [field]: value,
    });
  };

  const handleMedicineChange = (index: number, field: string, value: string) => {
    if (!activePrescription) return;
    const updatedMeds = [...activePrescription.medicines];
    updatedMeds[index] = { ...updatedMeds[index], [field]: value };
    setActivePrescription({
      ...activePrescription,
      medicines: updatedMeds,
    });
  };

  const addMedicineRow = () => {
    if (!activePrescription) return;
    setActivePrescription({
      ...activePrescription,
      medicines: [...activePrescription.medicines, { name: '', dosage: '', frequency: '' }],
    });
  };

  const removeMedicineRow = (index: number) => {
    if (!activePrescription) return;
    const updatedMeds = activePrescription.medicines.filter((_, idx) => idx !== index);
    setActivePrescription({
      ...activePrescription,
      medicines: updatedMeds,
    });
  };

  const handleVerifySubmit = async () => {
    if (!activePrescription) return;

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await api.put(`/api/v1/prescriptions/${activePrescription._id}/verify`, {
        doctorName: activePrescription.doctorName,
        hospitalName: activePrescription.hospitalName,
        prescriptionDate: activePrescription.prescriptionDate?.split('T')[0],
        medicines: activePrescription.medicines,
      });

      const updated = response.data.data;
      setPrescriptions((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      setSuccessMsg('Prescription verified and logged successfully!');
      setActivePrescription(null);
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Verification save failed.');
    } finally {
      setIsUploading(false);
      fetchPrescriptions();
    }
  };

  const handleSyncToReminders = async () => {
    if (!activePrescription) return;

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await api.post(`/api/v1/prescriptions/${activePrescription._id}/sync`);
      setSuccessMsg('Medication reminders and active checklists successfully synchronized!');
      setActivePrescription(null);
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Synchronization failed.');
    } finally {
      setIsUploading(false);
      fetchPrescriptions();
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            Multimodal Prescription Parser
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Upload files to automatically extract medicine tables, doctors, and hospitals.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Upload zone and list (2 Cols Width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Dropzone */}
          <div className="glass-panel p-8 rounded-3xl text-center relative border-dashed border-2 border-slate-200 dark:border-slate-800/60 hover:border-blue-400 dark:hover:border-blue-500/40 transition-all">
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={isUploading}
              id="pres-upload-input"
              className="hidden"
              accept=".png,.jpg,.jpeg,.pdf"
            />
            <label htmlFor="pres-upload-input" className="cursor-pointer flex flex-col items-center gap-3">
              <Upload size={40} className="text-slate-400" />
              <div>
                <span className="text-sm font-bold text-slate-800 dark:text-white block">Upload Prescription File</span>
                <span className="text-xs text-slate-400 block mt-1">Supports PNG, JPG, JPEG, and PDF formats</span>
              </div>
            </label>

            {isUploading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-blue-500 font-semibold">
                <Loader2 className="animate-spin" size={16} />
                Parsing prescription image with Gemini Multimodal API...
              </div>
            )}

            {errorMsg && (
              <div className="mt-4 text-xs text-rose-500 font-semibold bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/10">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mt-4 text-xs text-emerald-500 font-semibold bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/10">
                {successMsg}
              </div>
            )}
          </div>

          {/* List past scans */}
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">Past Scanned Logs</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {prescriptions.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No prescriptions parsed yet.</p>
              ) : (
                prescriptions.map((pres) => (
                  <div
                    key={pres._id}
                    onClick={() => setActivePrescription(pres)}
                    className="flex items-center justify-between py-4 cursor-pointer hover:bg-slate-100/10 dark:hover:bg-slate-800/10 rounded-2xl px-2.5 transition-all"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText size={18} className="text-blue-500 shrink-0" />
                      <div className="overflow-hidden">
                        <h4 className="text-sm font-semibold truncate text-slate-800 dark:text-white">
                          {pres.doctorName || 'Unknown Doctor'} - {pres.hospitalName || 'Unknown Hospital'}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">Uploaded: {new Date(pres.createdAt).toLocaleDateString()} | Medicines: {pres.medicines.length}</p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      pres.status === 'VERIFIED'
                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 animate-pulse'
                    }`}>
                      {pres.status === 'PENDING_VERIFICATION' ? 'Pending Check' : 'Verified'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Verification inputs form (1 Col Width) */}
        <div className="lg:col-span-1">
          {activePrescription ? (
            <div className="glass-panel p-6 rounded-3xl space-y-4 relative">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Verify Extracted Data</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Doctor Name</label>
                  <input
                    type="text"
                    value={activePrescription.doctorName || ''}
                    onChange={(e) => handleFieldChange('doctorName', e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl glass-input text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Hospital Name</label>
                  <input
                    type="text"
                    value={activePrescription.hospitalName || ''}
                    onChange={(e) => handleFieldChange('hospitalName', e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl glass-input text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Prescription Date</label>
                  <input
                    type="date"
                    value={activePrescription.prescriptionDate ? activePrescription.prescriptionDate.split('T')[0] : ''}
                    onChange={(e) => handleFieldChange('prescriptionDate', e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl glass-input text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider flex items-center gap-1">
                    <Pill size={12} className="text-blue-500" />
                    Medicines
                  </label>
                  <button
                    onClick={addMedicineRow}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    + Add Row
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {activePrescription.medicines.map((med, index) => (
                    <div key={index} className="p-3 border border-white/20 dark:border-white/5 bg-white/20 dark:bg-slate-800/20 rounded-2xl space-y-2 relative">
                      <input
                        type="text"
                        value={med.name}
                        placeholder="Medicine Name"
                        onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg glass-input text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={med.dosage}
                          placeholder="Dosage (500mg)"
                          onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg glass-input text-slate-800 dark:text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          value={med.frequency}
                          placeholder="Times (1-0-1)"
                          onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg glass-input text-slate-800 dark:text-white focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={() => removeMedicineRow(index)}
                        className="absolute top-1 right-2 text-rose-500 hover:text-rose-700 text-[10px]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => setActivePrescription(null)}
                    className="flex-1 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerifySubmit}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition-all shadow-md hover:shadow-blue-500/10"
                  >
                    Save & Verify
                  </button>
                </div>
                {activePrescription.status === 'VERIFIED' && (
                  <button
                    onClick={handleSyncToReminders}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <CheckSquare size={13} />
                    Sync to Daily Reminders
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-3xl text-center flex flex-col items-center justify-center h-64 text-slate-400">
              <FileText size={32} className="mb-2" />
              <p className="text-xs">Click or drop a prescription in the dropzone or select a pending file to verify and review drug lists.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default PrescriptionScanner;
