const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

// Прокси для обхода CORS
const getHtml = async (url) => {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9',
        'Referer': 'https://rezka.ag/'
      },
      timeout: 10000
    });
    return data;
  } catch (error) {
    console.error('Proxy error:', error.message);
    throw new Error('Не удалось загрузить данные');
  }
};

// Маршрут поиска на HDRezka
app.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Укажите название фильма' });

    const searchUrl = `https://rezka.ag/search/?do=search&subaction=search&q=${encodeURIComponent(query)}`;
    const html = await getHtml(searchUrl);
    const $ = cheerio.load(html);

    const results = [];
    $('.b-content__inline_item').each((i, el) => {
      const title = $(el).find('.title').text().trim();
      const link = $(el).find('a').attr('href');
      const image = $(el).find('img').attr('src');
      const year = $(el).find('.info').text().split(',')[0].trim();

      if (title && link) {
        results.push({
          title: `${title} (${year})`,
          link: link.startsWith('http') ? link : `https://rezka.ag${link}`,
          image: image || '/placeholder.jpg',
          source: 'HDRezka'
        });
      }
    });

    if (results.length === 0) {
      return res.status(404).json({ error: 'Ничего не найдено' });
    }

    res.json(results);
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ 
      error: 'Ошибка при поиске',
      details: error.message
    });
  }
});

// Альтернативный источник - Filmix
app.get('/filmix-search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Укажите название фильма' });

    const searchUrl = `https://filmix.ac/search/${encodeURIComponent(query)}`;
    const html = await getHtml(searchUrl);
    const $ = cheerio.load(html);

    const results = [];
    $('.short-story').each((i, el) => {
      const title = $(el).find('.sh-title').text().trim();
      const link = $(el).find('a').attr('href');
      const image = $(el).find('img').attr('src');

      if (title && link) {
        results.push({
          title,
          link: link.startsWith('http') ? link : `https://filmix.ac${link}`,
          image: image || '/placeholder.jpg',
          source: 'Filmix'
        });
      }
    });

    res.json(results.length ? results : { error: 'Ничего не найдено' });
  } catch (error) {
    console.error('Filmix error:', error);
    res.status(500).json({ error: 'Ошибка Filmix' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));