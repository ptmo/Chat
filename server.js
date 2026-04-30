const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());

// Konfigurasi Supabase menggunakan data Anda
// Catatan kecil: Untuk ke depannya (kalau rilis publik), usahakan key ini ditaruh di file .env ya agar aman!
const supabaseUrl = 'https://xoprkhmqdiejyxpqfscz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvcHJraG1xZGllanl4cHFmc2N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MTQyNTksImV4cCI6MjA5MzA5MDI1OX0.DM9Svj4FfTCXXqExKAXc1iUHZli68Q93Y4r-0o_sOJI';
const supabase = createClient(supabaseUrl, supabaseKey);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
    // Meminta riwayat chat saat user masuk ke room
    socket.on('get_history', async (chatInfo) => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_nickname.eq."${chatInfo.me}",recipient_nickname.eq."${chatInfo.friend}"),and(sender_nickname.eq."${chatInfo.friend}",recipient_nickname.eq."${chatInfo.me}")`)
            .order('created_at', { ascending: true });
        
        if (!error) socket.emit('load_history', data);
    });

    socket.on('send_message', async (data) => {
        // Tangkap penanda isMedia dari frontend (jika tidak ada, anggap false)
        const isMediaFlag = data.isMedia || false;

        // Simpan pesan ke Supabase
        await supabase.from('messages').insert([
            { 
                sender_nickname: data.sender, 
                recipient_nickname: data.recipient, 
                content: data.text,
                isMedia: isMediaFlag // 👈 Ini penting agar server tahu ini gambar/dokumen
            }
        ]);
        
        // Siarkan pesan
        socket.broadcast.emit('receive_message', data);
    });
});

// =========================================================
// --- FITUR TUKANG SAPU OTOMATIS (KHUSUS SUPABASE) ---
// =========================================================
async function bersihkanFileLama() {
    try {
        // 1. Dapatkan waktu tepat 7 hari yang lalu dari sekarang
        const batasWaktu = new Date();
        batasWaktu.setDate(batasWaktu.getDate() - 7);
        const isoBatasWaktu = batasWaktu.toISOString(); // Format waktu yang diwajibkan Supabase

        // 2. Eksekusi hapus di Supabase: 
        // Hapus JIKA isMedia = true (gambar/file) DAN umurnya kurang dari (lt) 7 hari yang lalu
        const { data, error } = await supabase
            .from('messages')
            .delete()
            .eq('isMedia', true)
            .lt('created_at', isoBatasWaktu);

        if (error) {
            console.error("Gagal membersihkan file lama di Supabase:", error);
        } else {
            console.log(`[Tukang Sapu Supabase] Pengecekan selesai. File kadaluarsa dibersihkan.`);
        }
    } catch (err) {
        console.error("Terjadi kesalahan pada Tukang Sapu:", err);
    }
}

// Jalankan pembersihan otomatis setiap 24 jam sekali (86.400.000 milidetik)
setInterval(bersihkanFileLama, 86400000);

// Jalankan satu kali sebagai pemanasan saat server pertama kali menyala / di-restart
bersihkanFileLama();
// =========================================================

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Server Online di Port ${PORT}`));
