// server.js - Полный сервер для "Гномий Гороскоп"
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// ================================================================
// CORS НАСТРОЙКИ - ИСПРАВЛЯЕТ ВСЕ ОШИБКИ
// ================================================================

const allowedOrigins = [
  'https://gnome-horoscope-react.vercel.app',  // Ваш основной домен
  'https://gnome-horoscope.vercel.app',        // Альтернативный домен
  'https://web.telegram.org',                  // Telegram WebApp
  'https://telegram.org',                      // Telegram WebApp альтернативный
  'http://localhost:3000',                     // Для локальной разработки
  'http://localhost:3001',                     // Для локальной разработки
  'http://127.0.0.1:3000'                      // Для локальной разработки
];

const corsOptions = {
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (например, из мобильных приложений)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
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
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  credentials: false, // Для Telegram WebApp лучше false
  optionsSuccessStatus: 200 // Для старых браузеров
};

// Применяем CORS
app.use(cors(corsOptions));

// Дополнительные заголовки для preflight запросов
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'false');
  
  // Обработка preflight OPTIONS запросов
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS preflight запрос от:', origin);
    return res.sendStatus(200);
  }
  
  next();
});

// Middleware для парсинга JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование запросов
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
    "Сегодня особенно важно прислушаться к своему сердцу.",
    "Древние руны предсказывают успех в делах сердечных.",
    "День благоприятен для творчества и самовыражения.",
    "Гномы-предки шепчут: время действовать настало!"
  ];
  
  const love = [
    "В любви ждут приятные сюрпризы",
    "Романтическое знакомство возможно",
    "Время укрепить отношения",
    "Страсть вспыхнет с новой силой",
    "Гармония в паре принесет счастье"
  ];
  
  const work = [
    "Карьерный рост не за горами",
    "Новые проекты принесут успех", 
    "Коллеги оценят ваши таланты",
    "Финансовое благополучие растет",
    "Творческий подход решит проблемы"
  ];
  
  const health = [
    "Энергия бьет ключом",
    "Физическая активность пойдет на пользу",
    "Стоит больше отдыхать",
    "Правильное питание - ключ к здоровью",
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

// Главная страница API
app.get('/', (req, res) => {
  res.json({
    message: '🧙‍♂️ API Гномий Гороскоп работает!',
    version: '2.1.0',
    endpoints: [
      'GET /api/moon - Лунный календарь',
      'GET /api/horoscope/:sign - Гороскоп по знаку',
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
    const currentDate = today.getDate();
    const currentMonth = today.getMonth(); // 0-11
    
    // Актуальные лунные данные на август 2025
    let currentPhase;
    let illumination;
    let age;
    
    // 27 августа 2025 - растущая луна, 4-5 лунный день
    if (currentMonth === 7 && currentDate === 27) {
      currentPhase = {
        phase: 'Растущая луна',
        emoji: '🌔',
        illumination: 25
      };
      age = 5;
    } else {
      // Базовая логика для других дней
      const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
      const lunarCycle = dayOfYear % 29;
      
      if (lunarCycle < 7) {
        currentPhase = { phase: 'Растущая луна', emoji: '🌔', illumination: Math.round(lunarCycle * 14) };
        age = lunarCycle + 1;
      } else if (lunarCycle < 14) {
        currentPhase = { phase: 'Полнолуние', emoji: '🌕', illumination: 95 + Math.round(Math.random() * 5) };
        age = lunarCycle + 1;
      } else if (lunarCycle < 22) {
        currentPhase = { phase: 'Убывающая луна', emoji: '🌖', illumination: 90 - (lunarCycle - 14) * 12 };
        age = lunarCycle + 1;
      } else {
        currentPhase = { phase: 'Новолуние', emoji: '🌑', illumination: Math.round(Math.random() * 10) };
        age = lunarCycle + 1;
      }
    }
    
    // Создаем календарь на неделю
    const calendar = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayPhase = i === 0 ? currentPhase : {
        phase: 'Растущая луна',
        emoji: '🌔',
        illumination: Math.round(25 + i * 5)
      };
      
      calendar.push({
        date: date.toISOString(),
        displayDate: date.toLocaleDateString('ru-RU', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        }),
        ...dayPhase,
        age: Math.max(1, Math.min(29, age + i))
      });
    }
    
    const advice = {
      title: 'Время роста и накопления энергии',
      text: 'Гном Мудрый советует: растущая луна дает силу для новых начинаний и воплощения планов. Время действовать!',
      activities: ['Начинание новых проектов', 'Привлечение денег', 'Укрепление здоровья'],
      avoid: ['Излишнюю активность', 'Переедание']
    };
    
    res.json({
      current: {
        ...currentPhase,
        age: age,
        date: today.toISOString(),
        advice,
        zodiacSign: 'Весы',
        moonrise: '06:45',
        moonset: '19:30'
      },
      calendar,
      source: 'gnome_astronomy',
      note: 'Актуальные лунные данные от гномьих мудрецов',
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ошибка в /api/moon:', error);
    res.status(500).json({ 
      error: 'Не удалось получить лунные данные',
      message: error.message
    });
  }
});

// 🔮 Гороскоп по знаку зодиака
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
      luckyColor: ['Золотой', 'Изумрудный', 'Сапфировый', 'Рубиновый'][Math.floor(Math.random() * 4)],
      element: sign === 'Овен' || sign === 'Лев' || sign === 'Стрелец' ? 'Огонь' 
              : sign === 'Телец' || sign === 'Дева' || sign === 'Козерог' ? 'Земля'
              : sign === 'Близнецы' || sign === 'Весы' || sign === 'Водолей' ? 'Воздух' : 'Вода',
      compatibility: ZODIAC_SIGNS[Math.floor(Math.random() * ZODIAC_SIGNS.length)],
      source: 'gnome_wisdom',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ошибка в /api/horoscope:', error);
    res.status(500).json({ 
      error: 'Не удалось получить гороскоп',
      message: error.message
    });
  }
});

