// server/index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch'); // v2
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// ---- Load local JSON data ----

const antarcticaPointsPath = path.join(__dirname, 'antarctica_points.json');
const climateDataPath = path.join(__dirname, 'climateData.json');

let antarcticaPoints = { note: '', points: [] };
let climateData = { datasets: [], measurements: [] };

try {
  antarcticaPoints = JSON.parse(fs.readFileSync(antarcticaPointsPath, 'utf8'));
} catch (err) {
  console.error('Failed to load antarctica_points.json:', err.message);
}

try {
  climateData = JSON.parse(fs.readFileSync(climateDataPath, 'utf8'));
} catch (err) {
  console.error('Failed to load climateData.json:', err.message);
}

// ---- In-memory notes store (CRUD) ----

let notes = [];
let nextNoteId = 1;

// GET /api/notes
app.get('/api/notes', (req, res) => {
  res.json(notes);
});

// POST /api/notes
app.post('/api/notes', (req, res) => {
  const { date, value, summary } = req.body || {};
  if (!date || typeof value !== 'number' || typeof summary !== 'string') {
    return res.status(400).json({ error: 'Invalid note payload' });
  }

  const note = {
    id: nextNoteId++,
    date,
    value,
    summary,
  };
  notes.push(note);
  res.status(201).json(note);
});

// PUT /api/notes/:id
app.put('/api/notes/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = notes.findIndex((n) => n.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }

  const { date, value, summary } = req.body || {};
  if (!date || typeof value !== 'number' || typeof summary !== 'string') {
    return res.status(400).json({ error: 'Invalid note payload' });
  }

  notes[idx] = { id, date, value, summary };
  res.json(notes[idx]);
});

// DELETE /api/notes/:id
app.delete('/api/notes/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = notes.findIndex((n) => n.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }
  const deleted = notes.splice(idx, 1)[0];
  res.json(deleted);
});

// ---- Antarctica heat map points ----

// GET /api/antarctica-points
app.get('/api/antarctica-points', (req, res) => {
  // antarcticaPoints is either { note, points: [...] } or just an array in your file
  res.json(antarcticaPoints);
});

// ---- Climate demo data from local JSON (if you use it) ----

// GET /api/climate/demo
app.get('/api/climate/demo', (req, res) => {
  res.json(climateData);
});

// ---- Open-Meteo climate proxy ----

// Helper to clamp dates to allowed range
function clampDateRange(start, end) {
  const min = new Date('2013-01-01');
  const max = new Date('2050-12-31');

  let s = start ? new Date(start) : min;
  let e = end ? new Date(end) : new Date();

  if (s < min) s = min;
  if (e > max) e = max;
  if (e < s) e = s;

  const toISODate = (d) => d.toISOString().slice(0, 10);
  return {
    start: toISODate(s),
    end: toISODate(e),
  };
}

// GET /api/climate/daily
app.get('/api/climate/daily', async (req, res) => {
  try {
    const {
      lat = '78.2',
      lon = '15.6',
      start,
      end,
      model = 'CMCC_CM2_VHR4',
      variable = 'temperature_2m_mean',
      timezone = 'UTC',
    } = req.query;

    const { start: safeStart, end: safeEnd } = clampDateRange(start, end);

    const url = new URL('https://climate-api.open-meteo.com/v1/climate');
    url.searchParams.set('latitude', lat);
    url.searchParams.set('longitude', lon);
    url.searchParams.set('start_date', safeStart);
    url.searchParams.set('end_date', safeEnd);
    url.searchParams.set('models', model);
    url.searchParams.set('daily', variable);
    url.searchParams.set('timezone', timezone);

    console.log('Calling Open-Meteo:', url.toString());

    const response = await fetch(url.toString());
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Open-Meteo error status:', response.status);
      console.error('Open-Meteo error body:', errorBody);
      return res
        .status(response.status)
        .json({ error: true, message: 'Open-Meteo error', details: errorBody });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Error fetching climate data', err);
    res.status(500).json({ error: 'Failed to fetch climate data' });
  }
});

// ---- Start server ----

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});