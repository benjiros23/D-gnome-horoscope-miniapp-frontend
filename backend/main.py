import os
import sqlite3
import json
import hashlib
import hmac
import time
import random
import requests
from datetime import datetime, timezone, timedelta
from urllib.parse import unquote, parse_qs
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import asyncio

# Настройки
BOT_TOKEN = os.getenv("BOT_TOKEN", "8314608234:AAFQUNz63MECCtExqaKGqg02qm0GWv0Nbz4")  # Переместить в .env!
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://gilded-blancmange-ecc392.netlify.app")
API_KEY_HOROSCOPE = os.getenv("API_KEY_HOROSCOPE", "")  # Для внешних API гороскопов

app = FastAPI(title="Gnome Horoscope API", version="2.0.0")

# Pydantic модели
class UserSettings(BaseModel):
    user_id: int
    zodiac_sign: str
    birth_time: Optional[str] = None
    birth_location: Optional[str] = None
    notification_time: Optional[str] = "09:00"
    premium: bool = False
    language: str = "ru"
    theme: str = "light"

# CORS для фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://gilded-blancmange-ecc392.netlify.app",
        "https://gilded-blancmange-ecc392.netlify.app/",
        "https://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Маппинг знаков зодиака
ZODIAC_MAP = {
    "Овен": "aries", "Телец": "taurus", "Близнецы": "gemini", "Рак": "cancer",
    "Лев": "leo", "Дева": "virgo", "Весы": "libra", "Скорпион": "scorpio",
    "Стрелец": "sagittarius", "Козерог": "capricorn", 
    "Водолей": "aquarius", "Рыбы": "pisces"
}

# Пул гороскопов для локального использования
HOROSCOPE_TEMPLATES = [
    "Звезды советуют вам проявить инициативу! Сегодня удачный день для новых начинаний.",
    "Прислушайтесь к своей интуиции - она не подведет в важных решениях.",
    "День благоприятен для общения и установления новых контактов.",
    "Сосредоточьтесь на семейных делах, близкие нуждаются в вашей поддержке.",
    "Время проявить творческие способности! Не бойтесь экспериментировать.",
    "Практичный подход к делам принесет отличные результаты.",
    "Ищите баланс во всем - работе, отдыхе и отношениях.",
    "Глубокий анализ ситуации поможет найти неожиданное решение.",
    "Расширьте горизонты! Новые знания откроют перспективы.",
    "Терпение и настойчивость - ключ к достижению цели.",
    "Время для смелых идей и нестандартных решений!",
    "Доверьтесь течению жизни, интуиция подскажет верный путь."
]

# Карты дня
DAY_CARDS = [
    {"название": "Гном-авантюрист", "совет": "Сегодня время для смелых решений! Не бойся рискнуть - фортуна любит храбрых."},
    {"название": "Гном-повар", "совет": "День для заботы о своем теле и душе. Приготовь что-то вкусное или побалуй себя."},
    {"название": "Гном-садовник", "совет": "Время посадить семена будущих успехов. Небольшие действия сегодня принесут большие плоды."},
    {"название": "Гном-изобретатель", "совет": "Креативность зашкаливает сегодня! Придумай что-то новое или реши задачу нестандартным способом."},
    {"название": "Гном-музыкант", "совет": "Найди свой ритм дня. Включи любимую музыку и позволь мелодии вести тебя к успеху."},
    {"название": "Гном-философ", "совет": "Размышления принесут ясность. Уделите время анализу своих целей и желаний."},
    {"название": "Гном-путешественник", "совет": "Новые места и впечатления ждут! Даже короткая прогулка может стать приключением."},
    {"название": "Гном-мастер", "совет": "Руки помнят мудрость. Займитесь любимым делом или освойте новый навык."}
]

