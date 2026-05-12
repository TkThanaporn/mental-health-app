// server/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs'); // ✅ เปลี่ยนเป็น bcryptjs ให้เหมือน authRoutes
const { authMiddleware, authorizeRole } = require('../middleware/auth');

// ==========================================
// 1. 📊 API สำหรับ AdminDashboard
// ==========================================
router.get('/summary', authMiddleware, authorizeRole(['Admin']), async (req, res) => {
    try {
        // 1. นับจำนวนนักเรียน
        const [students] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'Student'");
        
        // 2. นับจำนวนนักจิตวิทยา
        const [psychologists] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'Psychologist'");

        // 3. นับจำนวนนัดหมาย (เลือกเฉพาะที่ status เป็น 'confirmed' ตาม ENUM ใหม่)
        let confirmedAppointments = 0;
        try {
            const [appt] = await db.query("SELECT COUNT(*) as count FROM appointments WHERE status = 'confirmed'");
            confirmedAppointments = appt[0].count;
        } catch (e) { console.log("Appointments table not ready"); }

        // 4. แบบประเมิน
        let pendingAssessments = 0;
        try {
            const [assess] = await db.query("SELECT COUNT(*) as count FROM assessments"); 
            pendingAssessments = assess[0].count;
        } catch (e) { console.log("Assessments table not ready"); }

        // ส่งข้อมูลกลับไปตามชื่อที่ Frontend รอรับ
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
        const hashed_password = await bcrypt.hash(password, salt);
        const profile_image = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullname)}&background=random&color=fff`;

        // ✅ เปลี่ยน password_hash เป็น password ให้ตรงกับตาราง users ล่าสุด
        const sql = `INSERT INTO users (fullname, email, password, role, phone, gender, profile_image, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
        await db.query(sql, [fullname, email, hashed_password, role, phone || null, gender || 'Other', profile_image]);

        res.json({ msg: 'เพิ่มผู้ใช้งานสำเร็จ' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ==========================================
// 4. ✏️ แก้ไขข้อมูลผู้ใช้งาน (Update User) - เพิ่มใหม่!
// ==========================================
router.put('/users/:id', authMiddleware, authorizeRole(['Admin']), async (req, res) => {
    const { fullname, email, role, phone, gender } = req.body;
    const userId = req.params.id;

    try {
        // 1. ตรวจสอบว่าผู้ใช้มีตัวตนจริงไหม
        const [user] = await db.query("SELECT * FROM users WHERE user_id = ?", [userId]);
        if (user.length === 0) {
            return res.status(404).json({ msg: 'ไม่พบผู้ใช้งานที่ต้องการแก้ไข' });
        }

        // 2. ตรวจสอบว่าอีเมลใหม่ไปซ้ำกับคนอื่นไหม (ถ้ามีการเปลี่ยนอีเมล)
        const [existingEmail] = await db.query("SELECT user_id FROM users WHERE email = ? AND user_id != ?", [email, userId]);
        if (existingEmail.length > 0) {
            return res.status(400).json({ msg: 'อีเมลนี้ถูกใช้งานโดยผู้ใช้รายอื่นแล้ว' });
        }

        // 3. อัปเดตข้อมูล (ไม่รวมรหัสผ่าน เพื่อความปลอดภัย)
        const sql = `
            UPDATE users 
            SET fullname = ?, email = ?, role = ?, phone = ?, gender = ?
            WHERE user_id = ?
        `;
        await db.query(sql, [fullname, email, role, phone || null, gender || 'Other', userId]);

        res.json({ msg: 'อัปเดตข้อมูลผู้ใช้งานสำเร็จ' });
    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ msg: 'Server Error: ไม่สามารถแก้ไขข้อมูลได้' });
    }
});

// ==========================================
// 5. ❌ ลบผู้ใช้งาน (ปรับปรุงจากเดิม)
// ==========================================
router.delete('/users/:id', authMiddleware, authorizeRole(['Admin']), async (req, res) => {
    try {
        const userId = req.params.id;
        
        // ตรวจสอบก่อนว่ามี user นี้ไหม
        const [user] = await db.query("SELECT * FROM users WHERE user_id = ?", [userId]);
        if (user.length === 0) {
            return res.status(404).json({ msg: 'ไม่พบผู้ใช้งานที่ต้องการลบ' });
        }

        // ทำการลบ
        await db.query("DELETE FROM users WHERE user_id = ?", [userId]);
        res.json({ msg: 'ลบผู้ใช้งานสำเร็จ' });
    } catch (err) {
        console.error("Delete Error:", err);
        res.status(500).json({ msg: 'Server Error: ไม่สามารถลบผู้ใช้งานได้ (อาจมีข้อมูลที่เกี่ยวข้องอยู่ในตารางอื่น)' });
    }
});

module.exports = router;