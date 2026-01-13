// D:\mental-health-app\server\routes\psychologistRoutes.js
const express = require('express');
const router = express.Router(); // ✅ ต้องประกาศ router ก่อนเรียกใช้
const db = require('../config/db'); // ✅ ต้อง import db เพื่อใช้ connect ฐานข้อมูล
const { authMiddleware, authorizeRole } = require('../middleware/auth'); // (ทางเลือก) ถ้าต้องการตรวจสอบสิทธิ์

// ❗ ตรวจสอบให้แน่ใจว่าใน Database ตาราง Users มี id = 2 และ role = 'Psychologist'
const THE_ONE_PSYCHOLOGIST_ID = 2; 

// --- GET /api/psychologists/available ---
// ดึงข้อมูลนักจิตวิทยาและตารางเวลาว่าง
router.get('/available', async (req, res) => {
    try {
        // SQL Query: ดึงชื่อ (fullname) และตารางเวลา (available_settings)
        const [psycho] = await db.execute(`
            SELECT 
                p.psychologist_id, 
                u.fullname, 
                p.available_settings 
            FROM PsychologistProfiles p 
            JOIN Users u ON u.user_id = p.psychologist_id
            WHERE p.psychologist_id = ?
        `, [THE_ONE_PSYCHOLOGIST_ID]);
        
        // ตรวจสอบว่าเจอข้อมูลหรือไม่
        if (psycho.length === 0) {
            return res.status(404).json({ msg: 'ไม่พบข้อมูลนักจิตวิทยา (ตรวจสอบ ID ในโค้ดและ DB ให้ตรงกัน)' });
        }
        
        // ส่งข้อมูลกลับไปให้ Frontend
        res.json(psycho[0]);
        
    } catch (err) {
        console.error("ERROR GET AVAILABLE:", err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router; // ✅ สำคัญมาก! ต้อง export router ออกไปให้ server.js ใช้