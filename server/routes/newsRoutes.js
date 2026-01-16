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

// 1. ดึงหมวดหมู่
router.get('/categories', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM news_categories');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. ดึงข่าวทั้งหมด
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT n.*, c.category_name, u.fullname as author_name 
            FROM student_news n
            JOIN news_categories c ON n.category_id = c.category_id
            LEFT JOIN users u ON n.author_id = u.user_id
            ORDER BY n.created_at DESC
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ✅ 3. เพิ่มข่าวใหม่ (ใช้ authMiddleware เพื่อระบุตัวตนนักจิตวิทยา)
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const { title, content, category_id } = req.body;
        // ดึง ID ของคนโพสต์จาก Token (req.user.id)
        const author_id = req.user.id || req.user.user_id; 
        const image_url = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;

        const sql = `INSERT INTO student_news (title, content, image_url, category_id, author_id) VALUES (?, ?, ?, ?, ?)`;
        await db.query(sql, [title, content, image_url, category_id, author_id]); 
        
        res.json({ msg: 'Success' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ 4. แก้ไขข่าว (PUT)
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category_id } = req.body;
        
        // ถ้ามีการอัปโหลดรูปใหม่ ให้ใช้รูปใหม่ ถ้าไม่มีให้ใช้รูปเดิม (Logic นี้ทำใน SQL)
        let sql = '';
        let params = [];

        if (req.file) {
            // กรณีเปลี่ยนรูป
            const image_url = `http://localhost:5000/uploads/${req.file.filename}`;
            sql = `UPDATE student_news SET title=?, content=?, category_id=?, image_url=? WHERE news_id=?`;
            params = [title, content, category_id, image_url, id];
        } else {
            // กรณีไม่เปลี่ยนรูป (ไม่ต้องอัปเดต image_url)
            sql = `UPDATE student_news SET title=?, content=?, category_id=? WHERE news_id=?`;
            params = [title, content, category_id, id];
        }

        await db.query(sql, params);
        res.json({ msg: 'Updated Successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 5. ลบข่าว
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await db.query('DELETE FROM student_news WHERE news_id = ?', [req.params.id]);
        res.json({ msg: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;