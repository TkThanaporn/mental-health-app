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
        const { date, time_slots } = req.body; // รับวันที่ และ Array ของเวลา เช่น ["09:00-10:00", "10:00-11:00"]

        if (!date || !time_slots || time_slots.length === 0) {
            return res.status(400).json({ msg: 'กรุณาระบุวันที่และช่วงเวลา' });
        }

        console.log(`📅 Adding slots for Psych ${psychologist_id} on ${date}:`, time_slots);

        // วนลูปบันทึกทีละช่วงเวลา
        const sql = `INSERT INTO schedules (psychologist_id, date, time_slot) VALUES ?`;
        const values = time_slots.map(slot => [psychologist_id, date, slot]);

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
router.get('/my-slots', authMiddleware, authorizeRole(['Psychologist']), async (req, res) => {
    try {
        const psychologist_id = req.user.id;
        
        // ดึงเฉพาะเวลาที่ยังว่างอยู่ (is_available = 1) เรียงตามวันที่และเวลา
        const sql = `
            SELECT * FROM schedules 
            WHERE psychologist_id = ? AND is_available = 1 
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
// 3. DELETE: ลบช่วงเวลา (เช่น ติดธุระกะทันหัน)
// ==========================================
router.delete('/:id', authMiddleware, authorizeRole(['Psychologist']), async (req, res) => {
    try {
        const schedule_id = req.params.id;
        const psychologist_id = req.user.id;

        // ลบเฉพาะที่เป็นของตัวเองเท่านั้น
        const sql = `DELETE FROM schedules WHERE schedule_id = ? AND psychologist_id = ?`;
        await db.query(sql, [schedule_id, psychologist_id]);

        res.json({ msg: 'ลบช่วงเวลาเรียบร้อยแล้ว' });

    } catch (err) {
        console.error("❌ DELETE SLOT ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 4. GET: ดึงเวลาว่างของนักจิตคนนี้ (สำหรับนักเรียนดูตอนจอง)
// ==========================================
router.get('/psychologist/:id', async (req, res) => {
    try {
        const psychologist_id = req.params.id;
        
        // ดึงเฉพาะวันเวลาที่ว่าง
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