const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log(`🔌 Pengguna terhubung: ${socket.id}`);

    socket.on('send_message', (data) => {
        socket.broadcast.emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log(`❌ Pengguna terputus: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server berjalan di port ${PORT}`);
});
