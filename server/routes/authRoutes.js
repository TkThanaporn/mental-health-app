// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../services/emailService');

// ==========================================
// 1. POST: ขอสมัครสมาชิก (รับ OTP)
// ==========================================
router.post('/register-request', async (req, res) => {
    const { email, password, role, fullname, phone, gender, education_level, dormitory } = req.body;
    
    if (!email || !password || !fullname) {
        return res.status(400).json({ msg: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
    }

    try {
        // 1. ตรวจสอบว่าอีเมลนี้ถูกใช้งานไปหรือยัง
        const [existingUsers] = await db.execute('SELECT user_id, is_verified FROM users WHERE email = ?', [email]);
        
        if (existingUsers.length > 0) {
            // ถ้ามีอีเมลในระบบ และยืนยันตัวตนแล้ว -> สมัครซ้ำไม่ได้
            if (existingUsers[0].is_verified) {
                return res.status(400).json({ msg: 'อีเมลนี้ถูกใช้งานและยืนยันตัวตนแล้ว' });
            } else {
                // ถ้ามีอีเมลในระบบ แต่ "ยังไม่ได้ยืนยันตัวตน" -> ลบข้อมูลขยะเก่าทิ้งก่อน เพื่อสร้างใหม่
                await db.execute('DELETE FROM users WHERE email = ?', [email]);
            }
        }

        // 2. เข้ารหัสรหัสผ่าน (นำระบบ bcrypt จากโค้ดเก่าของคุณมาใช้)
        const salt = await bcrypt.genSalt(10);
        const hashed_password = await bcrypt.hash(password, salt);

        // 3. สร้างรหัส OTP 6 หลัก และตั้งเวลาหมดอายุ (5 นาที)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires_at = new Date(Date.now() + 5 * 60000); 

        // 4. บันทึกข้อมูลลงตาราง users พร้อมแนบ OTP ไปด้วย (ตั้ง is_verified = FALSE)
        const sql = `
            INSERT INTO users 
            (email, password, role, fullname, phone, gender, education_level, dormitory, otp_code, otp_expires_at, is_verified, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, NOW())
        `;

        await db.execute(sql, [
            email,
            hashed_password,
            role || 'Student',
            fullname,
            phone || null,
            gender || 'Other',
            education_level || null,
            dormitory || null,
            otp,
            expires_at
        ]);

        // 5. ส่งอีเมลรหัส OTP หาผู้ใช้ (ดีไซน์พรีเมียม)
        await sendEmail({
            to: email,
            subject: '🔒 รหัส OTP สำหรับยืนยันตัวตน - PCSHS Care',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f7f6; padding: 20px; border-radius: 12px;">
                    <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                        
                        <div style="background: linear-gradient(135deg, #002147 0%, #1B3F8B 100%); padding: 30px 20px; text-align: center;">
                            <h1 style="color: #FFD700; margin: 0; font-size: 26px; letter-spacing: 1px;">PCSHS HeartCare</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 15px; opacity: 0.9;">ระบบดูแลช่วยเหลือนักเรียน</p>
                        </div>

                        <div style="padding: 40px 30px; text-align: center;">
                            <h2 style="color: #333333; margin-top: 0; font-size: 22px;">รหัสยืนยันตัวตน (OTP)</h2>
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                                กรุณานำรหัส 6 หลักด้านล่างนี้ไปกรอกในแอปพลิเคชัน เพื่อยืนยันการสมัครสมาชิกของคุณ
                            </p>

                            <div style="background-color: #fff4e6; border: 2px dashed #f26522; border-radius: 12px; padding: 20px; margin: 0 auto; max-width: 320px;">
                                <h1 style="color: #f26522; font-size: 46px; letter-spacing: 12px; margin: 0; text-align: center; font-weight: 900;">${otp}</h1>
                            </div>

                            <div style="margin-top: 35px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #dc3545; text-align: left;">
                                <p style="margin: 0; color: #dc3545; font-size: 14px; font-weight: bold;">⚠️ ข้อควรระวังด้านความปลอดภัย</p>
                                <p style="margin: 5px 0 0 0; color: #555555; font-size: 14px; line-height: 1.5;">
                                    รหัสนี้จะหมดอายุภายใน <strong>5 นาที</strong> โปรดอย่าแชร์รหัสนี้ให้ผู้อื่นทราบโดยเด็ดขาด ทางโรงเรียนไม่มีนโยบายสอบถามรหัสผ่านของคุณ
                                </p>
                            </div>
                        </div>

                        <div style="background-color: #eeeeee; padding: 20px; text-align: center; border-top: 1px solid #dddddd;">
                            <p style="color: #888888; font-size: 12px; margin: 0 0 10px 0; line-height: 1.5;">
                                หากคุณไม่ได้เป็นผู้ทำรายการนี้ โปรดละเว้นอีเมลฉบับนี้และไม่ต้องดำเนินการใดๆ
                            </p>
                            <p style="color: #aaaaaa; font-size: 12px; margin: 0;">
                                &copy; โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย
                            </p>
                        </div>
                        
                    </div>
                </div>
            `
        });
        res.json({ msg: 'ระบบได้ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว' });

    } catch (err) {
        console.error("REGISTER REQUEST ERROR:", err.message); 
        res.status(500).send('Server error.');
    }
});

// ==========================================
// 2. POST: ยืนยันรหัส OTP (ทำให้บัญชีใช้งานได้จริง)
// ==========================================
router.post('/register-verify', async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) return res.status(400).json({ msg: 'กรุณากรอกข้อมูลให้ครบถ้วน' });

    try {
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE email = ? AND otp_code = ? AND is_verified = FALSE',
            [email, otp]
        );

        if (rows.length === 0) return res.status(400).json({ msg: 'รหัส OTP ไม่ถูกต้อง' });

        const user = rows[0];

        if (new Date() > new Date(user.otp_expires_at)) {
            return res.status(400).json({ msg: 'รหัส OTP หมดอายุแล้ว ระบบกำลังลบข้อมูล กรุณาสมัครใหม่อีกครั้ง' });
        }

        // ยืนยันสำเร็จ ลบ OTP ทิ้ง และปรับเป็นผู้ใช้งานจริง
        await db.execute(
            'UPDATE users SET is_verified = TRUE, otp_code = NULL, otp_expires_at = NULL WHERE user_id = ?',
            [user.user_id]
        );

        res.json({ msg: 'สมัครสมาชิกและยืนยันตัวตนสำเร็จแล้ว!', verified: true });
    } catch (err) {
        console.error("REGISTER VERIFY ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 3. POST: ระบบเข้าสู่ระบบ (Login)
// ==========================================
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(400).json({ msg: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }
        
        const user = users[0];

        // ⛔ เช็คดักไว้ก่อน: ถ้าสมัครแล้วแต่หนีไปตอนให้กรอก OTP จะไม่ให้เข้าสู่ระบบ
        if (!user.is_verified) {
            return res.status(403).json({ msg: 'บัญชีนี้ยังไม่ได้ยืนยันตัวตน (OTP) กรุณาสมัครสมาชิกใหม่อีกครั้ง' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

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
                res.json({ token, role: user.role, userId: user.user_id }); 
            }
        );

    } catch (err) {
        console.error("LOGIN ERROR:", err.message);
        res.status(500).send('Server error.');
    }
});

module.exports = router;