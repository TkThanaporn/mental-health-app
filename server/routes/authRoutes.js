// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');

// ==========================================
// 1. ระบบสมัครสมาชิก (Register) - อัปเดตตาม DB ใหม่
// ==========================================
router.post('/register', async (req, res) => {
    // รับค่าทั้งหมดจากหน้าเว็บ
    const { 
        email, 
        password, 
        role, 
        fullname, 
        phone, 
        gender, 
        education_level, 
        dormitory 
    } = req.body;
    
    // ตรวจสอบข้อมูลบังคับ
    if (!email || !password || !fullname) {
        return res.status(400).json({ msg: 'Please enter all required fields.' });
    }

    try {
        // 1. ตรวจสอบว่าอีเมลนี้ถูกใช้งานไปหรือยัง (ใช้ตาราง users)
        let [existingUsers] = await db.execute('SELECT user_id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ msg: 'User already exists.' });
        }

        // 2. เข้ารหัสรหัสผ่าน
        const salt = await bcrypt.genSalt(10);
        const hashed_password = await bcrypt.hash(password, salt);

        // 3. บันทึกข้อมูลลงตาราง users (ตารางเดียวจบ)
        // ใส่ || null เพื่อป้องกัน Error Undefined
        const sql = `
            INSERT INTO users 
            (email, password, role, fullname, phone, gender, education_level, dormitory, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        await db.execute(sql, [
            email,
            hashed_password,
            role || 'Student',
            fullname,
            phone || null,
            gender || 'Other',
            education_level || null,
            dormitory || null
        ]);
        
        res.status(201).json({ msg: 'Registration successful.' });

    } catch (err) {
        console.error("REGISTER ERROR:", err.message); 
        res.status(500).send('Server error. Check database connection or SQL constraints.');
    }
});


// ==========================================
// 2. ระบบเข้าสู่ระบบ (Login)
// ==========================================
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // ค้นหาผู้ใช้จากอีเมล
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(400).json({ msg: 'Invalid Credentials.' });
        }
        
        const user = users[0];

        // ตรวจสอบรหัสผ่าน (ใช้ user.password ตามชื่อคอลัมน์ใหม่)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials.' });
        }

        // สร้าง Payload สำหรับ Token
        const payload = { 
            user: { 
                id: user.user_id, 
                role: user.role 
            } 
        };
        
        jwt.sign(
            payload, 
            process.env.JWT_SECRET, 
            { expiresIn: '5h' }, 
            (err, token) => {
                if (err) throw err;
                // ส่งข้อมูลที่จำเป็นกลับไปให้ Frontend
                res.json({ token, role: user.role, userId: user.user_id }); 
            }
        );

    } catch (err) {
        console.error("LOGIN ERROR:", err.message);
        res.status(500).send('Server error.');
    }
});

module.exports = router;