// server/routes/newsRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const { authMiddleware } = require('../middleware/auth'); // ✅ เรียกใช้ Auth Middleware

// ตั้งค่า Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, 'news-' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// ==========================================
// 1. ดึงหมวดหมู่ (ส่งค่าจำลองไปให้ Frontend จะได้ไม่พัง เพราะเราลบตารางนี้ไปแล้ว)
// ==========================================
router.get('/categories', async (req, res) => {
    try {
        const categories = [
            { category_id: 'ประกาศ', category_name: 'ประกาศ' },
            { category_id: 'กิจกรรม', category_name: 'กิจกรรม' },
            { category_id: 'สุขภาพจิต', category_name: 'สุขภาพจิต' },
            { category_id: 'ทั่วไป', category_name: 'ทั่วไป' }
        ];
        res.json(categories);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 2. ดึงข่าวทั้งหมด (ใช้ตาราง system_news ตาม DB ใหม่)
// ==========================================
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT n.*, n.category as category_name, u.fullname as author_name 
            FROM system_news n
            LEFT JOIN users u ON n.user_id = u.user_id
            ORDER BY n.created_at DESC
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 3. เพิ่มข่าวใหม่
// ==========================================
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const { title, content, category_id, category } = req.body;
        const user_id = req.user.id || req.user.user_id; 
        const image_url = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;

        // ดักรับค่า category แบบเก่าและแบบใหม่ให้ลงตัว
        const finalCategory = category || category_id || 'ทั่วไป';

        const sql = `INSERT INTO system_news (title, content, image_url, category, user_id, status) VALUES (?, ?, ?, ?, ?, 'published')`;
        await db.query(sql, [title, content, image_url, finalCategory, user_id]); 
        
        res.json({ msg: 'Success' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 4. แก้ไขข่าว (PUT)
// ==========================================
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category_id, category } = req.body;
        
        const finalCategory = category || category_id || 'ทั่วไป';
        
        let sql = '';
        let params = [];

        if (req.file) {
            const image_url = `http://localhost:5000/uploads/${req.file.filename}`;
            sql = `UPDATE system_news SET title=?, content=?, category=?, image_url=? WHERE news_id=?`;
            params = [title, content, finalCategory, image_url, id];
        } else {
            sql = `UPDATE system_news SET title=?, content=?, category=? WHERE news_id=?`;
            params = [title, content, finalCategory, id];
        }

        await db.query(sql, params);
        res.json({ msg: 'Updated Successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 5. ลบข่าว
// ==========================================
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await db.query('DELETE FROM system_news WHERE news_id = ?', [req.params.id]);
        res.json({ msg: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;