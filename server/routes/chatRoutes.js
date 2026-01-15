const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET: ดึงประวัติข้อความตาม Appointment ID
router.get('/:appointmentId', async (req, res) => {
    try {
        const { appointmentId } = req.params;
        
        // ดึงข้อความ + ชื่อคนส่ง (Join ตาราง Users)
        const sql = `
            SELECT 
                c.message_text, 
                c.sender_id, 
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

module.exports = router;