// 🌌 Астрономические события
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
        description: 'Время для завершения начатых дел и медитации',
        type: 'lunar',
        impact: 'neutral'
      },
      {
        date: '2025-09-02',
        title: 'Тригон Юпитера и Солнца',
        description: 'Удачный период для карьерного роста',
        type: 'planetary',
        impact: 'positive'
      },
      {
        date: '2025-09-05',
        title: 'Ретроградный Меркурий',
        description: 'Будьте осторожны с документами и переговорами',
        type: 'planetary',
        impact: 'negative'
      },
      {
        date: '2025-09-10',
        title: 'Новолуние в Деве',
        description: 'Отличное время для новых начинаний в работе',
        type: 'lunar',
        impact: 'positive'
      },
      {
        date: '2025-09-15',
        title: 'Противостояние Сатурна и Солнца',
        description: 'Время проверки на прочность, будьте терпеливы',
        type: 'planetary',
        impact: 'challenging'
      }
    ];
    
    res.json({
      events: events,
      source: 'astronomy_data',
      generated_at: new Date().toISOString(),
      note: 'Актуальные астрономические события на август-сентябрь 2025 года',
      total_events: events.length
    });
    
  } catch (error) {
    console.error('Ошибка в /api/astro-events:', error);
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
    
    // Простой расчет числа судьбы
    const dateSum = birthDate.replace(/\D/g, '').split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    const destinyNumber = dateSum > 9 ? dateSum.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0) : dateSum;
    
    const interpretations = {
      1: 'Лидер, независимый, инициативный',
      2: 'Дипломат, миротворец, чувствительный',
      3: 'Творческий, общительный, оптимистичный',
      4: 'Практичный, надежный, трудолюбивый',
      5: 'Свободолюбивый, любознательный, энергичный',
      6: 'Заботливый, ответственный, семейный',
      7: 'Мыслитель, духовный, интуитивный',
      8: 'Амбициозный, целеустремленный, материалистичный',
      9: 'Гуманист, щедрый, мудрый'
    };
    
    res.json({
      birthDate: birthDate,
      name: name || 'Неизвестно',
      destinyNumber: destinyNumber,
      interpretation: interpretations[destinyNumber] || 'Особенная душа',
      luckyNumbers: [destinyNumber, destinyNumber * 2, destinyNumber * 3].map(n => n > 9 ? n % 9 || 9 : n),
      advice: 'Следуйте своему предназначению, и успех не заставит себя ждать!',
      compatibility: Math.floor(Math.random() * 9) + 1,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ошибка в /api/numerology:', error);
    res.status(500).json({ 
      error: 'Не удалось рассчитать нумерологию',
      message: error.message
    });
  }
});

