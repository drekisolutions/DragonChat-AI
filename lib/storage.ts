export interface AuthData {
  email: string;
  businessName: string;
  createdAt: string;
}

export interface BrandingData {
  businessName: string;
  primaryColor: string;
  logoDataUrl: string;
  tagline: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface BusinessHour {
  enabled: boolean;
  open: string;
  close: string;
}

export interface ConfigData {
  botName: string;
  bubbleColor: string;
  greeting: string;
  offlineMessage: string;
  collectName: boolean;
  collectEmail: boolean;
  collectPhone: boolean;
  faqs: FAQ[];
  hours: Record<string, BusinessHour>;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  source: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'closed';
}

export interface ConversationMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  messages: ConversationMessage[];
  createdAt: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_HOURS: Record<string, BusinessHour> = DAYS.reduce((acc, day) => {
  acc[day] = {
    enabled: day !== 'Saturday' && day !== 'Sunday',
    open: '09:00',
    close: '17:00',
  };
  return acc;
}, {} as Record<string, BusinessHour>);

const DEFAULT_CONFIG: ConfigData = {
  botName: 'AI Assistant',
  bubbleColor: '#A07840',
  greeting: 'Hi there! How can I help you today?',
  offlineMessage: "We're currently offline. Leave a message and we'll get back to you soon!",
  collectName: true,
  collectEmail: true,
  collectPhone: false,
  faqs: [],
  hours: DEFAULT_HOURS,
};

const MOCK_LEADS: Lead[] = [
  { id: '1', name: 'James Hartwell', email: 'james@email.com', phone: '555-0101', message: 'Need a quote for HVAC repair', source: 'Website Chat', createdAt: '2026-05-01T10:30:00Z', status: 'new' },
  { id: '2', name: 'Sandra Okonkwo', email: 'sandra@email.com', phone: '555-0102', message: 'Interested in monthly service plan', source: 'Website Chat', createdAt: '2026-04-30T14:15:00Z', status: 'contacted' },
  { id: '3', name: 'Mike Kowalski', email: 'mike@email.com', phone: '555-0103', message: 'Emergency plumbing needed ASAP', source: 'Website Chat', createdAt: '2026-04-29T09:00:00Z', status: 'closed' },
  { id: '4', name: 'Diane Fletcher', email: 'diane@email.com', phone: '555-0104', message: 'Landscaping estimate request', source: 'Website Chat', createdAt: '2026-04-28T16:45:00Z', status: 'new' },
  { id: '5', name: 'Carlos Reyes', email: 'carlos@email.com', phone: '555-0105', message: 'Roof inspection needed', source: 'Website Chat', createdAt: '2026-04-27T11:20:00Z', status: 'new' },
];

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const storage = {
  getAuth: (): AuthData | null => safeGet<AuthData | null>('dc_auth', null),
  setAuth: (data: AuthData) => safeSet('dc_auth', data),
  clearAuth: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('dc_auth');
  },

  getBranding: (): BrandingData => safeGet<BrandingData>('dc_branding', {
    businessName: '',
    primaryColor: '#A07840',
    logoDataUrl: '',
    tagline: '',
  }),
  setBranding: (data: BrandingData) => {
    safeSet('dc_branding', data);
    if (typeof window !== 'undefined') {
      document.documentElement.style.setProperty('--brand', data.primaryColor);
    }
  },

  getConfig: (): ConfigData => safeGet<ConfigData>('dc_config', DEFAULT_CONFIG),
  setConfig: (data: ConfigData) => safeSet('dc_config', data),

  getLeads: (): Lead[] => {
    const leads = safeGet<Lead[]>('dc_leads', []);
    if (leads.length === 0) {
      safeSet('dc_leads', MOCK_LEADS);
      return MOCK_LEADS;
    }
    return leads;
  },
  setLeads: (data: Lead[]) => safeSet('dc_leads', data),

  getConversations: (): Conversation[] => safeGet<Conversation[]>('dc_conversations', []),
  addConversation: (convo: Conversation) => {
    const existing = safeGet<Conversation[]>('dc_conversations', []);
    safeSet('dc_conversations', [...existing, convo]);
  },

  isBrandingSet: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('dc_branding');
  },
};

export function applyBrandColor(color: string) {
  if (typeof window !== 'undefined') {
    document.documentElement.style.setProperty('--brand', color);
  }
}
