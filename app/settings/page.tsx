'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, Upload, Check, LogOut, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { storage, BrandingData, applyBrandColor } from '@/lib/storage';

const PRESET_COLORS = [
  '#A07840', '#2563EB', '#7C3AED', '#DC2626',
  '#059669', '#D97706', '#0891B2', '#BE185D',
];

export default function SettingsPage() {
  const router = useRouter();
  const [branding, setBranding] = useState<BrandingData>({ businessName: '', primaryColor: '#A07840', logoDataUrl: '', tagline: '' });
  const [auth, setAuth] = useState<{ email: string; createdAt: string } | null>(null);
  const [customHex, setCustomHex] = useState('#A07840');
  const [saved, setSaved] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const b = storage.getBranding();
    setBranding(b);
    setCustomHex(b.primaryColor || '#A07840');
    const a = storage.getAuth();
    if (a) setAuth(a);
  }, []);

  const handleColorChange = (color: string) => {
    setBranding(prev => ({ ...prev, primaryColor: color }));
    setCustomHex(color);
    applyBrandColor(color);
  };

  const handleHexInput = (val: string) => {
    setCustomHex(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setBranding(prev => ({ ...prev, primaryColor: val }));
      applyBrandColor(val);
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setBranding(prev => ({ ...prev, logoDataUrl: e.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, []);

  const handleSave = () => {
    storage.setBranding(branding);
    const authData = storage.getAuth();
    if (authData) storage.setAuth({ ...authData, businessName: branding.businessName });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const defaults: BrandingData = { businessName: '', primaryColor: '#A07840', logoDataUrl: '', tagline: '' };
    setBranding(defaults);
    setCustomHex('#A07840');
    applyBrandColor('#A07840');
    if (typeof window !== 'undefined') localStorage.removeItem('dc_branding');
  };

  const handleSignOut = () => { storage.clearAuth(); router.push('/login'); };

  return (
    <div>
      <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--muted)', textDecoration: 'none', fontSize: 13, marginBottom: 24, transition: 'color 150ms ease' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}>
        <ChevronLeft size={16} />Back to Dashboard
      </Link>

      <div style={{ marginBottom: 28 }}>
        <h1 className="font-cinzel" style={{ color: 'var(--text)', fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Settings</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Manage your account and brand settings.</p>
      </div>

      <div style={{ maxWidth: 640 }}>
        <Section title="Account">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <InfoRow label="Email" value={auth?.email || '—'} />
            <InfoRow label="Member Since" value={auth?.createdAt ? new Date(auth.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'} />
          </div>
        </Section>

        <Section title="Brand Settings">
          <FormRow label="Business Name">
            <input value={branding.businessName} onChange={e => setBranding(prev => ({ ...prev, businessName: e.target.value }))} placeholder="Your Business Name" />
          </FormRow>
          <FormRow label="Tagline">
            <input value={branding.tagline} onChange={e => setBranding(prev => ({ ...prev, tagline: e.target.value }))} placeholder="Your tagline (optional)" />
          </FormRow>
          <FormRow label="Brand Color">
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
                {PRESET_COLORS.map(color => (
                  <button key={color} onClick={() => handleColorChange(color)} style={{ height: 36, borderRadius: 4, background: color, border: branding.primaryColor === color ? '2px solid var(--text)' : '2px solid transparent', cursor: 'pointer', position: 'relative', transition: 'transform 150ms ease', transform: branding.primaryColor === color ? 'scale(1.05)' : 'scale(1)' }}>
                    {branding.primaryColor === color && <Check size={13} color="#fff" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="color" value={branding.primaryColor} onChange={e => handleColorChange(e.target.value)} style={{ width: 44, height: 40, padding: 2, cursor: 'pointer', borderRadius: 4, flexShrink: 0 }} />
                <input value={customHex} onChange={e => handleHexInput(e.target.value)} placeholder="#A07840" style={{ fontFamily: 'monospace' }} />
              </div>
            </div>
          </FormRow>
          <FormRow label="Logo">
            {branding.logoDataUrl ? (
              <div style={{ border: '1px solid var(--border)', borderRadius: 4, padding: 16, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
                <img src={branding.logoDataUrl} alt="Logo preview" style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain' }} />
                <button onClick={() => setBranding(prev => ({ ...prev, logoDataUrl: '' }))} style={{ position: 'absolute', top: 6, right: 6, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', cursor: 'pointer' }}>
                  <X size={11} />
                </button>
              </div>
            ) : (
              <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => document.getElementById('settings-logo')?.click()} style={{ border: `2px dashed ${dragOver ? 'var(--brand)' : 'var(--border)'}`, borderRadius: 4, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', background: dragOver ? 'color-mix(in srgb, var(--brand) 5%, transparent)' : 'var(--surface)', transition: 'all 150ms ease' }}>
                <Upload size={20} color="var(--muted)" />
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>Click or drag to upload logo</p>
                <input id="settings-logo" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
              </div>
            )}
          </FormRow>
        </Section>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <button onClick={handleSave} style={{ padding: '11px 24px', background: 'var(--brand)', color: '#0F0F0F', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Cinzel', serif", letterSpacing: '0.05em' }}>
            {saved ? <><Check size={14} />SAVED</> : 'SAVE CHANGES'}
          </button>
          <button onClick={handleReset} style={{ padding: '11px 20px', background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, cursor: 'pointer', transition: 'all 150ms ease' }}
            onMouseEnter={e => { (e.currentTarget.style.borderColor = 'var(--dim)'); (e.currentTarget.style.color = 'var(--text)'); }}
            onMouseLeave={e => { (e.currentTarget.style.borderColor = 'var(--border)'); (e.currentTarget.style.color = 'var(--muted)'); }}>
            Reset to Defaults
          </button>
        </div>

        <Section title="Danger Zone">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500, marginBottom: 2 }}>Sign Out</p>
              <p style={{ color: 'var(--muted)', fontSize: 12 }}>You will be redirected to the login page.</p>
            </div>
            <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 4, color: '#F87171', fontSize: 13, cursor: 'pointer', transition: 'all 150ms ease' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}>
              <LogOut size={14} />Sign Out
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 20, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <p className="font-cinzel" style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em' }}>{title.toUpperCase()}</p>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 6, letterSpacing: '0.05em' }}>{label.toUpperCase()}</label>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ color: 'var(--muted)', fontSize: 12, width: 100, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--text)', fontSize: 13 }}>{value}</span>
    </div>
  );
}
