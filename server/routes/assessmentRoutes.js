const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

// ฟังก์ชันคำนวณและแปลผลคะแนน PHQ-A
const interpretPHQA = (score) => {
    if (score >= 20) return 'ภาวะซึมเศร้ารุนแรง';
    if (score >= 15) return 'ภาวะซึมเศร้ามาก';
    if (score >= 10) return 'ภาวะซึมเศร้าปานกลาง';
    if (score >= 5) return 'ภาวะซึมเศร้าเล็กน้อย';
    return 'ไม่มีภาวะซึมเศร้า';
};

// ==========================================
// 1. POST: ส่งแบบประเมิน (สำหรับนักเรียน)
// ==========================================
router.post('/', authMiddleware, authorizeRole(['Student']), async (req, res) => {
    // Frontend ส่ง type และ answers มา
    const { type, answers } = req.body; 
    const student_id = req.user.id; 

    // Validation เบื้องต้น
    if (!Array.isArray(answers)) {
        return res.status(400).json({ msg: 'Invalid assessment data.' });
    }

    try {
        // 1. คำนวณคะแนนรวม
        const totalScore = answers.reduce((sum, current) => sum + current, 0);
        
        // 2. แปลผลคะแนน
        const stress_level = interpretPHQA(totalScore);

        // 3. บันทึกผลลงในตาราง assessments (ใช้ชื่อตารางตัวพิมพ์เล็กให้ตรงกับ DB)
        // หมายเหตุ: ตรวจสอบว่าใน DB มีคอลัมน์ชื่อ stress_level หรือ result_level (โค้ดนี้ใช้ stress_level ตาม SQL ขั้นตอนแรก)
        const sql = `INSERT INTO assessments (student_id, score, stress_level) VALUES (?, ?, ?)`;
        
        await db.execute(sql, [student_id, totalScore, stress_level]);

        console.log(`✅ Assessment saved: Student ${student_id} Score ${totalScore}`);

        // 4. ส่งผลลัพธ์กลับไปให้ Frontend
        res.status(201).json({ score: totalScore, result: stress_level, msg: 'Assessment submitted successfully.' });
        
    } catch (err) {
        console.error("❌ ASSESSMENT ERROR:", err.message);
        res.status(500).send('Server error during assessment processing.'); 
    }
});

// ==========================================
// 2. GET: ดึงผลประเมินล่าสุดของตัวเอง (สำหรับนักเรียน)
// ==========================================
router.get('/latest', authMiddleware, authorizeRole(['Student']), async (req, res) => {
    try {
        const student_id = req.user.id;
        // ดึงอันล่าสุด (เรียงตามเวลา)
        const sql = `SELECT * FROM assessments WHERE student_id = ? ORDER BY created_at DESC LIMIT 1`;
        const [result] = await db.query(sql, [student_id]);
        
        res.json(result[0] || null); // ส่งคืนอันล่าสุด หรือ null ถ้าไม่เคยทำ
    } catch (err) {
        console.error("❌ FETCH ASSESSMENT ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 3. GET: ดึงผลประเมินของนักเรียน (สำหรับนักจิตวิทยา)
// *Route นี้จำเป็นสำหรับปุ่ม "📄 ดูผลประเมิน" ที่เราเพิ่งทำไป
// ==========================================
router.get('/student/:studentId', authMiddleware, authorizeRole(['Psychologist']), async (req, res) => {
    try {
        const { studentId } = req.params;
        
        const sql = `SELECT * FROM assessments WHERE student_id = ? ORDER BY created_at DESC LIMIT 1`;
        const [result] = await db.query(sql, [studentId]);

        if (result.length === 0) {
            return res.json({ message: "ยังไม่เคยทำแบบประเมิน" });
        }
        
        res.json(result[0]);

    } catch (err) {
        console.error("❌ FETCH STUDENT ASSESSMENT ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});
// ==========================================
// 4. GET: ดึงผลประเมินทั้งหมด (สำหรับหน้า Dashboard นักจิตวิทยา)
// ==========================================
router.get('/all', authMiddleware, authorizeRole(['Psychologist']), async (req, res) => {
    try {
        // ดึงผลการประเมินทั้งหมดจากฐานข้อมูล
        const sql = `SELECT * FROM assessments`;
        const [results] = await db.query(sql);
        
        res.json(results);
    } catch (err) {
        console.error("❌ FETCH ALL ASSESSMENTS ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});
module.exports = router;