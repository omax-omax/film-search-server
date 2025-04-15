const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

// 1. Добавляем обработчик для корневого пути
app.get('/', (req, res) => {
  res.json({
    status: 'SERVER IS WORKING',
    endpoints: {
      search: '/search?q=название_фильма',
      examples: [
        'https://film-search-2v7h.onrender.com/search?q=интерстеллар',
        'https://film-search-2v7h.onrender.com/search?q=матрица'
      ]
    },
    message: 'Используйте /search с параметром q для поиска фильмов'
  });
});

// 2. Улучшенный парсер с обработкой ошибок
app.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ 
        error: 'Укажите параметр q',
        example: 'https://film-search-2v7h.onrender.com/search?q=интерстеллар'
      });
    }

    // 3. Используем рабочий источник (замените на актуальный URL)
    const searchUrl = `https://hd.kinopoisk.ru/search/${encodeURIComponent(query)}`;
    
    const { data } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      timeout: 10000
    });

    const $ = cheerio.load(data);
    const results = [];

    // 4. Адаптируйте селекторы под выбранный источник
    $('.film-list .film-item').each((i, el) => {
      results.push({
        title: $(el).find('.film-title').text().trim(),
        year: $(el).find('.film-year').text().trim(),
        link: $(el).find('a').attr('href'),
        image: $(el).find('img').attr('src') || 'no-poster.jpg'
      });
    });

    if (results.length === 0) {
      return res.status(404).json({ 
        error: 'Ничего не найдено',
        try_alternative: 'Попробуйте другой запрос'
      });
    }

    res.json(results);

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Ошибка при поиске',
      details: error.message,
      support: 'Попробуйте позже или используйте другой источник'
    });
  }
});

// 5. Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Проверьте: http://localhost:${PORT}/`);
  console.log(`Пример запроса: http://localhost:${PORT}/search?q=интерстеллар`);
});