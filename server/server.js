const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io'); 
require('dotenv').config();
const db = require('./config/db');
const path = require('path'); 

// สร้าง Express App
const app = express();

// ==========================================
// 1. Middleware & CORS Configuration
// ==========================================

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"], // รองรับทั้ง React Port 3000 และ 3001 (เผื่อไว้)
  credentials: true
}));

app.use(express.json()); 

// ตั้งค่าให้เข้าถึงโฟลเดอร์รูปภาพได้ (สำหรับโปรไฟล์)
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

// ✅ แก้ไขบรรทัดนี้: เปลี่ยนจาก newsRoutes เป็น news (เพื่อให้ตรงกับชื่อไฟล์ news.js)
app.use('/api/news', require('./routes/news'));

// ✅ เพิ่มบรรทัดนี้: เพื่อแก้ปัญหา Error 404 (Not Found) ในหน้าตารางเวลา
app.use('/api/schedule', require('./routes/scheduleRoutes')); 

// ==========================================
// 3. สร้าง HTTP Server และเชื่อม Socket.io
// ==========================================
const server = http.createServer(app);

const io = require("socket.io")(server, {
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

    // เมื่อ User เข้าห้องแชทตาม Appointment ID
    socket.on('join_room', (appointmentId) => {
        socket.join(appointmentId);
        console.log(`📁 User joined room: ${appointmentId}`);
    });

    // เมื่อมีการส่งข้อความ
    socket.on('send_message', async (data) => {
        // ส่งข้อความหาทุกคนในห้องนัดหมายนั้นๆ (Real-time)
        io.to(data.appointmentId).emit('receive_message', data);
        
        // บันทึกลง Database
        try {
            const sql = `
                INSERT INTO chat_messages (appointment_id, sender_id, message_text) 
                VALUES (?, ?, ?)
            `;
            // เช็คว่า data.content ไม่เป็นค่าว่าง
            if (data.content) {
                 await db.execute(sql, [data.appointmentId, data.senderId, data.content]);
            }
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
    console.log(`💬 Socket.io & API Routes are ready`);
});