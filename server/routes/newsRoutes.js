const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ดึงรายการข่าวทั้งหมดจากตาราง student_news
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM student_news ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error("❌ Get News Error:", err.message);
        res.status(500).json({ message: err.message });
    }
});

// เพิ่มข่าวใหม่
router.post('/', async (req, res) => {
    const { title, content, image_url, category_id, author_id } = req.body;
    try {
        const sql = `
            INSERT INTO student_news (title, content, image_url, category_id, author_id) 
            VALUES (?, ?, ?, ?, ?)
        `;
        await db.execute(sql, [title, content, image_url || null, category_id || null, author_id || null]);
        res.status(201).json({ message: "News created successfully" });
    } catch (err) {
        console.error("❌ Create News Error:", err.message);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;