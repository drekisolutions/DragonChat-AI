'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Upload, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { storage, applyBrandColor } from '@/lib/storage';

const PRESET_COLORS = [
  '#A07840', '#2563EB', '#7C3AED', '#DC2626',
  '#059669', '#D97706', '#0891B2', '#BE185D',
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [tagline, setTagline] = useState('');
  const [selectedColor, setSelectedColor] = useState('#A07840');
  const [customHex, setCustomHex] = useState('#A07840');
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setCustomHex(color);
    applyBrandColor(color);
  };

  const handleHexInput = (val: string) => {
    setCustomHex(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setSelectedColor(val);
      applyBrandColor(val);
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setLogoDataUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, []);

  const goNext = () => {
    if (step === 1) {
      if (!businessName.trim()) { setErrors({ businessName: 'Business name is required' }); return; }
      setErrors({});
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleLaunch = () => {
    storage.setBranding({ businessName: businessName.trim(), primaryColor: selectedColor, logoDataUrl, tagline: tagline.trim() });
    const auth = storage.getAuth();
    if (auth) storage.setAuth({ ...auth, businessName: businessName.trim() });
    router.push('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 className="font-cinzel" style={{ color: 'var(--brand)', fontSize: 18, fontWeight: 600, letterSpacing: '0.2em', marginBottom: 4 }}>DRAGONCHAT AI</h1>
        <p style={{ color: 'var(--muted)', fontSize: 12 }}>Setup Wizard</p>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40, width: '100%', maxWidth: 400 }}>
        {[1, 2, 3].map((s, i) => (
          <div key={s} style={{ display: 'contents' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: s <= step ? 'var(--brand)' : 'var(--surface)', border: `1px solid ${s <= step ? 'var(--brand)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 300ms ease' }}>
              {s < step ? <Check size={14} color="#0F0F0F" /> : <span style={{ fontSize: 12, fontWeight: 600, color: s <= step ? '#0F0F0F' : 'var(--muted)' }}>{s}</span>}
            </div>
            {i < 2 && <div style={{ flex: 1, height: 1, background: s < step ? 'var(--brand)' : 'var(--border)', transition: 'background 300ms ease' }} />}
          </div>
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: 480, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '36px 32px' }}>
        {/* Step 1 */}
        {step === 1 && (
          <div>
            <h2 className="font-cinzel" style={{ color: 'var(--text)', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Business Information</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 28 }}>Tell us about your business so we can personalize your chatbot.</p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6, letterSpacing: '0.05em' }}>BUSINESS NAME <span style={{ color: 'var(--brand)' }}>*</span></label>
              <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Hartwell HVAC Services" onKeyDown={e => e.key === 'Enter' && goNext()} />
              {errors.businessName && <p style={{ color: '#F87171', fontSize: 12, marginTop: 4 }}>{errors.businessName}</p>}
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6, letterSpacing: '0.05em' }}>TAGLINE <span style={{ color: 'var(--dim)' }}>(optional)</span></label>
              <input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="e.g. Keeping you comfortable year-round" />
            </div>
            <button onClick={goNext} style={{ width: '100%', padding: 12, background: 'var(--brand)', color: '#0F0F0F', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'Cinzel', serif" }}>
              CONTINUE <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <h2 className="font-cinzel" style={{ color: 'var(--text)', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Brand Color</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 28 }}>Choose a primary color that matches your brand identity.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
              {PRESET_COLORS.map(color => (
                <button key={color} onClick={() => handleColorChange(color)} style={{ height: 40, borderRadius: 4, background: color, border: selectedColor === color ? '2px solid var(--text)' : '2px solid transparent', cursor: 'pointer', transition: 'transform 150ms ease', transform: selectedColor === color ? 'scale(1.05)' : 'scale(1)', position: 'relative' }}>
                  {selectedColor === color && <Check size={14} color="#fff" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center' }}>
              <input type="color" value={selectedColor} onChange={e => handleColorChange(e.target.value)} style={{ width: 44, height: 44, padding: 2, cursor: 'pointer', borderRadius: 4, flexShrink: 0 }} />
              <input value={customHex} onChange={e => handleHexInput(e.target.value)} placeholder="#A07840" style={{ fontFamily: 'monospace', flex: 1 }} />
            </div>
            <div style={{ padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, marginBottom: 28 }}>
              <p style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 10, letterSpacing: '0.05em' }}>PREVIEW</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{ padding: '8px 16px', background: selectedColor, color: '#0F0F0F', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'default' }}>Get a Quote</button>
                <button style={{ padding: '8px 16px', background: 'transparent', color: selectedColor, border: `1px solid ${selectedColor}`, borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'default' }}>Learn More</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ padding: '12px 20px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ChevronLeft size={16} /> Back
              </button>
              <button onClick={goNext} style={{ flex: 1, padding: 12, background: 'var(--brand)', color: '#0F0F0F', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'Cinzel', serif" }}>
                CONTINUE <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div>
            <h2 className="font-cinzel" style={{ color: 'var(--text)', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Logo Upload</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 28 }}>Upload your business logo to display in the chat widget. (Optional)</p>
            {logoDataUrl ? (
              <div style={{ border: '1px solid var(--border)', borderRadius: 4, padding: 20, marginBottom: 24, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
                <img src={logoDataUrl} alt="Logo preview" style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain' }} />
                <button onClick={() => setLogoDataUrl('')} style={{ position: 'absolute', top: 8, right: 8, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', cursor: 'pointer' }}>
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => document.getElementById('logo-input')?.click()} style={{ border: `2px dashed ${dragOver ? 'var(--brand)' : 'var(--border)'}`, borderRadius: 4, padding: '36px 20px', marginBottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer', background: dragOver ? 'color-mix(in srgb, var(--brand) 5%, transparent)' : 'var(--surface)', transition: 'all 150ms ease' }}>
                <Upload size={24} color="var(--muted)" />
                <p style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500 }}>Drag & drop or click to upload</p>
                <p style={{ color: 'var(--muted)', fontSize: 12 }}>PNG, JPG, SVG up to 2MB</p>
                <input id="logo-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(2)} style={{ padding: '12px 20px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ChevronLeft size={16} /> Back
              </button>
              <button onClick={handleLaunch} style={{ flex: 1, padding: 12, background: 'var(--brand)', color: '#0F0F0F', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', fontFamily: "'Cinzel', serif" }}>
                LAUNCH DASHBOARD
              </button>
            </div>
          </div>
        )}
      </div>
      <p style={{ color: 'var(--dim)', fontSize: 12, marginTop: 24 }}>Step {step} of 3</p>
    </div>
  );
}
