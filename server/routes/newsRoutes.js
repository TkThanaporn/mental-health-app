// ไฟล์: server/routes/news.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // ตรวจสอบว่า path นี้ตรงกับโฟลเดอร์ config ของคุณ

// ✅ 1. ส่วนดึงหมวดหมู่ (ต้องวางไว้บนสุด!)
router.get('/categories', async (req, res) => {
    try {
        // ข้อมูลจำลองเพื่อให้ Dropdown ทำงานได้ทันที
        const categories = [
            { id: 1, name: 'General', label: 'ข่าวทั่วไป' },
            { id: 2, name: 'Academic', label: 'ข่าวการศึกษา' },
            { id: 3, name: 'Activity', label: 'กิจกรรม' },
            { id: 4, name: 'MentalHealth', label: 'สาระสุขภาพจิต' }
        ];
        res.json(categories);
    } catch (err) {
        console.error("❌ Get Categories Error:", err.message);
        res.status(500).json({ message: err.message });
    }
});

// ✅ 2. ส่วนดึงข่าวทั้งหมด
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM student_news ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error("❌ Get News Error:", err.message);
        res.status(500).json({ message: err.message });
    }
});

// ✅ 3. ส่วนเพิ่มข่าว
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