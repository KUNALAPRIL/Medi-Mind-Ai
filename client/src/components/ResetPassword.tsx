import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Shield, Lock, Loader2, ArrowLeft } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const password = watch('password');
  const token = searchParams.get('token');

  const onSubmit = async (data: any) => {
    if (!token) {
      setErrorMessage('Reset password token is missing from URL.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const response = await axios.post('/api/v1/auth/reset-password', {
        token,
        password: data.password,
      });
      setSuccessMessage(response.data.message || 'Password has been updated.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Password reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500"></div>

        <div className="mb-6">
          <Link to="/login" className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all">
            <ArrowLeft size={14} />
            Back to Login
          </Link>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-2xl mb-3 text-blue-600 dark:text-blue-400">
            <Shield size={28} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Reset Password</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure your new credentials</p>
        </div>

        {errorMessage && (
          <div className="p-4 mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-4 mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm text-center">
            {successMessage}
            <div className="mt-2 text-xs text-slate-400">Redirecting to login view...</div>
          </div>
        )}

        {!token && (
          <div className="p-4 mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm text-center">
            Verification link is malformed or expired.
          </div>
        )}

        {token && !successMessage && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' }
                  })}
                  placeholder="••••••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                />
              </div>
              {errors.password && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.password.message as string}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match'
                  })}
                  placeholder="••••••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                />
              </div>
              {errors.confirmPassword && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.confirmPassword.message as string}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 text-sm"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
export default ResetPassword;
