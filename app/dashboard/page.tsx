'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Settings, Users, Code, ArrowRight, Zap } from 'lucide-react';
import { storage, BrandingData, ConfigData, Lead, Conversation } from '@/lib/storage';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const quickActions = [
  { href: '/dashboard/preview', icon: MessageSquare, title: 'Preview Your Chatbot', desc: 'Test how visitors will experience your AI assistant' },
  { href: '/dashboard/configure', icon: Settings, title: 'Configure Bot Settings', desc: 'Customize personality, FAQs, and lead capture' },
  { href: '/dashboard/leads', icon: Users, title: 'View Captured Leads', desc: 'Review and manage visitors who reached out' },
  { href: '/dashboard/embed', icon: Code, title: 'Get Embed Code', desc: 'Add the chat widget to your website in seconds' },
];

export default function DashboardPage() {
  const [branding, setBranding] = useState<BrandingData | null>(null);
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [newLeads, setNewLeads] = useState(0);
  const [todayConvos, setTodayConvos] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    setBranding(storage.getBranding());
    setConfig(storage.getConfig());
    const leads: Lead[] = storage.getLeads();
    setNewLeads(leads.filter(l => l.status === 'new').length);
    const convos: Conversation[] = storage.getConversations();
    const today = new Date().toDateString();
    setTodayConvos(convos.filter(c => new Date(c.createdAt).toDateString() === today).length);
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className="font-cinzel" style={{ color: 'var(--text)', fontSize: 22, fontWeight: 600, marginBottom: 6 }}>
          {getGreeting()}, {branding?.businessName || 'there'}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Here's what's happening with your chatbot today.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 36, flexWrap: 'wrap' }}>
        {[
          { label: 'New Leads', value: newLeads, accent: true },
          { label: 'Conversations Today', value: todayConvos, accent: false },
          { label: 'FAQ Responses', value: config?.faqs?.length || 0, accent: false },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '22px 24px', flex: 1, minWidth: 140 }}>
            <p style={{ color: 'var(--muted)', fontSize: 12, letterSpacing: '0.05em', marginBottom: 10 }}>{stat.label.toUpperCase()}</p>
            <p style={{ fontSize: 36, fontWeight: 700, color: stat.accent ? 'var(--brand)' : 'var(--text)', lineHeight: 1, fontFamily: "'Cinzel', serif" }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Zap size={14} color="var(--brand)" />
          <p className="font-cinzel" style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em' }}>QUICK ACTIONS</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {quickActions.map(action => {
            const Icon = action.icon;
            const hovered = hoveredCard === action.href;
            return (
              <Link key={action.href} href={action.href}
                onMouseEnter={() => setHoveredCard(action.href)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{ display: 'block', textDecoration: 'none', background: 'var(--card)', border: `1px solid ${hovered ? 'var(--brand)' : 'var(--border)'}`, borderRadius: 6, padding: 20, transition: 'all 200ms ease', transform: hovered ? 'translateY(-2px)' : 'translateY(0)' }}>
                <div style={{ width: 36, height: 36, background: hovered ? 'color-mix(in srgb, var(--brand) 15%, transparent)' : 'var(--surface)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, transition: 'background 150ms ease' }}>
                  <Icon size={18} color={hovered ? 'var(--brand)' : 'var(--muted)'} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <p style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{action.title}</p>
                    <p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.5 }}>{action.desc}</p>
                  </div>
                  <ArrowRight size={16} color={hovered ? 'var(--brand)' : 'var(--dim)'} style={{ flexShrink: 0, marginTop: 2, transition: 'all 150ms ease', transform: hovered ? 'translateX(2px)' : 'translateX(0)' }} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
