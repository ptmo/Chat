const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());

app.get('/api/tiktok-profile', async (req, res) => {
    const username = req.query.username;
    if (!username) return res.status(400).json({ error: 'Username diperlukan' });

    try {
        const response = await axios.get(`https://www.tiktok.com/@${username}`, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
            }
        });
        
        const $ = cheerio.load(response.data);
        
        const avatarUrl = $('meta[property="og:image"]').attr('content');
        const titleContent = $('meta[property="og:title"]').attr('content'); 
        const name = titleContent ? titleContent.split('(')[0].trim() : username;

        // Ekstrak Followers dari Meta Description
        const desc = $('meta[name="description"]').attr('content');
        let followers = "0";
        if (desc) {
            const match = desc.match(/([\d\.,]+[KMB]?)\s+Followers/i);
            if (match) followers = match[1];
        }

        if (!avatarUrl) return res.status(404).json({ error: 'Profil tidak valid' });

        res.json({ username, name, avatarUrl, followers });

    } catch (error) {
        console.error("Error scraping:", error.message);
        res.status(500).json({ error: 'Gagal mengambil data' });
    }
});

// Wajib menggunakan process.env.PORT untuk Render.com
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server Backend berjalan di port ${PORT}`));
