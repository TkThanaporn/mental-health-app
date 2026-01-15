const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io'); 
require('dotenv').config();
const db = require('./config/db');
const path = require('path'); // ✅ 1. เพิ่มบรรทัดนี้

// สร้าง Express App
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); 

// ✅ 2. เพิ่มบรรทัดนี้ (เพื่อให้เรียกดูรูปผ่าน http://localhost:5000/uploads/xxx.jpg ได้)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// 1. ตั้งค่า Routes (เส้นทาง API) - รวมทุกระบบ
// ==========================================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/chat', require('./routes/chatRoutes')); 
app.use('/api/assessments', require('./routes/assessmentRoutes'));
app.use('/api/psychologists', require('./routes/psychologistRoutes'));
app.use('/api/profile', require('./routes/profileRoutes')); 

// ==========================================
// 2. สร้าง HTTP Server และเชื่อม Socket.io
// ==========================================
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// ==========================================
// 3. ระบบแชท Real-time (Socket.io Logic)
// ==========================================
io.on('connection', (socket) => {
    console.log(`⚡ User connected: ${socket.id}`);

    socket.on('join_room', (appointmentId) => {
        socket.join(appointmentId);
    });

    socket.on('send_message', async (data) => {
        io.to(data.appointmentId).emit('receive_message', data);
        try {
            const sql = `
                INSERT INTO chat_messages (appointment_id, sender_id, message_text) 
                VALUES (?, ?, ?)
            `;
            await db.execute(sql, [data.appointmentId, data.senderId, data.content]);
        } catch (err) {
            console.error("❌ Save Message Error:", err.message);
        }
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
    });
});

// ==========================================
// 4. Start Server
// ==========================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`💬 Socket.io is ready...`);
});