const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

// 1.3.1.2: จัดการผู้ใช้
router.post('/users', authMiddleware, authorizeRole(['Admin']), async (req, res) => {
    // **TODO: Logic เพิ่มผู้ใช้ใหม่ (เช่น นักจิตวิทยา)**
});

// 1.3.1.4: จัดการเนื้อหา (เพิ่มข่าวสาร)
router.post('/content', authMiddleware, authorizeRole(['Admin']), async (req, res) => {
    const { title, body, type } = req.body;
    try {
        await db.execute('INSERT INTO Content (title, body, content_type) VALUES (?, ?, ?)', [title, body, type]);
        res.status(201).json({ msg: 'Content created' });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// 1.3.1.5: รายงาน
router.get('/reports', authMiddleware, authorizeRole(['Admin']), async (req, res) => {
    // 1.3.1.5.1: จำนวนการนัดหมาย
    const [totalAppointments] = await db.execute('SELECT COUNT(*) AS total FROM Appointments');
    // 1.3.1.5.2: สถิติการใช้งานของผู้ใช้
    const [userStats] = await db.execute('SELECT role, COUNT(*) AS count FROM Users GROUP BY role');
    
    // 1.3.1.3: ประวัติการให้คำปรึกษาของนักจิตวิทยา
    const [counselingHistory] = await db.execute(`
        SELECT a.*, sp.fullname AS student_name, pp.fullname AS psycho_name
        FROM Appointments a
        JOIN StudentProfiles sp ON a.student_id = sp.student_id
        JOIN PsychologistProfiles pp ON a.psychologist_id = pp.psychologist_id
    `);

    res.json({ totalAppointments: totalAppointments[0].total, userStats, counselingHistory });
});

module.exports = router;