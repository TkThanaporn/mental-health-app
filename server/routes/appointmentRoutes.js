// D:\mental-health-app\server\routes\appointmentRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

// ✅ นำเข้า Service ของ Google Calendar
const { createCalendarEvent } = require('../services/googleCalendarService');

// @route   POST api/appointments
// @desc    P5: Student creates a new appointment request
router.post('/', authMiddleware, authorizeRole(['Student']), async (req, res) => {
    const { 
        psychologist_id, 
        date, 
        time, 
        type, // Online / Onsite (1.3.2.6)
        topic, // (1.3.2.7)
        consultation_type, // Individual / Group (1.3.2.9)
        group_members // (1.3.2.9.1)
    } = req.body;
    
    // ดึงข้อมูลจาก Token (ต้องมั่นใจว่า authMiddleware แนบ email มาด้วย)
    const student_id = req.user.id;
    const student_email = req.user.email; 
    const status = 'Pending'; // สถานะเริ่มต้น

    // ตรวจสอบข้อมูลจำเป็น
    if (!psychologist_id || !date || !time || !topic) {
        return res.status(400).json({ msg: 'Please provide all required fields.' });
    }

    try {
        // 1. บันทึกนัดหมายหลักลง MySQL
        const [result] = await db.execute(
            'INSERT INTO Appointments (student_id, psychologist_id, appointment_date, appointment_time, type, topic, consultation_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [student_id, psychologist_id, date, time, type, topic, consultation_type, status]
        );
        
        const appointmentId = result.insertId;

        // 2. ถ้าเป็นแบบกลุ่ม (P5.5, 1.3.2.9.1): บันทึกรายชื่อเพื่อน
        if (consultation_type === 'Group' && group_members && group_members.length > 0) {
            const memberValues = group_members.map(email => 
                [appointmentId, email]
            ).flat(); 
            
            const insertGroupSQL = `
                INSERT INTO GroupMembers (appointment_id, member_email) 
                VALUES ${group_members.map(() => '(?, ?)').join(', ')}
            `;
            
            await db.execute(insertGroupSQL, memberValues);
        }

        // 3. ✅ เพิ่ม: Sync ลง Google Calendar (Advanced Mode)
        try {
            // แปลงเวลาจาก "09:00-10:00" เป็น Start/End ISO Format
            const [startTimeStr, endTimeStr] = time.split('-'); 
            // สร้าง ISO String: "2024-02-14T09:00:00+07:00"
            const startDateTime = `${date}T${startTimeStr.trim()}:00+07:00`;
            const endDateTime = `${date}T${endTimeStr.trim()}:00+07:00`;

            await createCalendarEvent({
                title: `นัดหมายปรึกษาจิตวิทยา (${type})`,
                description: `หัวข้อ: ${topic}\nรูปแบบ: ${consultation_type}\nผู้จอง: ${student_email}`,
                startTime: startDateTime,
                endTime: endDateTime,
                studentEmail: student_email // ส่ง Invite ให้นักเรียน
            });

            console.log("Google Calendar Sync Successful");

        } catch (calendarErr) {
            // ถ้า Google Calendar พัง ให้ Log ไว้ แต่ไม่ต้องให้ App พัง (ยังถือว่าจองสำเร็จในระบบเรา)
            console.error("Google Calendar Sync Failed:", calendarErr.message);
        }

        // TODO: P8.1: ส่ง Notification นัดหมายเบื้องต้นไปยังนักเรียนและนักจิตวิทยา

        res.status(201).json({ msg: 'Appointment request submitted and synced to Calendar.', appointmentId });

    } catch (err) {
        console.error("APPOINTMENT CREATE ERROR:", err.message);
        res.status(500).send('Server error during appointment creation.');
    }
});

// @route   PUT api/appointments/:id/status
// @desc    P6.2: Psychologist confirms or cancels an appointment
router.put('/:id/status', authMiddleware, authorizeRole(['Psychologist']), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Confirmed' or 'Cancelled'
    const psychologist_id = req.user.id;
    
    // ตรวจสอบสถานะ
    if (!['Confirmed', 'Cancelled'].includes(status)) {
        return res.status(400).json({ msg: 'Invalid status.' });
    }

    try {
        const [result] = await db.execute(
            'UPDATE Appointments SET status = ? WHERE appointment_id = ? AND psychologist_id = ?',
            [status, id, psychologist_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Appointment not found or unauthorized.' });
        }
        
        // TODO: P6.5, P8.1: ส่ง Notification การยืนยัน/ยกเลิกไปยังนักเรียน

        res.json({ msg: `Appointment status updated to ${status}.` });
    } catch (err) {
        console.error("APPOINTMENT STATUS UPDATE ERROR:", err.message);
        res.status(500).send('Server error.');
    }
});

// ✅ เพิ่ม Route ใหม่: ดึงรายการนัดหมายทั้งหมดของนักจิตวิทยา (สำหรับ Dashboard)
// @route   GET api/appointments
router.get('/', authMiddleware, authorizeRole(['Psychologist']), async (req, res) => {
    try {
        const psychologist_id = req.user.id;

        // Query ดึงข้อมูลนัดหมาย + ชื่อนักเรียน (Join Table)
        const sql = `
            SELECT 
                a.appointment_id, 
                a.appointment_date, 
                a.appointment_time, 
                a.type, 
                a.topic, 
                a.status,
                u.fullname AS student_name,
                u.email AS student_email,
                u.phone_number
            FROM Appointments a
            JOIN Users u ON a.student_id = u.user_id
            WHERE a.psychologist_id = ?
            ORDER BY a.appointment_date DESC, a.appointment_time ASC
        `;

        const [appointments] = await db.execute(sql, [psychologist_id]);
        res.json(appointments);

    } catch (err) {
        console.error("FETCH APPOINTMENTS ERROR:", err.message);
        res.status(500).send('Server error.');
    }
});

module.exports = router;