const express = require('express');
const router = express.Router();
const db = require('../config/db'); 
const { authMiddleware, authorizeRole } = require('../middleware/auth');

// ==========================================
// 1. GET: ดึงรายการนัดหมาย (สำหรับนักจิตวิทยา)
// ==========================================
router.get('/', authMiddleware, authorizeRole(['Psychologist']), async (req, res) => {
    try {
        const psychologist_id = req.user.id; 
        const sql = `
            SELECT 
                a.appointment_id, 
                a.student_id,  -- ✅ เพิ่มบรรทัดนี้: เพื่อให้นักจิตฯ กดดูผลประเมินได้
                a.appointment_date, 
                a.appointment_time, 
                a.type, 
                a.topic, 
                a.status,
                u.fullname AS student_name,
                u.email AS student_email
            FROM appointments a
            JOIN users u ON a.student_id = u.user_id
            WHERE a.psychologist_id = ?
            ORDER BY a.appointment_date DESC, a.appointment_time ASC
        `;
        const [appointments] = await db.query(sql, [psychologist_id]);
        res.json(appointments);
    } catch (err) {
        console.error("❌ FETCH ERROR:", err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// ==========================================
// 2. PUT: อัปเดตสถานะนัดหมาย (รับนัด/ปฏิเสธ)
// ==========================================
router.put('/:id/status', authMiddleware, authorizeRole(['Psychologist']), async (req, res) => {
    try {
        const { status } = req.body; 
        const appointment_id = req.params.id;
        console.log(`🔄 Updating Appointment ID: ${appointment_id} to status: ${status}`);

        const sql = `UPDATE appointments SET status = ? WHERE appointment_id = ?`;
        await db.execute(sql, [status, appointment_id]);

        console.log("✅ Status updated successfully.");
        res.json({ msg: 'Status updated' });
    } catch (err) {
        console.error("❌ UPDATE STATUS ERROR:", err.message);
        res.status(500).send('Server error');
    }
});

// ==========================================
// 3. POST: จองนัดหมาย (สำหรับนักเรียน)
// ==========================================
router.post('/', authMiddleware, authorizeRole(['Student']), async (req, res) => {
    try {
        const student_id = req.user.id;
        const { psychologist_id, date, time, type, topic, consultation_type, group_members } = req.body;

        // 🛡️ [เพิ่มใหม่] ตรวจสอบว่าทำแบบประเมินหรือยัง?
        // เช็คในตาราง assessments ว่ามี student_id นี้ไหม
        const sqlCheck = `SELECT assessment_id FROM assessments WHERE student_id = ? LIMIT 1`;
        const [assessments] = await db.query(sqlCheck, [student_id]);

        if (assessments.length === 0) {
            // ถ้ายังไม่ทำ -> ส่ง Error 403 กลับไป (Frontend จะได้รับรู้)
            return res.status(403).json({ msg: 'กรุณาทำแบบประเมินความเครียดก่อนทำการจองนัดหมาย' });
        }

        console.log(`📝 New Booking Request from Student ID: ${student_id}`);

        const sqlAppt = `
            INSERT INTO appointments 
            (student_id, psychologist_id, appointment_date, appointment_time, type, topic, consultation_type, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
        `;
        
        const [result] = await db.execute(sqlAppt, [
            student_id, psychologist_id, date, time, type, topic, consultation_type
        ]);

        const appointment_id = result.insertId;

        if (consultation_type === 'Group' && group_members && group_members.length > 0) {
            console.log("👥 Adding group members...");
            const sqlGroup = `INSERT INTO groupmembers (appointment_id, member_email) VALUES ?`;
            const groupValues = group_members.map(email => [appointment_id, email]);
            await db.query(sqlGroup, [groupValues]);
        }

        console.log("✅ Booking saved successfully.");
        res.json({ msg: 'Appointment booked successfully', appointment_id });

    } catch (err) {
        console.error("❌ BOOKING ERROR:", err.message);
        res.status(500).send('Server error: ' + err.message);
    }
});

// ==========================================
// 4. GET: ดึงประวัตินัดหมาย (สำหรับนักเรียนดูเอง)
// ==========================================
router.get('/student-history', authMiddleware, authorizeRole(['Student']), async (req, res) => {
    try {
        const student_id = req.user.id;
        console.log(`🔍 Fetching history for Student ID: ${student_id}`);

        const sql = `
            SELECT 
                a.appointment_id, 
                a.appointment_date, 
                a.appointment_time, 
                a.type, 
                a.topic, 
                a.status,
                u.fullname AS psychologist_name
            FROM appointments a
            JOIN users u ON a.psychologist_id = u.user_id
            WHERE a.student_id = ?
            ORDER BY a.appointment_date DESC
        `;

        const [appointments] = await db.query(sql, [student_id]);
        res.json(appointments);

    } catch (err) {
        console.error("❌ FETCH HISTORY ERROR:", err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;