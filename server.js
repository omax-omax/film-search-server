const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json({ error: "Введите запрос" });

  try {
    const url = `https://rezka.ag/search/?do=search&subaction=search&q=${query}`;
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
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
    res.json({ error: "Ошибка парсинга" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на ${PORT}`));