import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Users, ShieldAlert, Cpu, Heart, CheckSquare, Loader2, Database, Search } from 'lucide-react';

interface UserItem {
  _id: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

interface DoctorItem {
  _id: string;
  firstName: string;
  lastName: string;
  npi: string;
  specialty: string;
  userId?: {
    _id: string;
    email: string;
    isVerified: boolean;
  };
}

interface AnalyticsData {
  totalUsers: number;
  totalDoctors: number;
  totalReports: number;
  activeSessions: number;
  systemHealth: string;
  latencyMs: number;
}

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeedingBulk, setIsSeedingBulk] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Search and pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, docsRes, analyticsRes] = await Promise.all([
        api.get('/api/v1/admin/users'),
        api.get('/api/v1/admin/doctors'),
        api.get('/api/v1/admin/analytics/system'),
      ]);
      setUsers(usersRes.data.data);
      setDoctors(docsRes.data.data);
      setAnalytics(analyticsRes.data.data);
    } catch (error) {
      console.error('Failed to load admin dashboard indices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedBulk = async () => {
    setIsSeedingBulk(true);
    try {
      await api.post('/api/v1/admin/seed-bulk');
      setSuccessMsg('Bulk patient records (20 accounts, intake logs, biomarkers) successfully seeded!');
      fetchAdminData();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (error) {
      console.error('Failed to seed bulk patients:', error);
    } finally {
      setIsSeedingBulk(false);
    }
  };

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    const rolesOrder = ['PATIENT', 'DOCTOR', 'ADMIN'];
    const nextRoleIdx = (rolesOrder.indexOf(currentRole) + 1) % rolesOrder.length;
    const nextRole = rolesOrder[nextRoleIdx];

    try {
      const response = await api.put(`/api/v1/admin/users/${userId}/role`, { role: nextRole });
      setUsers((prev) => prev.map((u) => (u._id === userId ? response.data.data : u)));
    } catch (error) {
      console.error('Failed to adjust user role context:', error);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await api.put(`/api/v1/admin/users/${userId}/status`, { isVerified: !currentStatus });
      setUsers((prev) => prev.map((u) => (u._id === userId ? response.data.data : u)));
    } catch (error) {
      console.error('Failed to adjust user status:', error);
    }
  };

  const handleVerifyDoctor = async (doctorId: string) => {
    try {
      await api.post(`/api/v1/admin/doctors/${doctorId}/verify`);
      setSuccessMsg('Doctor license credentials verified successfully!');
      fetchAdminData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (error) {
      console.error('Failed to verify doctor:', error);
    }
  };

  // Filter and pagination computations
  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading && !analytics) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            Operations Console
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Review operational metrics, credentials queues, and security scopes.</p>
        </div>

        <button
          onClick={handleSeedBulk}
          disabled={isSeedingBulk}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all disabled:opacity-50"
        >
          {isSeedingBulk ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Seeding Bulk Patients...
            </>
          ) : (
            <>
              <Database size={16} />
              Seed 20 Patients Demo Data
            </>
          )}
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
          <CheckSquare size={18} />
          {successMsg}
        </div>
      )}

      {/* Analytics Dashboard Grid */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-5 rounded-3xl flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
              <Users size={22} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Registrations</span>
              <span className="text-xl font-black text-slate-800 dark:text-white mt-0.5">{analytics.totalUsers}</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-3xl flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
              <Heart size={22} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Clinicians List</span>
              <span className="text-xl font-black text-slate-800 dark:text-white mt-0.5">{analytics.totalDoctors}</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-3xl flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500">
              <Cpu size={22} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Active Sessions</span>
              <span className="text-xl font-black text-slate-800 dark:text-white mt-0.5">{analytics.activeSessions}</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-3xl flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <ShieldAlert size={22} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Cluster Health</span>
              <span className="text-xl font-black text-slate-800 dark:text-white mt-0.5">{analytics.systemHealth} ({analytics.latencyMs}ms)</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* User Directory Table (2 Cols Width) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">User Database Directory</h3>
            
            {/* Search Input */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search user profile..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 pr-2">User Email</th>
                  <th className="pb-3 px-2">Access Role</th>
                  <th className="pb-3 px-2">Verification Status</th>
                  <th className="pb-3 pl-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {paginatedUsers.map((u) => (
                  <tr key={u._id} className="text-slate-600 dark:text-slate-300">
                    <td className="py-3.5 pr-2 font-semibold truncate max-w-[200px]">{u.email}</td>
                    <td className="py-3.5 px-2">
                      <button
                        onClick={() => handleRoleToggle(u._id, u.role)}
                        className="px-2 py-0.5 rounded bg-white/50 dark:bg-slate-800 border border-white/20 dark:border-white/5 font-bold hover:bg-white dark:hover:bg-slate-700 transition-all text-[9px] tracking-wide"
                      >
                        {u.role}
                      </button>
                    </td>
                    <td className="py-3.5 px-2">
                      <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                        u.isVerified
                          ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                      }`}>
                        {u.isVerified ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td className="py-3.5 pl-2 text-right">
                      <button
                        onClick={() => handleStatusToggle(u._id, u.isVerified)}
                        className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Toggle Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/40 pt-4">
              <span className="text-[10px] text-slate-400 font-semibold">
                Showing Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1 bg-white/50 dark:bg-slate-800 border border-white/20 dark:border-white/5 rounded-lg text-[10px] font-bold disabled:opacity-50 hover:bg-white dark:hover:bg-slate-700 transition-all"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1 bg-white/50 dark:bg-slate-800 border border-white/20 dark:border-white/5 rounded-lg text-[10px] font-bold disabled:opacity-50 hover:bg-white dark:hover:bg-slate-700 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Doctor Verification Queue (1 Col Width) */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Clinicians Verification Queue</h3>
          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
            {doctors.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No clinician profiles registered.</p>
            ) : (
              doctors.map((doc) => (
                <div key={doc._id} className="p-4 rounded-2xl border border-white/20 dark:border-white/5 bg-white/20 dark:bg-slate-800/20 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">Dr. {doc.firstName} {doc.lastName}</h4>
                      <span className="text-[10px] font-semibold text-slate-400">{doc.specialty}</span>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      doc.userId?.isVerified
                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 animate-pulse'
                    }`}>
                      {doc.userId?.isVerified ? 'VERIFIED' : 'PENDING'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-semibold space-y-1">
                    <p>NPI Registry: <span className="text-slate-700 dark:text-slate-300 font-bold">{doc.npi}</span></p>
                    <p>Licensing Email: <span className="text-slate-700 dark:text-slate-300 font-bold">{doc.userId?.email || 'N/A'}</span></p>
                  </div>
                  {!doc.userId?.isVerified && (
                    <button
                      onClick={() => handleVerifyDoctor(doc._id)}
                      className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[10px] transition-all shadow-sm hover:shadow-blue-500/10"
                    >
                      Approve Doctor NPI
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminPanel;
