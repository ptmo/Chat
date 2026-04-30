const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());

// Konfigurasi Supabase menggunakan data Anda
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
        // Simpan pesan ke Supabase
        await supabase.from('messages').insert([
            { 
                sender_nickname: data.sender, 
                recipient_nickname: data.recipient, 
                content: data.text 
            }
        ]);
        
        // Siarkan pesan
        socket.broadcast.emit('receive_message', data);
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Server Online di Port ${PORT}`));
