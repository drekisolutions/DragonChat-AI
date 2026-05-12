'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Send, X, ArrowRight } from 'lucide-react';
import { storage, ConfigData, BrandingData } from '@/lib/storage';

interface Message {
  id: string;
  role: 'bot' | 'user';
  content: string;
}

export default function PreviewPage() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [branding, setBranding] = useState<BrandingData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = storage.getConfig();
    const b = storage.getBranding();
    setConfig(c);
    setBranding(b);
    setMessages([{ id: 'greeting', role: 'bot', content: c.greeting || 'Hi there! How can I help you today?' }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping || !config) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          botName: config.botName,
          businessName: branding?.businessName,
          faqs: config.faqs,
        }),
      });

      const data = await response.json();
      const botReply = data.reply || "I'm here to help! Could you clarify your question?";

      setIsTyping(false);
      setMessages(prev => [...prev, { id: `bot-${Date.now()}`, role: 'bot', content: botReply }]);

      storage.addConversation({
        id: Date.now().toString(),
        messages: [
          { role: 'user', content: text.trim(), timestamp: new Date().toISOString() },
          { role: 'bot', content: botReply, timestamp: new Date().toISOString() },
        ],
        createdAt: new Date().toISOString(),
      });
    } catch {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: `bot-${Date.now()}`,
        role: 'bot',
        content: "I'm having trouble connecting. Please try again or contact us directly.",
      }]);
    }
  };

  const bubbleColor = config?.bubbleColor || '#A07840';

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 className="font-cinzel" style={{ color: 'var(--text)', fontSize: 22, fontWeight: 600, marginBottom: 4 }}>
          Live Preview
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          Test how your chatbot will appear and respond to visitors.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Chat widget */}
        <div style={{
          width: 360,
          flexShrink: 0,
          background: '#0A0A0A',
          border: '1px solid var(--border)',
          borderRadius: 8,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{ background: bubbleColor, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: "'Cinzel', serif" }}>
                {(config?.botName || 'A').charAt(0).toUpperCase()}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>{config?.botName || 'AI Assistant'}</p>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>Online · Powered by AI</p>
            </div>
            <X size={18} color="rgba(255,255,255,0.7)" style={{ cursor: 'default' }} />
          </div>

          {/* Messages */}
          <div style={{ flex: 1, minHeight: 300, maxHeight: 380, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '78%',
                  padding: '9px 13px',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: msg.role === 'user' ? bubbleColor : '#1E1E1E',
                  color: '#F0EDE8',
                  fontSize: 13,
                  lineHeight: 1.5,
                  border: msg.role === 'bot' ? '1px solid #272727' : 'none',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 16px', borderRadius: '12px 12px 12px 2px', background: '#1E1E1E', border: '1px solid #272727', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} className="typing-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#7A7A7A' }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ borderTop: '1px solid #272727', padding: 12, display: 'flex', gap: 8, background: '#161616' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder="Type a message..."
              style={{ flex: 1, fontSize: 13, padding: '8px 12px' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              style={{ width: 36, height: 36, background: bubbleColor, border: 'none', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: !input.trim() || isTyping ? 0.5 : 1, cursor: !input.trim() || isTyping ? 'not-allowed' : 'pointer' }}
            >
              <Send size={16} color="#fff" />
            </button>
          </div>

          {/* FAQ chips */}
          {(config?.faqs?.length || 0) > 0 && (
            <div style={{ padding: '10px 12px', borderTop: '1px solid #272727', background: '#0A0A0A' }}>
              <p style={{ color: '#4A4A4A', fontSize: 11, marginBottom: 8 }}>Try asking:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {config!.faqs.slice(0, 3).map(faq => (
                  <button
                    key={faq.id}
                    onClick={() => sendMessage(faq.question)}
                    style={{ padding: '5px 10px', background: '#161616', border: '1px solid #272727', borderRadius: 999, color: '#F0EDE8', fontSize: 11, cursor: 'pointer', transition: 'border-color 150ms ease' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = bubbleColor)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#272727')}
                  >
                    {faq.question.length > 38 ? faq.question.substring(0, 38) + '…' : faq.question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div style={{ flex: 1, minWidth: 240 }}>
          {/* Live status */}
          <div style={{ background: '#1E1E1E', border: '1px solid #272727', borderRadius: 6, padding: '18px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="pulse-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: '#34D399', flexShrink: 0 }} />
            <div>
              <p style={{ color: '#F0EDE8', fontWeight: 600, fontSize: 14 }}>Bot is LIVE</p>
              <p style={{ color: '#7A7A7A', fontSize: 12 }}>Your chatbot is active and ready</p>
            </div>
          </div>

          {/* Config summary */}
          <div style={{ background: '#1E1E1E', border: '1px solid #272727', borderRadius: 6, padding: '18px 20px', marginBottom: 16 }}>
            <p className="font-cinzel" style={{ color: '#F0EDE8', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', marginBottom: 16 }}>
              CURRENT CONFIG
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ConfigRow label="Bot Name" value={config?.botName || 'AI Assistant'} />
              <ConfigRow
                label="Greeting"
                value={config?.greeting ? (config.greeting.length > 55 ? config.greeting.substring(0, 55) + '…' : config.greeting) : '—'}
              />
              <ConfigRow label="FAQs Configured" value={`${config?.faqs?.length || 0} responses`} />
              <div>
                <p style={{ color: '#7A7A7A', fontSize: 11, marginBottom: 8 }}>Lead Capture</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    { label: 'Name', enabled: config?.collectName },
                    { label: 'Email', enabled: config?.collectEmail },
                    { label: 'Phone', enabled: config?.collectPhone },
                  ].map(item => (
                    <span key={item.label} style={{
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      background: item.enabled ? 'rgba(160,120,64,0.15)' : '#161616',
                      color: item.enabled ? bubbleColor : '#7A7A7A',
                      border: `1px solid ${item.enabled ? 'rgba(160,120,64,0.3)' : '#272727'}`,
                    }}>
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard/configure"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'transparent', border: '1px solid #272727', borderRadius: 6, textDecoration: 'none', color: 'var(--brand)', fontSize: 13, fontWeight: 600, transition: 'border-color 150ms ease' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brand)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#272727')}
          >
            Edit Configuration
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ color: '#7A7A7A', fontSize: 11, marginBottom: 2 }}>{label}</p>
      <p style={{ color: '#F0EDE8', fontSize: 13 }}>{value}</p>
    </div>
  );
}
