import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Verifying email address...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing in the request URL');
      return;
    }

    const triggerVerification = async () => {
      try {
        const response = await axios.post('/api/v1/auth/verify-email', { token });
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification token is invalid or has expired');
      }
    };

    triggerVerification();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500"></div>

        {status === 'loading' && (
          <div className="py-8 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-blue-500" size={40} />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Verifying Account</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-8 flex flex-col items-center gap-4">
            <CheckCircle className="text-emerald-500" size={48} />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Verification Complete</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
            <Link
              to="/login"
              className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-blue-500/10"
            >
              Sign In
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="py-8 flex flex-col items-center gap-4">
            <XCircle className="text-rose-500" size={48} />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Verification Failed</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
            <div className="flex gap-4 mt-6">
              <Link
                to="/register"
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Register Again
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all"
              >
                Go to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default VerifyEmail;
