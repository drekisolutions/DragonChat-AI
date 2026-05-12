'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { storage } from '@/lib/storage';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Email is required'); return; }
    if (!password.trim()) { setError('Password is required'); return; }
    if (!email.includes('@')) { setError('Enter a valid email address'); return; }

    setLoading(true);
    setTimeout(() => {
      const name = email.split('@')[0];
      const businessName = name.charAt(0).toUpperCase() + name.slice(1);
      storage.setAuth({ email: email.trim(), businessName, createdAt: new Date().toISOString() });
      if (!storage.isBrandingSet()) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    }, 600);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div className="hex-pattern" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(160,120,64,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400, margin: '0 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '40px 36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: 'color-mix(in srgb, var(--brand) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--brand) 40%, transparent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L20 7V12C20 16.4 17 20.5 12 22C7 20.5 4 16.4 4 12V7L12 2Z" stroke="var(--brand)" strokeWidth="1.5" fill="none"/>
              <path d="M9 12l2 2 4-4" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="font-cinzel" style={{ color: 'var(--brand)', fontSize: 20, fontWeight: 600, letterSpacing: '0.25em', marginBottom: 6 }}>DRAGONCHAT AI</h1>
          <p style={{ color: 'var(--muted)', fontSize: 12, letterSpacing: '0.05em' }}>by Dreki Solutions</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6, letterSpacing: '0.05em' }}>EMAIL ADDRESS</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@business.com" autoComplete="email" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6, letterSpacing: '0.05em' }}>PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', padding: 0, display: 'flex', alignItems: 'center' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: 16, padding: '10px 12px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: 4, color: '#F87171', fontSize: 13 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, background: loading ? 'var(--dim)' : 'var(--brand)', color: '#0F0F0F', border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600, letterSpacing: '0.05em', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Cinzel', serif" }}>
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: 12 }}>
            Need access?{' '}
            <a href="mailto:info@drekisolutions.com" style={{ color: 'var(--brand)', textDecoration: 'none' }}>Contact info@drekisolutions.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
