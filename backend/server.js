// Final clean server implementation
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const fetch = require('node-fetch');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: (origin, cb) => cb(null, true) }));

app.get('/', (req, res) => res.json({ message: 'Gnome Horoscope API', version: '3.0.0', time: new Date().toISOString() }));

app.post('/api/genai', async (req, res) => {
  try {
    const API_KEY = process.env.GOOGLE_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: 'GOOGLE_API_KEY not configured' });
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` }, body: JSON.stringify(req.body) });
    const txt = await r.text();
    try { return res.status(r.status).json(JSON.parse(txt)); } catch { return res.status(r.status).send(txt); }
  } catch (err) { console.error('genai proxy error', err); return res.status(500).json({ error: String(err) }); }
});

let moonCache = { ts: 0, data: null };
app.get('/api/moon', async (req, res) => {
  try {
    const now = Date.now();
    if (moonCache.data && now - moonCache.ts < 1000 * 60 * 15) return res.json({ cached: true, data: moonCache.data });
    const r = await axios.get('https://my-calend.ru/moon', { headers: { 'User-Agent': 'GnomeHoroscope/1.0' } });
    const $ = cheerio.load(r.data);
    const phases = [];
    $('.moon-phase__item, .moon__item').each((i, el) => { const title = $(el).find('h3').text().trim(); const text = $(el).find('p').text().trim(); if (title || text) phases.push({ title, text }); });
    const main = $('main').text().replace(/\s+/g, ' ').trim().slice(0, 2000);
    moonCache = { ts: now, data: { phases, main } };
    return res.json({ cached: false, data: moonCache.data });
  } catch (err) { console.error('moon error', err); return res.json({ cached: false, data: { phases: [], main: 'fallback' } }); }
});

app.get('/api/horoscope/:sign', (req, res) => { const sign = decodeURIComponent(req.params.sign || ''); return res.json({ sign, horoscope: { general: `Гном говорит: гороскоп для ${sign}` } }); });

app.get('/api/astro-events', (req, res) => res.json({ events: [], timestamp: new Date().toISOString() }));

app.post('/api/user/settings', (req, res) => { const { settings, initData } = req.body || {}; if (!initData || !settings) return res.status(400).json({ error: 'initData and settings required' }); return res.json({ status: 'ok', settings }); });

app.use('/api/*', (req, res) => res.status(404).json({ error: 'API endpoint not found', path: req.path }));

app.use((err, req, res, next) => { console.error('server error', err); res.status(500).json({ error: 'Internal Server Error' }); });

app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));

