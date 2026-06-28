import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Lock, Loader2, KeyRound } from 'lucide-react';

export const Login: React.FC = () => {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await axios.post('/api/v1/auth/login', {
        email: data.email,
        password: data.password,
      });

      const { accessToken, refreshToken, user } = response.data.data;
      login(accessToken, refreshToken, user);
      navigate('/');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const mockIdToken = `mock_google_token_google_user_${Math.random().toString(36).substring(2, 11)}@gmail.com`;
      const response = await axios.post('/api/v1/auth/google', {
        idToken: mockIdToken,
      });
      const { accessToken, refreshToken, user } = response.data.data;
      login(accessToken, refreshToken, user);
      navigate('/');
    } catch (error: any) {
      setErrorMessage('Google OAuth authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (email: string, pass: string) => {
    setValue('email', email);
    setValue('password', pass);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Premium Glassmorphic Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-3xl relative overflow-hidden z-10 border border-white/20 dark:border-white/5 shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500"></div>

        {/* Heading */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-2xl mb-3 text-white shadow-md shadow-blue-500/20">
            <Shield size={28} />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">MediMind AI Portal</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">Secure Clinical Assistant</p>
        </div>

        {errorMessage && (
          <div className="p-4 mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                placeholder="doctor@medimind.ai"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs transition-all placeholder:text-slate-400"
              />
            </div>
            {errors.email && (
              <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.email.message as string}</span>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="password"
                {...register('password', { required: 'Password is required' })}
                placeholder="••••••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs transition-all placeholder:text-slate-400"
              />
            </div>
            {errors.password && (
              <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.password.message as string}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 text-xs"
          >
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'ACCESS CONSOLE'}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <span className="absolute inset-x-0 top-1/2 border-t border-slate-200 dark:border-slate-800/60 -z-10"></span>
          <span className="bg-slate-50 dark:bg-slate-950 px-3 text-[9px] text-slate-400 uppercase tracking-widest font-black">Or Sign In with</span>
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          disabled={isLoading}
          className="w-full py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 rounded-2xl font-black transition-all flex items-center justify-center gap-2 text-xs"
        >
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google SSO
        </button>

        {/* Quick Sandbox Access panel */}
        <div className="mt-6 p-4 rounded-2xl border border-white/20 dark:border-white/5 bg-white/30 dark:bg-slate-900/30 text-xs space-y-2">
          <span className="font-black text-slate-400 uppercase tracking-widest text-[9px] flex items-center gap-1.5">
            <KeyRound size={12} className="text-amber-500" />
            Quick Sandbox Access
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => fillCredentials('patient1@medimind.ai', 'Password123!')}
              type="button"
              className="py-1.5 px-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-[10px] transition-all"
            >
              Patient File
            </button>
            <button
              onClick={() => fillCredentials('robert.chen@medimind.ai', 'Password123!')}
              type="button"
              className="py-1.5 px-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-[10px] transition-all"
            >
              Doctor Portal
            </button>
            <button
              onClick={() => fillCredentials('sarah.jenkins@medimind.ai', 'Password123!')}
              type="button"
              className="py-1.5 px-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl font-bold text-[10px] transition-all"
            >
              Clinician #2
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-400">
          New to the platform?{' '}
          <Link to="/register" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
            Request credentials
          </Link>
        </div>
      </div>
    </div>
  );
};
export default Login;