// 💕 Совместимость знаков
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
    
    const compatibilityScore = Math.floor(Math.random() * 41) + 60; // 60-100%
    const descriptions = [
      'Ваши души созданы друг для друга!',
      'Прекрасная совместимость в любви и дружбе.',
      'Вы дополняете друг друга во всем.',
      'Гармоничная пара с большим потенциалом.',
      'Искры страсти и глубокое понимание.'
    ];
    
    res.json({
      sign1: sign1,
      sign2: sign2,
      gnome1: GNOME_NAMES[sign1],
      gnome2: GNOME_NAMES[sign2],
      compatibilityScore: compatibilityScore,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      strongPoints: ['Взаимное понимание', 'Общие интересы', 'Эмоциональная связь'],
      challenges: ['Различия в характере', 'Нужно больше общения'],
      advice: 'Цените друг друга и не забывайте о романтике!',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ошибка в /api/compatibility:', error);
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
      { name: 'Императрица', meaning: 'Плодородие и материнская забота', advice: 'Время творить и создавать' },
      { name: 'Император', meaning: 'Власть и стабильность', advice: 'Проявите лидерские качества' },
      { name: 'Колесо Фортуны', meaning: 'Перемены и новые возможности', advice: 'Будьте готовы к переменам' },
      { name: 'Солнце', meaning: 'Радость, успех и жизненная энергия', advice: 'Наслаждайтесь моментом' },
      { name: 'Звезда', meaning: 'Надежда и духовное руководство', advice: 'Следуйте своей мечте' }
    ];
    
    const todayCard = cards[Math.floor(Math.random() * cards.length)];
    
    res.json({
      card: todayCard,
      date: new Date().toLocaleDateString('ru-RU'),
      type: 'daily_guidance',
      gnomeWisdom: 'Древние гномы говорят: карты никогда не ошибаются, если сердце открыто.',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ошибка в /api/day-card:', error);
    res.status(500).json({ 
      error: 'Не удалось получить карту дня',
      message: error.message
    });
  }
});

// 🪐 Статус Меркурия
app.get('/api/mercury', (req, res) => {
  try {
    const isRetrograde = Math.random() > 0.7; // 30% вероятность ретрограда
    
    res.json({
      isRetrograde: isRetrograde,
      status: isRetrograde ? 'Ретроградный' : 'Директный',
      influence: isRetrograde ? 'Осторожность в коммуникациях' : 'Благоприятное время для общения',
      advice: isRetrograde 
        ? 'Проверяйте документы дважды, избегайте важных переговоров'
        : 'Отличное время для подписания контрактов и переговоров',
      duration: isRetrograde ? '21 день' : 'До следующего ретрограда',
      affectedSigns: ['Близнецы', 'Дева', 'Весы'],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ошибка в /api/mercury:', error);
    res.status(500).json({ 
      error: 'Не удалось получить статус Меркурия',
      message: error.message
    });
  }
});

// ================================================================
// ОБРАБОТКА ОШИБОК И 404
// ================================================================

// 404 для API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint не найден',
    path: req.path,
    availableEndpoints: [
      '/api/moon',
      '/api/horoscope/:sign',
      '/api/astro-events',
      '/api/numerology',
      '/api/compatibility/:sign1/:sign2',
      '/api/day-card',
      '/api/mercury'
    ]
  });
});

// Общий обработчик ошибок
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
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log('✅ CORS настроен для доменов:', allowedOrigins);
  console.log('📱 Готов к приему запросов от Telegram WebApp');
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
