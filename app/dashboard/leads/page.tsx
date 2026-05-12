'use client';

import { useState, useEffect } from 'react';
import { Search, Mail, Users } from 'lucide-react';
import { storage, Lead } from '@/lib/storage';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'Just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

type FilterTab = 'All' | 'New' | 'Contacted' | 'Closed';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<FilterTab>('All');
  const [search, setSearch] = useState('');

  useEffect(() => { setLeads(storage.getLeads()); }, []);

  const updateStatus = (id: string, status: Lead['status']) => {
    const updated = leads.map(l => l.id === id ? { ...l, status } : l);
    setLeads(updated);
    storage.setLeads(updated);
  };

  const filtered = leads.filter(l => {
    const matchFilter = filter === 'All' || (filter === 'New' && l.status === 'new') || (filter === 'Contacted' && l.status === 'contacted') || (filter === 'Closed' && l.status === 'closed');
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = { All: leads.length, New: leads.filter(l => l.status === 'new').length, Contacted: leads.filter(l => l.status === 'contacted').length, Closed: leads.filter(l => l.status === 'closed').length };

  const statusStyle = (status: Lead['status']) => ({
    new: { className: 'badge-new', label: 'New' },
    contacted: { className: 'badge-contacted', label: 'Contacted' },
    closed: { className: 'badge-closed', label: 'Closed' },
  })[status];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="font-cinzel" style={{ color: 'var(--text)', fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Captured Leads</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>{leads.length} total contact{leads.length !== 1 ? 's' : ''} captured via your chatbot.</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: 3, gap: 2 }}>
          {(['All', 'New', 'Contacted', 'Closed'] as FilterTab[]).map(tab => (
            <button key={tab} onClick={() => setFilter(tab)} style={{ padding: '6px 12px', borderRadius: 3, border: 'none', background: filter === tab ? 'var(--card)' : 'transparent', color: filter === tab ? 'var(--text)' : 'var(--muted)', fontSize: 12, fontWeight: filter === tab ? 600 : 400, cursor: 'pointer', transition: 'all 150ms ease', display: 'flex', alignItems: 'center', gap: 5 }}>
              {tab}
              <span style={{ background: filter === tab ? 'var(--border)' : 'transparent', borderRadius: 999, padding: '0px 5px', fontSize: 10, color: filter === tab ? 'var(--text)' : 'var(--dim)' }}>{counts[tab]}</span>
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 300 }}>
          <Search size={14} color="var(--muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." style={{ paddingLeft: 32, fontSize: 13 }} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6 }}>
          <Users size={36} color="var(--dim)" style={{ margin: '0 auto 14px' }} />
          <p style={{ color: 'var(--text)', fontSize: 15, fontWeight: 500, marginBottom: 6 }}>No leads yet</p>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Once visitors interact with your chatbot, leads will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(lead => {
            const sc = statusStyle(lead.status);
            return (
              <div key={lead.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--brand)', fontWeight: 700, fontSize: 15, fontFamily: "'Cinzel', serif" }}>
                  {lead.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: 14 }}>{lead.name}</span>
                    <span className={sc.className} style={{ padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>{sc.label}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }}>{lead.source}</span>
                  </div>
                  <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>{lead.email} · {lead.phone}</p>
                  <p style={{ color: 'var(--text)', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 420 }}>{lead.message}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                  <span style={{ color: 'var(--dim)', fontSize: 11 }}>{timeAgo(lead.createdAt)}</span>
                  <select value={lead.status} onChange={e => updateStatus(lead.id, e.target.value as Lead['status'])} style={{ padding: '5px 8px', fontSize: 12, width: 'auto', cursor: 'pointer' }}>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
                  </select>
                  <a href={`mailto:${lead.email}?subject=Re: ${encodeURIComponent(lead.message.substring(0, 40))}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)', fontSize: 12, textDecoration: 'none', transition: 'border-color 150ms ease' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brand)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                    <Mail size={12} /> Send Email
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
