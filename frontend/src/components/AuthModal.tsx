import { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, LogIn, ArrowRight } from 'lucide-react';
import { authService } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await authService.login(email, password);
        setSuccessMsg('Authentication successful.');
        setTimeout(() => {
          onAuthSuccess(res.user);
          onClose();
        }, 500);
      } else {
        const res = await authService.register(email, password, fullName);
        setSuccessMsg('Account registered successfully.');
        setTimeout(() => {
          onAuthSuccess(res.user);
          onClose();
        }, 500);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-surface-50 border border-surface-border rounded-xl shadow-2xl p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-text-tertiary hover:text-text-primary rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent-cyan-dim border border-accent-cyan/30 text-accent-cyan mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-text-primary">
            {isLogin ? 'Researcher Access' : 'Create Scientific Account'}
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            {isLogin
              ? 'Access saved reports, telemetry history, and custom cohorts.'
              : 'Register to unlock persistent analysis logs and pipeline access.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-accent-red-dim border border-accent-red/20 text-accent-red text-xs">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-accent-emerald-dim border border-accent-emerald/20 text-accent-emerald text-xs">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-text-tertiary mb-1">
                Full Name / Department
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Jane Doe"
                  className="w-full pl-9 pr-4 py-2.5 bg-surface-100 border border-surface-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-cyan transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-text-tertiary mb-1">
              Institutional Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="scientist@institution.org"
                className="w-full pl-9 pr-4 py-2.5 bg-surface-100 border border-surface-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-cyan transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-text-tertiary mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-surface-100 border border-surface-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-cyan transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-accent-cyan hover:bg-accent-cyan/90 text-[#080b11] font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-glow-cyan disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : isLogin ? 'Sign In to Platform' : 'Complete Registration'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-surface-border text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs text-text-secondary hover:text-accent-cyan transition-colors"
          >
            {isLogin
              ? "Don't have an account? Sign up here."
              : 'Already registered? Sign in here.'}
          </button>
        </div>
      </div>
    </div>
  );
}
