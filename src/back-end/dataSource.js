// src/back-end/dataSource.js

const API_BASE = 'http://localhost:4000/api';

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
// { note, points: [{ nx, ny, value }, ...] }  OR  just  [{ nx, ny, value }, ...]
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