def get_db():
    """Инициализация базы данных с расширенными таблицами для новых функций"""
    db_path = "database.db"
    conn = sqlite3.connect(db_path)
    
    # Основные таблицы
    conn.execute("""
        CREATE TABLE IF NOT EXISTS daily_cache (
            id INTEGER PRIMARY KEY,
            sign TEXT NOT NULL,
            date TEXT NOT NULL,
            text TEXT NOT NULL,
            created_at TEXT NOT NULL,
            UNIQUE(sign, date)
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS day_cards (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            card_title TEXT NOT NULL,
            card_text TEXT NOT NULL,
            created_at TEXT NOT NULL,
            UNIQUE(user_id, date)
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            content_type TEXT NOT NULL,
            content TEXT NOT NULL,
            added_at TEXT NOT NULL
        )
    """)
    
    # Новые таблицы для расширенного функционала
    conn.execute("""
        CREATE TABLE IF NOT EXISTS user_settings (
            id INTEGER PRIMARY KEY,
            user_id INTEGER UNIQUE NOT NULL,
            zodiac_sign TEXT,
            birth_time TEXT,
            birth_location TEXT,
            notification_time TEXT DEFAULT '09:00',
            premium INTEGER DEFAULT 0,
            language TEXT DEFAULT 'ru',
            theme TEXT DEFAULT 'light',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS user_analytics (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            data TEXT,
            timestamp TEXT NOT NULL
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS shared_content (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            content_type TEXT NOT NULL,
            content TEXT NOT NULL,
            share_text TEXT NOT NULL,
            share_count INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        )
    """)
    
    return conn

def verify_telegram_data(init_data: str) -> Optional[dict]:
    """Проверка подлинности данных Telegram WebApp"""
    try:
        parsed_data = parse_qs(init_data)
        received_hash = parsed_data.get('hash', [''])[0]
        if not received_hash:
            return None
            
        data_to_check = []
        for key, value in parsed_data.items():
            if key != 'hash':
                data_to_check.append(f"{key}={value[0]}")
        
        data_string = '\n'.join(sorted(data_to_check))
        secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_string.encode(), hashlib.sha256).hexdigest()
        
        if calculated_hash == received_hash:
            user_data = parsed_data.get('user', [''])[0]
            if user_data:
                user = json.loads(unquote(user_data))
                return user
                
    except Exception as e:
        print(f"Ошибка проверки Telegram данных: {e}")
        
    return None

def today_key():
    """Получить ключ для текущего дня"""
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")

def log_user_action(user_id: int, action: str, data: Optional[Dict] = None):
    """Логирование действий пользователя для аналитики"""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO user_analytics(user_id, action, data, timestamp) VALUES(?,?,?,?)",
            (user_id, action, json.dumps(data) if data else None, datetime.now(timezone.utc).isoformat())
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Ошибка логирования: {e}")

