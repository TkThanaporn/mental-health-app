const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// ตั้งค่าการเก็บไฟล์ (Multer Config)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // เก็บในโฟลเดอร์ uploads
    },
    filename: function (req, file, cb) {
        // ตั้งชื่อไฟล์ใหม่: user-{id}-{เวลา}.jpg
        cb(null, `user-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

// GET: ดึงข้อมูลโปรไฟล์
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.id;
        const sql = `SELECT user_id, fullname, email, role, phone, gender, bio, profile_image FROM users WHERE user_id = ?`;
        const [result] = await db.query(sql, [user_id]);

        if (result.length === 0) return res.status(404).json({ msg: 'User not found' });
        
        // แปลง path รูปภาพให้เป็น Full URL
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

// PUT: แก้ไขข้อมูลโปรไฟล์ (รองรับ File Upload)
// ใช้ middleware upload.single('profile_image')
router.put('/me', authMiddleware, upload.single('profile_image'), async (req, res) => {
    try {
        const user_id = req.user.id;
        const { fullname, phone, gender, bio } = req.body;
        
        console.log(`📝 Updating profile for User ID: ${user_id}`);

        let sql, params;

        // เช็คว่ามีการอัปโหลดรูปใหม่มาไหม?
        if (req.file) {
            // ถ้ามีรูปใหม่ -> อัปเดตทุกอย่างรวมทั้งชื่อรูป
            const filename = req.file.filename;
            sql = `UPDATE users SET fullname = ?, phone = ?, gender = ?, bio = ?, profile_image = ? WHERE user_id = ?`;
            params = [fullname, phone, gender, bio, filename, user_id];
        } else {
            // ถ้าไม่มีรูป -> อัปเดตแค่ข้อมูลตัวอักษร
            sql = `UPDATE users SET fullname = ?, phone = ?, gender = ?, bio = ? WHERE user_id = ?`;
            params = [fullname, phone, gender, bio, user_id];
        }
        
        await db.execute(sql, params);

        res.json({ msg: 'Profile updated successfully' });

    } catch (err) {
        console.error("❌ UPDATE PROFILE ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;