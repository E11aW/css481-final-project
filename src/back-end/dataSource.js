// src/back-end/dataSource.js

// Point this at localhost in dev and your deployed API in production.
// On Vercel, set REACT_APP_API_BASE to something like:
//   https://your-api-service.onrender.com/api
const API_BASE =
  process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';

// ---- CLIMATE DATA (Open-Meteo via backend proxy) ----
//
// params example:
// {
//   lat: 78.2,
//   lon: 15.6,
//   start: '2013-01-01',
//   end: '2024-12-31',
//   model: 'CMCC_CM2_VHR4',
//   variable: 'temperature_2m_mean',
// }
export async function fetchDailyClimate(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/climate/daily?${query}`);
  if (!res.ok) {
    throw new Error(`Climate API error: ${res.status}`);
  }
  return res.json(); // full Open-Meteo response
}

// ---- ANTARCTICA HEATMAP POINTS ----
//
// Returns whatever your backend sends from antarctica_points.json.
// Usually:
//   [{ nx, ny, value }, ...]  OR  { points: [...] }
export async function fetchAntarcticaPoints() {
  const res = await fetch(`${API_BASE}/antarctica-points`);
  if (!res.ok) {
    throw new Error('Failed to load Antarctica points');
  }
  return res.json();
}

// ---- USER NOTES (FULL CRUD) ----
//
// Model (from backend):
// { id: number, date: "YYYY-MM-DD", value: number, summary: string }

export async function fetchNotes() {
  const res = await fetch(`${API_BASE}/notes`);
  if (!res.ok) {
    throw new Error('Notes API error');
  }
  return res.json();
}

export async function createNote(payload) {
  const res = await fetch(`${API_BASE}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Failed to create note');
  }
  return res.json();
}

export async function updateNote(id, payload) {
  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Failed to update note');
  }
  return res.json();
}

export async function deleteNote(id) {
  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Failed to delete note');
  }
  return res.json();
}

// ---- TRENDS (USED BY GAME CORE) ----
//
// This restores the 'trends' export that gameCore.js imports.
// If gameCore expects different field names, we can tweak them,
// but this gives it a structured array to work with.
export const trends = [
  {
    id: 1,
    title: 'Rising Arctic temperatures',
    description:
      'Average temperatures in polar regions have increased over recent decades, putting more stress on sea ice and wildlife.',
  },
  {
    id: 2,
    title: 'Regional ice loss hotspots',
    description:
      'Some parts of Antarctica and the Arctic are losing ice much faster than others, creating concentrated “hotspots” of change.',
  },
  {
    id: 3,
    title: 'More frequent extremes',
    description:
      'Temperature spikes, unusual melt events, and shifting sea ice patterns are becoming more frequent in recent years.',
  },
  {
    id: 4,
    title: 'Long-term warming trend',
    description:
      'Despite year-to-year variation, the long-term trend shows a clear move toward warmer conditions and thinner ice.',
  },
];