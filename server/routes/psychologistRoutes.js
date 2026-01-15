const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET: ดึงรายชื่อนักจิตวิทยาที่ "ว่าง" (หรือทั้งหมด)
router.get('/available', async (req, res) => {
    try {
        console.log("🔍 Fetching psychologists...");
        
        // ดึงเฉพาะคนที่เป็น Psychologist
        const sql = `SELECT user_id, fullname, email FROM users WHERE role = 'Psychologist'`;
        const [rows] = await db.query(sql);

        console.log(`✅ Found ${rows.length} psychologists`);
        res.json(rows);

    } catch (err) {
        console.error("❌ FETCH PSYCHOLOGISTS ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;