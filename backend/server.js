const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios'); // Добавить в package.json
const cheerio = require('cheerio'); // Для парсинга HTML
const NodeCache = require('node-cache'); // Для кэширования

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';

// Кэш на 4 часа (гороскопы обновляются не так часто)
const cache = new NodeCache({ stdTTL: 14400 });

// Middleware как было раньше...
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
    origin: [
        'https://d-gnome-horoscope-miniapp-frontend.vercel.app',
        'https://web.telegram.org'
    ],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Слишком много запросов, попробуйте позже' }
});
app.use('/api/', limiter);

// Соответствие знаков зодиака для разных API
const zodiacMapping = {
    // Русские знаки -> английские для API
    'Овен': 'aries',
    'Телец': 'taurus',
    'Близнецы': 'gemini',
    'Рак': 'cancer',
    'Лев': 'leo',
    'Дева': 'virgo',
    'Весы': 'libra',
    'Скорпион': 'scorpio',
    'Стрелец': 'sagittarius',
    'Козерог': 'capricorn',
    'Водолей': 'aquarius',
    'Рыбы': 'pisces'
};

// Функция получения гороскопа из Aztro API
async function getHoroscopeFromAztro(sign) {
    try {
        const englishSign = zodiacMapping[sign];
        if (!englishSign) throw new Error('Неизвестный знак зодиака');

        const response = await axios.post(
            `https://aztro.sameerkumar.website/?sign=${englishSign}&day=today`,
            {},
            { timeout: 10000 }
        );

        return {
            text: response.data.description,
            source: 'Aztro API',
            compatibility: response.data.compatibility,
            mood: response.data.mood,
            color: response.data.color,
            luckyNumber: response.data.lucky_number,
            luckyTime: response.data.lucky_time
        };
    } catch (error) {
        console.error('Ошибка Aztro API:', error.message);
        throw error;
    }
}

// Функция получения гороскопа из альтернативного API
async function getHoroscopeFromBackup(sign) {
    try {
        const englishSign = zodiacMapping[sign];
        const response = await axios.get(
            `https://horoscope-app-api.vercel.app/api/v1/get-horoscope/daily?sign=${englishSign}&day=TODAY`,
            { timeout: 10000 }
        );

        return {
            text: response.data.data.horoscope_data,
            source: 'Horoscope App API',
            date: response.data.data.date
        };
    } catch (error) {
        console.error('Ошибка Backup API:', error.message);
        throw error;
    }
}

// Функция парсинга российского сайта
async function parseRussianHoroscope(sign) {
    try {
        // Парсим astro.ru (пример)
        const signNumbers = {
            'Овен': 1, 'Телец': 2, 'Близнецы': 3, 'Рак': 4,
            'Лев': 5, 'Дева': 6, 'Весы': 7, 'Скорпион': 8,
            'Стрелец': 9, 'Козерог': 10, 'Водолей': 11, 'Рыбы': 12
        };

        const signNum = signNumbers[sign];
        const url = `https://astro.ru/horoscope/daily/${signNum}`;
        
        const response = await axios.get(url, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        
        // Ищем текст гороскопа (селектор может отличаться)
        const horoscopeText = $('.horoscope-text').text() || 
                             $('.daily-horoscope p').text() ||
                             $('article p').first().text();

        if (!horoscopeText || horoscopeText.length < 50) {
            throw new Error('Не удалось найти текст гороскопа');
        }

        return {
            text: horoscopeText.trim(),
            source: 'astro.ru',
            language: 'ru'
        };
    } catch (error) {
        console.error('Ошибка парсинга astro.ru:', error.message);
        throw error;
    }
}

// Альтернативный парсинг с goroskop.ru
async function parseGoroskopRu(sign) {
    try {
        const signUrls = {
            'Овен': 'aries', 'Телец': 'taurus', 'Близнецы': 'gemini',
            'Рак': 'cancer', 'Лев': 'leo', 'Дева': 'virgo',
            'Весы': 'libra', 'Скорпион': 'scorpio', 'Стрелец': 'sagittarius',
            'Козерог': 'capricorn', 'Водолей': 'aquarius', 'Рыбы': 'pisces'
        };

        const url = `https://goroskop.ru/publish/${signUrls[sign]}/`;
        
        const response = await axios.get(url, {
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GnomeBot/1.0)' }
        });

        const $ = cheerio.load(response.data);
        const horoscopeText = $('.goroskop-text').text() || 
                             $('.horoscope-today').text() ||
                             $('[data-horoscope]').text();

        if (!horoscopeText || horoscopeText.length < 30) {
            throw new Error('Не удалось найти текст гороскопа');
        }

        return {
            text: horoscopeText.trim(),
            source: 'goroskop.ru',
            language: 'ru'
        };
    } catch (error) {
        console.error('Ошибка парсинга goroskop.ru:', error.message);
        throw error;
    }
}

