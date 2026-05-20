// server/server.js
const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require("socket.io"); 
require('dotenv').config();
const db = require('./config/db');
const path = require('path'); 

// 🔥 [เพิ่มใหม่ 1] นำเข้าบริการ Cron Job
const { startNotificationCron } = require('./services/cronService');

const app = express();

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"], 
  credentials: true
}));

app.use(express.json()); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/chat', require('./routes/chatRoutes')); 
app.use('/api/assessments', require('./routes/assessmentRoutes'));
app.use('/api/psychologists', require('./routes/psychologistRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/news', require('./routes/newsRoutes'));
app.use('/api/schedule', require('./routes/scheduleRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on('connection', (socket) => {
    console.log(`⚡ User connected: ${socket.id}`);

    socket.on('join_room', (roomID) => {
        socket.join(roomID);
    });

    socket.on('send_message', async (data) => {
        socket.to(data.room).emit('receive_message', data);
        try {
            let apptId = data.room;
            if (typeof apptId === 'string' && apptId.includes('-')) {
                apptId = apptId.split('-')[1];
            }
            const sql = `INSERT INTO chat_messages (appointment_id, sender_id, receiver_id, message_text) VALUES (?, ?, ?, ?)`;
            await db.query(sql, [apptId, data.authorId, data.receiverId, data.message]);
        } catch (err) {
            console.error("❌ Save Message Error:", err.message);
        }
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`💬 Socket.io Ready!`);
    
    // 🔥 [เพิ่มใหม่ 2] เรียกใช้งานระบบแจ้งเตือนอัตโนมัติ
    startNotificationCron();
});