async def get_real_horoscope_data(sign: str, date: Optional[str] = None) -> str:
    """Получение актуальных данных о гороскопе через внешние API"""
    if not API_KEY_HOROSCOPE:
        seed = hash(f"{sign}{date or today_key()}") % len(HOROSCOPE_TEMPLATES)
        return HOROSCOPE_TEMPLATES[seed]
    
    try:
        english_sign = ZODIAC_MAP.get(sign, sign.lower())
        response = requests.post(
            "https://aztro.sameerkumar.website/",
            params={"sign": english_sign, "day": "today"},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            english_text = data.get("description", "")
            if english_text:
                return f"Гномы читают звезды: {english_text}"
    except Exception as e:
        print(f"Ошибка получения реальных данных: {e}")
    
    seed = hash(f"{sign}{date or today_key()}") % len(HOROSCOPE_TEMPLATES)
    return HOROSCOPE_TEMPLATES[seed]

def generate_premium_horoscope(sign: str, birth_time: Optional[str] = None, location: Optional[str] = None) -> Dict:
    """Генерация расширенного премиум гороскопа"""
    base_horoscope = HOROSCOPE_TEMPLATES[hash(sign + today_key()) % len(HOROSCOPE_TEMPLATES)]
    
    premium_aspects = {
        "detailed_forecast": base_horoscope,
        "love_compatibility": f"Сегодня ваша энергия привлечет нужных людей. Лучшая совместимость с знаками Огня.",
        "career_advice": "Профессиональные возможности открываются через коммуникацию с коллегами.",
        "health_tips": "Обратите внимание на сон и питание - ваше тело нуждается в заботе.",
        "lucky_numbers": [random.randint(1, 50) for _ in range(3)],
        "lucky_colors": ["gold", "emerald", "sapphire"][random.randint(0, 2)],
        "moon_influence": "Луна в третьей четверти усиливает вашу интуицию."
    }
    
    if birth_time:
        premium_aspects["birth_chart_insight"] = f"Ваше время рождения ({birth_time}) дает дополнительную энергию в первой половине дня."
    
    return premium_aspects

# API ENDPOINTS

@app.get("/health")
async def health():
    """Проверка работоспособности API"""
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.get("/api/horoscope")
async def get_horoscope(sign: str, date: Optional[str] = None, user_id: Optional[int] = None):
    """Получить гороскоп для знака зодиака с актуальными данными"""
    if date is None:
        date = today_key()
    
    if sign not in ZODIAC_MAP:
        raise HTTPException(status_code=400, detail="Неизвестный знак зодиака")
    
    if user_id:
        log_user_action(user_id, "get_horoscope", {"sign": sign, "date": date})
    
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("SELECT text FROM daily_cache WHERE sign=? AND date=?", (sign, date))
    row = cur.fetchone()
    
    if row:
        conn.close()
        return {
            "sign": sign,
            "date": date,
            "text": row[0],
            "cached": True,
            "source": "cache"
        }
    
    horoscope_text = await get_real_horoscope_data(sign, date)
    
    cur.execute(
        "INSERT OR REPLACE INTO daily_cache(sign, date, text, created_at) VALUES(?,?,?,?)",
        (sign, date, horoscope_text, datetime.now(timezone.utc).isoformat())
    )
    conn.commit()
    conn.close()
    
    return {
        "sign": sign,
        "date": date,
        "text": horoscope_text,
        "cached": False,
        "source": "real_api" if API_KEY_HOROSCOPE else "template"
    }

@app.post("/api/day-card")
async def get_day_card(request: Request):
    """Получить карту дня (один раз в сутки на пользователя)"""
    try:
        payload = await request.json()
        init_data = payload.get("initData")
        
        if not init_data:
            raise HTTPException(status_code=400, detail="initData отсутствует")
        
        user = verify_telegram_data(init_data)
        user_id = user["id"] if user else 12345
        date = today_key()
        
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute("SELECT card_title, card_text FROM day_cards WHERE user_id=? AND date=?", (user_id, date))
        row = cur.fetchone()
        
        if row:
            conn.close()
            return {
                "title": row[0],
                "text": row[1],
                "reused": True,
                "date": date
            }
        
        card = random.choice(DAY_CARDS)
        
        cur.execute(
            "INSERT INTO day_cards(user_id, date, card_title, card_text, created_at) VALUES(?,?,?,?,?)",
            (user_id, date, card["название"], card["совет"], datetime.now(timezone.utc).isoformat())
        )
        conn.commit()
        conn.close()
        
        log_user_action(user_id, "get_day_card", {"card": card["название"]})
        
        return {
            "title": card["название"],
            "text": card["совет"],
            "reused": False,
            "date": date
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения карты дня: {str(e)}")

@app.post("/api/favorites")
async def add_favorite(request: Request):
    """Добавить в избранное"""
    try:
        payload = await request.json()
        init_data = payload.get("initData")
        content_type = payload.get("type")
        content = payload.get("content")
        
        if not all([init_data, content_type, content]):
            raise HTTPException(status_code=400, detail="Недостаточно данных")
        
        user = verify_telegram_data(init_data)
        user_id = user["id"] if user else 12345
        
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute(
            "INSERT INTO favorites(user_id, content_type, content, added_at) VALUES(?,?,?,?)",
            (user_id, content_type, json.dumps(content, ensure_ascii=False), datetime.now(timezone.utc).isoformat())
        )
        conn.commit()
        conn.close()
        
        log_user_action(user_id, "add_favorite", {"type": content_type})
        
        return {"status": "added", "message": "Добавлено в избранное"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка добавления в избранное: {str(e)}")

@app.get("/api/favorites")
async def get_favorites(init_data: str):
    """Получить избранное пользователя"""
    try:
        if not init_data:
            raise HTTPException(status_code=400, detail="initData отсутствует")
        
        user = verify_telegram_data(init_data)
        user_id = user["id"] if user else 12345
        
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute("SELECT content_type, content, added_at FROM favorites WHERE user_id=? ORDER BY added_at DESC", (user_id,))
        rows = cur.fetchall()
        conn.close()
        
        favorites = []
        for row in rows:
            favorites.append({
                "type": row[0],
                "content": json.loads(row[1]),
                "added_at": row[2]
            })
        
        return {"favorites": favorites}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения избранного: {str(e)}")

# Новые эндпоинты для расширенного функционала

@app.post("/api/user/settings")
async def save_user_settings(request: Request):
    """Сохранение настроек пользователя (Персонализация)"""
    try:
        payload = await request.json()
        init_data = payload.get("initData")
        settings = payload.get("settings")
        
        if not init_data or not settings:
            raise HTTPException(status_code=400, detail="Недостаточно данных")
        
        user = verify_telegram_data(init_data)
        user_id = user["id"] if user else 12345
        
        conn = get_db()
        cur = conn.cursor()
        
        log_user_action(user_id, "save_settings", settings)
        
        now = datetime.now(timezone.utc).isoformat()
        cur.execute("""
            INSERT OR REPLACE INTO user_settings 
            (user_id, zodiac_sign, birth_time, birth_location, notification_time, 
             premium, language, theme, created_at, updated_at) 
            VALUES (?,?,?,?,?,?,?,?,?,?)
        """, (
            user_id,
            settings.get("zodiac_sign"),
            settings.get("birth_time"),
            settings.get("birth_location"),
            settings.get("notification_time", "09:00"),
            settings.get("premium", False),
            settings.get("language", "ru"),
            settings.get("theme", "light"),
            now,
            now
        ))
        
        conn.commit()
        conn.close()
        
        return {"status": "success", "message": "Настройки сохранены"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка сохранения настроек: {str(e)}")

@app.get("/api/user/settings")
async def get_user_settings(init_data: str):
    """Получение настроек пользователя"""
    try:
        user = verify_telegram_data(init_data)
        user_id = user["id"] if user else 12345
        
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT zodiac_sign, birth_time, birth_location, notification_time, 
                   premium, language, theme, created_at 
            FROM user_settings WHERE user_id=?
        """, (user_id,))
        
        row = cur.fetchone()
        conn.close()
        
        if row:
            return {
                "zodiac_sign": row[0],
                "birth_time": row[1],
                "birth_location": row[2],
                "notification_time": row[3],
                "premium": bool(row[4]),
                "language": row[5],
                "theme": row[6],
                "created_at": row[7]
            }
        else:
            return {
                "zodiac_sign": None,
                "birth_time": None,
                "birth_location": None,
                "notification_time": "09:00",
                "premium": False,
                "language": "ru",
                "theme": "light",
                "created_at": None
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения настроек: {str(e)}")

@app.get("/api/analytics/user")
async def get_user_analytics(init_data: str):
    """Получить аналитику пользователя (Аналитика)"""
    try:
        user = verify_telegram_data(init_data)
        user_id = user["id"] if user else 12345
        
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT action, COUNT(*) as count 
            FROM user_analytics 
            WHERE user_id=? 
            GROUP BY action 
            ORDER BY count DESC
        """, (user_id,))
        
        action_stats = {row[0]: row[1] for row in cur.fetchall()}
        
        cur.execute("""
            SELECT action, data, timestamp 
            FROM user_analytics 
            WHERE user_id=? 
            ORDER BY timestamp DESC 
            LIMIT 10
        """, (user_id,))
        
        recent_actions = [{
            "action": row[0],
            "data": json.loads(row[1]) if row[1] else None,
            "timestamp": row[2]
        } for row in cur.fetchall()]
        
        conn.close()
        
        return {
            "user_id": user_id,
            "action_statistics": action_stats,
            "recent_actions": recent_actions,
            "total_actions": sum(action_stats.values())
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения аналитики: {str(e)}")

@app.post("/api/horoscope/premium")
async def get_premium_horoscope(request: Request):
    """Премиум гороскоп с расширенными данными (Премиум функции)"""
    try:
        payload = await request.json()
        init_data = payload.get("initData")
        sign = payload.get("sign")
        
        user = verify_telegram_data(init_data)
        user_id = user["id"] if user else 12345
        
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT premium, birth_time, birth_location FROM user_settings WHERE user_id=?", (user_id,))
        user_data = cur.fetchone()
        conn.close()
        
        log_user_action(user_id, "get_premium_horoscope", {"sign": sign})
        
        birth_time = user_data[1] if user_data else None
        birth_location = user_data[2] if user_data else None
        premium_data = generate_premium_horoscope(sign, birth_time, birth_location)
        
        return {
            "sign": sign,
            "date": today_key(),
            "premium_data": premium_data,
            "user_birth_time": birth_time,
            "user_location": birth_location
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения премиум гороскопа: {str(e)}")

@app.post("/api/share")
async def share_content(request: Request):
    """Поделиться содержимым (Социальные функции)"""
    try:
        payload = await request.json()
        init_data = payload.get("initData")
        content_type = payload.get("content_type")
        content = payload.get("content")
        share_text = payload.get("share_text", "")
        
        user = verify_telegram_data(init_data)
        user_id = user["id"] if user else 12345
        
        conn = get_db()
        cur = conn.cursor()
        
        log_user_action(user_id, "share_content", {"type": content_type})
        
        cur.execute("""
            INSERT INTO shared_content 
            (user_id, content_type, content, share_text, created_at) 
            VALUES (?,?,?,?,?)
        """, (
            user_id,
            content_type,
            json.dumps(content, ensure_ascii=False),
            share_text,
            datetime.now(timezone.utc).isoformat()
        ))
        
        share_id = cur.lastrowid
        conn.commit()
        conn.close()
        
        share_url = f"{FRONTEND_URL}/shared/{share_id}"
        
        return {
            "status": "success",
            "share_id": share_id,
            "share_url": share_url,
            "share_text": f"🧙‍♂️ {share_text} - {share_url} #ГномыйГороскоп"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка создания репоста: {str(e)}")

@app.get("/api/shared/{share_id}")
async def get_shared_content(share_id: int):
    """Получить опубликованный контент"""
    try:
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT content_type, content, share_text, share_count, created_at 
            FROM shared_content WHERE id=?
        """, (share_id,))
        
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Контент не найден")
        
        cur.execute("UPDATE shared_content SET share_count = share_count + 1 WHERE id=?", (share_id,))
        conn.commit()
        conn.close()
        
        return {
            "content_type": row[0],
            "content": json.loads(row[1]),
            "share_text": row[2],
            "views": row[3] + 1,
            "created_at": row[4]
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Ошибка получения контента: {str(e)}")

# Функция для отправки push-уведомлений
async def send_daily_horoscopes():
    """Отправка ежедневных гороскопов через Telegram Bot (Push-уведомления)"""
    try:
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT user_id, zodiac_sign, notification_time 
            FROM user_settings 
            WHERE zodiac_sign IS NOT NULL
        """)
        
        users = cur.fetchall()
        conn.close()
        
        current_time = datetime.now().strftime("%H:%M")
        
        for user_id, zodiac_sign, notification_time in users:
            if notification_time == current_time:
                horoscope_text = await get_real_horoscope_data(zodiac_sign)
                
                telegram_url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
                message_data = {
                    "chat_id": user_id,
                    "text": f"🧙‍♂️ Ваш гороскоп на сегодня ({zodiac_sign}):\n\n{horoscope_text}",
                    "parse_mode": "HTML"
                }
                
                try:
                    response = requests.post(telegram_url, json=message_data, timeout=10)
                    if response.status_code == 200:
                        log_user_action(user_id, "daily_notification_sent", {"sign": zodiac_sign})
                except Exception as e:
                    print(f"Ошибка отправки уведомления {user_id}: {e}")
                    
    except Exception as e:
        print(f"Ошибка отправки ежедневных гороскопов: {e}")

# Для деплоя на Render и локального запуска
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print("🚀 Запуск Gnome Horoscope API v2.0...")
    print(f"📡 CORS для: {FRONTEND_URL}")
    print(f"💾 База данных: database.db (в текущей папке)")
    print("✨ Новые функции: Персонализация, Push-уведомления, Соцсети, Премиум, Аналитика")
    print("🔮 Актуальные данные гороскопов через внешние API")
    uvicorn.run(app, host="0.0.0.0", port=port)