'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Settings, Users, Code, LogOut, Menu, X } from 'lucide-react';
import { storage, BrandingData, Lead } from '@/lib/storage';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard Overview', exact: true },
  { href: '/dashboard/preview', icon: MessageSquare, label: 'Live Preview' },
  { href: '/dashboard/configure', icon: Settings, label: 'Configure Bot' },
  { href: '/dashboard/leads', icon: Users, label: 'Captured Leads' },
  { href: '/dashboard/embed', icon: Code, label: 'Embed Code' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [branding, setBranding] = useState<BrandingData | null>(null);
  const [newLeadCount, setNewLeadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const auth = storage.getAuth();
    if (!auth) { router.replace('/login'); return; }
    const b = storage.getBranding();
    setBranding(b);
    if (b.primaryColor) document.documentElement.style.setProperty('--brand', b.primaryColor);
    const leads: Lead[] = storage.getLeads();
    setNewLeadCount(leads.filter(l => l.status === 'new').length);
  }, [router]);

  const handleSignOut = () => { storage.clearAuth(); router.push('/login'); };
  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href);
  const firstLetter = branding?.businessName?.charAt(0).toUpperCase() || 'D';

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {branding?.logoDataUrl ? (
            <img src={branding.logoDataUrl} alt="Logo" style={{ height: 40, maxWidth: 80, objectFit: 'contain', borderRadius: 4 }} />
          ) : (
            <div style={{ width: 40, height: 40, background: 'var(--brand)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="font-cinzel" style={{ color: '#0F0F0F', fontSize: 18, fontWeight: 700 }}>{firstLetter}</span>
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <p className="font-cinzel" style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{branding?.businessName || 'Your Business'}</p>
            {branding?.tagline && <p style={{ color: 'var(--muted)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{branding.tagline}</p>}
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {navItems.map(item => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 4, marginBottom: 2, textDecoration: 'none', background: active ? 'var(--brand)' : 'transparent', color: active ? '#0F0F0F' : 'var(--muted)', fontSize: 13, fontWeight: active ? 600 : 400, transition: 'all 150ms ease' }}>
              <Icon size={16} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.href === '/dashboard/leads' && newLeadCount > 0 && (
                <span style={{ background: active ? '#0F0F0F' : 'var(--brand)', color: active ? 'var(--brand)' : '#0F0F0F', borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '1px 6px' }}>{newLeadCount}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div style={{ padding: '12px 10px 20px', borderTop: '1px solid var(--border)' }}>
        <Link href="/settings" onClick={() => setSidebarOpen(false)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 4, marginBottom: 2, textDecoration: 'none', color: pathname === '/settings' ? '#0F0F0F' : 'var(--muted)', background: pathname === '/settings' ? 'var(--brand)' : 'transparent', fontSize: 13, transition: 'all 150ms ease' }}>
          <Settings size={16} /><span>Settings</span>
        </Link>
        <button onClick={handleSignOut}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 4, width: '100%', background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', transition: 'all 150ms ease', textAlign: 'left' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#F87171'; (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.08)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
          <LogOut size={16} /><span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <aside style={{ width: 220, background: '#111111', borderRight: '1px solid #1E1E1E', flexShrink: 0, position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 50, display: 'flex', flexDirection: 'column' }} className="hidden-mobile">
        <SidebarContent />
      </aside>
      <div style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: 56, background: '#111111', borderBottom: '1px solid #1E1E1E', zIndex: 50, alignItems: 'center', padding: '0 16px', gap: 12 }} className="show-mobile">
        <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text)', padding: 4, display: 'flex' }}><Menu size={20} /></button>
        <span className="font-cinzel" style={{ color: 'var(--brand)', fontSize: 14, fontWeight: 600, letterSpacing: '0.15em' }}>DRAGONCHAT AI</span>
      </div>
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.6)' }} onClick={() => setSidebarOpen(false)} />
          <div style={{ width: 260, background: '#111111', height: '100%', position: 'absolute', left: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 12px 0' }}>
              <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', padding: 4, display: 'flex' }}><X size={18} /></button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}
      <main style={{ flex: 1, marginLeft: 220, minHeight: '100vh', overflowY: 'auto', padding: '32px' }} className="dashboard-main">
        {children}
      </main>
      <style>{`@media (max-width: 768px) { .hidden-mobile { display: none !important; } .show-mobile { display: flex !important; } .dashboard-main { margin-left: 0 !important; padding-top: 72px !important; padding-left: 16px !important; padding-right: 16px !important; } }`}</style>
    </div>
  );
}
