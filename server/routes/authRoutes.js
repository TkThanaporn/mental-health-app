// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1.3.2.1: สมัครสมาชิก (Register)
router.post('/register', async (req, res) => {
    const { email, password, role, fullname, education_level, dormitory } = req.body;
    
    // ตรวจสอบความถูกต้องของข้อมูล (Minimal Validation)
    if (!email || !password || !fullname) {
        return res.status(400).json({ msg: 'Please enter all required fields.' });
    }

    try {
        // 1. ตรวจสอบว่าอีเมลถูกใช้แล้วหรือไม่
        let [users] = await db.execute('SELECT user_id FROM Users WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(400).json({ msg: 'User already exists.' });
        }

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 3. Insert into Users
        const [userResult] = await db.execute(
            'INSERT INTO Users (email, password_hash, role) VALUES (?, ?, ?)',
            [email, password_hash, role]
        );
        const user_id = userResult.insertId;

        // 4. Insert into Profile table (StudentProfiles)
        if (role === 'Student') {
            await db.execute(
                'INSERT INTO StudentProfiles (student_id, fullname, education_level, dormitory) VALUES (?, ?, ?, ?)',
                [user_id, fullname, education_level, dormitory]
            );
        } else if (role === 'Psychologist') {
            // (Admin จะเพิ่ม Psychologist เอง แต่เพื่อความสมบูรณ์จึงใส่ไว้)
            await db.execute(
                'INSERT INTO PsychologistProfiles (psychologist_id, fullname) VALUES (?, ?)',
                [user_id, fullname]
            );
        }
        
        // ไม่ส่ง Token กลับไปตอน Register (ให้ Login ภายหลัง)
        res.status(201).json({ msg: 'Registration successful.' });

    } catch (err) {
        // Log Error ใน Terminal ของ Server
        console.error("REGISTER ERROR:", err.message); 
        res.status(500).send('Server error. Check database connection or SQL constraints.');
    }
});


// Login (1.3.1.1, 1.3.2.2, 1.3.3.1)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.execute('SELECT * FROM Users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(400).json({ msg: 'Invalid Credentials.' });
        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials.' });

        // Payload สำหรับ JWT Token (สำคัญ: ต้องมี user_id และ role)
        const payload = { user: { id: user.user_id, role: user.role } };
        
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            // ส่ง Token, Role, และ User ID กลับไปให้ Frontend
            res.json({ token, role: user.role, userId: user.user_id }); 
        });

    } catch (err) {
        console.error("LOGIN ERROR:", err.message);
        res.status(500).send('Server error.');
    }
});

module.exports = router;