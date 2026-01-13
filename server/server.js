// D:\mental-health-app\server\server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "http://localhost:3000" } });
// **ลบบรรทัด: const psychologistRoutes = require('./routes/psychologistRoutes'); ออก**

app.use(cors());
app.use(express.json());

// -----------------------------------------------------------------
// A. SOCKET.IO REAL-TIME (1.4.3.2)
// -----------------------------------------------------------------
io.on('connection', (socket) => {
    socket.on('join_room', (appointmentId) => { socket.join(appointmentId); });

    socket.on('send_message', async (data) => {
        // บันทึกข้อความ (1.3.2.5, 1.3.3.3)
        await db.execute(
            'INSERT INTO ChatMessages (appointment_id, sender_id, content) VALUES (?, ?, ?)',
            [data.appointmentId, data.senderId, data.content]
        );
        io.to(data.appointmentId).emit('receive_message', data); 
    });
});

// -----------------------------------------------------------------
// B. EXPRESS ROUTING (เชื่อมต่อทั้งหมดที่นี่)
// -----------------------------------------------------------------
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes')); 
app.use('/api/assessments', require('./routes/assessmentRoutes')); 
app.use('/api/admin', require('./routes/adminRoutes')); 
// **บรรทัดนี้คือการเชื่อมต่อ psychologistRoutes ที่ถูกต้อง**
app.use('/api/psychologists', require('./routes/psychologistRoutes')); 

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));