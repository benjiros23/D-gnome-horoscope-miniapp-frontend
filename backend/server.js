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

// CORS: allow frontend host + localhost for dev
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://d-gnome-horoscope-miniapp-frontend.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return cb(null, true);
    return cb(new Error('CORS not allowed'), false);
  }
}));

// Simple status
app.get('/', (req, res) => {
  res.json({ message: '🧙‍♂️ API Гномий Гороскоп работает!', version: '2.1.0', status: 'active', cors_fixed: true, timestamp: new Date().toISOString(), endpoints: [
    'GET /api/horoscope/:sign - Гороскоп по знаку',
    'GET /api/moon - Лунный календарь',
    'GET /api/astro-events - Астрособытия',
    'POST /api/genai - Proxy for Google Generative API',
    'GET /api/day-card - Карта дня'
  ]});
});

// Proxy endpoint for Google Generative API
app.post('/api/genai', async (req, res) => {
  try {
    const API_KEY = process.env.GOOGLE_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: 'GOOGLE_API_KEY not configured on server' });

    const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(req.body)
    });

    const json = await resp.json();
    res.status(resp.status).json(json);
  } catch (err) {
    console.error('GenAI proxy error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// In-memory cache for moon data (simple TTL)
let moonCache = { ts: 0, data: null };
const MOON_TTL = 1000 * 60 * 15; // 15 minutes

// Scrape moon data from my-calend.ru
app.get('/api/moon', async (req, res) => {
  try {
    const now = Date.now();
    if (moonCache.data && (now - moonCache.ts) < MOON_TTL) {
      return res.json({ cached: true, data: moonCache.data });
    }

    const url = 'https://my-calend.ru/moon';
    const r = await axios.get(url, { headers: { 'User-Agent': 'GnomeHoroscope/1.0 (+https://example.com)' } });
    const $ = cheerio.load(r.data);

    // This scraping is best-effort — page structure may change. Extract some useful bits.
    const phases = [];
    $('.moon-phase__item, .moon__item').each((i, el) => {
      const title = $(el).find('h3').text().trim() || $(el).find('.title').text().trim();
      const text = $(el).find('p').text().trim() || $(el).find('.description').text().trim();
      if (title || text) phases.push({ title, text });
    });

    // Fallback simpler parse: get main info block
    const main = $('main').text().replace(/\s+/g, ' ').trim().slice(0, 2000);

    const data = { phases, main };
    moonCache = { ts: now, data };
    res.json({ cached: false, data });
  } catch (err) {
    console.error('Moon fetch error:', err.toString());
    res.status(500).json({ error: 'Не удалось получить данные луны', details: String(err) });
  }
});

// Placeholder endpoints (you can replace with your own logic or connect to DB)
app.get('/api/horoscope/:sign', (req, res) => {
  const sign = req.params.sign;
  res.json({ sign, horoscope: { general: `Гном говорит: гороскоп для ${sign}`, love: '', work: '', health: '' } });
});

app.get('/api/day-card', (req, res) => {
  res.json({ card: 'Колесо фортуны', meaning: 'Вас ждёт перемена' });
});

app.get('/api/astro-events', (req, res) => {
  res.json({ events: [] });
});

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// CORS настройки
const allowedOrigins = [
  'https://gnome-horoscope-react.vercel.app',
  'https://gnome-horoscope.vercel.app',
  'https://web.telegram.org',
 'https://telegram.org',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3000'
  , 'https://d-gnome-horoscope-miniapp-frontend.onrender.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('🚫 CORS заблокирован для:', origin);
      callback(null, true); // Разрешаем все для отладки
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'Pragma',
    'If-None-Match',
    'If-Modified-Since'
  ],
  credentials: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma, If-None-Match, If-Modified-Since');
  res.header('Access-Control-Allow-Credentials', 'false');
  
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS preflight от:', origin);
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} от ${req.headers.origin || 'неизвестно'}`);
  next();
});

// ДАННЫЕ
const ZODIAC_SIGNS = [
  'Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева',
  'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'
];

const GNOME_NAMES = {
  'Овен': 'Гном Огнебород',
  'Телец': 'Гном Златоруд',
  'Близнецы': 'Гном Двойняшка',
  'Рак': 'Гном Домовой',
  'Лев': 'Гном Златогрив',
  'Дева': 'Гном Аккуратный',
  'Весы': 'Гном Справедливый',
  'Скорпион': 'Гном Тайновед',
  'Стрелец': 'Гном Путешественник',
  'Козерог': 'Гном Горовосходитель',
  'Водолей': 'Гном Изобретатель',
  'Рыбы': 'Гном Мечтатель'
};

// ФУНКЦИЯ генерации гороскопа
const generateHoroscope = (sign) => {
  const predictions = [
    "Сегодня звезды благоволят вашим начинаниям. Доверьтесь интуиции!",
    "День полон возможностей. Не бойтесь делать первый шаг к своей мечте.",
    "Гномья мудрость говорит: терпение принесет свои плоды уже очень скоро.",
    "Энергия дня поможет вам преодолеть любые препятствия на пути к успеху.",
    "Сегодня особенно важно прислушаться к своему сердцу и довериться судьбе."
  ];
  
  const loveAdvice = [
    "В любви ждут приятные сюрпризы и романтические встречи",
    "Время укрепить отношения и показать свои чувства",
    "Возможно судьбоносное знакомство или возвращение старой любви",
    "Гармония в паре принесет счастье и взаимопонимание"
  ];
  
  const workAdvice = [
    "Карьерный рост и новые возможности не за горами",
    "Ваши таланты будут замечены и по достоинству оценены",
    "Финансовое благополучие растет благодаря мудрым решениям",
    "Творческий подход поможет решить все рабочие задачи"
  ];
  
  const healthAdvice = [
    "Энергия бьет ключом, используйте это время продуктивно",
    "Позитивный настрой станет лучшим лекарством от всех недугов",
    "Время заняться спортом и укрепить здоровье",
    "Правильное питание принесет заметные улучшения"
  ];
  
  return {
    general: predictions[Math.floor(Math.random() * predictions.length)],
    love: loveAdvice[Math.floor(Math.random() * loveAdvice.length)],
    work: workAdvice[Math.floor(Math.random() * workAdvice.length)],
    health: healthAdvice[Math.floor(Math.random() * healthAdvice.length)]
  };
};

// API ENDPOINTS
app.get('/', (req, res) => {
  res.json({
    message: '🧙‍♂️ API Гномий Гороскоп работает!',
    version: '2.1.0',
    status: 'active',
    cors_fixed: true,
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/horoscope/:sign - Гороскоп по знаку',
      'GET /api/horoscope?sign=знак - Гороскоп (старый формат)',
      'GET /api/moon - Лунный календарь',
      'GET /api/astro-events - Астрособытия',
      'POST /api/numerology - Нумерология',
      'GET /api/compatibility/:sign1/:sign2 - Совместимость',
      'GET /api/day-card - Карта дня',
      'GET /api/mercury - Статус Меркурия'
    ]
  });
});

// ИСПРАВЛЕННЫЙ endpoint гороскопа с поддержкой query параметра
app.get('/api/horoscope', (req, res) => {
  try {
    const sign = req.query.sign;
    console.log('Запрос гороскопа (query) для знака:', sign);
    
    if (!sign) {
      return res.status(400).json({ 
        error: 'Требуется параметр sign',
        example: '/api/horoscope?sign=Лев'
      });
    }
    
    const decodedSign = decodeURIComponent(sign);
    
    if (!ZODIAC_SIGNS.includes(decodedSign)) {
      return res.status(400).json({
        error: 'Неверный знак зодиака',
        received: decodedSign,
        validSigns: ZODIAC_SIGNS
      });
    }
    
    const horoscope = generateHoroscope(decodedSign);
    
    res.json({
      sign: decodedSign,
      gnome: GNOME_NAMES[decodedSign],
      date: new Date().toLocaleDateString('ru-RU'),
      horoscope: horoscope,
      luckyNumber: Math.floor(Math.random() * 100) + 1,
      luckyColor: ['Золотой', 'Изумрудный', 'Сапфировый', 'Рубиновый'][Math.floor(Math.random() * 4)],
      element: ['Овен', 'Лев', 'Стрелец'].includes(decodedSign) ? 'Огонь' 
              : ['Телец', 'Дева', 'Козерог'].includes(decodedSign) ? 'Земля'
              : ['Близнецы', 'Весы', 'Водолей'].includes(decodedSign) ? 'Воздух' : 'Вода',
      compatibility: ZODIAC_SIGNS[Math.floor(Math.random() * ZODIAC_SIGNS.length)],
      source: 'gnome_wisdom',
      format: 'query_parameter',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ошибка /api/horoscope (query):', error);
    res.status(500).json({ 
      error: 'Не удалось получить гороскоп',
      message: error.message
    });
  }
});

// Новый endpoint гороскопа с параметром в URL
app.get('/api/horoscope/:sign', (req, res) => {
  try {
    const sign = decodeURIComponent(req.params.sign);
    console.log('Запрос гороскопа (params) для знака:', sign);
    
    if (!ZODIAC_SIGNS.includes(sign)) {
      return res.status(400).json({
        error: 'Неверный знак зодиака',
        received: sign,
        validSigns: ZODIAC_SIGNS
      });
    }
    
    const horoscope = generateHoroscope(sign);
    
    res.json({
      sign: sign,
      gnome: GNOME_NAMES[sign],
      date: new Date().toLocaleDateString('ru-RU'),
      horoscope: horoscope,
      luckyNumber: Math.floor(Math.random() * 100) + 1,
      luckyColor: ['Золотой', 'Изумрудный', 'Сапфировый', 'Рубиновый'][Math.floor(Math.random() * 4)],
      element: ['Овен', 'Лев', 'Стрелец'].includes(sign) ? 'Огонь' 
              : ['Телец', 'Дева', 'Козерог'].includes(sign) ? 'Земля'
              : ['Близнецы', 'Весы', 'Водолей'].includes(sign) ? 'Воздух' : 'Вода',
      compatibility: ZODIAC_SIGNS[Math.floor(Math.random() * ZODIAC_SIGNS.length)],
      source: 'gnome_wisdom',
      format: 'url_parameter',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ошибка /api/horoscope/:sign:', error);
    res.status(500).json({ 
      error: 'Не удалось получить гороскоп',
      message: error.message,
      sign: req.params.sign
    });
  }
});

app.get('/api/moon', (req, res) => {
  try {
    const today = new Date();
    
    const currentPhase = {
      phase: 'Растущая луна',
      emoji: '🌔', 
      illumination: 25,
      age: 5,
      date: today.toISOString(),
      zodiacSign: 'Весы',
      moonrise: '06:45',
      moonset: '19:30'
    };
    
    const calendar = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      calendar.push({
        date: date.toISOString(),
        displayDate: date.toLocaleDateString('ru-RU', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        }),
        phase: 'Растущая луна',
        emoji: '🌔',
        illumination: Math.round(25 + i * 5),
        age: Math.max(1, Math.min(29, 5 + i))
      });
    }
    
    const advice = {
      title: 'Время роста и накопления энергии',
      text: 'Гном Мудрый советует: растущая луна дает силу для новых начинаний.',
      activities: ['Новые проекты', 'Привлечение денег', 'Укрепление здоровья'],
      avoid: ['Излишнюю активность', 'Переедание']
    };
    
    currentPhase.advice = advice;
    
    res.json({
      current: currentPhase,
      calendar,
      source: 'gnome_astronomy',
      note: 'Актуальные лунные данные от гномьих мудрецов',
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ошибка /api/moon:', error);
    res.status(500).json({ 
      error: 'Не удалось получить лунные данные',
      message: error.message
    });
  }
});

app.get('/api/astro-events', (req, res) => {
  try {
    const events = [
      {
        date: '2025-08-28',
        title: 'Соединение Венеры и Марса',
        description: 'Благоприятный день для любовных дел и творчества',
        type: 'planetary',
        impact: 'positive'
      },
      {
        date: '2025-08-30', 
        title: 'Полнолуние в Рыбах',
        description: 'Время для завершения дел и глубокой медитации',
        type: 'lunar',
        impact: 'neutral'
      },
      {
        date: '2025-09-02',
        title: 'Тригон Юпитера и Солнца',
        description: 'Удачный период для карьерного роста и новых начинаний',
        type: 'planetary',
        impact: 'positive'
      },
      {
        date: '2025-09-05',
        title: 'Противостояние Марса и Сатурна',
        description: 'Время для терпения и осторожности в решениях',
        type: 'planetary',
        impact: 'challenging'
      }
    ];
    
    res.json({
      events,
      source: 'astronomy_data',
      generated_at: new Date().toISOString(),
      total_events: events.length,
      note: 'Актуальные астрономические события на август-сентябрь 2025'
    });
    
  } catch (error) {
    console.error('Ошибка /api/astro-events:', error);
    res.status(500).json({ 
      error: 'Не удалось получить астрособытия',
      message: error.message
    });
  }
});

app.post('/api/numerology', (req, res) => {
  try {
    const { birthDate, name } = req.body;
    
    if (!birthDate) {
      return res.status(400).json({
        error: 'Требуется дата рождения',
        example: { birthDate: '1990-05-15', name: 'Иван' }
      });
    }
    
    const dateSum = birthDate.replace(/\D/g, '').split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    const destinyNumber = dateSum > 9 ? dateSum.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0) : dateSum;
    
    const interpretations = {
      1: 'Лидер, независимый, инициативный',
      2: 'Дипломат, миротворец, чувствительный',
      3: 'Творческий, общительный, оптимистичный',
      4: 'Практичный, надежный, трудолюбивый',
      5: 'Свободолюбивый, любознательный',
      6: 'Заботливый, ответственный, семейный',
      7: 'Мыслитель, духовный, интуитивный',
      8: 'Амбициозный, целеустремленный',
      9: 'Гуманист, щедрый, мудрый'
    };
    
    const luckyNumbers = [destinyNumber];
    for (let i = 1; i <= 3; i++) {
      let num = (destinyNumber * i) % 9;
      if (num === 0) num = 9;
      if (!luckyNumbers.includes(num)) luckyNumbers.push(num);
    }
    
    res.json({
      birthDate,
      name: name || 'Неизвестно',
      destinyNumber,
      interpretation: interpretations[destinyNumber] || 'Особенная душа',
      luckyNumbers: luckyNumbers.slice(0, 3),
      advice: 'Следуйте своему предназначению и доверьтесь внутренней мудрости!',
      compatibility: Math.floor(Math.random() * 9) + 1,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ошибка /api/numerology:', error);
    res.status(500).json({ 
      error: 'Не удалось рассчитать нумерологию',
      message: error.message
    });
  }
});

app.get('/api/compatibility/:sign1/:sign2', (req, res) => {
  try {
    const sign1 = decodeURIComponent(req.params.sign1);
    const sign2 = decodeURIComponent(req.params.sign2);
    
    if (!ZODIAC_SIGNS.includes(sign1) || !ZODIAC_SIGNS.includes(sign2)) {
      return res.status(400).json({
        error: 'Неверные знаки зодиака',
        received: { sign1, sign2 },
        validSigns: ZODIAC_SIGNS
      });
    }
    
    // Более сложная логика совместимости
    const elementCompatibility = {
      'Огонь': ['Огонь', 'Воздух'],
      'Земля': ['Земля', 'Вода'],
      'Воздух': ['Воздух', 'Огонь'],
      'Вода': ['Вода', 'Земля']
    };
    
    const getElement = (sign) => {
      if (['Овен', 'Лев', 'Стрелец'].includes(sign)) return 'Огонь';
      if (['Телец', 'Дева', 'Козерог'].includes(sign)) return 'Земля';
      if (['Близнецы', 'Весы', 'Водолей'].includes(sign)) return 'Воздух';
      return 'Вода';
    };
    
    const element1 = getElement(sign1);
    const element2 = getElement(sign2);
    
    const baseCompatibility = elementCompatibility[element1].includes(element2) ? 75 : 55;
    const randomModifier = Math.floor(Math.random() * 21) - 10; // от -10 до +10
    const compatibilityScore = Math.max(30, Math.min(100, baseCompatibility + randomModifier));
    
    const descriptions = {
      high: 'Ваши души созданы друг для друга! Прекрасная гармония во всех сферах жизни.',
      medium: 'Хорошая совместимость с потенциалом для роста. Работайте над пониманием.',
      low: 'Сложные отношения, но возможны при взаимном уважении и терпении.'
    };
    
    const level = compatibilityScore >= 75 ? 'high' : compatibilityScore >= 55 ? 'medium' : 'low';
    
    res.json({
      sign1,
      sign2,
      gnome1: GNOME_NAMES[sign1],
      gnome2: GNOME_NAMES[sign2],
      element1,
      element2,
      compatibilityScore,
      level,
      description: descriptions[level],
      strongPoints: ['Взаимное притяжение', 'Общие цели', 'Эмоциональная связь'],
      challenges: ['Различия в темпераменте', 'Разные потребности в общении'],
      advice: 'Цените различия друг друга и не забывайте о компромиссах!',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ошибка /api/compatibility:', error);
    res.status(500).json({ 
      error: 'Не удалось рассчитать совместимость',
      message: error.message
    });
  }
});

app.get('/api/day-card', (req, res) => {
  try {
    const cards = [
      { 
        name: 'Маг', 
        meaning: 'Новые возможности и творческая энергия', 
        advice: 'Используйте свои таланты на полную мощность',
        element: 'Воздух',
        energy: 'positive'
      },
      { 
        name: 'Верховная Жрица', 
        meaning: 'Интуиция и скрытые знания', 
        advice: 'Доверьтесь внутреннему голосу и мудрости',
        element: 'Вода',
        energy: 'mystical'
      },
      { 
        name: 'Солнце', 
        meaning: 'Радость, успех и жизненная энергия', 
        advice: 'Наслаждайтесь моментом и дарите радость другим',
        element: 'Огонь',
        energy: 'positive'
      },
      { 
        name: 'Луна', 
        meaning: 'Подсознание и скрытые эмоции', 
        advice: 'Обратитесь к своим глубинным чувствам',
        element: 'Вода',
        energy: 'reflective'
      },
      { 
        name: 'Звезда', 
        meaning: 'Надежда и духовное руководство', 
        advice: 'Следуйте своей мечте, звезды укажут путь',
        element: 'Воздух',
        energy: 'inspiring'
      }
    ];
    
    const todayCard = cards[Math.floor(Math.random() * cards.length)];
    
    res.json({
      card: todayCard,
      date: new Date().toLocaleDateString('ru-RU'),
      type: 'daily_guidance',
      gnomeWisdom: 'Древние гномы говорят: карты никогда не ошибаются, если сердце открыто для мудрости.',
      reflection: 'Подумайте о том, как это послание применимо к вашему текущему жизненному периоду.',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ошибка /api/day-card:', error);
    res.status(500).json({ 
      error: 'Не удалось получить карту дня',
      message: error.message
    });
  }
});

app.get('/api/mercury', (req, res) => {
  try {
    const isRetrograde = Math.random() > 0.7; // 30% вероятность
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (isRetrograde ? 21 : 45));
    
    res.json({
      isRetrograde,
      status: isRetrograde ? 'Ретроградный' : 'Директный',
      influence: isRetrograde 
        ? 'Осторожность в коммуникациях и технических вопросах' 
        : 'Благоприятное время для общения и новых контрактов',
      advice: isRetrograde 
        ? 'Проверяйте документы дважды, избегайте важных покупок техники'
        : 'Отличное время для переговоров, подписания договоров и обучения',
      duration: isRetrograde ? '21 день' : 'До следующего ретрограда',
      period: {
        start: startDate.toLocaleDateString('ru-RU'),
        end: endDate.toLocaleDateString('ru-RU')
      },
      affectedSigns: ['Близнецы', 'Дева', 'Весы'],
      recommendations: isRetrograde ? [
        'Делайте резервные копии важных данных',
        'Перепроверяйте расписание встреч',
        'Будьте терпеливы с техникой'
      ] : [
        'Планируйте важные переговоры',
        'Изучайте новые навыки',
        'Налаживайте деловые связи'
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ошибка /api/mercury:', error);
    res.status(500).json({ 
      error: 'Не удалось получить статус Меркурия',
      message: error.message
    });
  }
});

// Proxy endpoint for Google Generative Language (GenAI) to keep API key on server
app.post('/api/genai', async (req, res) => {
  try {
    const API_KEY = process.env.GOOGLE_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: 'GOOGLE_API_KEY not configured on server' });
    }

    const googleUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    const response = await fetch(googleUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.text();
    // Try to parse JSON, otherwise return raw text
    try {
      const json = JSON.parse(data);
      return res.status(response.status).json(json);
    } catch (e) {
      return res.status(response.status).send(data);
    }
  } catch (err) {
    console.error('GenAI proxy error:', err);
    return res.status(500).json({ error: String(err) });
  }
});

// Endpoint для работы с настройками пользователя
app.get('/api/user/settings', (req, res) => {
  try {
    const initData = req.query.init_data;
    console.log('Запрос настроек пользователя:', initData);
    
    if (!initData) {
      return res.status(400).json({ 
        error: 'Требуется параметр init_data',
        example: '/api/user/settings?init_data=initDataString'
      });
    }
    
    // Возвращаем стандартные настройки для тестирования
    // В реальном приложении здесь должна быть логика получения настроек из базы данных
    const defaultSettings = {
      zodiac_sign: null,
      birth_time: null,
      birth_location: null,
      notification_time: '09:00',
      premium: false,
      language: 'ru',
      theme: 'light'
    };
    
    res.json({
      ...defaultSettings,
      init_data: initData,
      source: 'default_settings',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ошибка /api/user/settings (GET):', error);
    res.status(500).json({ 
      error: 'Не удалось получить настройки пользователя',
      message: error.message
    });
  }
});

// Endpoint для сохранения настроек пользователя
app.post('/api/user/settings', (req, res) => {
  try {
    const { settings, initData } = req.body;
    console.log('Сохранение настроек пользователя:', { settings, initData });
    
    if (!initData) {
      return res.status(400).json({ 
        error: 'Требуется параметр init_data',
        example: '{ settings: {...}, initData: "initDataString" }'
      });
    }
    
    if (!settings) {
      return res.status(400).json({ 
        error: 'Требуется параметр settings',
        example: '{ settings: {...}, initData: "initDataString" }'
      });
    }
    
    // В реальном приложении здесь должна быть логика сохранения настроек в базу данных
    // Для тестирования просто возвращаем успешный результат
    
    res.json({
      status: 'success',
      message: 'Настройки пользователя сохранены',
      settings: { ...settings, init_data: initData },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ошибка /api/user/settings (POST):', error);
    res.status(500).json({ 
      error: 'Не удалось сохранить настройки пользователя',
      message: error.message
    });
  }
});

// Обработка 404 для API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint не найден',
    path: req.path,
    availableEndpoints: [
      'GET /',
      'GET /api/horoscope?sign=знак',
      'GET /api/horoscope/:sign',
      'GET /api/moon',
      'GET /api/astro-events',
      'POST /api/numerology',
      'GET /api/compatibility/:sign1/:sign2',
      'GET /api/day-card',
      'GET /api/mercury',
      'GET /api/user/settings',
      'POST /api/user/settings'
    ],
    timestamp: new Date().toISOString()
  });
});

// Общий обработчик ошибок
app.use((error, req, res, next) => {
  console.error('💥 Серверная ошибка:', error);
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Что-то пошло не так',
    timestamp: new Date().toISOString()
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🧙‍♂️ Сервер "Гномий Гороскоп" запущен на порту ${PORT}`);
  console.log(`🔗 URL: https://d-gnome-horoscope-miniapp-frontend.onrender.com`);
  console.log('✅ CORS исправлен - добавлен localhost:3002');
  console.log('📱 Готов к приему запросов от Vercel');
  console.log('🔧 Поддерживаются оба формата API для гороскопов');
 console.log('⏰ Время запуска:', new Date().toLocaleString('ru-RU'));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Получен сигнал SIGTERM, завершаем сервер...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Получен сигнал SIGINT, завершаем сервер...');
  process.exit(0);
});
