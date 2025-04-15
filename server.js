const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

// Глобальные настройки axios для обхода блокировок
axios.defaults.headers.common = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
  'Referer': 'https://www.google.com/'
};

// Прокси-функция с повторными попытками
const fetchWithRetry = async (url, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        validateStatus: () => true // Принимаем любые статусы
      });
      return response.data;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

// Рабочий парсер (используем базовый URL)
const WORKING_PARSERS = {
  kinovod: {
    search: q => `https://kinovod.net/search?q=${encodeURIComponent(q)}`,
    parse: $ => {
      const results = [];
      $('.movie-item').each((i, el) => {
        results.push({
          title: $(el).find('.movie-title').text().trim(),
          link: $(el).find('a').attr('href'),
          image: $(el).find('img').attr('src'),
          source: 'Kinovod'
        });
      });
      return results;
    }
  },
  hdvb: {
    search: q => `https://hdvb.ru/search/?q=${encodeURIComponent(q)}`,
    parse: $ => {
      const results = [];
      $('.short').each((i, el) => {
        results.push({
          title: $(el).find('.name').text().trim(),
          link: $(el).find('a').attr('href'),
          image: $(el).find('img').attr('src'),
          source: 'HDVB'
        });
      });
      return results;
    }
  }
};

// Универсальный обработчик поиска
app.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Specify ?q= parameter' });

    // Пробуем все доступные парсеры по очереди
    for (const [name, parser] of Object.entries(WORKING_PARSERS)) {
      try {
        const html = await fetchWithRetry(parser.search(query));
        const $ = cheerio.load(html);
        const results = parser.parse($);
        
        if (results.length > 0) {
          return res.json({
            success: true,
            source: name,
            results,
            search_url: parser.search(query)
          });
        }
      } catch (e) {
        console.log(`Parser ${name} failed:`, e.message);
      }
    }

    res.status(404).json({
      error: 'No working parsers available',
      working_parsers: Object.keys(WORKING_PARSERS),
      try_direct: Object.values(WORKING_PARSERS).map(p => p.search(query))
    });
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({
      error: 'All parsers failed',
      details: error.message
    });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));