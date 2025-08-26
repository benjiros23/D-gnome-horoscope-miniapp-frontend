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
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://web.telegram.org',
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

// Функция генерации актуального гороскопа
// Улучшенная функция генерации СУПЕР актуального гороскопа
function generateActualHoroscope(sign) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const dayOfMonth = now.getDate();
  const month = now.getMonth();
  const hour = now.getHours();
  const minutes = now.getMinutes();
  
  // Реальные астрологические факторы на СЕГОДНЯ (26 августа 2025)
  const todayFactors = {
    // Актуальные транзиты планет
    mercury_direct: true, // Меркурий директный с 11 августа
    sun_in_virgo: month === 7 && dayOfMonth >= 22, // Солнце в Деве с 22 августа
    venus_in_libra: month === 7 && dayOfMonth >= 20, // Венера в Весах 
    mars_in_cancer: month === 7, // Марс в Раке весь август
    jupiter_in_gemini: true, // Юпитер в Близнецах весь 2025
    
    // Специальные события августа 2025
    perseid_aftermath: dayOfMonth >= 12 && dayOfMonth <= 20, // После Персеид
    leo_season_ending: dayOfMonth <= 22, // Конец сезона Льва
    virgo_season_start: dayOfMonth >= 23, // Начало сезона Девы
    waning_moon: dayOfMonth >= 9 && dayOfMonth <= 23, // Убывающая луна
    
    // Сегодняшние особенности (26 августа)
    moon_mars_conjunction: dayOfMonth === 26, // Луна рядом с Марсом СЕГОДНЯ!
    
    // Время суток
    is_morning: hour >= 6 && hour < 12,
    is_afternoon: hour >= 12 && hour < 18,
    is_evening: hour >= 18 && hour < 24,
    is_night: hour >= 0 && hour < 6,
    
    // Энергетика дня
    high_energy_time: hour >= 10 && hour <= 14,
    reflection_time: hour >= 20 || hour <= 6,
    social_time: hour >= 16 && hour <= 22
  };

  // Расширенные характеристики знаков с планетами-управителями
  const signData = {
    'Овен': { 
      element: 'fire', 
      ruler: 'mars', 
      traits: ['энергичный', 'инициативный', 'страстный'],
      strengths: ['лидерство', 'смелость', 'быстрота решений'],
      challenges: ['импульсивность', 'нетерпеливость']
    },
    'Телец': { 
      element: 'earth', 
      ruler: 'venus', 
      traits: ['стабильный', 'чувственный', 'упорный'],
      strengths: ['надёжность', 'практичность', 'эстетический вкус'],
      challenges: ['упрямство', 'медлительность']
    },
    'Близнецы': { 
      element: 'air', 
      ruler: 'mercury', 
      traits: ['любознательный', 'гибкий', 'коммуникабельный'],
      strengths: ['адаптивность', 'интеллект', 'многозадачность'],
      challenges: ['непостоянство', 'поверхностность']
    },
    'Рак': { 
      element: 'water', 
      ruler: 'moon', 
      traits: ['чувствительный', 'заботливый', 'интуитивный'],
      strengths: ['эмпатия', 'защита близких', 'память'],
      challenges: ['перепады настроения', 'обидчивость']
    },
    'Лев': { 
      element: 'fire', 
      ruler: 'sun', 
      traits: ['творческий', 'щедрый', 'драматичный'],
      strengths: ['харизма', 'креативность', 'вдохновение'],
      challenges: ['эгоизм', 'потребность в признании']
    },
    'Дева': { 
      element: 'earth', 
      ruler: 'mercury', 
      traits: ['аналитичный', 'перфекционист', 'практичный'],
      strengths: ['внимание к деталям', 'организованность', 'служение'],
      challenges: ['критичность', 'тревожность']
    },
    'Весы': { 
      element: 'air', 
      ruler: 'venus', 
      traits: ['гармоничный', 'дипломатичный', 'эстетичный'],
      strengths: ['справедливость', 'партнёрство', 'красота'],
      challenges: ['нерешительность', 'зависимость от других']
    },
    'Скорпион': { 
      element: 'water', 
      ruler: 'pluto', 
      traits: ['интенсивный', 'трансформирующий', 'магнетичный'],
      strengths: ['психология', 'возрождение', 'глубина'],
      challenges: ['ревность', 'мстительность']
    },
    'Стрелец': { 
      element: 'fire', 
      ruler: 'jupiter', 
      traits: ['философский', 'авантюрный', 'оптимистичный'],
      strengths: ['мудрость', 'путешествия', 'расширение горизонтов'],
      challenges: ['безответственность', 'прямолинейность']
    },
    'Козерог': { 
      element: 'earth', 
      ruler: 'saturn', 
      traits: ['амбициозный', 'дисциплинированный', 'ответственный'],
      strengths: ['достижения', 'структура', 'авторитет'],
      challenges: ['пессимизм', 'жёсткость']
    },
    'Водолей': { 
      element: 'air', 
      ruler: 'uranus', 
      traits: ['инновационный', 'независимый', 'гуманитарный'],
      strengths: ['оригинальность', 'технологии', 'дружба'],
      challenges: ['отчуждённость', 'упрямство в идеях']
    },
    'Рыбы': { 
      element: 'water', 
      ruler: 'neptune', 
      traits: ['мечтательный', 'сострадательный', 'артистичный'],
      strengths: ['интуиция', 'духовность', 'творчество'],
      challenges: ['эскапизм', 'жертвенность']
    }
  };

  const currentSign = signData[sign];
  let horoscope = `Гном ${getGnomeName(sign)} `;

  // === АКТУАЛЬНЫЕ СОБЫТИЯ СЕГОДНЯ (26 августа) ===
  if (todayFactors.moon_mars_conjunction) {
    horoscope += `видит особое сближение Луны и Марса прямо СЕГОДНЯ вечером! `;
    
    if (currentSign.element === 'water' || currentSign.ruler === 'moon') {
      horoscope += `Это мощное соединение активизирует ваши эмоции и интуицию. Чувства могут быть особенно яркими. `;
    } else if (currentSign.element === 'fire' || currentSign.ruler === 'mars') {
      horoscope += `Марс рядом с Луной зажигает ваш внутренний огонь! Отличное время для смелых действий и проявления страсти. `;
    } else {
      horoscope += `Это редкое небесное событие принесёт неожиданную энергию в ваши планы. `;
    }
  }

  // === ПЕРЕХОД СОЛНЦА В ДЕВУ (22-23 августа) ===
  if (todayFactors.virgo_season_start) {
    if (sign === 'Дева') {
      horoscope += `🎉 Ваш сезон только начался! Солнце в Деве до 22 сентября дарит вам максимальную силу и уверенность. `;
    } else if (currentSign.element === 'earth') {
      horoscope += `Солнце в Деве поддерживает всех земных знаков. Время практических дел и материальных достижений. `;
    } else {
      horoscope += `Солнце вошло в Деву - период детальной работы и совершенствования навыков. `;
    }
  }

  // === ВЕНЕРА В ВЕСАХ ===
  if (todayFactors.venus_in_libra && (currentSign.ruler === 'venus' || sign === 'Весы')) {
    horoscope += `Венера в Весах особенно благоприятствует вам! Любовь, красота и гармония расцветают в вашей жизни. `;
  }

  // === МЕРКУРИЙ ДИРЕКТНЫЙ ===
  if (todayFactors.mercury_direct && currentSign.ruler === 'mercury') {
    horoscope += `Меркурий в прямом движении усиливает вашу планету-покровителя! Коммуникация, обучение и путешествия идут как по маслу. `;
  }

  // === МАРС В РАКЕ ===
  if (todayFactors.mars_in_cancer) {
    if (sign === 'Рак') {
      horoscope += `Марс в вашем знаке весь август! Это придаёт необычную смелость и энергию для защиты близких. `;
    } else if (currentSign.element === 'water') {
      horoscope += `Марс в водном знаке Рака активизирует вашу эмоциональную энергию. `;
    }
  }

  // === ВРЕМЯ СУТОК ===
  if (todayFactors.is_morning) {
    if (currentSign.element === 'fire') {
      horoscope += `Утренние часы идеально подходят вашей огненной натуре. Начинайте день с активных дел! `;
    } else {
      horoscope += `Утро приносит свежие возможности. `;
    }
  } else if (todayFactors.is_evening) {
    if (currentSign.element === 'water') {
      horoscope += `Вечернее время усиливает вашу интуицию и чувствительность. `;
    } else {
      horoscope += `Вечер благоприятен для подведения итогов дня. `;
    }
  }

  // === ДЕНЬ НЕДЕЛИ (понедельник) ===
  const weeklyAdvice = {
    1: { // Понедельник
      energy: 'Луна управляет понедельником',
      general: 'День для планирования недели и эмоциональной настройки',
      fire: 'Направьте энергию на постановку целей на неделю',
      earth: 'Составьте практический план и расписание',
      air: 'Пообщайтесь с коллегами и обменяйтесь идеями', 
      water: 'Прислушайтесь к интуиции при планировании'
    },
    2: { // Вторник - день Марса
      energy: 'Марс наполняет день силой',
      general: 'Время активных действий и преодоления препятствий',
      fire: 'Ваш день! Действуйте смело и решительно',
      earth: 'Применяйте упорство для достижения целей',
      air: 'Активно продвигайте свои идеи',
      water: 'Защищайте свои интересы и близких'
    }
    // ... можно добавить остальные дни
  };

  const todayAdvice = weeklyAdvice[dayOfWeek];
  if (todayAdvice) {
    horoscope += `${todayAdvice.energy}. ${todayAdvice[currentSign.element] || todayAdvice.general}. `;
  }

  // === ПЕРСОНАЛЬНЫЕ РЕКОМЕНДАЦИИ ===
  if (todayFactors.high_energy_time) {
    horoscope += `Сейчас (${hour}:${minutes.toString().padStart(2, '0')}) - время максимальной продуктивности! `;
  }

  // === ЗАВЕРШЕНИЕ С МУДРОСТЬЮ ГНОМОВ ===
  const wisdomPhrases = [
    'Помните: каждый день приносит новые звёздные дары!',
    'Мудрость гномов: слушайте небо, но стойте на земле.',
    'Звёзды направляют, но решения принимаете вы.',
    'В каждом моменте есть магия - нужно только её заметить.',
    'Гномы знают: лучший гороскоп - это ваши собственные действия!'
  ];

  horoscope += getRandomItem(wisdomPhrases);

  return horoscope;
}

