D-Gnome Horoscope — backend

This Express backend provides:
- / (GET) — status
- /api/genai (POST) — proxy to Google Generative Language API (use server-side API key)
- /api/moon (GET) — scrape moon data from my-calend.ru (cached)
- /api/horoscope/:sign (GET) — placeholder horoscope
- /api/day-card (GET) — placeholder card

Setup
1. Copy `.env.example` to `.env` and set `GOOGLE_API_KEY` and `FRONTEND_URL`.
2. Install dependencies:

   npm install

3. Run locally:

   # PowerShell
   $Env:GOOGLE_API_KEY="your_google_key"
   npm run dev

Deployment (Render)
1. Create a new Web Service on Render and connect this repository (or the folder containing `backend/`).
2. You can use the provided `render.yaml` manifest — Render will read it when you create a new service from the repo. Alternatively, create a Web Service manually:
   - Build command: `npm install`
   - Start command: `npm start` (or use the `Procfile` already included)
3. Set environment variables in Render service settings:
   - `GOOGLE_API_KEY` — ваш серверный ключ Google Generative API (НЕ храните в фронте)
   - `FRONTEND_URL` — URL фронтенда, например `https://d-gnome-horoscope-miniapp-frontend.onrender.com`
4. Deploy. After successful deploy:
   - Open `<your-render-url>/` — should return the status JSON.
   - `<your-render-url>/api/moon` — проверка лунных данных.

Render checklist
- Ensure repository root contains the `backend` folder or that you point Render to the `backend` subdirectory when creating the service.
- Include `render.yaml` in the repo root (already added in `backend/render.yaml`) to auto-provision service settings.


Frontend integration
- Replace direct Google GenAI calls with POST to `/api/genai` on your backend.
- For moon data, request GET `/api/moon`.

Notes
- The moon scraping is best-effort; my-calend.ru may change its DOM — adjust selectors if needed.
- Keep `GOOGLE_API_KEY` secret and never embed it in frontend code.
# 🧙‍♂️ Гномий Гороскоп API v2.0

Enhanced Backend для Telegram WebApp с гороскопами, картами дня и расширенными функциями.

## ✨ Новые функции v2.0

### 🎯 **Персонализация**
- Сохранение настроек пользователя (знак зодиака, время рождения, локация)
- Персональные темы (светлая/темная)
- Выбор языка интерфейса
- Настройка времени уведомлений

### 📱 **Push-уведомления**
- Ежедневные гороскопы по расписанию
- Персональное время получения уведомлений
- Интеграция с Telegram Bot API
- Логирование отправленных уведомлений

### 🌐 **Социальные функции**
- Репост гороскопов и карт дня
- Создание уникальных ссылок для репостов
- Счетчик просмотров общего контента
- Система репостов с красивыми ссылками

### 💎 **Премиум функции**
- Расширенные гороскопы с детализацией
- Совместимость по знакам зодиака
- Карьерные советы и рекомендации по здоровью
- Счастливые числа и цвета
- Влияние Луны и персональные инсайты

### 📊 **Аналитика**
- Отслеживание активности пользователей
- Статистика использования функций
- История действий пользователя
- Глобальная аналитика приложения

### 🔮 **Актуальные данные**
- Интеграция с внешними API гороскопов
- Fallback на локальные темплейты
- Кеширование для оптимизации
- Реальные астрологические данные

## 🚀 Новые API Endpoints

### Персонализация
```http
POST /api/user/settings    # Сохранить настройки
GET  /api/user/settings    # Получить настройки
```

### Премиум функции
```http
POST /api/horoscope/premium    # Получить премиум гороскоп
```

### Социальные функции
```http
POST /api/share               # Создать репост
GET  /api/shared/{id}         # Получить общий контент
```

### Аналитика
```http
GET /api/analytics/user       # Персональная аналитика
GET /api/analytics/global     # Глобальная статистика
```

## 🗄️ Новые таблицы БД

- **user_settings** - Настройки пользователей
- **user_analytics** - Логи действий для аналитики
- **shared_content** - Репосты и общий контент
- **push_notifications** - История уведомлений

## 🚀 Деплой на Render

