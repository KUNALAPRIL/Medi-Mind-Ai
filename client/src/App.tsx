import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { VerifyEmail } from './components/VerifyEmail';
import { ForgotPassword } from './components/ForgotPassword';
import { ResetPassword } from './components/ResetPassword';
import { Dashboard } from './components/Dashboard';
import { Chat } from './components/Chat';
import { MedicalRecords } from './components/MedicalRecords';
import { PrescriptionScanner } from './components/PrescriptionScanner';
import { AppointmentScheduler } from './components/AppointmentScheduler';
import { MedicineReminderComponent } from './components/MedicineReminder';
import { SymptomChecker } from './components/SymptomChecker';
import { AdminPanel } from './components/AdminPanel';
import { DoctorPanel } from './components/DoctorPanel';
import { HealthAnalytics } from './components/HealthAnalytics';
import api from './utils/api';
import { Sun, Moon, LayoutDashboard, MessageSquare, LogOut, Loader2, User, FileText, Upload, Calendar, ShieldAlert, Pill, Activity, Database, TrendingUp, Menu } from 'lucide-react';

const queryClient = new QueryClient();

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

interface TopNavbarProps {
  onOpenSidebar: () => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [isSeeding, setIsSeeding] = React.useState(false);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      await api.post('/api/v1/auth/seed-demo');
      window.location.reload();
    } catch (error) {
      console.error('Demo data seeding failed:', error);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <header className="h-16 px-6 lg:px-8 border-b border-white/20 dark:border-white/5 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-2.5">
        {user && (
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400"
            title="Open navigation menu"
          >
            <Menu size={18} />
          </button>
        )}
        <span className="font-bold text-xl tracking-tight text-blue-600 dark:text-blue-400">MediMind AI</span>
        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">V1.0</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Language Selector */}
        <button
          onClick={toggleLanguage}
          className="px-3 py-1.5 rounded-xl border border-white/20 dark:border-white/5 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800 text-xs font-black transition-all text-slate-700 dark:text-slate-200"
          title="Toggle Language / भाषा बदलें"
        >
          {language === 'en' ? 'हिंदी (Hindi)' : 'EN (English)'}
        </button>

        {user && (
          <button
            onClick={handleSeedDemo}
            disabled={isSeeding}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold transition-all disabled:opacity-50"
            title="Load mock patient metrics, medications, and records"
          >
            {isSeeding ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                {t('seeding')}
              </>
            ) : (
              <>
                <Database size={13} />
                {t('seedData')}
              </>
            )}
          </button>
        )}

        {user && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-white/20 dark:border-white/5">
            <User size={14} className="text-blue-500" />
            <span>{user.email}</span>
            <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-[9px] font-bold text-blue-700 dark:text-blue-300">
              {user.role}
            </span>
          </div>
        )}

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg glass-panel hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={18} className="text-slate-700" /> : <Sun size={18} className="text-amber-400" />}
        </button>

        {user && (
          <button
            onClick={logout}
            className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-600 transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Sign out"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}
      </div>
    </header>
  );
};

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  return (
    <Router>
      <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-tr from-blue-50 via-slate-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100">
        
        {/* Navigation Sidebar */}
        {user && (
          <>
            {/* Mobile Backdrop Overlay */}
            {isMobileSidebarOpen && (
              <div
                className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-sm lg:hidden"
                onClick={() => setIsMobileSidebarOpen(false)}
              ></div>
            )}

            <aside className={`
              fixed inset-y-0 left-0 z-50 w-64 h-full border-r border-white/20 dark:border-white/5 bg-white dark:bg-slate-900 lg:bg-white/40 lg:dark:bg-slate-900/40 lg:backdrop-blur-md flex flex-col shrink-0 transition-transform duration-300 ease-in-out
              lg:translate-x-0 lg:static lg:z-auto
              ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
              <div className="p-6 border-b border-white/20 dark:border-white/5 flex items-center justify-between">
                <span className="font-bold text-lg text-slate-800 dark:text-white">{t('workspace')}</span>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="lg:hidden text-slate-400 hover:text-slate-500 text-xs font-bold"
                >
                  {t('close')}
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <Link
                  onClick={() => setIsMobileSidebarOpen(false)}
                  to="/"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all font-medium text-sm text-slate-700 dark:text-slate-300"
                >
                  <LayoutDashboard size={18} className="text-blue-500" />
                  {t('dashboard')}
                </Link>
                <Link
                  onClick={() => setIsMobileSidebarOpen(false)}
                  to="/chat"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all font-medium text-sm text-slate-700 dark:text-slate-300"
                >
                  <MessageSquare size={18} className="text-cyan-500" />
                  {t('aiChat')}
                </Link>
                <Link
                  onClick={() => setIsMobileSidebarOpen(false)}
                  to="/analytics"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all font-medium text-sm text-slate-700 dark:text-slate-300"
                >
                  <TrendingUp size={18} className="text-purple-500" />
                  {t('healthAnalytics')}
                </Link>
                <Link
                  onClick={() => setIsMobileSidebarOpen(false)}
                  to="/records"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all font-medium text-sm text-slate-700 dark:text-slate-300"
                >
                  <FileText size={18} className="text-emerald-500" />
                  {t('medicalRecords')}
                </Link>
                <Link
                  onClick={() => setIsMobileSidebarOpen(false)}
                  to="/scanner"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all font-medium text-sm text-slate-700 dark:text-slate-300"
                >
                  <Upload size={18} className="text-sky-500" />
                  {t('prescriptionScanner')}
                </Link>
                <Link
                  onClick={() => setIsMobileSidebarOpen(false)}
                  to="/reminders"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all font-medium text-sm text-slate-700 dark:text-slate-300"
                >
                  <Pill size={18} className="text-blue-500" />
                  {t('reminders')}
                </Link>
                <Link
                  onClick={() => setIsMobileSidebarOpen(false)}
                  to="/triage"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all font-medium text-sm text-slate-700 dark:text-slate-300"
                >
                  <Activity size={18} className="text-emerald-500" />
                  {t('symptomChecker')}
                </Link>
                <Link
                  onClick={() => setIsMobileSidebarOpen(false)}
                  to="/appointments"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all font-medium text-sm text-slate-700 dark:text-slate-300"
                >
                  <Calendar size={18} className="text-indigo-500" />
                  {t('bookAppointment')}
                </Link>
                {user.role === 'DOCTOR' && (
                  <Link
                    onClick={() => setIsMobileSidebarOpen(false)}
                    to="/doctor"
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all font-medium text-sm text-slate-700 dark:text-slate-300"
                  >
                    <Activity size={18} className="text-blue-500" />
                    {t('doctorPanel')}
                  </Link>
                )}
                {user.role === 'ADMIN' && (
                  <Link
                    onClick={() => setIsMobileSidebarOpen(false)}
                    to="/admin"
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all font-medium text-sm text-slate-700 dark:text-slate-300"
                  >
                    <ShieldAlert size={18} className="text-rose-500" />
                    {t('adminPanel')}
                  </Link>
                )}
              </nav>
            </aside>
          </>
        )}
 
        {/* Content Panel Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {user && <TopNavbar onOpenSidebar={() => setIsMobileSidebarOpen(true)} />}
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/records"
                element={
                  <ProtectedRoute>
                    <MedicalRecords />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/scanner"
                element={
                  <ProtectedRoute>
                    <PrescriptionScanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reminders"
                element={
                  <ProtectedRoute>
                    <MedicineReminderComponent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/triage"
                element={
                  <ProtectedRoute>
                    <SymptomChecker />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <HealthAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/appointments"
                element={
                  <ProtectedRoute>
                    <AppointmentScheduler />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor"
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR']}>
                    <DoctorPanel />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <LanguageProvider>
            <AppContent />
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