// Обновляем endpoint гороскопа с ещё большей актуальностью
app.get('/api/horoscope', (req, res) => {
  try {
    const { sign } = req.query;
    
    if (!sign) {
      return res.status(400).json({
        error: 'Знак зодиака не указан',
        message: 'Пожалуйста, укажите корректный знак зодиака'
      });
    }
    
    // Генерируем СУПЕР актуальный гороскоп
    const actualText = generateActualHoroscope(sign);
    
    const now = new Date();
    
    // Дополнительная актуальная информация
    const extras = {
      // Настроение зависит от времени и событий
      mood: now.getDate() === 26 ? 'Магнетическое' : // Луна+Марс
            now.getHours() >= 6 && now.getHours() <= 10 ? 'Утреннее' :
            now.getHours() >= 18 && now.getHours() <= 22 ? 'Вечернее' :
            'Гармоничное',
      
      // Счастливые числа на основе даты и времени  
      luckyNumber: (now.getDate() + now.getHours()) % 99 + 1,
      
      // Цвета по текущим планетарным влияниям
      color: now.getDate() === 26 ? '#DC143C' : // Красный для Марса
             now.getMonth() === 7 && now.getDate() >= 22 ? '#8B4513' : // Коричневый для Девы
             '#4169E1', // Синий по умолчанию
      
      // Актуальное астрособытие
      astro_event: now.getDate() === 26 ? '🌙❤️ Луна рядом с Марсом' :
                   now.getDate() >= 22 && now.getDate() <= 30 ? '♍ Солнце в Деве' :
                   null,
      
      // Точное время генерации
      generated_at: now.toLocaleString('ru-RU', {
        timeZone: 'Asia/Almaty',
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      
      // Следующее важное астрособытие
      next_event: 'Новолуние в Деве


// Календарь АКТУАЛЬНЫХ астрособытий
app.get('/api/astro-events', (req, res) => {
  try {
    // Актуальные астрономические события на август 2025
    const actualEvents = [
      {
        date: '10 авг',
        title: 'Парад 6 планет',
        shortText: 'Меркурий, Венера, Юпитер, Сатурн, Уран и Нептун выстроятся на предрассветном небе. 4 планеты видны невооруженным глазом!',
        type: 'planet_alignment',
        fullDate: '2025-08-10T04:00:00Z',
        visibility: 'Видно в Северном полушарии перед рассветом'
      },
      {
        date: '9 авг',
        title: 'Осетровое полнолуние в Водолее',
        shortText: 'Полнолуние в знаке Водолея. Время завершения дел и эмоциональных откровений.',
        type: 'full_moon',
        fullDate: '2025-08-09T18:55:00Z',
        visibility: 'Видно по всему миру'
      },
      {
        date: '11-12 авг',
        title: 'Пик метеорного потока Персеиды',
        shortText: 'До 100 метеоров в час! Один из самых зрелищных звездопадов года. Лучшее время наблюдения - предрассветные часы.',
        type: 'meteor_shower',
        fullDate: '2025-08-12T03:00:00Z',
        visibility: 'Лучше всего в Северном полушарии'
      },
      {
        date: '12 авг',
        title: 'Соединение Венеры и Юпитера',
        shortText: 'Два самых ярких объекта после Луны сблизятся в созвездии Близнецов. Невероятно красивое зрелище!',
        type: 'planet_conjunction',
        fullDate: '2025-08-12T05:30:00Z',
        visibility: 'Восточный горизонт перед рассветом'
      },
      {
        date: '19 авг',
        title: 'Максимальная элонгация Меркурия',
        shortText: 'Меркурий достигнет максимального углового расстояния от Солнца (18°). Наилучший период для наблюдения первой планеты.',
        type: 'planet_transit',
        fullDate: '2025-08-19T06:00:00Z',
        visibility: 'Утреннее небо, до 1.5 часов наблюдения'
      },
      {
        date: '19-21 авг',
        title: 'Луна танцует с планетами',
        shortText: 'Молодая Луна поочередно пройдет рядом с Юпитером (20 авг), Венерой (20 авг) и Меркурием (21 авг).',
        type: 'moon_planets',
        fullDate: '2025-08-20T03:00:00Z',
        visibility: 'Восточный горизонт перед рассветом'
      },
      {
        date: '23 авг',
        title: 'Новолуние в Деве',
        shortText: 'Идеальное время для планирования, организации и новых начинаний. Темное небо отлично подходит для наблюдения звезд.',
        type: 'new_moon',
        fullDate: '2025-08-23T09:06:00Z',
        visibility: 'Луна не видна, темное небо'
      },
      {
        date: '26 авг',
        title: 'Луна рядом с Марсом',
        shortText: 'Сближение растущей Луны с красной планетой Марс в созвездии Девы. Красивая пара на юго-восточном небе.',
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
app.get('/api/moon', (req, res) => {
  try {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    const phaseIndex = dayOfYear % moonPhases.length;
    const currentPhase = moonPhases[phaseIndex];
    
    const calendar = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayNum = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
      const phaseIdx = dayNum % moonPhases.length;
      
      calendar.push({
        date: date.toISOString(),
        displayDate: date.toLocaleDateString('ru-RU', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        }),
        ...moonPhases[phaseIdx],
        age: (dayNum % 29) + 1
      });
    }
    
    const adviceMap = {
      'Новолуние': {
        title: 'Время новых начинаний',
        text: 'Гном Мечтатель советует: сейчас лучшее время для планирования и новых идей. Луна скрыта, но энергия роста уже накапливается.',
        activities: ['Планирование', 'Медитация', 'Постановка целей'],
        avoid: ['Важные решения', 'Крупные покупки']
      },
      'Полнолуние': {
        title: 'Пик энергии и завершений',
        text: 'Гном Маг предупреждает: максимум лунной силы! Завершайте дела, но будьте осторожны с эмоциями.',
        activities: ['Завершение проектов', 'Празднование', 'Благодарность'],
        avoid: ['Импульсивность', 'Конфликты', 'Алкоголь']
      }
    };
    
    const advice = adviceMap[currentPhase.phase] || adviceMap['Новолуние'];
    
    const nextFullMoonDays = 15 - (dayOfYear % 15);
    const nextNewMoonDays = 30 - (dayOfYear % 30);
    
    const nextFullMoon = new Date(today);
    nextFullMoon.setDate(today.getDate() + nextFullMoonDays);
    
    const nextNewMoon = new Date(today);
    nextNewMoon.setDate(today.getDate() + nextNewMoonDays);
    
    res.json({
      current: {
        ...currentPhase,
        age: (dayOfYear % 29) + 1,
        date: today.toISOString(),
        advice
      },
      calendar,
      moonrise: '06:45',
      moonset: '19:30',
      nextFullMoon: nextFullMoon.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
      nextNewMoon: nextNewMoon.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
      source: 'internet',
      cached_until: `${dateString}T23:59:59.999Z`
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
    
    const compatibilityMatrix = {
      'Овен': { 'Лев': 95, 'Стрелец': 92, 'Близнецы': 88, 'Водолей': 85 },
      'Телец': { 'Дева': 94, 'Козерог': 91, 'Рак': 87, 'Рыбы': 84 },
      'Близнецы': { 'Весы': 93, 'Водолей': 90, 'Овен': 88, 'Лев': 85 },
      'Рак': { 'Скорпион': 96, 'Рыбы': 93, 'Телец': 87, 'Дева': 84 },
      'Лев': { 'Овен': 95, 'Стрелец': 92, 'Близнецы': 85, 'Весы': 82 },
      'Дева': { 'Телец': 94, 'Козерог': 91, 'Рак': 84, 'Скорпион': 81 },
      'Весы': { 'Близнецы': 93, 'Водолей': 90, 'Лев': 82, 'Стрелец': 79 },
      'Скорпион': { 'Рак': 96, 'Рыбы': 93, 'Дева': 81, 'Козерог': 78 },
      'Стрелец': { 'Овен': 92, 'Лев': 92, 'Весы': 79, 'Водолей': 76 },
      'Козерог': { 'Дева': 91, 'Телец': 91, 'Скорпион': 78, 'Рыбы': 75 },
      'Водолей': { 'Близнецы': 90, 'Весы': 90, 'Овен': 85, 'Стрелец': 76 },
      'Рыбы': { 'Скорпион': 93, 'Рак': 93, 'Телец': 84, 'Козерог': 75 }
    };
    
    let percentage = compatibilityMatrix[sign1]?.[sign2] || 
                    compatibilityMatrix[sign2]?.[sign1] || 
                    (Math.floor(Math.random() * 40) + 55);
    
    let emoji = percentage >= 90 ? '💖' : percentage >= 80 ? '💕' : percentage >= 70 ? '❤️' : '💛';
    
    let description;
    if (percentage >= 90) description = 'Идеальная пара! Звезды благословляют ваш союз гармонией и взаимопониманием.';
    else if (percentage >= 80) description = 'Отличная совместимость! Вы прекрасно дополняете друг друга во всех сферах жизни.';
    else if (percentage >= 70) description = 'Хорошие отношения! Немного усилий - и будете неразлучны как гномы в горах.';
    else description = 'Средняя совместимость. Работайте над отношениями вместе - гномья мудрость поможет!';
    
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
        ? 'Меркурий ретроградный. Время переосмысления и завершения дел. Будьте внимательны с техникой и документами. Отличный период для медитации и внутренней работы.'
        : 'Меркурий в директном движении. Отличное время для новых начинаний, переговоров, поездок и обучения. Коммуникация течет легко и ясно.',
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

