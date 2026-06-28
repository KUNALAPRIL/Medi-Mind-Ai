import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { FileText, UploadCloud, Search, Trash2, Calendar, Eye, Loader2, X } from 'lucide-react';

interface Biomarker {
  name: string;
  value: number;
  unit: string;
  referenceRange: string;
  status: 'NORMAL' | 'HIGH' | 'LOW';
}

interface MedicalRecord {
  _id: string;
  originalFileName: string;
  fileUrl: string;
  extractedData?: {
    biomarkers?: Biomarker[];
    rawText?: string;
  };
  aiAnalysisSummary?: string;
  parsedAt: string;
}

export const MedicalRecords: React.FC = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [search, setSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
  }, [search]);

  const fetchRecords = async () => {
    try {
      const response = await api.get('/api/v1/records', {
        params: { search: search || undefined },
      });
      setRecords(response.data.data);
    } catch (error) {
      console.error('Failed to fetch records:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/v1/records/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setRecords((prev) => [response.data.data, ...prev]);
    } catch (error: any) {
      setUploadError(error.response?.data?.message || 'File upload failed. Ensure PNG, JPG, or PDF format.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/v1/records/${id}`);
      setRecords((prev) => prev.filter((r) => r._id !== id));
      if (selectedRecord?._id === id) {
        setSelectedRecord(null);
      }
    } catch (error) {
      console.error('Failed to delete record:', error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            Medical Document Registry
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Upload and parse your prescriptions, lab tests, and imaging records securely.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Drag-and-Drop and List (2 Cols Width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* File Upload zone */}
          <div className="glass-panel p-8 rounded-3xl text-center relative border-dashed border-2 border-slate-200 dark:border-slate-800/60 hover:border-blue-400 dark:hover:border-blue-500/40 transition-all">
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={isUploading}
              id="file-upload-input"
              className="hidden"
              accept=".png,.jpg,.jpeg,.pdf"
            />
            <label htmlFor="file-upload-input" className="cursor-pointer flex flex-col items-center gap-3">
              <UploadCloud size={40} className="text-slate-400 animate-pulse" />
              <div>
                <span className="text-sm font-bold text-slate-800 dark:text-white block">Upload Medical Report</span>
                <span className="text-xs text-slate-400 block mt-1">Supports PNG, JPG, JPEG, and PDF up to 10MB</span>
              </div>
            </label>

            {isUploading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-blue-500 font-semibold">
                <Loader2 className="animate-spin" size={16} />
                Uploading and parsing with AI system...
              </div>
            )}

            {uploadError && (
              <div className="mt-4 text-xs text-rose-500 font-semibold bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/10">
                {uploadError}
              </div>
            )}
          </div>

          {/* Records List Table */}
          <div className="glass-panel p-6 rounded-3xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Historical Scans</h3>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search file name..."
                  className="pl-9 pr-4 py-2 text-xs rounded-xl glass-input text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-56"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {records.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No medical reports found matching query.</p>
              ) : (
                records.map((record) => (
                  <div
                    key={record._id}
                    onClick={() => setSelectedRecord(record)}
                    className="flex items-center justify-between py-4 cursor-pointer hover:bg-slate-100/10 dark:hover:bg-slate-800/10 rounded-2xl px-2.5 transition-all"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText size={18} className="text-blue-500 shrink-0" />
                      <div className="overflow-hidden">
                        <h4 className="text-sm font-semibold truncate text-slate-800 dark:text-white">
                          {record.originalFileName}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-semibold">
                          <Calendar size={12} />
                          <span>{new Date(record.parsedAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{record.extractedData?.biomarkers?.length || 0} biomarkers</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-all">
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteRecord(record._id, e)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Detailed analysis Panel (1 Col Width) */}
        <div className="lg:col-span-1">
          {selectedRecord ? (
            <div className="glass-panel p-6 rounded-3xl space-y-6 relative overflow-hidden">
              <button
                onClick={() => setSelectedRecord(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all"
              >
                <X size={16} />
              </button>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Selected Analysis</h3>
                <h4 className="text-base font-extrabold text-slate-800 dark:text-white mt-1 truncate pr-8">
                  {selectedRecord.originalFileName}
                </h4>
              </div>

              {selectedRecord.aiAnalysisSummary && (
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">AI Medical Summary</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedRecord.aiAnalysisSummary}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Biomarkers Extracted</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {selectedRecord.extractedData?.biomarkers?.map((bio, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-2xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-slate-800/40">
                      <div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">{bio.name}</span>
                        <span className="text-[10px] text-slate-400">Ref: {bio.referenceRange}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-800 dark:text-white block">{bio.value} {bio.unit}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          bio.status === 'HIGH' ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300' :
                          bio.status === 'LOW' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' :
                          'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          {bio.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={selectedRecord.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-semibold text-center block text-xs transition-all"
                >
                  Download Original File
                </a>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-3xl text-center flex flex-col items-center justify-center h-64 text-slate-400">
              <FileText size={32} className="mb-2" />
              <p className="text-xs">Select a medical record in the historical scans list to view extracted biometric details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default MedicalRecords;
