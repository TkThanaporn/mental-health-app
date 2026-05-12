const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ==========================================
// ✅ 1. GET: ดึงรายชื่อนักจิตวิทยา (สำหรับหน้าจองของนักเรียน)
// ==========================================
router.get('/available', async (req, res) => {
    try {
        console.log("🔍 Fetching psychologists...");
        // ตรงส่วนนี้โครงสร้างตรงกับ DB ใหม่แล้ว (ตาราง users) 
        const sql = `
            SELECT user_id, fullname, email, phone, bio, profile_image 
            FROM users 
            WHERE role = 'Psychologist'
        `;
        const [rows] = await db.query(sql);

        const psychologists = rows.map(user => {
            if (user.profile_image && !user.profile_image.startsWith('http')) {
                // ตรวจสอบ Port ให้ตรงกับ server.js ของคุณ (เช่น 5000 หรือ 8800)
                user.profile_image = `http://localhost:5000/uploads/${user.profile_image}`;
            }
            return user;
        });

        console.log(`✅ Found ${psychologists.length} psychologists`);
        res.json(psychologists);
    } catch (err) {
        console.error("❌ FETCH PSYCHOLOGISTS ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// ✅ 2. GET: ดึงรายการนัดหมายของนักจิตวิทยา (สำหรับหน้า Dashboard นักจิตวิทยา)
// ==========================================
router.get('/my-appointments/:id', async (req, res) => {
    try {
        // อัปเดต SQL ให้ JOIN กับตาราง schedules เพื่อดึงวันที่และเวลา
        // และเปลี่ยนชื่อคอลัมน์ให้ตรงกับ Data Dictionary ใหม่
        const sql = `
            SELECT 
                a.*, 
                u.fullname as student_name,
                s.date as appointment_date, 
                s.start_time as appointment_time
            FROM appointments a
            JOIN users u ON a.student_user_id = u.user_id
            JOIN schedules s ON a.schedule_id = s.schedule_id
            WHERE a.psychologist_user_id = ?
            ORDER BY s.date ASC, s.start_time ASC
        `;
        
        const [rows] = await db.query(sql, [req.params.id]);
        res.json(rows);
    } catch (err) {
        console.error("❌ FETCH APPOINTMENTS ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;