import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Button from '../components/common/Button';
import { DemoBadge } from '../components/common/DemoBadge';

export const LoginPage = () => {
  const { login } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(email, password);
      setIsLoading(false);
      addToast({
        title: 'Authentication Successful',
        message: res.backend ? 'Connected via Backend API' : 'Logged into Demo Safe Mode',
        type: 'success',
      });
      navigate('/dashboard');
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Authentication error.');
    }
  };

  const fillDemoCredentials = () => {
    setEmail('quant.alex@algoboostx.ai');
    setPassword('DemoAlgo2026!');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="rounded-3xl bg-[#090e1c]/90 border border-white/[0.08] backdrop-blur-2xl p-8 shadow-2xl shadow-cyan-950/40">
          {/* Logo Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-[1.5px] shadow-lg shadow-cyan-500/25">
                <div className="w-full h-full bg-[#070a12] rounded-[10px] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <span className="font-heading font-extrabold text-xl text-white">
                Algo <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">boostX</span>
              </span>
            </Link>

            <h2 className="text-2xl font-bold font-heading text-white">Welcome Back</h2>
            <p className="text-xs text-slate-400 mt-1">Sign in to your algorithmic trading workspace</p>
          </div>

          {/* Quick Demo Credentials Autofill Banner */}
          <div className="mb-6 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-2">
            <div className="text-[11px] text-cyan-300 font-mono">
              <span className="font-bold">Demo Mode:</span> One-click credentials
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 font-semibold transition-colors"
            >
              Fill Demo
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@algoboostx.ai"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-900 border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full mt-2"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Platform
            </Button>
          </form>

          {/* Footer Link to Signup */}
          <div className="mt-6 pt-6 border-t border-white/[0.06] text-center text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-semibold">
              Create an account
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
