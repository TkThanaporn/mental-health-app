// D:\mental-health-app\server\routes\assessmentRoutes.js
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

// @route   POST api/assessments
// @desc    Student submits an assessment (PHQ-A)
router.post('/', authMiddleware, authorizeRole(['Student']), async (req, res) => {
    // Frontend ส่ง type และ answers มา
    const { type, answers } = req.body; 
    const student_id = req.user.id; // ดึง ID จาก authMiddleware

    if (type !== 'PHQ-A' || !Array.isArray(answers) || answers.length !== 9) {
        return res.status(400).json({ msg: 'Invalid assessment data.' });
    }

    try {
        // 1. คำนวณคะแนนรวม
        const totalScore = answers.reduce((sum, current) => sum + current, 0);
        
        // 2. แปลผลคะแนน
        const resultLevel = interpretPHQA(totalScore);

        // 3. บันทึกผลลงในตาราง Assessments
        await db.execute(
            'INSERT INTO Assessments (student_id, assessment_type, score, result_level) VALUES (?, ?, ?, ?)',
            [student_id, type, totalScore, resultLevel]
        );

        // 4. ส่งผลลัพธ์กลับไปให้ Frontend
        res.status(201).json({ score: totalScore, result: resultLevel, msg: 'Assessment submitted successfully.' });
        
    } catch (err) {
        // 5. บล็อกดักจับ Error และแสดง Log
        console.error("ASSESSMENT ERROR (SQL FAIL):", err.message); 
        
        // ส่ง HTTP 500 กลับไปที่ Client
        res.status(500).send('Server error during assessment processing. Check server logs.'); 
    }
});

module.exports = router;    