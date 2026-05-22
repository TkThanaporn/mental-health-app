// server/routes/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); 
const { authMiddleware } = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');

// ==========================================
// ฟังก์ชันช่วยแปลงเวลาให้อยู่ในรูปแบบ 00.00 น.
// ==========================================
const formatTimeWithDot = (timeString) => {
    if (!timeString) return '00.00';
    return timeString.substring(0, 5).replace(':', '.');
};

// ==========================================
// ฟังก์ชันช่วยแปลงวันที่เป็นภาษาไทยแบบเต็ม
// ==========================================
const formatThaiDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// ==========================================
// 1. GET: ดูประวัตินัดหมาย (สำหรับนักจิตวิทยา) - แก้ไขใหม่ให้ดึงผลประเมินและสรุปผล
// ==========================================
router.get('/psychologist-history', authMiddleware, async (req, res) => {
    try {
        const psychologist_user_id = req.user.id || req.user.user_id; 
        
        const sql = `
            SELECT 
                a.appointment_id, 
                a.student_user_id,
                s.date AS date, 
                CONCAT(DATE_FORMAT(s.start_time, '%H:%i'), '-', DATE_FORMAT(s.end_time, '%H:%i')) AS time_slot, 
                a.status, 
                a.topic,
                a.result_summary, -- 👈 เพิ่มตรงนี้เพื่อให้เห็นสรุปผล
                u.fullname AS student_name,
                u.email AS student_email,
                u.phone AS student_phone,
                -- 👇 เพิ่ม Subquery ตรงนี้เพื่อดึงผลประเมินล่าสุด
                (SELECT stress_level 
                 FROM assessments 
                 WHERE student_user_id = a.student_user_id 
                 ORDER BY created_at DESC 
                 LIMIT 1) AS stress_level
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

        const [slots] = await connection.query(
            'SELECT * FROM schedules WHERE schedule_id = ? AND is_available = 1', 
            [schedule_id]
        );

        if (slots.length === 0) {
            await connection.rollback();
            return res.status(400).json({ msg: 'เวลานี้ถูกจองไปแล้ว หรือไม่ว่างครับ' });
        }

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

        await connection.query(
            'UPDATE schedules SET is_available = 0 WHERE schedule_id = ?', 
            [schedule_id]
        );

        const [psychRows] = await connection.query(
            `SELECT u.fullname, u.email, s.date, s.start_time, s.end_time 
             FROM users u 
             JOIN schedules s ON s.schedule_id = ? 
             WHERE u.user_id = ?`, 
            [schedule_id, psychologist_id]
        );

        await connection.commit();

        if (psychRows.length > 0 && psychRows[0].email) {
            const info = psychRows[0];
            const formattedDate = formatThaiDate(info.date);
            const formattedTime = `${formatTimeWithDot(info.start_time)}-${formatTimeWithDot(info.end_time)} น.`;

            await sendEmail({
                to: info.email,
                subject: '🔔 มีคำขอจองคิวรับคำปรึกษาใหม่เข้าสู่ระบบ',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #002d56; padding: 20px; text-align: center;">
                            <h2 style="color: #ffffff; margin: 0; letter-spacing: 1px;">PCSHS Care</h2>
                        </div>
                        <div style="padding: 30px; background-color: #f8f9fa;">
                            <h3 style="color: #f26522; margin-top: 0;">🔔 มีคำขอรับคำปรึกษาใหม่</h3>
                            <p style="color: #333333; font-size: 16px;">เรียน คุณ <strong>${info.fullname}</strong>,</p>
                            <p style="color: #555555; font-size: 15px; line-height: 1.6;">ขณะนี้มีนักเรียนได้ทำการจองคิวใหม่เข้ามาในระบบ โดยมีรายละเอียดการนัดหมายดังนี้:</p>
                            
                            <div style="background-color: #ffffff; border-left: 4px solid #002d56; padding: 15px; margin: 20px 0; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                <p style="margin: 5px 0; font-size: 16px; color: #333;">📅 <strong>วันที่:</strong> ${formattedDate}</p>
                                <p style="margin: 5px 0; font-size: 16px; color: #333;">⏰ <strong>เวลา:</strong> ${formattedTime}</p>
                            </div>

                            <p style="color: #555555; font-size: 15px; line-height: 1.6;">โปรดเข้าสู่ระบบเพื่อตรวจสอบรายละเอียดและกดยืนยันการนัดหมายครับ</p>
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="http://localhost:3000/psychologist/appointments" style="background-color: #f26522; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">จัดการการนัดหมาย</a>
                            </div>
                        </div>
                        <div style="background-color: #eeeeee; padding: 15px; text-align: center; font-size: 12px; color: #888888;">
                            อีเมลแจ้งเตือนอัตโนมัติจากระบบดูแลช่วยเหลือนักเรียน<br>โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย
                        </div>
                    </div>
                `
            });
        }

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
                s.start_time,
                s.end_time,
                (SELECT COUNT(*) FROM feedback f WHERE f.appointment_id = a.appointment_id) AS is_reviewed
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

    const validStatuses = ['confirmed', 'completed', 'cancelled', 'pending', 'no-show'];
    const dbStatus = status.toLowerCase(); 

    if (!validStatuses.includes(dbStatus)) {
        return res.status(400).json({ msg: 'สถานะไม่ถูกต้อง' });
    }

    try {
        await db.query(
            'UPDATE appointments SET status = ? WHERE appointment_id = ?', 
            [dbStatus, appointmentId]
        );

        const [studentInfo] = await db.query(`
            SELECT u.email, u.fullname, a.topic, s.date, s.start_time, s.end_time
            FROM appointments a
            JOIN users u ON a.student_user_id = u.user_id
            JOIN schedules s ON a.schedule_id = s.schedule_id
            WHERE a.appointment_id = ?
        `, [appointmentId]);

        if (studentInfo.length > 0 && studentInfo[0].email) {
            const info = studentInfo[0];
            const isConfirmed = dbStatus === 'confirmed';
            
            let thStatus = dbStatus;
            if (dbStatus === 'confirmed') thStatus = 'ยืนยันการนัดหมายแล้ว';
            if (dbStatus === 'cancelled') thStatus = 'ถูกยกเลิก';
            if (dbStatus === 'no-show') thStatus = 'ขาดนัด (ไม่มีการปรากฏตัว)';
            
            const colorCode = isConfirmed ? '#198754' : '#dc3545';
            
            const formattedDate = formatThaiDate(info.date);
            const formattedTime = `${formatTimeWithDot(info.start_time)}-${formatTimeWithDot(info.end_time)} น.`;

            await sendEmail({
                to: info.email,
                subject: `📅 อัปเดตสถานะการนัดหมาย: ${info.topic}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #002d56; padding: 20px; text-align: center;">
                            <h2 style="color: #ffffff; margin: 0; letter-spacing: 1px;">PCSHS Care</h2>
                        </div>
                        <div style="padding: 30px; background-color: #ffffff;">
                            <h3 style="color: ${colorCode}; margin-top: 0;">📅 อัปเดตสถานะการนัดหมาย</h3>
                            <p style="color: #333333; font-size: 16px;">สวัสดี <strong>${info.fullname}</strong>,</p>
                            <p style="color: #555555; font-size: 15px; line-height: 1.6;">รายการนัดหมายของคุณได้รับการอัปเดตสถานะแล้ว โดยมีรายละเอียดดังนี้:</p>
                            
                            <div style="background-color: #f8f9fa; border-left: 4px solid #f26522; padding: 15px; margin: 15px 0;">
                                <p style="margin: 0 0 8px 0; font-size: 15px;">📌 <strong>หัวข้อ:</strong> ${info.topic}</p>
                                <p style="margin: 0 0 8px 0; font-size: 15px;">📅 <strong>วันที่:</strong> ${formattedDate}</p>
                                <p style="margin: 0; font-size: 15px;">⏰ <strong>เวลา:</strong> ${formattedTime}</p>
                            </div>
                            
                            <p style="color: #555555; font-size: 15px;">สถานะล่าสุดคือ: <strong style="color: ${colorCode}; font-size: 16px;">${thStatus}</strong></p>
                            
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="http://localhost:3000/student/appointments" style="background-color: #002d56; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">ดูรายละเอียดของฉัน</a>
                            </div>
                        </div>
                        <div style="background-color: #eeeeee; padding: 15px; text-align: center; font-size: 12px; color: #888888;">
                            อีเมลแจ้งเตือนอัตโนมัติจากระบบดูแลช่วยเหลือนักเรียน<br>โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย
                        </div>
                    </div>
                `
            });
        }

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

        await connection.query(
            'UPDATE appointments SET status = ?, result_summary = ? WHERE appointment_id = ?',
            ['completed', result_summary, appointmentId]
        );

        let follow_up_end_time = null; // ✅ ตัวแปรเก็บเวลาจบที่บวกแล้ว

        if (follow_up_date && follow_up_time) {
            // ✅ คำนวณบวกเวลาสิ้นสุดไปอีก 1 ชั่วโมง (ป้องกันปัญหาเวลาซ้ำ 22.00-22.00)
            let [hours, minutes] = follow_up_time.split(':');
            hours = String((parseInt(hours) + 1) % 24).padStart(2, '0');
            follow_up_end_time = `${hours}:${minutes}`;

            const [schedResult] = await connection.query(
                'INSERT INTO schedules (psychologist_user_id, date, start_time, end_time, is_available) VALUES (?, ?, ?, ?, 0)',
                [psychologist_user_id, follow_up_date, follow_up_time, follow_up_end_time]
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

        const [studentRows] = await connection.query(
            'SELECT fullname, email FROM users WHERE user_id = ?', 
            [student_user_id]
        );

        await connection.commit();

        if (studentRows.length > 0 && studentRows[0].email) {
            let followUpHtml = '';
            
            // ✅ นำเวลาที่บวกเสร็จแล้วมาแสดงผลแบบมีขีดกลาง
            if (follow_up_date && follow_up_time) {
                const fDate = formatThaiDate(follow_up_date);
                const fTimeStart = formatTimeWithDot(follow_up_time);
                const fTimeEnd = formatTimeWithDot(follow_up_end_time);

                followUpHtml = `
                <div style="background-color: #fff3cd; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: left; border-left: 4px solid #ffc107;">
                    <p style="margin: 0 0 10px 0; color: #856404; font-weight: bold; font-size: 16px;">📅 มีการนัดติดตามอาการ (Follow-up)</p>
                    <p style="margin: 5px 0; color: #666; font-size: 15px;"><strong>วันที่:</strong> ${fDate}</p>
                    <p style="margin: 5px 0; color: #666; font-size: 15px;"><strong>เวลา:</strong> ${fTimeStart}-${fTimeEnd} น.</p>
                    <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">โปรดตรวจสอบรายละเอียดเพิ่มเติมได้ที่หน้าแอปพลิเคชัน</p>
                </div>
                `;
            }

            await sendEmail({
                to: studentRows[0].email,
                subject: '✅ การให้คำปรึกษาเสร็จสิ้น - PCSHS Student Care',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #002d56; padding: 20px; text-align: center;">
                            <h2 style="color: #ffffff; margin: 0; letter-spacing: 1px;">PCSHS Care</h2>
                        </div>
                        <div style="padding: 30px; background-color: #ffffff;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <span style="font-size: 50px;">✅</span>
                            </div>
                            <h3 style="color: #198754; margin-top: 0; text-align: center;">การให้คำปรึกษาเสร็จสิ้น</h3>
                            <p style="color: #333333; font-size: 16px;">สวัสดี <strong>${studentRows[0].fullname}</strong>,</p>
                            <p style="color: #555555; font-size: 15px; line-height: 1.6;">ขอบคุณที่เข้ารับการพูดคุยและปรึกษากับครูแนะแนว/นักจิตวิทยาในวันนี้ หวังว่าคุณจะรู้สึกสบายใจขึ้นและได้รับมุมมองใหม่ๆ ในการจัดการกับความรู้สึกนะครับ</p>
                            
                            ${followUpHtml}

                            <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                                <h4 style="color: #002d56; margin-top: 0; font-size: 18px;">บอกเราหน่อยว่าวันนี้เป็นอย่างไรบ้าง? ⭐</h4>
                                <p style="color: #555555; font-size: 14px;">การให้คะแนนความพึงพอใจของคุณ จะช่วยให้เราพัฒนาการดูแลนักเรียนได้ดียิ่งขึ้น</p>
                                <a href="http://localhost:3000/student/appointments" style="background-color: #ffc107; color: #000000; padding: 10px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; margin-top: 10px;">ทำแบบประเมินความพึงพอใจ</a>
                            </div>
                        </div>
                        <div style="background-color: #eeeeee; padding: 15px; text-align: center; font-size: 12px; color: #888888;">
                            ระบบดูแลช่วยเหลือนักเรียน<br>โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย
                        </div>
                    </div>
                `
            });
        }

        res.json({ msg: '✅ บันทึกผลการให้คำปรึกษาเรียบร้อยแล้ว!' });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Complete Job Error:", err);
        res.status(500).send('Server Error');
    } finally {
        if (connection) connection.release();
    }
});

// ==========================================
// 7. POST: บันทึกการประเมินความพึงพอใจ (ฝั่งนักเรียน)
// ==========================================
router.post('/feedback', authMiddleware, async (req, res) => {
    const { appointment_id, rating, comment } = req.body;
    const student_user_id = req.user.id || req.user.user_id;

    try {
        await db.query(
            'INSERT INTO feedback (appointment_id, student_user_id, rating, comment) VALUES (?, ?, ?, ?)',
            [appointment_id, student_user_id, rating, comment || '-']
        );
        res.json({ msg: '✅ ขอบคุณสำหรับการประเมินค่ะ!' });
    } catch (err) {
        console.error("Feedback Error:", err);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 8. PUT: ขาดนัด / ไม่มาตามนัด (No-show)
// ==========================================
router.put('/no-show/:id', authMiddleware, async (req, res) => {
    const appointmentId = req.params.id;
    const { note } = req.body; 

    try {
        await db.query(
            'UPDATE appointments SET status = ?, result_summary = ? WHERE appointment_id = ?',
            ['no-show', note || 'นักเรียนขาดนัด / ไม่มาตามวันเวลาที่กำหนด (No-show)', appointmentId]
        );
        res.json({ msg: 'บันทึกสถานะขาดนัด (No-show) เรียบร้อยแล้ว' });
    } catch (err) {
        console.error("No-Show Error:", err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;