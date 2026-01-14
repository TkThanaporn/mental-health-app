const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io'); 
require('dotenv').config();
const db = require('./config/db');

// สร้าง Express App
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); 

// ==========================================
// 1. ตั้งค่า Routes (เส้นทาง API)
// ==========================================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));

// ✅ เพิ่มบรรทัดนี้ครับ (ระบบแชทถึงจะทำงานได้)
app.use('/api/chat', require('./routes/chatRoutes')); 

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

    // เข้าห้องแชท
    socket.on('join_room', (appointmentId) => {
        socket.join(appointmentId);
        console.log(`👤 User joined room: ${appointmentId}`);
    });

    // รับ-ส่งข้อความ
    socket.on('send_message', async (data) => {
        console.log("📩 Received Message:", data);

        // 1. ส่งให้ทุกคนในห้อง (Real-time)
        io.to(data.appointmentId).emit('receive_message', data);

        // 2. บันทึกลงฐานข้อมูล
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