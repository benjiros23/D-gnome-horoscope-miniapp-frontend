const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000', // для разработки React
    'https://web.telegram.org',
    'https://d-gnome-horoscope-miniapp-frontend.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());

// Пример эндпоинта — выведите сообщение для всех /api/horoscope?sign=...
app.get('/api/horoscope', (req, res) => {
  const { sign } = req.query;
  res.json({
    sign,
    text: `Гномы глядят на звезды... Ваш знак: ${sign}`,
    date: new Date().toISOString(),
    source: 'demo'
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Гномий Гороскоп API запущен!', version: '1.0.0' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🧙‍♂️ API работает на порту ${PORT}`);
});
