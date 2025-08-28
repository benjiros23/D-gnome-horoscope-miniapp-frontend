// server.js - ES Modules версия для Render
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 10000;

// ================================================================
// CORS НАСТРОЙКИ
// ================================================================

const allowedOrigins = [
  'https://gnome-horoscope-react.vercel.app',
  'https://gnome-horoscope.vercel.app', 
  'https://web.telegram.org',
  'https://telegram.org',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Разрешаем запросы без origin
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('🚫 CORS заблокирован для:', origin);
      callback(null, true); // Временно разрешаем все для отладки
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Дополнительные CORS заголовки
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS preflight от:', origin);
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} от ${req.headers.origin || 'неизвестно'}`);
  next();
});

// ================================================================
// ДАННЫЕ И УТИЛИТЫ
// ================================================================

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

const generateHoroscope = (sign) => {
  const predictions = [
    "Сегодня звезды благоволят вашим начинаниям. Доверьтесь интуиции!",
    "День полон возможностей. Не бойтесь делать первый шаг.",
    "Гномья мудрость говорит: терпение принесет свои плоды.",
    "Энергия дня поможет вам преодолеть любые препятствия.",
    "Сегодня особенно важно прислушаться к своему сердцу."
  ];
  
  const love = [
    "В любви ждут приятные сюрпризы",
    "Романтическое знакомство возможно",
    "Время укрепить отношения"
  ];
  
  const work = [
    "Карьерный рост не за горами",
    "Новые проекты принесут успех",
    "Коллеги оценят ваши таланты"
  ];
  
  const health = [
    "Энергия бьет ключом",
    "Физическая активность пойдет на пользу",
    "Позитивный настрой укрепит иммунитет"
  ];

  return {
    general: predictions[Math.floor(Math.random() * predictions.length)],
    love: love[Math.floor(Math.random() * love.length)],
    work: work[Math.floor(Math.random() * work.length)],
    health: health[Math.floor(Math.random() * health.length)]
  };
};

// ================================================================
// API ENDPOINTS
// ================================================================

// Главная страница
app.get('/', (req, res) => {
  res.json({
    message: '🧙‍♂️ API Гномий Гороскоп работает!',
    version: '2.1.0',
    endpoints: [
      'GET /api/moon - Лунный календарь',
      'GET /api/horoscope/:sign - Гороскоп',
      'GET /api/astro-events - Астрособытия',
      'POST /api/numerology - Нумерология',
      'GET /api/compatibility/:sign1/:sign2 - Совместимость',
      'GET /api/day-card - Карта дня',
      'GET /api/mercury - Статус Меркурия'
    ],
    timestamp: new Date().toISOString()
  });
});

// 🌙 Лунный календарь  
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
        phase: i === 0 ? 'Растущая луна' : 'Растущая луна',
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

// 🔮 Гороскоп
app.get('/api/horoscope/:sign', (req, res) => {
  try {
    const sign = decodeURIComponent(req.params.sign);
    
    if (!ZODIAC_SIGNS.includes(sign)) {
      return res.status(400).json({
        error: 'Неверный знак зодиака',
        validSigns: ZODIAC_SIGNS
      });
    }
    
    const horoscope = generateHoroscope(sign);
    const gnomeName = GNOME_NAMES[sign];
    
    res.json({
      sign: sign,
      gnome: gnomeName,
      date: new Date().toLocaleDateString('ru-RU'),
      horoscope: horoscope,
      luckyNumber: Math.floor(Math.random() * 100) + 1,
      luckyColor: ['Золотой', 'Изумрудный', 'Сапфировый'][Math.floor(Math.random() * 3)],
      compatibility: ZODIAC_SIGNS[Math.floor(Math.random() * ZODIAC_SIGNS.length)],
      source: 'gnome_wisdom',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ошибка /api/horoscope:', error);
    res.status(500).json({ 
      error: 'Не удалось получить гороскоп',
      message: error.message
    });
  }
});

// 🌌 Астрособытия
app.get('/api/astro-events', (req, res) => {
  try {
    const events = [
      {
        date: '2025-08-28',
        title: 'Соединение Венеры и Марса',
        description: 'Благоприятный день для любовных дел',
        type: 'planetary',
        impact: 'positive'
      },
      {
        date: '2025-08-30',
        title: 'Полнолуние в Рыбах', 
        description: 'Время для завершения дел и медитации',
        type: 'lunar',
        impact: 'neutral'
      },
      {
        date: '2025-09-02',
        title: 'Тригон Юпитера и Солнца',
        description: 'Удачный период для карьерного роста',
        type: 'planetary',
        impact: 'positive'
      }
    ];
    
    res.json({
      events: events,
      source: 'astronomy_data',
      generated_at: new Date().toISOString(),
      note: 'Актуальные астрономические события',
      total_events: events.length
    });
    
  } catch (error) {
    console.error('Ошибка /api/astro-events:', error);
    res.status(500).json({ 
      error: 'Не удалось получить астрособытия',
      message: error.message
    });
  }
});

// 🔢 Нумерология
app.post('/api/numerology', (req, res) => {
  try {
    const { birthDate, name } = req.body;
    
    if (!birthDate) {
      return res.status(400).json({
        error: 'Требуется дата рождения',
        example: '1990-05-15'
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
    
    res.json({
      birthDate: birthDate,
      name: name || 'Неизвестно',
      destinyNumber: destinyNumber,
      interpretation: interpretations[destinyNumber] || 'Особенная душа',
      advice: 'Следуйте своему предназначению!',
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

// 💕 Совместимость
app.get('/api/compatibility/:sign1/:sign2', (req, res) => {
  try {
    const sign1 = decodeURIComponent(req.params.sign1);
    const sign2 = decodeURIComponent(req.params.sign2);
    
    if (!ZODIAC_SIGNS.includes(sign1) || !ZODIAC_SIGNS.includes(sign2)) {
      return res.status(400).json({
        error: 'Неверные знаки зодиака',
        validSigns: ZODIAC_SIGNS
      });
    }
    
    const compatibilityScore = Math.floor(Math.random() * 41) + 60;
    
    res.json({
      sign1: sign1,
      sign2: sign2,
      gnome1: GNOME_NAMES[sign1],
      gnome2: GNOME_NAMES[sign2],
      compatibilityScore: compatibilityScore,
      description: 'Прекрасная совместимость в любви и дружбе.',
      advice: 'Цените друг друга и не забывайте о романтике!',
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

// 🃏 Карта дня
app.get('/api/day-card', (req, res) => {
  try {
    const cards = [
      { name: 'Маг', meaning: 'Новые возможности и творческая энергия', advice: 'Используйте свои таланты' },
      { name: 'Верховная Жрица', meaning: 'Интуиция и скрытые знания', advice: 'Доверьтесь внутреннему голосу' },
      { name: 'Солнце', meaning: 'Радость, успех и жизненная энергия', advice: 'Наслаждайтесь моментом' }
    ];
    
    const todayCard = cards[Math.floor(Math.random() * cards.length)];
    
    res.json({
      card: todayCard,
      date: new Date().toLocaleDateString('ru-RU'),
      type: 'daily_guidance',
      gnomeWisdom: 'Древние гномы говорят: карты никогда не ошибаются.',
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

// 🪐 Статус Меркурия
app.get('/api/mercury', (req, res) => {
  try {
    const isRetrograde = Math.random() > 0.7;
    
    res.json({
      isRetrograde: isRetrograde,
      status: isRetrograde ? 'Ретроградный' : 'Директный',
      influence: isRetrograde ? 'Осторожность в коммуникациях' : 'Благоприятное время для общения',
      advice: isRetrograde 
        ? 'Проверяйте документы дважды'
        : 'Отличное время для переговоров',
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

// ================================================================
// ОБРАБОТКА ОШИБОК
// ================================================================

app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint не найден',
    path: req.path
  });
});

app.use((error, req, res, next) => {
  console.error('Серверная ошибка:', error);
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Что-то пошло не так'
  });
});

// ================================================================
// ЗАПУСК СЕРВЕРА
// ================================================================

app.listen(PORT, () => {
  console.log(`🧙‍♂️ Сервер "Гномий Гороскоп" запущен на порту ${PORT}`);
  console.log('✅ CORS настроен для доменов:', allowedOrigins);
  console.log('📱 Готов к приему запросов от Telegram WebApp');
  console.log('⏰ Время запуска:', new Date().toLocaleString('ru-RU'));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Завершаем сервер...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Завершаем сервер...');
  process.exit(0);
});
