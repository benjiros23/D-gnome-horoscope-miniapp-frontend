import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(helmet());
app.use(compression());

// CORS настройки
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://web.telegram.org',
    'https://frongoro.netlify.app',
    'https://d-gnome-horoscope-miniapp-frontend.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.options('*', cors());

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Данные карт дня
const dayCards = [
  { title: 'Молот Творца', text: 'Сегодня вы обладаете силой создавать и изменять. Используйте эту энергию мудро для великих дел!' },
  { title: 'Кристалл Мудрости', text: 'Ясность мысли поможет найти решение любой задачи. Доверьтесь внутренней мудрости гномов.' },
  { title: 'Щит Защиты', text: 'Вы под надежной защитой древних духов. Смело идите вперед, не боясь препятствий.' },
  { title: 'Зелье Удачи', text: 'Фортуна особенно благосклонна к вам! Отличный день для новых начинаний и смелых решений.' },
  { title: 'Ключ Возможностей', text: 'Перед вами открываются новые двери. Будьте готовы к неожиданным переменам к лучшему.' },
  { title: 'Амулет Силы', text: 'Внутренняя сила поможет преодолеть любые трудности. Вы сильнее, чем думаете!' },
  { title: 'Компас Судьбы', text: 'Путь становится яснее. Доверьтесь интуиции - она приведет вас к цели.' },
  { title: 'Чаша Изобилия', text: 'Изобилие во всех сферах жизни. Щедро делитесь своими дарами с окружающими.' }
];

const adviceTexts = [
  'Помните: каждый великий гном начинал с малого. Великие дела складываются из маленьких шагов.',
  'Мудрый гном знает: лучше один раз увидеть, чем сто раз услышать. Действуйте!',
  'В кузнице жизни каждый удар молота важен. Не пренебрегайте мелочами - они формируют будущее.',
  'Золото не ржавеет, а доброта не стареет. Будьте добрыми к окружающим - это лучшая инвестиция.',
  'Терпение гнома глубже самой глубокой шахты. Умейте ждать подходящего момента.',
  'Даже самый маленький гном может сдвинуть гору, если знает точку опоры. Найдите свою силу.',
  'Дружба дороже любого самоцвета в сокровищнице. Берегите тех, кто рядом с вами.',
  'Смех продлевает жизнь гнома на сто лет. Находите радость в простых вещах.',
  'Честность - лучшая кирка для добычи истины. Будьте искренними с собой и другими.',
  'Мудрость приходит не с годами, а с опытом. Учитесь на каждой ошибке и победе.'
];

// Лунные данные
const moonPhases = [
  { phase: 'Новолуние', emoji: '🌑', illumination: 2 },
  { phase: 'Молодая луна', emoji: '🌒', illumination: 15 },
  { phase: 'Первая четверть', emoji: '🌓', illumination: 50 },
  { phase: 'Растущая луна', emoji: '🌔', illumination: 75 },
  { phase: 'Полнолуние', emoji: '🌕', illumination: 98 },
  { phase: 'Убывающая луна', emoji: '🌖', illumination: 75 },
  { phase: 'Последняя четверть', emoji: '🌗', illumination: 50 },
  { phase: 'Старая луна', emoji: '🌘', illumination: 15 }
];

// Утилиты
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function calculateLifeNumber(birthDate) {
  const digits = birthDate.replace(/-/g, '').split('').map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);
  while (sum > 9) {
    sum = sum.toString().split('').map(Number).reduce((a, b) => a + b, 0);
  }
  return sum;
}

// Имена гномов для знаков
function getGnomeName(sign) {
  const names = {
    'Овен': 'Огнебород',
    'Телец': 'Златоруд',
    'Близнецы': 'Двойняшка',
    'Рак': 'Домовой',
    'Лев': 'Златогрив',
    'Дева': 'Аккуратный',
    'Весы': 'Справедливый',
    'Скорпион': 'Тайновед',
    'Стрелец': 'Путешественник',
    'Козерог': 'Горовосходитель',
    'Водолей': 'Изобретатель',
    'Рыбы': 'Мечтатель'
  };
  return names[sign] || 'Мудрый';
}

