import React, { useState } from 'react';
import { Lock, Mail, Key, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFirebase } from '../../context/FirebaseContext';

interface AdminLoginProps {
  onBackToPublic: () => void;
  onLoginSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onBackToPublic, onLoginSuccess }) => {
  const { login, loginWithFirebaseGoogle } = useAuth();
  const { signInWithGoogle } = useFirebase();
  const [email, setEmail] = useState('sobur@owner.com');
  const [password, setPassword] = useState('SoburKhan@2026!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter both administrative email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const { idToken } = await signInWithGoogle();
      await loginWithFirebaseGoogle(idToken);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Google authentication failed or account is not authorized.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F5F5F5] flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background ambient gold aura */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C9A45C]/10 blur-[130px] pointer-events-none rounded-full"
        aria-hidden="true"
      />

      {/* Back to public link */}
      <button
        onClick={onBackToPublic}
        className="absolute top-8 left-8 flex items-center gap-2 text-xs uppercase tracking-widest text-[#A7A7A7] hover:text-[#C9A45C] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return To Public Portfolio</span>
      </button>

      <div className="w-full max-w-md bg-[#121212] border border-[#C9A45C]/30 p-8 md:p-10 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 border border-[#C9A45C]/40 bg-[#181818] flex items-center justify-center text-[#C9A45C]">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-editorial font-bold text-[#F5F5F5] tracking-wide">
            OWNER PORTAL
          </h1>
          <p className="text-xs uppercase tracking-widest text-[#C9A45C] mt-1 font-medium">
            Sobur Ali Khan Private CMS
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 border border-red-500/40 bg-red-950/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div>
            <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1.5 font-medium">
              Owner Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sobur@owner.com"
                className="w-full bg-[#181818] border border-[#C9A45C]/30 px-3.5 py-3 text-[#F5F5F5] pl-10 focus:outline-none focus:border-[#C9A45C]"
              />
              <Mail className="w-4 h-4 text-[#C9A45C] absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block uppercase tracking-wider text-[#A7A7A7] mb-1.5 font-medium">
              Master Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#181818] border border-[#C9A45C]/30 px-3.5 py-3 text-[#F5F5F5] pl-10 focus:outline-none focus:border-[#C9A45C]"
              />
              <Key className="w-4 h-4 text-[#C9A45C] absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 text-xs uppercase tracking-widest font-semibold text-[#080808] bg-[#C9A45C] hover:bg-[#E5C98A] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4 shadow-lg shadow-[#C9A45C]/10"
          >
            <Lock className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Secure Master Sign In'}</span>
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#C9A45C]/20" />
          <span className="text-[10px] uppercase tracking-widest text-[#777]">Or</span>
          <div className="h-px flex-1 bg-[#C9A45C]/20" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 text-xs uppercase tracking-widest font-semibold border border-[#C9A45C]/40 bg-[#181818] text-[#F5F5F5] hover:border-[#C9A45C] hover:text-[#E5C98A] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Shield className="w-4 h-4 text-[#C9A45C]" />
          <span>Sign in with Google (Firebase)</span>
        </button>

        <div className="mt-8 pt-6 border-t border-[#C9A45C]/15 text-[11px] text-[#A7A7A7] text-center space-y-1">
          <p className="text-[#C9A45C] font-semibold">Strict Private Access</p>
          <p>Initial master credentials pre-filled for Sobur Ali Khan.</p>
          <p className="text-[#666]">Password can be changed inside Account Settings.</p>
        </div>
      </div>
    </div>
  );
};
