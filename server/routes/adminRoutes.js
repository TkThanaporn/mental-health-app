const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt'); 
const { authMiddleware, authorizeRole } = require('../middleware/auth');

// ==========================================
// 1. 📊 API สำหรับ AdminDashboard (แก้ให้ตรงกับ Frontend)
// ==========================================
router.get('/summary', authMiddleware, authorizeRole(['Admin']), async (req, res) => {
    try {
        // 1. นับจำนวนนักเรียน (total_students)
        const [students] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'Student'");
        
        // 2. นับจำนวนนักจิตวิทยา (pending_psychologists - หรือนับทั้งหมดไปก่อน)
        const [psychologists] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'Psychologist'");

        // 3. นับจำนวนนัดหมาย (confirmed_appointments)
        // (ใช้ try-catch กัน Error กรณีที่ยังไม่มีตาราง appointments)
        let confirmedAppointments = 0;
        try {
            const [appt] = await db.query("SELECT COUNT(*) as count FROM appointments"); // หรือ WHERE status = 'Confirmed'
            confirmedAppointments = appt[0].count;
        } catch (e) { console.log("Appointments table not ready"); }

        // 4. แบบประเมิน (pending_assessments)
        let pendingAssessments = 0;
        try {
            const [assess] = await db.query("SELECT COUNT(*) as count FROM assessments"); 
            pendingAssessments = assess[0].count;
        } catch (e) { console.log("Assessments table not ready"); }

        // ส่งข้อมูลกลับไปตามชื่อที่ Frontend รอรับ (total_students, etc.)
        res.json({
            total_students: students[0].count,
            pending_assessments: pendingAssessments,
            confirmed_appointments: confirmedAppointments,
            pending_psychologists: psychologists[0].count
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database Error' });
    }
});

// ==========================================
// 2. 👥 ดึงรายชื่อผู้ใช้ทั้งหมด (สำหรับหน้าจัดการ Users)
// ==========================================
router.get('/users', authMiddleware, authorizeRole(['Admin']), async (req, res) => {
    try {
        const [rows] = await db.query("SELECT user_id, fullname, email, role, phone, created_at, profile_image FROM users ORDER BY created_at DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Database Error' });
    }
});

// ==========================================
// 3. ➕ เพิ่มผู้ใช้งานใหม่ (Create User)
// ==========================================
router.post('/users', authMiddleware, authorizeRole(['Admin']), async (req, res) => {
    const { fullname, email, password, role, phone, gender } = req.body;

    if (!fullname || !email || !password || !role) {
        return res.status(400).json({ msg: 'กรุณากรอกข้อมูลให้ครบ' });
    }

    try {
        const [existing] = await db.query("SELECT user_id FROM users WHERE email = ?", [email]);
        if (existing.length > 0) return res.status(400).json({ msg: 'อีเมลนี้มีอยู่ในระบบแล้ว' });

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        const profile_image = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullname)}&background=random&color=fff`;

        const sql = `INSERT INTO users (fullname, email, password_hash, role, phone, gender, profile_image, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
        await db.query(sql, [fullname, email, password_hash, role, phone || null, gender || 'Other', profile_image]);

        res.json({ msg: 'เพิ่มผู้ใช้งานสำเร็จ' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ==========================================
// 4. ❌ ลบผู้ใช้งาน
// ==========================================
router.delete('/users/:id', authMiddleware, authorizeRole(['Admin']), async (req, res) => {
    try {
        await db.query("DELETE FROM users WHERE user_id = ?", [req.params.id]);
        res.json({ msg: 'ลบผู้ใช้งานสำเร็จ' });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;