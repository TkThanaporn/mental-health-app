// server/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ==========================================
// 1. GET: ดึงประวัติข้อความ (ดึงมาครบทุกคอลัมน์)
// ==========================================
router.get('/:appointmentId', async (req, res) => {
    try {
        const { appointmentId } = req.params;
        
        // ✅ ดึงมาครบทั้ง messages_id, receiver_id และอื่นๆ ตามฐานข้อมูลเป๊ะๆ
        const sql = `
            SELECT 
                c.messages_id,
                c.appointment_id,
                c.sender_id, 
                c.receiver_id,
                c.message_text, 
                c.created_at,
                u.fullname AS sender_name 
            FROM chat_messages c
            JOIN users u ON c.sender_id = u.user_id
            WHERE c.appointment_id = ?
            ORDER BY c.created_at ASC
        `;
        
        const [messages] = await db.query(sql, [appointmentId]);
        res.json(messages);

    } catch (err) {
        console.error("❌ FETCH CHAT ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 2. POST: บันทึกข้อความแชทใหม่ลงฐานข้อมูล (แก้ปัญหา receiver_id)
// ==========================================
router.post('/', async (req, res) => {
    try {
        // รับค่ามาจากฝั่งหน้าเว็บ (ไม่ต้องบังคับรับ receiver_id แล้ว)
        const { appointment_id, sender_id, message_text } = req.body;

        if (!appointment_id || !sender_id || !message_text) {
            return res.status(400).json({ msg: 'ข้อมูลแชทไม่ครบถ้วน' });
        }

        // 1. ค้นหาข้อมูลการนัดหมายนี้ เพื่อดูว่าใครเป็นนักเรียน ใครเป็นนักจิตวิทยา
        const [apptRows] = await db.query(
            'SELECT student_user_id, psychologist_user_id FROM appointments WHERE appointment_id = ?', 
            [appointment_id]
        );

        if (apptRows.length === 0) {
            return res.status(404).json({ msg: 'ไม่พบข้อมูลการนัดหมาย' });
        }

        const appointment = apptRows[0];
        let receiver_id = null;

        // 2. ตรวจสอบว่าคนส่ง (sender) คือใคร เพื่อกำหนดตัวคนรับ (receiver)
        if (parseInt(sender_id) === appointment.student_user_id) {
            // ถ้านักเรียนส่ง -> คนรับคือนักจิตวิทยา
            receiver_id = appointment.psychologist_user_id;
        } else {
            // ถ้านักจิตวิทยาส่ง -> คนรับคือนักเรียน
            receiver_id = appointment.student_user_id;
        }

        // 3. บันทึกข้อมูลลงตาราง (ตอนนี้มี receiver_id ที่ถูกต้อง 100% แล้ว)
        const sql = `
            INSERT INTO chat_messages (appointment_id, sender_id, receiver_id, message_text) 
            VALUES (?, ?, ?, ?)
        `;
        await db.query(sql, [appointment_id, sender_id, receiver_id, message_text]);

        res.status(201).json({ msg: 'บันทึกข้อความสำเร็จ' });

    } catch (err) {
        console.error("❌ SAVE CHAT ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;