const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require("socket.io"); // ใช้ destructuring แบบนี้จะชัดเจนกว่า
require('dotenv').config();
const db = require('./config/db');
const path = require('path'); 

// สร้าง Express App
const app = express();

// ==========================================
// 1. Middleware & CORS Configuration
// ==========================================
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"], 
  credentials: true
}));

app.use(express.json()); 

// ตั้งค่าให้เข้าถึงโฟลเดอร์รูปภาพได้
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// 2. ตั้งค่า Routes (เส้นทาง API)
// ==========================================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/chat', require('./routes/chatRoutes')); 
app.use('/api/assessments', require('./routes/assessmentRoutes'));
app.use('/api/psychologists', require('./routes/psychologistRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/news', require('./routes/newsRoutes'));
app.use('/api/schedule', require('./routes/scheduleRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// ==========================================
// 3. สร้าง HTTP Server และเชื่อม Socket.io
// ==========================================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ==========================================
// 4. ระบบแชท Real-time (Socket.io Logic)
// ==========================================
io.on('connection', (socket) => {
    console.log(`⚡ User connected: ${socket.id}`);

    // เมื่อ User เข้าห้องแชท
    socket.on('join_room', (roomID) => {
        // frontend ส่งมาเป็น "appt-12" หรือ "12" ก็ได้ แต่เราจะ join ตามนั้นเลย
        socket.join(roomID);
        console.log(`📁 User ${socket.id} joined room: ${roomID}`);
    });

    // เมื่อมีการส่งข้อความ
    socket.on('send_message', async (data) => {
        // Data format จาก Frontend: 
        // { room: "appt-12", author: "Name", authorId: 1, message: "Hello", time: "..." }
        
        console.log("📩 Received:", data);

        // 1. ส่งข้อความหาทุกคนในห้อง (Real-time) ยกเว้นคนส่งเอง (ใช้ broadcast) หรือส่งทุกคน (ใช้ io)
        // ใช้ to(data.room) เพื่อส่งเข้าห้องที่ระบุ
        socket.to(data.room).emit('receive_message', data);
        
        // 2. บันทึกลง Database
        try {
            // ต้องแยก ID ออกจาก prefix "appt-" ถ้ามี
            let apptId = data.room;
            if (typeof apptId === 'string' && apptId.includes('-')) {
                apptId = apptId.split('-')[1];
            }

            const sql = `
                INSERT INTO chat_messages (appointment_id, sender_id, message_text) 
                VALUES (?, ?, ?)
            `;
            
            // Map ข้อมูลให้ตรงกับตาราง
            await db.query(sql, [apptId, data.authorId, data.message]);
            
            console.log("💾 Message saved to DB");
        } catch (err) {
            console.error("❌ Save Message Error:", err.message);
        }
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
    });
});

// ==========================================
// 5. Start Server
// ==========================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`💬 Socket.io Ready!`);
});