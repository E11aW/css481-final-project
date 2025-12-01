// src/dataSource.js
const API_BASE = 'http://localhost:4000/api';

export async function fetchDailyClimate(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/climate/daily?${query}`);
  if (!res.ok) {
    throw new Error(`Climate API error: ${res.status}`);
  }
  return res.json(); // full Open-Meteo response
}

export async function fetchNotes() {
  const res = await fetch(`${API_BASE}/notes`);
  if (!res.ok) throw new Error('Notes API error');
  return res.json();
}

export async function createNote(payload) {
  const res = await fetch(`${API_BASE}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create note');
  return res.json();
}

export async function updateNote(id, payload) {
  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update note');
  return res.json();
}

export async function deleteNote(id) {
  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete note');
  return res.json();
}