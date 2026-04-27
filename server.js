const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

app.get('/api/tiktok-profile', async (req, res) => {
    let username = req.query.username;
    if (!username) return res.status(400).json({ error: 'Username diperlukan' });

    // Hapus tanda @ jika pengguna tidak sengaja mengetiknya
    if (username.startsWith('@')) {
        username = username.substring(1);
    }

    try {
        // Menggunakan jalur API resmi/pihak ketiga agar kebal dari blokir anti-bot TikTok
        const response = await axios.get(`https://www.tikwm.com/api/user/info?unique_id=${username}`);
        
        // Jika respons data kosong, berarti akun salah atau dibanned
        if (!response.data.data || !response.data.data.user) {
            return res.status(404).json({ error: 'Profil tidak valid' });
        }

        const userData = response.data.data;
        const avatarUrl = userData.user.avatarLarger || userData.user.avatarMedium;
        const name = userData.user.nickname;
        
        // Format Angka Followers (contoh: 1500000 -> 1.5M)
        let followersCount = userData.stats.followerCount;
        let followers = followersCount.toString();
        if (followersCount >= 1000000) {
            followers = (followersCount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        } else if (followersCount >= 1000) {
            followers = (followersCount / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        }

        res.json({ username, name, avatarUrl, followers });

    } catch (error) {
        console.error("Error scraping API:", error.message);
        res.status(500).json({ error: 'Gagal mengambil data' });
    }
});

// Wajib menggunakan process.env.PORT untuk Render.com
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server Backend berjalan di port ${PORT}`));
