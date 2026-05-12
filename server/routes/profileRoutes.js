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
// 2. GET: ดึงข้อมูลโปรไฟล์ (ดึงจากตาราง users ที่เดียว)
// ==========================================
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.id;
        
        // ✅ เปลี่ยนมาดึงข้อมูลทั้งหมดจากตาราง users โดยตรง ไม่ต้อง JOIN แล้ว
        const sql = `
            SELECT 
                user_id, fullname, email, role, gender, profile_image,
                phone, bio 
            FROM users
            WHERE user_id = ?
        `;
        
        const [result] = await db.query(sql, [user_id]);

        if (result.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        const user = result[0];
        
        // แปลง path รูปภาพให้สมบูรณ์
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
// 3. PUT: บันทึกข้อมูลโปรไฟล์ (อัปเดตตาราง users ที่เดียว)
// ==========================================
router.put('/me', authMiddleware, upload.single('profile_image'), async (req, res) => {
    try {
        const user_id = req.user.id;
        const { fullname, phone, gender, bio } = req.body;
        
        console.log(`📝 Updating User ID: ${user_id}`);

        let sql, params;

        // ✅ อัปเดตข้อมูลทุกอย่างลงตาราง users ในคำสั่งเดียว
        if (req.file) {
            const filename = req.file.filename;
            sql = `UPDATE users SET fullname = ?, gender = ?, phone = ?, bio = ?, profile_image = ? WHERE user_id = ?`;
            params = [fullname, gender, phone || null, bio || null, filename, user_id];
        } else {
            sql = `UPDATE users SET fullname = ?, gender = ?, phone = ?, bio = ? WHERE user_id = ?`;
            params = [fullname, gender, phone || null, bio || null, user_id];
        }
        
        await db.execute(sql, params);

        res.json({ msg: 'บันทึกข้อมูลเรียบร้อยแล้ว' });

    } catch (err) {
        console.error("❌ UPDATE PROFILE ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;