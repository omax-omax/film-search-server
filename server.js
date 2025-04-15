const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();

// Разрешаем запросы с любых доменов (для фронтенда)
app.use(cors());

// Статус сервера
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'Используйте /search?q=название_фильма',
    endpoints: {
      search: '/search?q=название',
      example: 'https://film-search-2v7h.onrender.com/search?q=интерстеллар'
    }
  });
});

// Парсинг HDRezka
app.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Введите запрос: /search?q=название_фильма' });
  }

  try {
    const url = `https://rezka.ag/search/?do=search&subaction=search&q=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(data);
    const results = [];

    $('.b-content__inline_item').each((i, el) => {
      const title = $(el).find('.title').text().trim();
      const link = $(el).find('a').attr('href');
      const image = $(el).find('img').attr('src');
      
      if (title && link) {
        results.push({ 
          title,
          link: link.startsWith('http') ? link : `https://rezka.ag${link}`,
          image: image || 'https://via.placeholder.com/200x300'
        });
      }
    });

    res.json({ query, results });
  } catch (error) {
    console.error('Ошибка парсинга:', error);
    res.status(500).json({ error: 'Ошибка сервера при парсинге' });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});