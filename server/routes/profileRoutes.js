const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// --- 1. ตั้งค่า Multer (เก็บรูปภาพ) ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, `user-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

// ==========================================
// 2. GET: ดึงข้อมูลโปรไฟล์
// ==========================================
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.id;
        
        // ✅ เปลี่ยนคำว่า education_level AS grade เพื่อส่งไปให้ React รู้จัก
        const sql = `
            SELECT 
                user_id, fullname, email, role, gender, profile_image,
                phone, bio, education_level AS grade, dormitory 
            FROM users
            WHERE user_id = ?
        `;
        
        const [result] = await db.query(sql, [user_id]);

        if (result.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        const user = result[0];
        
        if (user.profile_image && !user.profile_image.startsWith('http')) {
            user.profile_image = `http://localhost:5000/uploads/${user.profile_image}`;
        }
        
        res.json(user);

    } catch (err) {
        console.error("❌ FETCH PROFILE ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 3. PUT: บันทึกข้อมูลโปรไฟล์
// ==========================================
router.put('/me', authMiddleware, upload.single('profile_image'), async (req, res) => {
    try {
        const user_id = req.user.id;
        // ✅ รับค่า grade และ dormitory จากหน้าเว็บ
        const { fullname, phone, gender, bio, grade, dormitory } = req.body; 
        
        console.log(`📝 Updating User ID: ${user_id}`);

        let sql, params;

        // ✅ อัปเดตลงคอลัมน์ education_level และ dormitory
        if (req.file) {
            const filename = req.file.filename;
            sql = `UPDATE users SET fullname = ?, gender = ?, phone = ?, bio = ?, education_level = ?, dormitory = ?, profile_image = ? WHERE user_id = ?`;
            params = [fullname, gender, phone || null, bio || null, grade || null, dormitory || null, filename, user_id];
        } else {
            sql = `UPDATE users SET fullname = ?, gender = ?, phone = ?, bio = ?, education_level = ?, dormitory = ? WHERE user_id = ?`;
            params = [fullname, gender, phone || null, bio || null, grade || null, dormitory || null, user_id];
        }
        
        await db.execute(sql, params);

        res.json({ msg: 'บันทึกข้อมูลเรียบร้อยแล้ว' });

    } catch (err) {
        console.error("❌ UPDATE PROFILE ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;