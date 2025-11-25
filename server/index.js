// server/index.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');   // node-fetch@2
const { URL } = require('url');

const app = express();
app.use(cors());
app.use(express.json());

// Defaults: Arctic-ish location + allowed Open-Meteo range
const DEFAULT_LAT = 78.2;   // Svalbard-ish
const DEFAULT_LON = 15.6;

// Open-Meteo error told us: allowed range is 2013-01-01 to 2050-12-31
const DEFAULT_START = '2013-01-01';
const DEFAULT_END = '2024-12-31';  // you can extend up to '2050-12-31'
const DEFAULT_MODEL = 'CMCC_CM2_VHR4';
const DEFAULT_DAILY = 'temperature_2m_mean';

// ---- GET /api/climate/daily ----
app.get('/api/climate/daily', async (req, res) => {
  let {
    lat = DEFAULT_LAT,
    lon = DEFAULT_LON,
    start = DEFAULT_START,
    end = DEFAULT_END,
    model = DEFAULT_MODEL,
    variable = DEFAULT_DAILY,
  } = req.query;

  // Enforce Open-Meteo's allowed range on the server side
  const MIN_START = '2013-01-01';
  const MAX_END = '2050-12-31';

  if (start < MIN_START) start = MIN_START;
  if (end > MAX_END) end = MAX_END;
  if (end < start) end = start;

  try {
    const url = new URL('https://climate-api.open-meteo.com/v1/climate');
    url.searchParams.set('latitude', lat);
    url.searchParams.set('longitude', lon);
    url.searchParams.set('start_date', start);
    url.searchParams.set('end_date', end);
    url.searchParams.set('models', model);
    url.searchParams.set('daily', variable);
    url.searchParams.set('timezone', 'UTC');

    console.log('Calling Open-Meteo:', url.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Open-Meteo error status:', response.status);
      console.error('Open-Meteo error body:', errorText);
      return res
        .status(response.status)
        .type('application/json')
        .send(errorText);
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Error fetching climate data', err);
    res.status(500).json({ error: 'Failed to fetch climate data' });
  }
});

// ---- Simple in-memory CRUD for notes (optional) ----
let notes = [];
let nextNoteId = 1;

// GET /api/notes
app.get('/api/notes', (req, res) => {
  res.json(notes);
});

// POST /api/notes
app.post('/api/notes', (req, res) => {
  const { date, value, summary } = req.body;
  const newNote = { id: nextNoteId++, date, value, summary };
  notes.push(newNote);
  res.status(201).json(newNote);
});

// PUT /api/notes/:id
app.put('/api/notes/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = notes.findIndex((n) => n.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  notes[idx] = { ...notes[idx], ...req.body };
  res.json(notes[idx]);
});

// DELETE /api/notes/:id
app.delete('/api/notes/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = notes.findIndex((n) => n.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const [deleted] = notes.splice(idx, 1);
  res.json(deleted);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});