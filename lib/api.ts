// lib/api.ts — Connect to existing CRM Backend API

const CRM_API_BASE = process.env.NEXT_PUBLIC_CRM_API || 'https://crm.invictus-ai.in/api';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://187.124.99.189:8000';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

// ============ PROSPECTS ============
export async function getProspects(params: {
  page?: number; limit?: number; search?: string; stage?: string;
  niche?: string; city?: string; sort?: string; order?: string;
} = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) searchParams.set(k, String(v)); });
  const res = await fetch(`${CRM_API_BASE}/prospects?${searchParams}`);
  return res.json();
}

export async function getProspect(id: string) {
  const res = await fetch(`${CRM_API_BASE}/prospects/${id}`);
  return res.json();
}

export async function updateProspect(id: string, data: Record<string, unknown>) {
  const res = await fetch(`${CRM_API_BASE}/prospects/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

// ============ DASHBOARD ============
export async function getDashboard() {
  const res = await fetch(`${CRM_API_BASE}/dashboard`);
  return res.json();
}

// ============ ACTIVITIES ============
export async function getActivities(prospectId?: string) {
  const params = prospectId ? `?prospect_id=${prospectId}` : '';
  const res = await fetch(`${CRM_API_BASE}/activities${params}`);
  return res.json();
}

export async function logActivity(data: {
  prospect_id: string; type: string; description: string; created_by?: string;
}) {
  const res = await fetch(`${CRM_API_BASE}/activities`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

// ============ EMAILS ============
export async function getEmailHistory(prospectId?: string) {
  const params = prospectId ? `?prospect_id=${prospectId}` : '';
  const res = await fetch(`${CRM_API_BASE}/email/history${params}`);
  return res.json();
}

export async function sendEmail(data: {
  to: string; subject: string; html?: string; text?: string;
  prospect_id?: string; from?: string;
}) {
  const res = await fetch(`${CRM_API_BASE}/email/send`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getEmailTemplates() {
  const res = await fetch(`${CRM_API_BASE}/email/templates`);
  return res.json();
}

// ============ TASKS ============
export async function getTasks(prospectId?: string) {
  const params = prospectId ? `?prospect_id=${prospectId}` : '';
  const res = await fetch(`${CRM_API_BASE}/tasks${params}`);
  return res.json();
}

// ============ NOTES ============
export async function getNotes(prospectId: string) {
  const res = await fetch(`${CRM_API_BASE}/notes?prospect_id=${prospectId}`);
  return res.json();
}

// ============ SUPABASE DIRECT (for real-time & raw queries) ============
export async function supabaseQuery(table: string, params: Record<string, string> = {}) {
  const searchParams = new URLSearchParams(params);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${searchParams}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
  return res.json();
}

// ============ AGENT STATUS ============
export async function getAgentStatus() {
  // Check agent relay endpoints
  const agents = [
    { name: 'Jarvis', ip: '172.26.0.10', port: 18790 },
    { name: 'Linus', ip: '172.26.0.12', port: 18790 },
    { name: 'Jordan', ip: '172.26.0.3', port: 18790 },
    { name: 'Gary', ip: '172.26.0.14', port: 18790 },
    { name: 'Friend', ip: '172.26.0.7', port: 18790 },
  ];
  
  return agents; // TODO: implement health checks via API route
}

// ============ WEBSOCKET ============
export function connectCRMWebSocket(onMessage: (data: { event: string; data: unknown }) => void) {
  const ws = new WebSocket(`wss://crm.invictus-ai.in/ws`);
  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onMessage(data);
    } catch (_) {}
  };
  ws.onclose = () => {
    // Reconnect after 5s
    setTimeout(() => connectCRMWebSocket(onMessage), 5000);
  };
  return ws;
}