// Главная функция получения гороскопа с fallback'ами
async function getLiveHoroscope(sign) {
    const cacheKey = `horoscope_${sign}_${new Date().toDateString()}`;
    
    // Проверяем кэш
    const cached = cache.get(cacheKey);
    if (cached) {
        console.log(`Гороскоп для ${sign} взят из кэша`);
        return cached;
    }

    const sources = [
        () => parseRussianHoroscope(sign),  // Сначала русский сайт
        () => parseGoroskopRu(sign),        // Резервный русский
        () => getHoroscopeFromAztro(sign),  // Английский API
        () => getHoroscopeFromBackup(sign)  // Резервный API
    ];

    for (const source of sources) {
        try {
            const result = await source();
            if (result && result.text) {
                // Добавляем гномий колорит к полученному тексту
                const gnomeText = addGnomeStyle(result.text, sign);
                
                const finalResult = {
                    ...result,
                    text: gnomeText,
                    cached: false,
                    obtainedAt: new Date().toISOString()
                };
                
                // Кэшируем результат
                cache.set(cacheKey, finalResult);
                console.log(`Гороскоп для ${sign} получен из источника: ${result.source}`);
                return finalResult;
            }
        } catch (error) {
            console.warn(`Источник недоступен: ${error.message}`);
            continue;
        }
    }

    // Если все источники недоступны, возвращаем fallback
    return getFallbackHoroscope(sign);
}

// Функция добавления гномьего стиля к тексту
function addGnomeStyle(originalText, sign) {
    const gnomeNames = {
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

    const gnomeName = gnomeNames[sign];
    const gnomeIntros = [
        `${gnomeName} внимательно изучил звезды и сообщает: `,
        `Древняя мудрость гномов гласит: `,
        `${gnomeName} заглянул в магический кристалл и увидел: `,
        `Гномьи летописи предсказывают: `
    ];

    const randomIntro = gnomeIntros[Math.floor(Math.random() * gnomeIntros.length)];
    
    return randomIntro + originalText + ` 🧙‍♂️✨`;
}

// Fallback гороскоп если все источники недоступны
function getFallbackHoroscope(sign) {
    const fallbackTexts = {
        'Овен': 'Звезды временно скрыты облаками, но гном Огнебород советует: будьте смелы сегодня!',
        'Телец': 'Небесные тела играют в прятки, но мудрый гном Златоруд знает: терпение - ваша сила.',
        'Близнецы': 'Астральные вихри мешают видеть четко, но гном Двойняшка уверен: общение принесет удачу.',
        // ... остальные знаки
    };

    return {
        text: fallbackTexts[sign] || 'Звезды молчат сегодня, но гномы всегда с вами! 🧙‍♂️',
        source: 'Fallback',
        cached: false,
        obtainedAt: new Date().toISOString()
    };
}

// Обновленный API endpoint для гороскопа
// Добавьте эту строку в ваш server.js ПОСЛЕ всех других настроек, но ПЕРЕД app.listen()

app.get('/', (req, res) => {
    res.json({ 
        message: '🧙‍♂️ Гномий Гороскоп API работает!',
        version: '1.0.0',
        status: 'active',
        node_version: process.version,
        timestamp: new Date().toISOString(),
        endpoints: {
            'GET /api/horoscope?sign=<знак>': 'Получить гороскоп для знака зодиака',
            'POST /api/day-card': 'Получить карту дня',
            'GET /api/advice?sign=<знак>': 'Получить совет дня',
            'POST /api/numerology': 'Нумерологический расчет',
            'POST /api/compatibility': 'Совместимость знаков',
            'GET /api/mercury': 'Статус ретроградного Меркурия',
            'GET /api/health': 'Проверка здоровья API'
        },
        supportedSigns: Object.keys(horoscopeTexts || {})
    });
});


// Остальные endpoints остаются без изменений...
// (day-card, advice, numerology, compatibility, mercury)

app.listen(PORT, () => {
    console.log(`🧙‍♂️ Сервер "Живой Гномий Гороскоп" запущен на порту ${PORT}`);
    console.log(`🌐 Подключены источники: astro.ru, goroskop.ru, Aztro API`);
    console.log(`💾 Кэширование: 4 часа`);
});

module.exports = app;


