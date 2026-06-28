import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Shield, Mail, Lock, User, Loader2 } from 'lucide-react';

export const Register: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const password = watch('password');

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await axios.post('/api/v1/auth/register', {
        email: data.email,
        password: data.password,
        role: data.role,
      });

      setSuccessMessage('Registration successful! Please check your email for verification.');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Registration failed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500"></div>

        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-2xl mb-3 text-blue-600 dark:text-blue-400">
            <Shield size={28} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Create Account</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Register for your clinical dashboard</p>
        </div>

        {errorMessage && (
          <div className="p-4 mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-4 mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm">
            {successMessage}
            <div className="mt-3">
              <Link to="/login" className="text-xs underline font-semibold">Proceed to Login</Link>
            </div>
          </div>
        )}

        {!successMessage && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  placeholder="doctor@medimind.ai"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                />
              </div>
              {errors.email && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.email.message as string}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Designation / Role
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  {...register('role', { required: 'Role is required' })}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all appearance-none"
                >
                  <option value="PATIENT">Patient Profile</option>
                  <option value="DOCTOR">Medical Professional (Doctor)</option>
                  <option value="NURSE">Nursing & Clinical Staff</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Password
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
                Confirm Password
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
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Register Account'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};
export default Register;
