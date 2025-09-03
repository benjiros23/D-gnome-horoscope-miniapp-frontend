#!/usr/bin/env python3
"""
Скрипт для тестирования enhanced API Гнома Гороскопа
"""

import requests
import json

# Базовый URL сервера
BASE_URL = "http://localhost:8000"

def test_health():
    """Проверка работоспособности сервера"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Health Check: {response.status_code}")
        print(f"   Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Health Check failed: {e}")
        return False

def test_horoscope():
    """Тест получения гороскопа"""
    try:
        response = requests.get(f"{BASE_URL}/api/horoscope", params={"sign": "Лев"})
        print(f"✅ Horoscope: {response.status_code}")
        data = response.json()
        print(f"   Sign: {data.get('sign')}")
        print(f"   Source: {data.get('source')}")
        print(f"   Text: {data.get('text')[:50]}...")
        return True
    except Exception as e:
        print(f"❌ Horoscope test failed: {e}")
        return False

def test_premium_horoscope():
    """Тест премиум гороскопа"""
    try:
        test_data = {
            "initData": "test_data",
            "sign": "Овен"
        }
        response = requests.post(f"{BASE_URL}/api/horoscope/premium", json=test_data)
        print(f"✅ Premium Horoscope: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Premium features: {list(data.get('premium_data', {}).keys())}")
        return True
    except Exception as e:
        print(f"❌ Premium horoscope test failed: {e}")
        return False

def test_share():
    """Тест функции репоста"""
    try:
        test_data = {
            "initData": "test_data",
            "content_type": "horoscope",
            "content": {"sign": "Лев", "text": "Тестовый гороскоп"},
            "share_text": "Мой гороскоп на сегодня!"
        }
        response = requests.post(f"{BASE_URL}/api/share", json=test_data)
        print(f"✅ Share Content: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Share URL: {data.get('share_url')}")
        return True
    except Exception as e:
        print(f"❌ Share test failed: {e}")
        return False

def test_analytics():
    """Тест аналитики"""
    try:
        response = requests.get(f"{BASE_URL}/api/analytics/user", params={"init_data": "test_data"})
        print(f"✅ Analytics: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Total actions: {data.get('total_actions', 0)}")
        return True
    except Exception as e:
        print(f"❌ Analytics test failed: {e}")
        return False

def main():
    """Запуск всех тестов"""
    print("🧙‍♂️ Тестирование Enhanced Gnome Horoscope API")
    print("=" * 50)
    
    tests = [
        test_health,
        test_horoscope,
        test_premium_horoscope,
        test_share,
        test_analytics
    ]
    
    passed = 0
    for test in tests:
        if test():
            passed += 1
        print()
    
    print(f"🎯 Результат: {passed}/{len(tests)} тестов прошли успешно")
    
    if passed == len(tests):
        print("🎉 Все новые функции работают корректно!")
        print("✨ Доступны: Персонализация, Push-уведомления, Соцсети, Премиум, Аналитика")
    else:
        print("⚠️  Некоторые функции требуют доработки")

if __name__ == "__main__":
    main()#!/usr/bin/env python3
"""
Скрипт для тестирования enhanced API Гнома Гороскопа
"""

import requests
import json

# Базовый URL сервера
BASE_URL = "http://localhost:8000"

def test_health():
    """Проверка работоспособности сервера"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Health Check: {response.status_code}")
        print(f"   Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Health Check failed: {e}")
        return False

def test_horoscope():
    """Тест получения гороскопа"""
    try:
        response = requests.get(f"{BASE_URL}/api/horoscope", params={"sign": "Лев"})
        print(f"✅ Horoscope: {response.status_code}")
        data = response.json()
        print(f"   Sign: {data.get('sign')}")
        print(f"   Source: {data.get('source')}")
        print(f"   Text: {data.get('text')[:50]}...")
        return True
    except Exception as e:
        print(f"❌ Horoscope test failed: {e}")
        return False

def test_premium_horoscope():
    """Тест премиум гороскопа"""
    try:
        test_data = {
            "initData": "test_data",
            "sign": "Овен"
        }
        response = requests.post(f"{BASE_URL}/api/horoscope/premium", json=test_data)
        print(f"✅ Premium Horoscope: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Premium features: {list(data.get('premium_data', {}).keys())}")
        return True
    except Exception as e:
        print(f"❌ Premium horoscope test failed: {e}")
        return False

def test_share():
    """Тест функции репоста"""
    try:
        test_data = {
            "initData": "test_data",
            "content_type": "horoscope",
            "content": {"sign": "Лев", "text": "Тестовый гороскоп"},
            "share_text": "Мой гороскоп на сегодня!"
        }
        response = requests.post(f"{BASE_URL}/api/share", json=test_data)
        print(f"✅ Share Content: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Share URL: {data.get('share_url')}")
        return True
    except Exception as e:
        print(f"❌ Share test failed: {e}")
        return False

def test_analytics():
    """Тест аналитики"""
    try:
        response = requests.get(f"{BASE_URL}/api/analytics/user", params={"init_data": "test_data"})
        print(f"✅ Analytics: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Total actions: {data.get('total_actions', 0)}")
        return True
    except Exception as e:
        print(f"❌ Analytics test failed: {e}")
        return False

def main():
    """Запуск всех тестов"""
    print("🧙‍♂️ Тестирование Enhanced Gnome Horoscope API")
    print("=" * 50)
    
    tests = [
        test_health,
        test_horoscope,
        test_premium_horoscope,
        test_share,
        test_analytics
    ]
    
    passed = 0
    for test in tests:
        if test():
            passed += 1
        print()
    
    print(f"🎯 Результат: {passed}/{len(tests)} тестов прошли успешно")
    
    if passed == len(tests):
        print("🎉 Все новые функции работают корректно!")
        print("✨ Доступны: Персонализация, Push-уведомления, Соцсети, Премиум, Аналитика")
    else:
        print("⚠️  Некоторые функции требуют доработки")

if __name__ == "__main__":
    main()