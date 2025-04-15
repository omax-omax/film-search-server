const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

// Корневой маршрут с инструкцией
app.get('/', (req, res) => {
  res.json({
    status: 'SERVER IS WORKING',
    endpoints: {
      hdrezka_search: 'https://film-search-2v7h.onrender.com/search?q=название_фильма',
      filmix_search: 'https://film-search-2v7h.onrender.com/filmix-search?q=название_фильма'
    },
    examples: {
      example1: 'https://film-search-2v7h.onrender.com/search?q=интерстеллар',
      example2: 'https://film-search-2v7h.onrender.com/filmix-search?q=матрица'
    }
  });
});

// Парсер HDRezka
app.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Add ?q=parameter with film name' });

    const searchUrl = `https://rezka.ag/search/?do=search&subaction=search&q=${encodeURIComponent(query)}`;
    const { data } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });

    const $ = cheerio.load(data);
    const results = [];

    $('.b-content__inline_item').each((i, el) => {
      results.push({
        title: $(el).find('.title').text().trim(),
        link: $(el).find('a').attr('href'),
        image: $(el).find('img').attr('src') || 'https://film-search-2v7h.onrender.com/placeholder.jpg',
        source: 'HDRezka'
      });
    });

    res.json(results.length ? results : { error: 'Nothing found' });
  } catch (error) {
    console.error('HDRezka error:', error);
    res.status(500).json({ 
      error: 'HDRezka parser error',
      try_alternative: 'https://film-search-2v7h.onrender.com/filmix-search?q=same_query'
    });
  }
});

// Парсер Filmix
app.get('/filmix-search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Add ?q=parameter with film name' });

    const searchUrl = `https://filmix.ac/search/${encodeURIComponent(query)}`;
    const { data } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(data);
    const results = [];

    $('.short-story').each((i, el) => {
      results.push({
        title: $(el).find('.sh-title').text().trim(),
        link: $(el).find('a').attr('href'),
        image: $(el).find('img').attr('src') || 'https://film-search-2v7h.onrender.com/placeholder.jpg',
        source: 'Filmix'
      });
    });

    res.json(results.length ? results : { error: 'Nothing found' });
  } catch (error) {
    console.error('Filmix error:', error);
    res.status(500).json({ 
      error: 'Filmix parser error',
      try_alternative: 'https://film-search-2v7h.onrender.com/search?q=same_query'
    });
  }
});

// Заглушка для изображений
app.get('/placeholder.jpg', (req, res) => {
  res.sendFile(__dirname + '/placeholder.jpg');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on https://film-search-2v7h.onrender.com`));