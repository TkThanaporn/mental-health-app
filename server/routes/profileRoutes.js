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

// --- 2. GET: ดึงข้อมูลโปรไฟล์ (JOIN 2 ตาราง) ---
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.id;
        
        // ✅ ใช้ LEFT JOIN ดึงข้อมูลจากตาราง profile ด้วย
        // สังเกต: เราดึง phone_number จากตาราง profile มาเป็น phone ให้ frontend ใช้
        const sql = `
            SELECT 
                u.user_id, u.fullname, u.email, u.role, u.gender, u.profile_image,
                p.phone_number AS phone, 
                p.bio 
            FROM users u
            LEFT JOIN psychologistprofiles p ON u.user_id = p.psychologist_id
            WHERE u.user_id = ?
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

// --- 3. PUT: บันทึกข้อมูล (แยกบันทึก 2 ตาราง) ---
router.put('/me', authMiddleware, upload.single('profile_image'), async (req, res) => {
    try {
        const user_id = req.user.id;
        const { fullname, phone, gender, bio } = req.body;
        
        console.log(`📝 Updating User ID: ${user_id}`);

        // --- Step A: อัปเดตตาราง USERS (ข้อมูลพื้นฐาน) ---
        let sqlUser, paramsUser;
        if (req.file) {
            const filename = req.file.filename;
            sqlUser = `UPDATE users SET fullname = ?, gender = ?, profile_image = ? WHERE user_id = ?`;
            paramsUser = [fullname, gender, filename, user_id];
        } else {
            sqlUser = `UPDATE users SET fullname = ?, gender = ? WHERE user_id = ?`;
            paramsUser = [fullname, gender, user_id];
        }
        await db.execute(sqlUser, paramsUser);

        // --- Step B: อัปเดตตาราง PSYCHOLOGISTPROFILES (ข้อมูลวิชาชีพ) ---
        // ✅ ใช้ ON DUPLICATE KEY UPDATE: ถ้าไม่มีข้อมูลให้สร้างใหม่ ถ้ามีให้อัปเดต
        const sqlProfile = `
            INSERT INTO psychologistprofiles (psychologist_id, phone_number, bio)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                phone_number = VALUES(phone_number),
                bio = VALUES(bio)
        `;
        // หมายเหตุ: ใน DB คุณใช้ชื่อคอลัมน์ phone_number
        await db.execute(sqlProfile, [user_id, phone, bio]);

        res.json({ msg: 'บันทึกข้อมูลเรียบร้อยแล้ว' });

    } catch (err) {
        console.error("❌ UPDATE PROFILE ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;