1. Создайте аккаунт на [Render.com](https://render.com)
2. Подключите этот GitHub репозиторий
3. Выберите "Web Service"
4. Настройте переменные окружения:
   - `BOT_TOKEN`: Токен вашего Telegram бота
   - `API_KEY_HOROSCOPE`: Ключ для внешних API (опционально)
   - `NODE_ENV`: `production`

## 🔧 Локальная разработка

```bash
# Установка зависимостей
pip install -r requirements.txt

# Запуск сервера
python main.py

# Тестирование API
python test_enhanced_api.py
```

## 📋 Требования

- Python 3.8+
- FastAPI 0.104+
- SQLite3 (встроенная)
- Requests для внешних API

## 🔒 Безопасность

- Проверка подлинности Telegram WebApp данных
- Валидация входных параметров
- Защита от SQL инъекций
- Логирование всех действий

## 📈 Мониторинг

- Health check endpoint: `/health`
- Логирование ошибок в консоль
- Аналитика использования функций
- Счетчики активности

## 🎮 Тестирование

Используйте `test_enhanced_api.py` для проверки всех новых функций:

```bash
python test_enhanced_api.py
```

## 📖 API Документация

После запуска сервера доступна по адресу:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

**Версия:** 2.0.0  
**Автор:** Команда Астро Гном  
**Лицензия:** MIT

- Логирование отправленных уведомлений

### 🌐 **Социальные функции**
- Репост гороскопов и карт дня
- Создание уникальных ссылок для репостов
- Счетчик просмотров общего контента
- Система репостов с красивыми ссылками

### 💎 **Премиум функции**
- Расширенные гороскопы с детализацией
- Совместимость по знакам зодиака
- Карьерные советы и рекомендации по здоровью
- Счастливые числа и цвета
- Влияние Луны и персональные инсайты

### 📊 **Аналитика**
- Отслеживание активности пользователей
- Статистика использования функций
- История действий пользователя
- Глобальная аналитика приложения

### 🔮 **Актуальные данные**
- Интеграция с внешними API гороскопов
- Fallback на локальные темплейты
- Кеширование для оптимизации
- Реальные астрологические данные

## 🚀 Новые API Endpoints

### Персонализация
```http
POST /api/user/settings    # Сохранить настройки
GET  /api/user/settings    # Получить настройки
```

### Премиум функции
```http
POST /api/horoscope/premium    # Получить премиум гороскоп
```

### Социальные функции
```http
POST /api/share               # Создать репост
GET  /api/shared/{id}         # Получить общий контент
```

### Аналитика
```http
GET /api/analytics/user       # Персональная аналитика
GET /api/analytics/global     # Глобальная статистика
```

## 🗄️ Новые таблицы БД

- **user_settings** - Настройки пользователей
- **user_analytics** - Логи действий для аналитики
- **shared_content** - Репосты и общий контент
- **push_notifications** - История уведомлений

## 🚀 Деплой на Render

1. Создайте аккаунт на [Render.com](https://render.com)
2. Подключите этот GitHub репозиторий
3. Выберите "Web Service"
4. Настройте переменные окружения:
   - `BOT_TOKEN`: Токен вашего Telegram бота
   - `API_KEY_HOROSCOPE`: Ключ для внешних API (опционально)
   - `NODE_ENV`: `production`

## 🔧 Локальная разработка

```bash
# Установка зависимостей
pip install -r requirements.txt

# Запуск сервера
python main.py

# Тестирование API
python test_enhanced_api.py
```

## 📋 Требования

- Python 3.8+
- FastAPI 0.104+
- SQLite3 (встроенная)
- Requests для внешних API

## 🔒 Безопасность

- Проверка подлинности Telegram WebApp данных
- Валидация входных параметров
- Защита от SQL инъекций
- Логирование всех действий

## 📈 Мониторинг

- Health check endpoint: `/health`
- Логирование ошибок в консоль
- Аналитика использования функций
- Счетчики активности

## 🎮 Тестирование

Используйте `test_enhanced_api.py` для проверки всех новых функций:

```bash
python test_enhanced_api.py
```

## 📖 API Документация

После запуска сервера доступна по адресу:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

**Версия:** 2.0.0  
**Автор:** Команда Астро Гном  
**Лицензия:** MIT

