const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

// Корневой маршрут
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'Используйте /search?q=название_фильма',
    example: 'https://ваш-сервер.onrender.com/search?q=интерстеллар'
  });
});

// Маршрут поиска
app.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Укажите параметр q' });
    
    const url = `https://rezka.ag/search/?do=search&subaction=search&q=${query}`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    
    const results = [];
    $('.b-content__inline_item').each((i, el) => {
      results.push({
        title: $(el).find('.title').text().trim(),
        link: $(el).find('a').attr('href'),
        image: $(el).find('img').attr('src')
      });
    });
    
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));