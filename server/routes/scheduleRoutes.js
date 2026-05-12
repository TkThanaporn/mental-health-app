const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

// ==========================================
// 1. POST: เพิ่มเวลาว่าง (สำหรับนักจิตวิทยา)
// ==========================================
router.post('/', authMiddleware, authorizeRole(['Psychologist']), async (req, res) => {
    try {
        const psychologist_user_id = req.user.id;
        const { date, time_slots } = req.body; 

        if (!date || !time_slots || time_slots.length === 0) {
            return res.status(400).json({ msg: 'กรุณาระบุวันที่และช่วงเวลา' });
        }

        console.log(`📅 Adding slots for Psych ${psychologist_user_id} on ${date}:`, time_slots);

        const sql = `INSERT INTO schedules (psychologist_user_id, date, start_time, end_time, is_available) VALUES ?`;
        
        // แยก time_slot ที่ Frontend ส่งมา (เช่น "09:00-10:00") ออกเป็น start_time และ end_time
        const values = time_slots.map(slot => {
            const [start_time, end_time] = slot.split('-');
            return [psychologist_user_id, date, start_time, end_time || null, 1];
        });

        await db.query(sql, [values]);

        res.json({ msg: 'บันทึกตารางเวลาเรียบร้อยแล้ว' });

    } catch (err) {
        console.error("❌ ADD SCHEDULE ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 2. GET: ดึงตารางงานของฉัน (Update: Join Appointments)
// ==========================================
router.get('/', authMiddleware, authorizeRole(['Psychologist']), async (req, res) => {
    try {
        const psychologist_user_id = req.user.id;
        
        // ✅ JOIN กับตาราง appointments เพื่อเช็คว่ามีคนจองหรือยัง
        // ✅ ใช้ CONCAT รวบเวลาให้ Frontend รับค่าเป็น time_slot เหมือนเดิม
        const sql = `
            SELECT 
                s.schedule_id, 
                s.psychologist_user_id, 
                DATE_FORMAT(s.date, '%Y-%m-%d') as date, 
                CONCAT(DATE_FORMAT(s.start_time, '%H:%i'), '-', DATE_FORMAT(s.end_time, '%H:%i')) as time_slot, 
                s.is_available,
                a.appointment_id,     -- ถ้ามีค่า แปลว่าถูกจองแล้ว
                u.fullname as student_name -- ชื่อคนจอง
            FROM schedules s
            LEFT JOIN appointments a ON s.schedule_id = a.schedule_id AND a.status != 'cancelled'
            LEFT JOIN users u ON a.student_user_id = u.user_id
            WHERE s.psychologist_user_id = ? 
            ORDER BY s.date ASC, s.start_time ASC
        `;
        const [rows] = await db.query(sql, [psychologist_user_id]);
        
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
        const psychologist_user_id = req.user.id;

        const sql = `DELETE FROM schedules WHERE schedule_id = ? AND psychologist_user_id = ?`;
        await db.query(sql, [schedule_id, psychologist_user_id]);

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
        const psychologist_user_id = req.params.id;
        
        // ✅ ใช้ DATE_FORMAT เพื่อล็อควันที่ให้เป็น String (YYYY-MM-DD)
        const sql = `
            SELECT 
                schedule_id, 
                DATE_FORMAT(date, '%Y-%m-%d') as date, 
                CONCAT(DATE_FORMAT(start_time, '%H:%i'), '-', DATE_FORMAT(end_time, '%H:%i')) as time_slot 
            FROM schedules 
            WHERE psychologist_user_id = ? AND is_available = 1
            ORDER BY date ASC, start_time ASC
        `;
        const [rows] = await db.query(sql, [psychologist_user_id]);
        
        res.json(rows);

    } catch (err) {
        console.error("❌ FETCH PUBLIC SLOTS ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 5. PUT: เปลี่ยนสถานะ (ว่าง <-> ไม่ว่าง)
// ==========================================
router.put('/:id/status', authMiddleware, authorizeRole(['Psychologist']), async (req, res) => {
    try {
        const schedule_id = req.params.id;
        const psychologist_user_id = req.user.id;
        const { is_available } = req.body; // รับค่า 0 หรือ 1

        // อัปเดตสถานะ
        const sql = `UPDATE schedules SET is_available = ? WHERE schedule_id = ? AND psychologist_user_id = ?`;
        await db.query(sql, [is_available, schedule_id, psychologist_user_id]);

        res.json({ msg: 'อัปเดตสถานะเรียบร้อยแล้ว' });

    } catch (err) {
        console.error("❌ UPDATE STATUS ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;