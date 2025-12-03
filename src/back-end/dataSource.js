// src/back-end/dataSource.js

// In production (Vercel), set REACT_APP_API_BASE to:
//   https://tip-of-the-iceberg.onrender.com/api
// Locally, this falls back to your dev backend at http://localhost:4000/api
const API_BASE =
  process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';

/**
 * Fetch daily climate data via our backend proxy.
 *
 * params example:
 * {
 *   lat: 78.2,
 *   lon: 15.6,
 *   start: '2013-01-01',
 *   end: '2024-12-31',
 *   model: 'CMCC_CM2_VHR4',
 *   variable: 'temperature_2m_mean',
 *   timezone: 'UTC',
 * }
 */
export async function fetchDailyClimate(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/climate/daily?${query}`);

  if (!res.ok) {
    throw new Error(`Climate API error: ${res.status}`);
  }

  // Returns the full Open-Meteo response object
  return res.json();
}

/**
 * Fetch Antarctica heat map points.
 * Backend returns either:
 *   [{ nx, ny, value }, ...]
 * or:
 *   { points: [{ nx, ny, value }, ...], note: string }
 */
export async function fetchAntarcticaPoints() {
  const res = await fetch(`${API_BASE}/antarctica-points`);

  if (!res.ok) {
    throw new Error('Failed to load Antarctica points');
  }

  return res.json();
}

/**
 * NOTES CRUD
 *
 * Note model (from backend):
 * {
 *   id: number,
 *   date: "YYYY-MM-DD",
 *   value: number,
 *   summary: string
 * }
 */

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

/**
 * TRENDS (used by gameCore.js)
 *
 * This restores the `trends` export that the game imports.
 * Adjust field names if your game expects something different.
 */
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