const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Import Pool
const { authMiddleware } = require('../middleware/auth');



// ✅ ย้ายมาไว้ด้านบนสุดของไฟล์ (ก่อน Route ที่มี /:id)
router.get('/psychologist-history', authMiddleware, async (req, res) => {
    try {
        const psychologist_id = req.user.id || req.user.user_id; 
        const sql = `
            SELECT 
                a.appointment_id, 
                a.appointment_date AS date, 
                a.appointment_time AS time_slot, 
                a.status, 
                a.topic,
                u.fullname AS student_name,
                u.email AS student_email,
                u.phone AS student_phone
            FROM appointments a
            JOIN users u ON a.student_id = u.user_id
            WHERE a.psychologist_id = ?
            ORDER BY a.appointment_date DESC, a.appointment_time ASC
        `;
        const [rows] = await db.query(sql, [psychologist_id]);
        res.json(rows);
    } catch (err) {
        console.error("❌ FETCH HISTORY ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});
/// ==========================================
// 📌 POST: จองนัดหมาย (สำหรับนักเรียน)
// ==========================================
router.post('/', authMiddleware, async (req, res) => {
    const { schedule_id, psychologist_id, note, type, consultation_type } = req.body;
    const student_id = req.user.id || req.user.user_id;

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
        
        const selectedSlot = slots[0];

        // 2. บันทึกการจอง
        // ✅ แก้ไข: เพิ่ม schedule_id เข้าไปในวงเล็บคอลัมน์ และ VALUES
        const sql = `
            INSERT INTO appointments 
            (student_id, psychologist_id, appointment_date, appointment_time, topic, type, consultation_type, status, schedule_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
        `;

        await connection.query(sql, [
            student_id, 
            psychologist_id, 
            selectedSlot.date,        
            selectedSlot.time_slot,   
            note || '-',              
            type || 'Onsite',         
            consultation_type || 'Individual',
            schedule_id // <--- ✅ ใส่ค่า schedule_id ตรงนี้ (ตัวแปรสุดท้าย)
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
// 📌 GET: ดูประวัติการจอง (สำหรับนักเรียน)
// ==========================================
router.get('/my-appointments', authMiddleware, async (req, res) => {
    try {
        // ✅ แก้ไข: ใช้ u.fullname และ u.user_id
        const sql = `
            SELECT a.*, u.fullname AS psychologist_name
            FROM appointments a
            JOIN users u ON a.psychologist_id = u.user_id
            WHERE a.student_id = ?
            ORDER BY a.appointment_date DESC, a.appointment_time ASC
        `;
        const student_id = req.user.id || req.user.user_id;
        const [rows] = await db.query(sql, [student_id]);
        res.json(rows);
    } catch (err) {
        console.error("Fetch Student History Error:", err);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 📌 GET: ดูรายการนัดหมายทั้งหมด (สำหรับนักจิตวิทยา)
// ==========================================
router.get('/psychologist-appointments', authMiddleware, async (req, res) => {
    try {
        // ✅ แก้ไข: ใช้ u.fullname และ u.user_id
        const sql = `
            SELECT a.*, u.fullname AS student_name, u.email AS student_email
            FROM appointments a
            JOIN users u ON a.student_id = u.user_id
            WHERE a.psychologist_id = ? 
            ORDER BY a.appointment_date DESC, a.appointment_time ASC
        `;
        const psychologist_id = req.user.id || req.user.user_id;
        const [rows] = await db.query(sql, [psychologist_id]);
        res.json(rows);
    } catch (err) {
        console.error("Fetch Psych Appointments Error:", err);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 📌 PUT: อัปเดตสถานะ (กดอนุมัติ / เสร็จสิ้น / ยกเลิก)
// ==========================================
router.put('/status/:id', authMiddleware, async (req, res) => {
    const { status } = req.body; 
    const appointmentId = req.params.id;

    const validStatuses = ['Confirmed', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ msg: 'สถานะไม่ถูกต้อง' });
    }

    try {
        await db.query(
            'UPDATE appointments SET status = ? WHERE appointment_id = ?', 
            [status, appointmentId]
        );
        res.json({ msg: `อัปเดตสถานะเป็น ${status} เรียบร้อย!` });
    } catch (err) {
        console.error("Update Status Error:", err);
        res.status(500).send('Server Error');
    }
});


// 📌 POST: จบงาน + บันทึกผล + นัดติดตามอาการ (Follow-up)
// ==========================================
router.post('/complete/:id', authMiddleware, async (req, res) => {
    const appointmentId = req.params.id;
    const { result_summary, follow_up_date, follow_up_time, student_id } = req.body;
    const psychologist_id = req.user.id || req.user.user_id;

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. อัปเดตงานเดิมเป็น Completed + บันทึกผล
        // ⚠️ อย่าลืม: ต้องรัน SQL เพิ่มคอลัมน์ result_summary ใน Database ก่อนนะครับ
        await connection.query(
            'UPDATE appointments SET status = ?, result_summary = ? WHERE appointment_id = ?',
            ['Completed', result_summary, appointmentId]
        );

        // 2. ถ้ามีการนัดต่อ (Follow-up) ให้สร้างนัดหมายใหม่ทันที
        if (follow_up_date && follow_up_time) {
            const sqlFollowUp = `
                INSERT INTO appointments 
                (student_id, psychologist_id, appointment_date, appointment_time, topic, type, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            await connection.query(sqlFollowUp, [
                student_id,
                psychologist_id,
                follow_up_date,
                follow_up_time,
                'นัดติดตามอาการ (Follow-up)',
                'Online', 
                'Confirmed' 
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

