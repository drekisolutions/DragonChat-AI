'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, Sparkles, Check } from 'lucide-react';
import { storage, ConfigData, FAQ } from '@/lib/storage';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: '12px 0' }}>
      <div>
        <p style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{label}</p>
        <p style={{ color: 'var(--muted)', fontSize: 12 }}>{desc}</p>
      </div>
      <button onClick={() => onChange(!checked)} style={{ width: 44, height: 24, borderRadius: 999, background: checked ? 'var(--brand)' : 'var(--dim)', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 150ms ease', padding: 0 }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: checked ? 23 : 3, transition: 'left 150ms ease' }} />
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 20, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <p className="font-cinzel" style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em' }}>{title.toUpperCase()}</p>
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 6, letterSpacing: '0.05em' }}>{label.toUpperCase()}</label>
      {children}
    </div>
  );
}

export default function ConfigurePage() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [suggestingFaq, setSuggestingFaq] = useState<string | null>(null);

  useEffect(() => { setConfig(storage.getConfig()); }, []);

  const triggerSave = useCallback((newConfig: ConfigData) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState('saving');
    debounceRef.current = setTimeout(() => {
      storage.setConfig(newConfig);
      setSaveState('saved');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveState('idle'), 2000);
    }, 500);
  }, []);

  const update = useCallback(<K extends keyof ConfigData>(key: K, value: ConfigData[K]) => {
    setConfig(prev => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      triggerSave(next);
      return next;
    });
  }, [triggerSave]);

  const addFaq = () => {
    if (!config || config.faqs.length >= 15) return;
    const newFaq: FAQ = { id: Date.now().toString(), question: '', answer: '' };
    update('faqs', [...config.faqs, newFaq]);
  };

  const updateFaq = (id: string, field: 'question' | 'answer', value: string) => {
    if (!config) return;
    update('faqs', config.faqs.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const deleteFaq = (id: string) => {
    if (!config) return;
    update('faqs', config.faqs.filter(f => f.id !== id));
  };

  const suggestAnswer = async (faqId: string, question: string) => {
    if (!question.trim()) return;
    setSuggestingFaq(faqId);
    try {
      const branding = storage.getBranding();
      const response = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, businessName: branding.businessName }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.answer) updateFaq(faqId, 'answer', data.answer);
      }
    } catch {}
    setSuggestingFaq(null);
  };

  if (!config) return <div style={{ color: 'var(--muted)', padding: 40 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="font-cinzel" style={{ color: 'var(--text)', fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Configure Bot</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Changes are saved automatically.</p>
        </div>
        {saveState !== 'idle' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: saveState === 'saved' ? '#34D399' : 'var(--muted)', fontSize: 12 }}>
            {saveState === 'saved' && <Check size={13} />}
            {saveState === 'saving' ? 'Saving…' : 'Saved'}
          </div>
        )}
      </div>

      <Section title="Bot Identity">
        <FormRow label="Bot Name">
          <input value={config.botName} onChange={e => update('botName', e.target.value)} placeholder="AI Assistant" />
        </FormRow>
        <FormRow label="Chat Bubble Color">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="color" value={config.bubbleColor} onChange={e => update('bubbleColor', e.target.value)} style={{ width: 44, height: 40, padding: 2, cursor: 'pointer', borderRadius: 4, flexShrink: 0 }} />
            <input value={config.bubbleColor} onChange={e => update('bubbleColor', e.target.value)} placeholder="#A07840" style={{ fontFamily: 'monospace' }} />
          </div>
        </FormRow>
        <FormRow label="Greeting Message">
          <input value={config.greeting} onChange={e => update('greeting', e.target.value)} placeholder="Hi there! How can I help you today?" />
        </FormRow>
        <FormRow label="Offline Message">
          <input value={config.offlineMessage} onChange={e => update('offlineMessage', e.target.value)} placeholder="We're currently offline..." />
        </FormRow>
      </Section>

      <Section title="Lead Capture">
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <Toggle checked={config.collectName} onChange={v => update('collectName', v)} label="Collect Visitor Name" desc="Asked after first response" />
          <div style={{ borderTop: '1px solid var(--border)' }} />
          <Toggle checked={config.collectEmail} onChange={v => update('collectEmail', v)} label="Collect Email Address" desc="Asked after first response" />
          <div style={{ borderTop: '1px solid var(--border)' }} />
          <Toggle checked={config.collectPhone} onChange={v => update('collectPhone', v)} label="Collect Phone Number" desc="Asked after first response" />
        </div>
      </Section>

      <Section title={`FAQ Responses (${config.faqs.length}/15)`}>
        {config.faqs.length === 0 && (
          <div style={{ padding: '28px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No FAQs yet. Add your first question below.</div>
        )}
        {config.faqs.map((faq, i) => (
          <div key={faq.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: 16, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ color: 'var(--dim)', fontSize: 11, letterSpacing: '0.05em' }}>FAQ #{i + 1}</span>
              <button onClick={() => deleteFaq(faq.id)} style={{ background: 'none', border: 'none', color: 'var(--dim)', padding: 4, display: 'flex', cursor: 'pointer', borderRadius: 4, transition: 'color 150ms ease' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#F87171')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--dim)')}>
                <Trash2 size={15} />
              </button>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 5, letterSpacing: '0.05em' }}>QUESTION</label>
              <input value={faq.question} onChange={e => updateFaq(faq.id, 'question', e.target.value)} placeholder="e.g. What are your business hours?" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <label style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.05em' }}>ANSWER</label>
                <button onClick={() => suggestAnswer(faq.id, faq.question)} disabled={!faq.question.trim() || suggestingFaq === faq.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, color: faq.question.trim() ? 'var(--brand)' : 'var(--dim)', fontSize: 11, cursor: faq.question.trim() ? 'pointer' : 'not-allowed', opacity: !faq.question.trim() ? 0.4 : 1 }}>
                  {suggestingFaq === faq.id ? <div style={{ width: 10, height: 10, border: '1.5px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : <Sparkles size={11} />}
                  AI Suggest
                </button>
              </div>
              <textarea value={faq.answer} onChange={e => updateFaq(faq.id, 'answer', e.target.value)} placeholder="Provide a clear, helpful answer..." rows={3} style={{ resize: 'vertical' }} />
            </div>
          </div>
        ))}
        {config.faqs.length < 15 && (
          <button onClick={addFaq} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'transparent', border: '1px solid var(--brand)', borderRadius: 4, color: 'var(--brand)', fontSize: 13, cursor: 'pointer', width: '100%', justifyContent: 'center', transition: 'background 150ms ease', marginTop: 4 }}
            onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--brand) 8%, transparent)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <Plus size={15} /> Add FAQ
          </button>
        )}
      </Section>

      <Section title="Business Hours">
        <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 16 }}>Outside hours: bot uses Offline Message</p>
        <div style={{ display: 'grid', gap: 6 }}>
          {DAYS.map(day => {
            const h = config.hours?.[day] || { enabled: false, open: '09:00', close: '17:00' };
            return (
              <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 12px', background: 'var(--surface)', borderRadius: 4, border: '1px solid var(--border)', opacity: h.enabled ? 1 : 0.5 }}>
                <button onClick={() => { const updated = { ...config.hours, [day]: { ...h, enabled: !h.enabled } }; update('hours', updated); }} style={{ width: 36, height: 20, borderRadius: 999, background: h.enabled ? 'var(--brand)' : 'var(--dim)', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 150ms ease', padding: 0 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: h.enabled ? 19 : 3, transition: 'left 150ms ease' }} />
                </button>
                <span style={{ color: 'var(--text)', fontSize: 13, width: 90, flexShrink: 0 }}>{day}</span>
                <input type="time" value={h.open} onChange={e => { const updated = { ...config.hours, [day]: { ...h, open: e.target.value } }; update('hours', updated); }} disabled={!h.enabled} style={{ width: 90, padding: '4px 8px', fontSize: 12, flexShrink: 0 }} />
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>–</span>
                <input type="time" value={h.close} onChange={e => { const updated = { ...config.hours, [day]: { ...h, close: e.target.value } }; update('hours', updated); }} disabled={!h.enabled} style={{ width: 90, padding: '4px 8px', fontSize: 12, flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
