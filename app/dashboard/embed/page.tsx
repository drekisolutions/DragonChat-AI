'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { storage, ConfigData } from '@/lib/storage';

const PLATFORMS = [
  { name: 'WordPress', steps: 'Go to Appearance → Theme Editor → footer.php and paste before the closing </body> tag.' },
  { name: 'Wix', steps: 'Go to Settings → Custom Code → Add Code to Pages. Set location to "Body — end".' },
  { name: 'Squarespace', steps: 'Go to Settings → Advanced → Code Injection and paste into the Footer section.' },
  { name: 'Webflow', steps: 'Go to Project Settings → Custom Code → Footer Code section.' },
  { name: 'Other Platform', steps: 'Contact us at info@drekisolutions.com for free installation help.' },
];

const INSTALL_STEPS = [
  'Copy the code snippet above',
  "Open your website's HTML editor or CMS",
  'Paste before the </body> closing tag',
  'Save and refresh your page',
  'The chat bubble will appear in the bottom-right corner',
];

export default function EmbedPage() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [copied, setCopied] = useState(false);
  const [openPlatform, setOpenPlatform] = useState<string | null>(null);

  useEffect(() => { setConfig(storage.getConfig()); }, []);

  const embedCode = config
    ? `<!-- DragonChat AI by Dreki Solutions -->\n<script\n  src="https://app.dreki-solutions.com/dragonchat.js"\n  data-key="YOUR_API_KEY"\n  data-color="${config.bubbleColor || '#A07840'}"\n  data-bot-name="${config.botName || 'AI Assistant'}"\n  data-greeting="${config.greeting || 'Hi there! How can I help you today?'}"\n></script>`
    : '';

  const handleCopy = async () => {
    if (!embedCode) return;
    try {
      await navigator.clipboard.writeText(embedCode);
    } catch {
      const el = document.createElement('textarea');
      el.value = embedCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="font-cinzel" style={{ color: 'var(--text)', fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Embed Code</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          Add DragonChat to Your Website — paste this snippet before the{' '}
          <code style={{ fontFamily: 'monospace', color: 'var(--brand)', fontSize: 12 }}>&lt;/body&gt;</code>{' '}tag. It takes 30 seconds.
        </p>
      </div>

      {/* Code block */}
      <div style={{ background: '#0A0A0A', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#F87171', '#FBBF24', '#34D399'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />)}
          </div>
          <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, color: copied ? '#34D399' : 'var(--text)', fontSize: 12, cursor: 'pointer', transition: 'all 150ms ease' }}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
        <pre style={{ padding: 20, overflowX: 'auto', margin: 0, fontFamily: 'monospace', fontSize: 13, color: 'var(--brand)', lineHeight: 1.6 }}>{embedCode}</pre>
      </div>

      <div style={{ padding: '12px 16px', background: 'color-mix(in srgb, var(--brand) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--brand) 25%, transparent)', borderRadius: 4, marginBottom: 28 }}>
        <p style={{ color: 'var(--text)', fontSize: 13 }}>
          <span style={{ color: 'var(--brand)', fontWeight: 600 }}>Note:</span>{' '}Replace{' '}
          <code style={{ fontFamily: 'monospace', color: 'var(--brand)' }}>YOUR_API_KEY</code>{' '}with your key from your Dreki account.
        </p>
      </div>

      {/* Install steps */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <p className="font-cinzel" style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em' }}>INSTALLATION STEPS</p>
        </div>
        <div style={{ padding: 20 }}>
          {INSTALL_STEPS.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: i < INSTALL_STEPS.length - 1 ? 14 : 0 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--brand)', fontSize: 12, fontWeight: 700, fontFamily: "'Cinzel', serif" }}>{i + 1}</div>
              <p style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.5, paddingTop: 3 }}>
                {step.includes('</body>') ? <>{step.split('</body>')[0]}<code style={{ fontFamily: 'monospace', color: 'var(--brand)', fontSize: 12 }}>&lt;/body&gt;</code>{step.split('</body>')[1]}</> : step}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Platform guides */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <p className="font-cinzel" style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em' }}>PLATFORM GUIDES</p>
        </div>
        {PLATFORMS.map((platform, i) => {
          const isOpen = openPlatform === platform.name;
          return (
            <div key={platform.name}>
              {i > 0 && <div style={{ borderTop: '1px solid var(--border)' }} />}
              <button onClick={() => setOpenPlatform(isOpen ? null : platform.name)} style={{ width: '100%', padding: '14px 20px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: 'var(--text)', fontSize: 14, fontWeight: 500, transition: 'background 150ms ease', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                {platform.name}
                {isOpen ? <ChevronUp size={16} color="var(--muted)" /> : <ChevronDown size={16} color="var(--muted)" />}
              </button>
              {isOpen && (
                <div style={{ padding: '0 20px 16px', color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>
                  {platform.steps.includes('info@drekisolutions.com') ? <>Contact us at <a href="mailto:info@drekisolutions.com" style={{ color: 'var(--brand)', textDecoration: 'none' }}>info@drekisolutions.com</a> for free installation help.</> : platform.steps}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div style={{ padding: 20, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, textAlign: 'center' }}>
        <p style={{ color: 'var(--text)', fontSize: 14, marginBottom: 6 }}>Need help installing?</p>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>We offer free white-glove installation for all subscribers.</p>
        <a href="mailto:info@drekisolutions.com?subject=DragonChat Installation Help"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: 'var(--brand)', color: '#0F0F0F', borderRadius: 4, fontSize: 13, fontWeight: 600, textDecoration: 'none', fontFamily: "'Cinzel', serif", letterSpacing: '0.05em' }}>
          Get Free Installation Help
        </a>
      </div>
    </div>
  );
}
