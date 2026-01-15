const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET: ดึงรายชื่อนักจิตวิทยา (สำหรับหน้าจองของนักเรียน)
router.get('/available', async (req, res) => {
    try {
        console.log("🔍 Fetching psychologists...");
        
        // ✅ จุดที่แก้ไข: เพิ่ม phone, bio, profile_image เข้าไปใน SQL
        const sql = `
            SELECT user_id, fullname, email, phone, bio, profile_image 
            FROM users 
            WHERE role = 'Psychologist'
        `;
        
        const [rows] = await db.query(sql);

        // ✅ แปลงชื่อไฟล์รูปให้เป็น URL เต็มๆ (เพื่อให้ Frontend เอาไปโชว์ได้เลย)
        const psychologists = rows.map(user => {
            if (user.profile_image && !user.profile_image.startsWith('http')) {
                // ถ้ามีรูป และไม่ใช่ลิงก์เว็บ -> เติม path ของ server เข้าไป
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

module.exports = router;