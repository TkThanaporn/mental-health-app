// server/routes/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Import Pool
const { authMiddleware } = require('../middleware/auth');

// ==========================================
// 1. GET: ดูประวัตินัดหมาย (สำหรับนักจิตวิทยา)
// ==========================================
router.get('/psychologist-history', authMiddleware, async (req, res) => {
    try {
        const psychologist_user_id = req.user.id || req.user.user_id; 
        
        const sql = `
            SELECT 
                a.appointment_id, 
                s.date AS date, 
                CONCAT(DATE_FORMAT(s.start_time, '%H:%i'), '-', DATE_FORMAT(s.end_time, '%H:%i')) AS time_slot, 
                a.status, 
                a.topic,
                u.fullname AS student_name,
                u.email AS student_email,
                u.phone AS student_phone
            FROM appointments a
            JOIN users u ON a.student_user_id = u.user_id
            JOIN schedules s ON a.schedule_id = s.schedule_id
            WHERE a.psychologist_user_id = ?
            ORDER BY s.date DESC, s.start_time ASC
        `;
        const [rows] = await db.query(sql, [psychologist_user_id]);
        res.json(rows);
    } catch (err) {
        console.error("❌ FETCH HISTORY ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 2. POST: จองนัดหมาย (สำหรับนักเรียน)
// ==========================================
router.post('/', authMiddleware, async (req, res) => {
    const { schedule_id, psychologist_id, note, type, consultation_type } = req.body;
    const student_user_id = req.user.id || req.user.user_id;

    if (!schedule_id || !psychologist_id) {
        return res.status(400).json({ msg: 'ข้อมูลไม่ครบถ้วน' });
    }

    let connection;
    try {
        connection = await db.getConnection(); 
        await connection.beginTransaction();

        // 1. เช็คเวลาว่าง
        const [slots] = await connection.query(
            'SELECT * FROM schedules WHERE schedule_id = ? AND is_available = 1', 
            [schedule_id]
        );

        if (slots.length === 0) {
            await connection.rollback();
            return res.status(400).json({ msg: 'เวลานี้ถูกจองไปแล้ว หรือไม่ว่างครับ' });
        }

        // 2. บันทึกการจอง
        const sql = `
            INSERT INTO appointments 
            (student_user_id, psychologist_user_id, schedule_id, topic, type, consultation_type, status) 
            VALUES (?, ?, ?, ?, ?, ?, 'pending')
        `;

        await connection.query(sql, [
            student_user_id, 
            psychologist_id, 
            schedule_id,
            note || '-',              
            (type || 'online').toLowerCase(),        
            (consultation_type || 'individual').toLowerCase()
        ]);

        // 3. ตัดเวลาออกจากตาราง (ไม่ว่างแล้ว)
        await connection.query(
            'UPDATE schedules SET is_available = 0 WHERE schedule_id = ?', 
            [schedule_id]
        );

        await connection.commit();
        res.json({ msg: '✅ จองนัดหมายสำเร็จ!' });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("❌ Booking Error:", err);
        res.status(500).send('Server Error: ' + err.message);
    } finally {
        if (connection) connection.release();
    }
});

// ==========================================
// 3. GET: ดูประวัติการจอง (สำหรับนักเรียน)
// ==========================================
router.get('/my-appointments', authMiddleware, async (req, res) => {
    try {
        const student_user_id = req.user.id || req.user.user_id;
        const sql = `
            SELECT 
                a.*, 
                u.fullname AS psychologist_name,
                s.date AS appointment_date,
                s.start_time AS appointment_time
            FROM appointments a
            JOIN users u ON a.psychologist_user_id = u.user_id
            JOIN schedules s ON a.schedule_id = s.schedule_id
            WHERE a.student_user_id = ?
            ORDER BY s.date DESC, s.start_time ASC
        `;
        const [rows] = await db.query(sql, [student_user_id]);
        res.json(rows);
    } catch (err) {
        console.error("Fetch Student History Error:", err);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 4. GET: ดูรายการนัดหมายทั้งหมด (สำหรับนักจิตวิทยา)
// ==========================================
router.get('/psychologist-appointments', authMiddleware, async (req, res) => {
    try {
        const psychologist_user_id = req.user.id || req.user.user_id;
        
        // ✅ อัปเดต SQL ตรงนี้: เพิ่ม JOIN ตาราง assessments และดึง start_time, end_time
        const sql = `
            SELECT 
                a.*, 
                u.fullname AS student_name, 
                u.email AS student_email,
                s.date AS appointment_date,
                s.start_time,
                s.end_time,
                ass.stress_level AS latest_assessment
            FROM appointments a
            JOIN users u ON a.student_user_id = u.user_id
            JOIN schedules s ON a.schedule_id = s.schedule_id
            LEFT JOIN (
                SELECT student_user_id, stress_level 
                FROM assessments 
                WHERE assessment_id IN (
                    SELECT MAX(assessment_id) 
                    FROM assessments 
                    GROUP BY student_user_id
                )
            ) ass ON a.student_user_id = ass.student_user_id
            WHERE a.psychologist_user_id = ? 
            ORDER BY s.date DESC, s.start_time ASC
        `;
        
        const [rows] = await db.query(sql, [psychologist_user_id]);
        res.json(rows);
    } catch (err) {
        console.error("Fetch Psych Appointments Error:", err);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 5. PUT: อัปเดตสถานะ (กดอนุมัติ / เสร็จสิ้น / ยกเลิก)
// ==========================================
router.put('/status/:id', authMiddleware, async (req, res) => {
    const { status } = req.body; 
    const appointmentId = req.params.id;

    const validStatuses = ['confirmed', 'completed', 'cancelled', 'pending'];
    const dbStatus = status.toLowerCase(); 

    if (!validStatuses.includes(dbStatus)) {
        return res.status(400).json({ msg: 'สถานะไม่ถูกต้อง' });
    }

    try {
        await db.query(
            'UPDATE appointments SET status = ? WHERE appointment_id = ?', 
            [dbStatus, appointmentId]
        );
        res.json({ msg: `อัปเดตสถานะเป็น ${status} เรียบร้อย!` });
    } catch (err) {
        console.error("Update Status Error:", err);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 6. POST: จบงาน + บันทึกผล + นัดติดตามอาการ (Follow-up)
// ==========================================
router.post('/complete/:id', authMiddleware, async (req, res) => {
    const appointmentId = req.params.id;
    const { result_summary, follow_up_date, follow_up_time, student_id } = req.body;
    const student_user_id = student_id; 
    const psychologist_user_id = req.user.id || req.user.user_id;

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. อัปเดตงานเดิมเป็น completed + บันทึกผล
        await connection.query(
            'UPDATE appointments SET status = ?, result_summary = ? WHERE appointment_id = ?',
            ['completed', result_summary, appointmentId]
        );

        // 2. ถ้ามีการนัดต่อ (Follow-up)
        if (follow_up_date && follow_up_time) {
            const [schedResult] = await connection.query(
                'INSERT INTO schedules (psychologist_user_id, date, start_time, end_time, is_available) VALUES (?, ?, ?, ?, 0)',
                [psychologist_user_id, follow_up_date, follow_up_time, follow_up_time]
            );
            const new_schedule_id = schedResult.insertId;

            const sqlFollowUp = `
                INSERT INTO appointments 
                (student_user_id, psychologist_user_id, schedule_id, topic, type, consultation_type, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            await connection.query(sqlFollowUp, [
                student_user_id,
                psychologist_user_id,
                new_schedule_id,
                'นัดติดตามอาการ (Follow-up)',
                'online', 
                'individual',
                'confirmed' 
            ]);
        }

        await connection.commit();
        res.json({ msg: '✅ บันทึกผลการให้คำปรึกษาเรียบร้อยแล้ว!' });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Complete Job Error:", err);
        res.status(500).send('Server Error');
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;