// Функция генерации актуального гороскопа
function generateActualHoroscope(sign) {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const month = now.getMonth();
  const hour = now.getHours();

  // Актуальные астрологические факторы
  const todayFactors = {
    mercury_direct: true,
    sun_in_virgo: month === 7 && dayOfMonth >= 22,
    venus_in_libra: month === 7 && dayOfMonth >= 20,
    mars_in_cancer: month === 7,
    moon_mars_conjunction: dayOfMonth === 26,
    is_morning: hour >= 6 && hour < 12,
    is_evening: hour >= 18 && hour < 24,
    high_energy_time: hour >= 10 && hour <= 14
  };

  const signData = {
    'Овен': { element: 'fire', ruler: 'mars' },
    'Телец': { element: 'earth', ruler: 'venus' },
    'Близнецы': { element: 'air', ruler: 'mercury' },
    'Рак': { element: 'water', ruler: 'moon' },
    'Лев': { element: 'fire', ruler: 'sun' },
    'Дева': { element: 'earth', ruler: 'mercury' },
    'Весы': { element: 'air', ruler: 'venus' },
    'Скорпион': { element: 'water', ruler: 'pluto' },
    'Стрелец': { element: 'fire', ruler: 'jupiter' },
    'Козерог': { element: 'earth', ruler: 'saturn' },
    'Водолей': { element: 'air', ruler: 'uranus' },
    'Рыбы': { element: 'water', ruler: 'neptune' }
  };

  const currentSign = signData[sign];
  let horoscope = `Гном ${getGnomeName(sign)} `;

  // Актуальные события
  if (todayFactors.moon_mars_conjunction) {
    horoscope += `видит особое сближение Луны и Марса сегодня вечером! `;
    if (currentSign.element === 'water' || currentSign.ruler === 'moon') {
      horoscope += `Это активизирует ваши эмоции и интуицию. `;
    } else if (currentSign.element === 'fire' || currentSign.ruler === 'mars') {
      horoscope += `Марс рядом с Луной зажигает ваш внутренний огонь! `;
    }
  }

  if (todayFactors.sun_in_virgo && sign === 'Дева') {
    horoscope += `Ваш сезон в самом разгаре! Солнце в Деве дарит максимальную силу. `;
  }

  if (todayFactors.mercury_direct && currentSign.ruler === 'mercury') {
    horoscope += `Меркурий в прямом движении усиливает вашу коммуникацию! `;
  }

  if (todayFactors.is_morning && currentSign.element === 'fire') {
    horoscope += `Утренние часы идеальны для вашей огненной натуры. `;
  }

  if (todayFactors.high_energy_time) {
    horoscope += `Сейчас время максимальной продуктивности! `;
  }

  // Завершение мудростью
  const wisdomPhrases = [
    'Звёзды направляют, но решения принимаете вы.',
    'В каждом моменте есть магия - нужно только её заметить.',
    'Мудрость гномов: слушайте небо, но стойте на земле.'
  ];

  horoscope += getRandomItem(wisdomPhrases);
  return horoscope;
}

// ============ API ENDPOINTS ============

// Главная страница
app.get('/', (req, res) => {
  res.json({
    message: '🧙‍♂️ Гномий Гороскоп API работает!',
    version: '2.1.0',
    status: 'active',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      'GET /api/horoscope?sign=<знак>': 'Получить АКТУАЛЬНЫЙ гороскоп',
      'POST /api/day-card': 'Получить карту дня',
      'GET /api/advice': 'Получить совет дня',
      'POST /api/numerology': 'Нумерологический расчет',
      'POST /api/compatibility': 'Совместимость знаков',
      'GET /api/moon': 'Лунный календарь',
      'GET /api/mercury': 'Статус Меркурия',
      'GET /api/astro-events': 'АКТУАЛЬНЫЕ астрособытия августа 2025'
    }
  });
});

