const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const db = require('../config/db'); 
const jwt = require('jsonwebtoken'); 
require('dotenv').config();

// นำเข้า authMiddleware (ปรับ Path ให้ตรงกับที่คุณเก็บไฟล์ middleware)
const { authMiddleware } = require('../middleware/auth');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/psychologist/dashboard' // 🚨 ต้องตรงกับที่ตั้งไว้ใน Google Cloud Console
);

// 1. API สำหรับขอ URL ไปหน้า Login ของ Google
router.get('/auth-url', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent', 
        scope: ['https://www.googleapis.com/auth/calendar']
    });
    res.json({ url });
});

// 2. API สำหรับรับ Code จาก Google มาแลกเป็น Token แล้วเซฟลง DB
router.post('/save-token', async (req, res) => {
    const { code } = req.body;
    const token = req.header('x-auth-token');

    if (!token) return res.status(401).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึง (Token หาย)' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = decoded.user ? decoded.user.id : decoded.id; 

        const { tokens } = await oauth2Client.getToken(code);
        
        if (tokens.refresh_token) {
            const sql = `UPDATE users SET google_refresh_token = ?, is_google_synced = 1 WHERE user_id = ?`;
            await db.query(sql, [tokens.refresh_token, user_id]);
            res.json({ success: true, message: 'เชื่อมต่อ Google Calendar สำเร็จ!' });
        } else {
            res.status(400).json({ success: false, message: 'เคยให้สิทธิ์ไปแล้ว กรุณาไปกดยกเลิกสิทธิ์แอปในบัญชี Google แล้วลองใหม่' });
        }
    } catch (error) {
        console.error('Google Auth Error:', error.message);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ (รหัสนี้อาจถูกใช้ไปแล้ว)' });
    }
});

// 3. API สำหรับยกเลิกการซิงค์
router.post('/disconnect', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึง' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = decoded.user ? decoded.user.id : decoded.id;

        const sql = `UPDATE users SET google_refresh_token = NULL, is_google_synced = 0 WHERE user_id = ?`;
        await db.query(sql, [user_id]);
        res.json({ success: true, message: 'ยกเลิกการเชื่อมต่อสำเร็จ' });
    } catch (error) {
        console.error('Disconnect Error:', error.message);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการยกเลิก' });
    }
});

// 4. API สำหรับเช็คสถานะว่าเคยเชื่อมต่อ Google หรือยัง (ดึงจาก DB โดยตรง)
router.get('/status', authMiddleware, async (req, res) => {
    try {
        // authMiddleware จะช่วยถอดรหัส x-auth-token และแนบ req.user มาให้
        const user_id = req.user.id;
        
        const [users] = await db.query('SELECT is_google_synced FROM users WHERE user_id = ?', [user_id]);
        
        if (users.length > 0 && users[0].is_google_synced === 1) {
            res.json({ is_google_synced: true });
        } else {
            res.json({ is_google_synced: false });
        }
    } catch (error) {
        console.error('Check Status Error:', error.message);
        res.json({ is_google_synced: false });
    }
});

module.exports = router;