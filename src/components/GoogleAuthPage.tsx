import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const GoogleAuthPage: React.FC = () => {
  const { loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Email/Password form state
  const [mode, setMode] = useState<'google' | 'email_login' | 'email_signup'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleGoogleSignIn = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      console.error('Google Sign-In Error:', err);
      const message =
        err instanceof Error
          ? err.message.includes('popup-closed-by-user')
            ? 'Sign-in window closed. Please try again.'
            : err.message.includes('cancelled-popup-request')
            ? 'Another sign-in request is in progress.'
            : err.message
          : 'Failed to authenticate with Google.';
      setAuthError(message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      if (mode === 'email_signup') {
        if (!displayName.trim()) {
          throw new Error('Please enter your full name');
        }
        await signupWithEmail(email, password, displayName);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: unknown) {
      console.error('Email Auth Error:', err);
      const message =
        err instanceof Error
          ? err.message.includes('user-not-found') || err.message.includes('wrong-password') || err.message.includes('invalid-credential')
            ? 'Invalid email or password.'
            : err.message.includes('email-already-in-use')
            ? 'This email is already registered. Please sign in.'
            : err.message.includes('weak-password')
            ? 'Password must be at least 6 characters.'
            : err.message
          : 'Authentication failed.';
      setAuthError(message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between items-center px-4 py-8 select-none relative overflow-hidden">
      {/* Subtle top ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[340px] bg-gradient-to-b from-neutral-800/10 via-transparent to-transparent pointer-events-none blur-3xl" />

      {/* Top Brand Bar */}
      <header className="w-full max-w-[440px] flex items-center justify-between pt-2 z-10">
        <div className="flex flex-col">
          <span className="text-xl font-light tracking-[0.35em] text-white uppercase font-sans">
            FLUID
          </span>
          <span className="text-[9px] tracking-[0.22em] uppercase text-neutral-500 font-mono">
            BY ECHO INTELLIGENCE
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>REAL AUTH SECURED</span>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="w-full max-w-[420px] flex flex-col items-center text-center my-auto py-8 space-y-6 z-10">
        {/* Brand Headline */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-white leading-tight">
            Visual culture. <br />
            <span className="font-normal text-neutral-400">Purely authentic.</span>
          </h1>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
            Zero fake profiles. Real creators, real posts, and real-time social intelligence from ECHO.
          </p>
        </div>

        {/* Error Notification if any */}
        {authError && (
          <div className="w-full flex items-center gap-2 p-3 text-left rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-200 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="flex-1">{authError}</span>
          </div>
        )}

        {/* Google Primary Sign In */}
        <div className="w-full space-y-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            className="w-full h-12 bg-white hover:bg-neutral-100 text-black font-semibold text-sm rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-white/5 cursor-pointer disabled:opacity-70"
          >
            {isAuthenticating && mode === 'google' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Authorizing with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4 ml-1 opacity-75" />
              </>
            )}
          </button>

          <div className="flex items-center my-4 text-xs text-neutral-600">
            <div className="flex-1 border-t border-neutral-800" />
            <span className="px-3 uppercase tracking-widest text-[10px] font-mono">OR EMAIL</span>
            <div className="flex-1 border-t border-neutral-800" />
          </div>

          {/* Email / Password Option */}
          {mode === 'google' ? (
            <button
              type="button"
              onClick={() => setMode('email_login')}
              className="w-full h-11 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white font-medium text-xs rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-neutral-400" />
              <span>Sign In with Email / Password</span>
            </button>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-3 text-left">
              {mode === 'email_signup' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your Name"
                      required
                      className="w-full bg-[#141416] border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-4 h-4 text-neutral-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    required
                    className="w-full bg-[#141416] border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-neutral-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-[#141416] border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full h-11 bg-white text-black font-semibold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-100 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer mt-1"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{mode === 'email_signup' ? 'Create Account' : 'Sign In with Email'}</span>
                )}
              </button>

              <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-500">
                <button
                  type="button"
                  onClick={() => setMode(mode === 'email_signup' ? 'email_login' : 'email_signup')}
                  className="hover:text-white transition-colors underline cursor-pointer"
                >
                  {mode === 'email_signup'
                    ? 'Already registered? Sign in'
                    : 'Need an account? Sign up'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('google')}
                  className="hover:text-neutral-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500 pt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
            <span>Strict Zero-Fake User Architecture · Firebase Native</span>
          </div>
        </div>
      </main>

      {/* Meta-Style Bottom Footer */}
      <footer className="w-full max-w-[440px] pt-4 pb-2 border-t border-neutral-900 flex flex-col items-center gap-1 select-none z-10">
        <span className="text-[9px] tracking-[0.25em] uppercase text-neutral-500 font-mono">
          FROM
        </span>
        <span className="text-xs font-semibold tracking-[0.16em] text-neutral-200 uppercase">
          ECHO INTELLIGENCE
        </span>
        <span className="text-[10px] text-neutral-600 mt-0.5">
          Fluid v2.5 · All rights reserved
        </span>
      </footer>
    </div>
  );
};