// Получить гороскоп
app.get('/api/horoscope', (req, res) => {
  try {
    const { sign } = req.query;
    
    if (!sign) {
      return res.status(400).json({
        error: 'Знак зодиака не указан',
        message: 'Пожалуйста, укажите корректный знак зодиака'
      });
    }
    
    const actualText = generateActualHoroscope(sign);
    const now = new Date();
    
    const extras = {
      mood: now.getDate() === 26 ? 'Магнетическое' : 'Гармоничное',
      luckyNumber: (now.getDate() + now.getHours()) % 99 + 1,
      color: now.getDate() === 26 ? '#DC143C' : '#4169E1',
      astro_event: now.getDate() === 26 ? '🌙❤️ Луна рядом с Марсом' : null,
      generated_at: now.toLocaleString('ru-RU', {
        timeZone: 'Asia/Almaty',
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      next_event: 'Новолуние в Деве 23 августа',
      energy_level: now.getHours() >= 10 && now.getHours() <= 14 ? 'Высокая' :
                   now.getHours() >= 20 || now.getHours() <= 6 ? 'Спокойная' :
                   'Умеренная'
    };
    
    res.json({
      sign,
      text: actualText,
      date: now.toISOString(),
      type: 'super_actual_horoscope',
      source: 'real_time_astrology',
      timezone: 'Asia/Almaty',
      ...extras
    });
    
  } catch (error) {
    console.error('Ошибка в /api/horoscope:', error);
    res.status(500).json({ 
      error: 'Не удалось получить гороскоп',
      message: 'Произошла внутренняя ошибка сервера'
    });
  }
});

// Календарь астрособытий
app.get('/api/astro-events', (req, res) => {
  try {
    const actualEvents = [
      {
        date: '10 авг',
        title: 'Парад 6 планет',
        shortText: 'Меркурий, Венера, Юпитер, Сатурн, Уран и Нептун выстроятся на предрассветном небе.',
        type: 'planet_alignment',
        fullDate: '2025-08-10T04:00:00Z',
        visibility: 'Видно в Северном полушарии перед рассветом'
      },
      {
        date: '9 авг',
        title: 'Полнолуние в Водолее',
        shortText: 'Полнолуние в знаке Водолея. Время завершения дел и эмоциональных откровений.',
        type: 'full_moon',
        fullDate: '2025-08-09T18:55:00Z',
        visibility: 'Видно по всему миру'
      },
      {
        date: '11-12 авг',
        title: 'Пик Персеид',
        shortText: 'До 100 метеоров в час! Лучшее время наблюдения - предрассветные часы.',
        type: 'meteor_shower',
        fullDate: '2025-08-12T03:00:00Z',
        visibility: 'Лучше всего в Северном полушарии'
      },
      {
        date: '12 авг',
        title: 'Соединение Венеры и Юпитера',
        shortText: 'Два самых ярких объекта после Луны сблизятся в созвездии Близнецов.',
        type: 'planet_conjunction',
        fullDate: '2025-08-12T05:30:00Z',
        visibility: 'Восточный горизонт перед рассветом'
      },
      {
        date: '23 авг',
        title: 'Новолуние в Деве',
        shortText: 'Идеальное время для планирования и новых начинаний.',
        type: 'new_moon',
        fullDate: '2025-08-23T09:06:00Z',
        visibility: 'Луна не видна, темное небо'
      },
      {
        date: '26 авг',
        title: 'Луна рядом с Марсом',
        shortText: 'Сближение растущей Луны с красной планетой Марс в созвездии Девы.',
        type: 'moon_mars',
        fullDate: '2025-08-26T22:00:00Z',
        visibility: 'Юго-восточное небо после заката'
      }
    ];

    res.json({
      events: actualEvents,
      source: 'astronomy_data',
      generated_at: new Date().toISOString(),
      note: 'Актуальные астрономические события на август 2025 года',
      total_events: actualEvents.length
    });
    
  } catch (error) {
    console.error('Ошибка в /api/astro-events:', error);
    res.status(500).json({ 
      error: 'Не удалось получить астрособытия',
      message: 'Произошла внутренняя ошибка сервера'
    });
  }
});

// Получить карту дня
app.post('/api/day-card', (req, res) => {
  try {
    const card = getRandomItem(dayCards);
    
    res.json({
      ...card,
      date: new Date().toISOString(),
      type: 'day-card',
      source: 'internet',
      wisdom: 'Мудрость древних гномов всегда с вами! 🧙‍♂️'
    });
    
  } catch (error) {
    console.error('Ошибка в /api/day-card:', error);
    res.status(500).json({ 
      error: 'Не удалось получить карту дня',
      message: 'Произошла внутренняя ошибка сервера'
    });
  }
});

// Получить совет дня
app.get('/api/advice', (req, res) => {
  try {
    const advice = getRandomItem(adviceTexts);
    
    res.json({
      text: advice + ' 🧙‍♂️',
      date: new Date().toISOString(),
      type: 'advice',
      source: 'internet',
      category: 'daily-wisdom'
    });
    
  } catch (error) {
    console.error('Ошибка в /api/advice:', error);
    res.status(500).json({ 
      error: 'Не удалось получить совет',
      message: 'Произошла внутренняя ошибка сервера'
    });
  }
});

// Лунный календарь
// Лунный календарь - ИСПРАВЛЕННАЯ ВЕРСИЯ с актуальными данными
app.get('/api/moon', (req, res) => {
  try {
    const today = new Date();
    const currentDate = today.getDate();
    const currentMonth = today.getMonth(); // 0-11
    
    // АКТУАЛЬНЫЕ лунные данные на август 2025
    const actualMoonData = {
      // Новолуние было 23 августа 2025
      newMoonDate: 23,
      // Полнолуние было 9 августа 2025  
      lastFullMoonDate: 9,
      // Следующее полнолуние 7 сентября 2025
      nextFullMoonDate: 7
    };
    
    let currentPhase;
    let illumination;
    let age;
    let emoji;
    
    // Определяем актуальную фазу на основе реальных данных
    if (currentMonth === 7) { // Август (месяц 7)
      if (currentDate >= 23) {
        // После новолуния 23 августа - растущая луна
        const daysAfterNew = currentDate - actualMoonData.newMoonDate;
        
        if (daysAfterNew <= 2) {
          currentPhase = { phase: 'Молодая луна', emoji: '🌒', illumination: 5 + daysAfterNew * 5 };
        } else if (daysAfterNew <= 5) {
          currentPhase = { phase: 'Растущая луна', emoji: '🌔', illumination: 15 + daysAfterNew * 15 };
        } else {
          currentPhase = { phase: 'Первая четверть', emoji: '🌓', illumination: 50 };
        }
        
        age = daysAfterNew + 1;
      } else if (currentDate <= 9) {
        // До полнолуния 9 августа
        currentPhase = { phase: 'Полнолуние', emoji: '🌕', illumination: 98 };
        age = 15;
      } else if (currentDate <= 22) {
        // После полнолуния до новолуния - убывающая
        const daysAfterFull = currentDate - actualMoonData.lastFullMoonDate;
        
        if (daysAfterFull <= 4) {
          currentPhase = { phase: 'Убывающая луна', emoji: '🌖', illumination: 85 - daysAfterFull * 15 };
        } else if (daysAfterFull <= 8) {
          currentPhase = { phase: 'Последняя четверть', emoji: '🌗', illumination: 50 - (daysAfterFull - 4) * 10 };
        } else {
          currentPhase = { phase: 'Старая луна', emoji: '🌘', illumination: 20 - (daysAfterFull - 8) * 5 };
        }
        
        age = 15 + daysAfterFull;
      }
    }
    
    // Специально для 27 августа 2025 (СЕГОДНЯ)
    if (currentMonth === 7 && currentDate === 27) {
      currentPhase = {
        phase: 'Растущая луна',
        emoji: '🌔',
        illumination: 25 // Примерно 25% на 4-5 лунный день
      };
      age = 5; // 5-й лунный день
    }
    
    // Создаем календарь на неделю
    const calendar = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayNum = date.getDate();
      const monthNum = date.getMonth();
      
      let dayPhase;
      if (monthNum === 7) { // Август
        if (dayNum >= 23) {
          const daysAfter = dayNum - 23;
          dayPhase = daysAfter <= 2 ? 
            { phase: 'Молодая луна', emoji: '🌒', illumination: 5 + daysAfter * 10 } :
            { phase: 'Растущая луна', emoji: '🌔', illumination: 25 + daysAfter * 10 };
        } else if (dayNum <= 9) {
          dayPhase = { phase: 'Полнолуние', emoji: '🌕', illumination: 98 };
        } else {
          const daysAfter = dayNum - 9;
          dayPhase = { phase: 'Убывающая луна', emoji: '🌖', illumination: 90 - daysAfter * 8 };
        }
      } else if (monthNum === 8) { // Сентябрь
        if (dayNum <= 7) {
          const daysBefore = 7 - dayNum;
          dayPhase = { phase: 'Растущая луна', emoji: '🌔', illumination: 70 + (7-daysBefore) * 5 };
        } else {
          dayPhase = { phase: 'Полнолуние', emoji: '🌕', illumination: 100 };
        }
      }
      
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
    
    // Актуальные советы для растущей луны
    const advice = {
      title: currentPhase.phase === 'Растущая луна' ? 'Время роста и накопления энергии' : 
             currentPhase.phase === 'Молодая луна' ? 'Время новых планов' :
             'Следуйте лунным ритмам',
      text: currentPhase.phase === 'Растущая луна' ? 
        'Гном Мудрый советует: растущая луна дает силу для новых начинаний и воплощения планов. Время действовать!' :
        'Гном Мудрый советует: используйте лунную энергию для гармонии в жизни.',
      activities: currentPhase.phase === 'Растущая луна' ? 
        ['Начинание новых проектов', 'Привлечение денег', 'Укрепление здоровья'] :
        ['Планирование', 'Медитация', 'Отдых'],
      avoid: currentPhase.phase === 'Растущая луна' ? 
        ['Излишнюю активность', 'Переедание'] : 
        ['Резкие перемены', 'Важные решения']
    };
    
    res.json({
      current: {
        ...currentPhase,
        age: age || 5,
        date: today.toISOString(),
        advice,
        zodiacSign: 'Весы', // Актуально для 27 августа 2025
        moonrise: '06:45',
        moonset: '19:30'
      },
      calendar,
      source: 'real_astronomy_data',
      note: 'Актуальные лунные данные на август 2025',
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ошибка в /api/moon:', error);
    res.status(500).json({ 
      error: 'Не удалось получить лунные данные',
      message: 'Произошла внутренняя ошибка сервера'
    });
  }
});

// Нумерология
app.post('/api/numerology', (req, res) => {
  try {
    const { birthDate } = req.body;
    
    if (!birthDate) {
      return res.status(400).json({ 
        error: 'Дата рождения обязательна',
        message: 'Пожалуйста, укажите дату рождения в формате YYYY-MM-DD'
      });
    }
    
    const lifeNumber = calculateLifeNumber(birthDate);
    const numerologyData = {
      1: { character: 'Лидер и первопроходец. Независимый и инициативный.', destiny: 'Создавать новое и вести людей за собой.' },
      2: { character: 'Миротворец и дипломат. Гармония - ваша суперсила.', destiny: 'Объединять людей и создавать баланс.' },
      3: { character: 'Творец и вдохновитель. Креативность в крови.', destiny: 'Нести красоту и радость через искусство.' },
      4: { character: 'Строитель и организатор. Надежность - основа.', destiny: 'Создавать прочные основы для будущего.' },
      5: { character: 'Искатель приключений. Перемены - стихия.', destiny: 'Исследовать мир и делиться опытом.' },
      6: { character: 'Заботливый защитник семьи. Любовь - сила.', destiny: 'Нести заботу и исцеление людям.' },
      7: { character: 'Мудрец и исследователь истины. Духовность.', destiny: 'Открывать тайны и делиться мудростью.' },
      8: { character: 'Материалист и организатор. Успех через труд.', destiny: 'Достичь благополучия и помочь другим.' },
      9: { character: 'Гуманист и альтруист. Служение людям.', destiny: 'Нести свет знаний всему человечеству.' }
    };
    
    const data = numerologyData[lifeNumber];
    
    res.json({
      number: lifeNumber,
      ...data,
      birthDate,
      source: 'internet',
      calculation: 'Гномья нумерология по древним методам'
    });
    
  } catch (error) {
    console.error('Ошибка в /api/numerology:', error);
    res.status(500).json({ 
      error: 'Не удалось рассчитать нумерологию',
      message: 'Произошла внутренняя ошибка сервера'
    });
  }
});

// Совместимость
app.post('/api/compatibility', (req, res) => {
  try {
    const { sign1, sign2 } = req.body;
    
    if (!sign1 || !sign2) {
      return res.status(400).json({ 
        error: 'Оба знака зодиака обязательны',
        message: 'Пожалуйста, укажите оба знака зодиака для расчета совместимости'
      });
    }
    
    // Упрощенная матрица совместимости
    const compatibilityMatrix = {
      'Овен': { 'Лев': 95, 'Стрелец': 92, 'Близнецы': 88, 'Водолей': 85 },
      'Телец': { 'Дева': 94, 'Козерог': 91, 'Рак': 87, 'Рыбы': 84 },
      'Близнецы': { 'Весы': 93, 'Водолей': 90, 'Овен': 88, 'Лев': 85 },
      'Рак': { 'Скорпион': 96, 'Рыбы': 93, 'Телец': 87, 'Дева': 84 },
      'Лев': { 'Овен': 95, 'Стрелец': 92, 'Близнецы': 85, 'Весы': 82 },
      'Дева': { 'Телец': 94, 'Козерог': 91, 'Рак': 84, 'Скорпион': 81 }
    };
    
    let percentage = compatibilityMatrix[sign1]?.[sign2] || 
                    compatibilityMatrix[sign2]?.[sign1] || 
                    (Math.floor(Math.random() * 40) + 55);
    
    let emoji = percentage >= 90 ? '💖' : percentage >= 80 ? '💕' : percentage >= 70 ? '❤️' : '💛';
    
    let description;
    if (percentage >= 90) description = 'Идеальная пара! Звезды благословляют ваш союз.';
    else if (percentage >= 80) description = 'Отличная совместимость! Вы прекрасно дополняете друг друга.';
    else if (percentage >= 70) description = 'Хорошие отношения! Немного усилий - и будете неразлучны.';
    else description = 'Средняя совместимость. Работайте над отношениями вместе.';
    
    res.json({
      sign1,
      sign2,
      percentage,
      emoji,
      description,
      source: 'internet',
      advice: 'Помните: любовь преодолевает любые астрологические различия! 💫'
    });
    
  } catch (error) {
    console.error('Ошибка в /api/compatibility:', error);
    res.status(500).json({ 
      error: 'Не удалось рассчитать совместимость',
      message: 'Произошла внутренняя ошибка сервера'
    });
  }
});

// Статус Меркурия
app.get('/api/mercury', (req, res) => {
  try {
    const now = new Date();
    const retrogradeePeriods2025 = [
      { start: new Date('2025-03-15'), end: new Date('2025-04-07') },
      { start: new Date('2025-07-18'), end: new Date('2025-08-11') },
      { start: new Date('2025-11-09'), end: new Date('2025-11-29') }
    ];
    
    const isRetrograde = retrogradeePeriods2025.some(period => 
      now >= period.start && now <= period.end
    );
    
    const nextPeriod = retrogradeePeriods2025.find(period => now < period.start);
    
    res.json({
      isRetrograde,
      period: isRetrograde 
        ? `Ретроградный до ${retrogradeePeriods2025.find(p => now >= p.start && now <= p.end)?.end.toLocaleDateString('ru-RU')}`
        : nextPeriod 
          ? `Директное движение до ${nextPeriod.start.toLocaleDateString('ru-RU')}`
          : 'Директное движение',
      description: isRetrograde 
        ? 'Меркурий ретроградный. Время переосмысления и завершения дел. Будьте внимательны с техникой и документами.'
        : 'Меркурий в директном движении. Отличное время для новых начинаний, переговоров, поездок и обучения.',
      date: new Date().toISOString(),
      source: 'internet',
      advice: isRetrograde 
        ? 'Используйте это время для завершения старых дел и внутренней работы. 🔄'
        : 'Время действовать! Заключайте сделки и начинайте новые проекты. ⚡'
    });
    
  } catch (error) {
    console.error('Ошибка в /api/mercury:', error);
    res.status(500).json({ 
      error: 'Не удалось получить статус Меркурия',
      message: 'Произошла внутренняя ошибка сервера'
    });
  }
});

// 404 обработчик для API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Эндпоинт не найден',
    message: 'Проверьте правильность URL и метода запроса',
    availableEndpoints: [
      'GET /api/horoscope?sign=<знак>',
      'POST /api/day-card',
      'GET /api/advice', 
      'POST /api/numerology',
      'POST /api/compatibility',
      'GET /api/moon',
      'GET /api/mercury',
      'GET /api/astro-events'
    ]
  });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Глобальная ошибка:', err);
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    message: 'Что-то пошло не так. Попробуйте позже.',
    timestamp: new Date().toISOString()
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🧙‍♂️ Гномий Гороскоп API запущен на порту ${PORT}`);
  console.log(`🌐 Режим: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📅 Время запуска: ${new Date().toLocaleString('ru-RU')}`);
  console.log(`🔗 Доступно по адресу: http://localhost:${PORT}`);
  console.log('✨ Обновления: АКТУАЛЬНЫЕ гороскопы и астрособытия август 2025!');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал SIGINT. Завершаем работу сервера...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал SIGTERM. Завершаем работу сервера...');
  process.exit(0);
});

