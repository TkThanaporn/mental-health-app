// D:\mental-health-app\server\routes\psychologistRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, authorizeRole } = require('../middleware/auth'); // ต้องใช้ Middleware เพื่อตรวจสอบสิทธิ์

// กำหนด ID ของนักจิตวิทยาคนเดียวที่รับผิดชอบ
// **สำคัญ: เปลี่ยนค่านี้เป็น user_id จริงของบัญชีนักจิตวิทยาในตาราง Users**
const THE_ONE_PSYCHOLOGIST_ID = 2; 

// --- 1. GET /api/psychologists/available (สำหรับ Student: P5.3) ---
// @desc    ดึงข้อมูลนักจิตวิทยาคนเดียวและตารางเวลาว่างสำหรับนักเรียน
router.get('/available', async (req, res) => {
    try {
        const [psycho] = await db.execute(`
            SELECT 
                p.psychologist_id, 
                 u.fullname,  -- หรือ u.name ตามที่คุณแก้ไข
                p.available_settings 
            FROM PsychologistProfiles p 
            JOIN Users u ON u.user_id = p.psychologist_id
            WHERE p.psychologist_id = ?
        `, [THE_ONE_PSYCHOLOGIST_ID]);
        
        if (psycho.length === 0) {
            return res.status(404).json({ msg: 'The designated psychologist profile not found.' });
        }
        
        res.json(psycho[0]); // ส่ง Object เดียวกลับไป
    } catch (err) {
        console.error("GET AVAILABLE PSYCHO ERROR:", err.message);
        res.status(500).send('Server error.');
    }
});

// ----------------------------------------------------------------------

// --- 2. PUT /api/psychologists/settings (สำหรับ Psychologist: P3.3) ---
// @desc    บันทึกการตั้งค่าตารางเวลาว่าง
router.put('/settings', authMiddleware, authorizeRole(['Psychologist']), async (req, res) => {
    const { settings } = req.body;
    const psychologist_id = req.user.id; // ใช้ ID ของคนที่ Login (นักจิตวิทยา)

    // ตรวจสอบว่านักจิตวิทยาที่ Login คือคนเดียวกับ ID ที่กำหนดหรือไม่ (เผื่ออนาคต)
    if (psychologist_id !== THE_ONE_PSYCHOLOGIST_ID) {
        return res.status(403).json({ msg: 'Unauthorized to change these settings.' });
    }

    try {
        const settingsJson = JSON.stringify(settings);
        
        // UPSERT: ลองอัปเดต ถ้าไม่มีให้เพิ่ม
        const [result] = await db.execute(`
            INSERT INTO PsychologistProfiles (psychologist_id, available_settings) 
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE available_settings = ?
        `, [psychologist_id, settingsJson, settingsJson]);
        
        res.json({ msg: 'Availability settings updated successfully.' });
    } catch (err) {
        console.error("SAVE SETTINGS ERROR:", err.message);
        res.status(500).send('Server error.');
    }
});

// ----------------------------------------------------------------------

// --- 3. GET /api/psychologists/settings (สำหรับ Psychologist: P3.3) ---
// @desc    ดึงการตั้งค่าตารางเวลาว่างเดิม
router.get('/settings', authMiddleware, authorizeRole(['Psychologist']), async (req, res) => {
    const psychologist_id = req.user.id;
    
    try {
        const [rows] = await db.execute(
            'SELECT available_settings FROM PsychologistProfiles WHERE psychologist_id = ?', 
            [psychologist_id]
        );
        
        if (rows.length === 0) {
            return res.json({ available_settings: null }); // ส่ง null ถ้ายังไม่มีการตั้งค่า
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("FETCH SETTINGS ERROR:", err.message);
        res.status(500).send('Server error.');
    }
});

module.exports = router;