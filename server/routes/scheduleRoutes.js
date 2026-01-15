const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

// ==========================================
// 1. POST: เพิ่มเวลาว่าง (สำหรับนักจิตวิทยา)
// ==========================================
router.post('/', authMiddleware, authorizeRole(['Psychologist']), async (req, res) => {
    try {
        const psychologist_id = req.user.id;
        const { date, time_slots } = req.body; 

        if (!date || !time_slots || time_slots.length === 0) {
            return res.status(400).json({ msg: 'กรุณาระบุวันที่และช่วงเวลา' });
        }

        console.log(`📅 Adding slots for Psych ${psychologist_id} on ${date}:`, time_slots);

        // ✅ แก้ไข SQL: เพิ่ม is_available = 1 ให้ชัดเจน
        const sql = `INSERT INTO schedules (psychologist_id, date, time_slot, is_available) VALUES ?`;
        
        // เตรียมข้อมูลสำหรับ Bulk Insert
        const values = time_slots.map(slot => [psychologist_id, date, slot, 1]);

        await db.query(sql, [values]);

        res.json({ msg: 'บันทึกตารางเวลาเรียบร้อยแล้ว' });

    } catch (err) {
        console.error("❌ ADD SCHEDULE ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 2. GET: ดึงตารางงานของฉัน (สำหรับนักจิตวิทยาดูเอง)
// ==========================================
// 🔴 แก้จาก '/my-slots' เป็น '/' เพื่อให้ตรงกับ Frontend
router.get('/', authMiddleware, authorizeRole(['Psychologist']), async (req, res) => {
    try {
        const psychologist_id = req.user.id;
        
        // ดึงตารางเวลาทั้งหมดของนักจิตคนนี้ (เรียงตามวันและเวลา)
        const sql = `
            SELECT * FROM schedules 
            WHERE psychologist_id = ? 
            ORDER BY date ASC, time_slot ASC
        `;
        const [rows] = await db.query(sql, [psychologist_id]);
        
        res.json(rows);

    } catch (err) {
        console.error("❌ FETCH MY SLOTS ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 3. DELETE: ลบช่วงเวลา
// ==========================================
router.delete('/:id', authMiddleware, authorizeRole(['Psychologist']), async (req, res) => {
    try {
        const schedule_id = req.params.id;
        const psychologist_id = req.user.id;

        const sql = `DELETE FROM schedules WHERE schedule_id = ? AND psychologist_id = ?`;
        await db.query(sql, [schedule_id, psychologist_id]);

        res.json({ msg: 'ลบช่วงเวลาเรียบร้อยแล้ว' });

    } catch (err) {
        console.error("❌ DELETE SLOT ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 4. GET: ดึงเวลาว่าง (สำหรับนักเรียนดูตอนจอง)
// ==========================================
router.get('/psychologist/:id', async (req, res) => {
    try {
        const psychologist_id = req.params.id;
        
        const sql = `
            SELECT schedule_id, date, time_slot 
            FROM schedules 
            WHERE psychologist_id = ? AND is_available = 1
            ORDER BY date ASC, time_slot ASC
        `;
        const [rows] = await db.query(sql, [psychologist_id]);
        
        res.json(rows);

    } catch (err) {
        console.error("❌ FETCH PUBLIC SLOTS ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;