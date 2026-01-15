const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// ==========================================
// 1. POST: จองนัดหมาย (ตัดเวลาในตารางด้วย)
// ==========================================
router.post('/', authMiddleware, async (req, res) => {
    try {
        const student_id = req.user.id;
        const { psychologist_id, date, time, type, topic, consultation_type, group_members } = req.body;

        // 1. ตรวจสอบว่าเวลานี้ยังว่างอยู่ไหม (กันจองชนกันวินาทีสุดท้าย)
        const checkSql = `
            SELECT is_available FROM schedules 
            WHERE psychologist_id = ? AND date = ? AND time_slot = ? AND is_available = 1
        `;
        const [slots] = await db.query(checkSql, [psychologist_id, date, time]);

        if (slots.length === 0) {
            return res.status(400).json({ msg: '❌ เวลานี้ถูกจองไปแล้ว หรือไม่ได้เปิดให้บริการ' });
        }

        // 2. บันทึกการนัดหมายลงตาราง appointments
        const sql = `
            INSERT INTO appointments (student_id, psychologist_id, appointment_date, appointment_time, type, topic, consultation_type, group_members) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        // แปลง group_members array เป็น string (ถ้ามี)
        const membersString = JSON.stringify(group_members || []);
        
        await db.execute(sql, [student_id, psychologist_id, date, time, type, topic, consultation_type, membersString]);

        // 3. ✅ ตัดเวลาในตาราง schedules (เปลี่ยนเป็น ไม่ว่าง)
        const updateScheduleSql = `
            UPDATE schedules 
            SET is_available = 0 
            WHERE psychologist_id = ? AND date = ? AND time_slot = ?
        `;
        await db.execute(updateScheduleSql, [psychologist_id, date, time]);

        res.status(201).json({ msg: 'Appointment booked successfully' });

    } catch (err) {
        console.error("❌ BOOKING ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 2. GET: ดึงรายการนัดหมาย (ตาม Role)
// ==========================================
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        let sql = '';

        if (role === 'Student') {
            sql = `
                SELECT a.*, u.fullname AS psychologist_name 
                FROM appointments a
                JOIN users u ON a.psychologist_id = u.user_id
                WHERE a.student_id = ?
                ORDER BY a.appointment_date DESC, a.appointment_time ASC
            `;
        } else if (role === 'Psychologist') {
            sql = `
                SELECT a.*, u.fullname AS student_name, u.profile_image AS student_image
                FROM appointments a
                JOIN users u ON a.student_id = u.user_id
                WHERE a.psychologist_id = ?
                ORDER BY a.appointment_date DESC, a.appointment_time ASC
            `;
        } else {
            // Admin ดูได้หมด
            sql = `
                SELECT a.*, s.fullname AS student_name, p.fullname AS psychologist_name
                FROM appointments a
                JOIN users s ON a.student_id = s.user_id
                JOIN users p ON a.psychologist_id = p.user_id
                ORDER BY a.appointment_date DESC
            `;
            return res.json((await db.query(sql))[0]);
        }

        const [rows] = await db.query(sql, [userId]);
        res.json(rows);

    } catch (err) {
        console.error("❌ FETCH APPOINTMENTS ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 3. PUT: อัปเดตสถานะนัดหมาย (รับ/ยกเลิก)
// ==========================================
router.put('/:id/status', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const appointmentId = req.params.id;

        // อัปเดตสถานะ
        await db.execute('UPDATE appointments SET status = ? WHERE appointment_id = ?', [status, appointmentId]);

        // 🔥 ถ้า "ยกเลิก" (Cancelled) ต้องคืนเวลาให้ว่างเหมือนเดิม
        if (status === 'Cancelled') {
            // ดึงข้อมูลนัดหมายเพื่อเอาวันเวลา
            const [appt] = await db.query('SELECT psychologist_id, appointment_date, appointment_time FROM appointments WHERE appointment_id = ?', [appointmentId]);
            if (appt.length > 0) {
                const { psychologist_id, appointment_date, appointment_time } = appt[0];
                
                // คืนค่า is_available = 1
                const dateStr = new Date(appointment_date).toISOString().split('T')[0];
                await db.execute(`
                    UPDATE schedules SET is_available = 1 
                    WHERE psychologist_id = ? AND date = ? AND time_slot = ?
                `, [psychologist_id, dateStr, appointment_time]);
            }
        }

        res.json({ msg: 'Status updated' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 4. GET: ดึงประวัตินัดหมายของนักเรียน (เฉพาะ Student Dashboard)
// ==========================================
router.get('/student-history', authMiddleware, async (req, res) => {
    try {
        const student_id = req.user.id;
        const sql = `
            SELECT a.*, u.fullname AS psychologist_name 
            FROM appointments a
            JOIN users u ON a.psychologist_id = u.user_id
            WHERE a.student_id = ?
            ORDER BY a.appointment_date DESC
        `;
        const [rows] = await db.query(sql, [student_id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;