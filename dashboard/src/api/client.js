const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

async function handleResponse(res) {
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body && body.error) message = body.error;
    } catch {
      // ignore parse errors, use default message
    }
    throw new Error(message);
  }
  return res.json();
}

export async function fetchSessions() {
  const res = await fetch(`${API_BASE}/sessions`);
  const data = await handleResponse(res);
  return data.sessions;
}

export async function fetchSessionEvents(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${encodeURIComponent(sessionId)}/events`);
  const data = await handleResponse(res);
  return data.events;
}

export async function fetchPages() {
  const res = await fetch(`${API_BASE}/pages`);
  const data = await handleResponse(res);
  return data.pages;
}

export async function fetchClicksForPage(pageUrl) {
  const res = await fetch(`${API_BASE}/clicks?pageUrl=${encodeURIComponent(pageUrl)}`);
  const data = await handleResponse(res);
  return data.clicks;
}
