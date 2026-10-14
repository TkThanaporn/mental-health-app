
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// URL ของ Backend
const SERVER_URL = (
  process.env.SERVER_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

// ==========================================
// 1. GET: ดึงรายชื่อนักจิตวิทยา
// ==========================================
router.get('/available', async (req, res) => {
  try {
    console.log('Fetching psychologists...');

    const sql = `
      SELECT
        user_id,
        fullname,
        email,
        phone,
        bio,
        profile_image
      FROM users
      WHERE role = 'Psychologist'
    `;

    const [rows] = await db.query(sql);

    const psychologists = rows.map((user) => {
      if (user.profile_image) {
        const image = user.profile_image;

        // รองรับ URL รูปแบบเก่าที่ใช้ localhost
        if (image.includes('localhost:5000/uploads/')) {
          const filename = image.split('/').pop();
          user.profile_image =
            `${SERVER_URL}/uploads/${filename}`;
        } else if (!/^https?:\/\//i.test(image)) {
          const filename = image
            .replace(/^\/+/, '')
            .replace(/^uploads\//, '');

          user.profile_image =
            `${SERVER_URL}/uploads/${filename}`;
        }
      }

      return user;
    });

    console.log(`Found ${psychologists.length} psychologists`);
    res.json(psychologists);
  } catch (err) {
    console.error(
      'FETCH PSYCHOLOGISTS ERROR:',
      err.message
    );
    res.status(500).json({
      error: 'ไม่สามารถดึงรายชื่อนักจิตวิทยาได้'
    });
  }
});

// ==========================================
// 2. GET: ดึงรายการนัดหมายของนักจิตวิทยา
// ==========================================
router.get('/my-appointments/:id', async (req, res) => {
  try {
    const sql = `
      SELECT
        a.*,
        u.fullname AS student_name,
        s.date AS appointment_date,
        s.start_time AS appointment_time
      FROM appointments a
      JOIN users u
        ON a.student_user_id = u.user_id
      JOIN schedules s
        ON a.schedule_id = s.schedule_id
      WHERE a.psychologist_user_id = ?
      ORDER BY s.date ASC, s.start_time ASC
    `;

    const [rows] = await db.query(sql, [req.params.id]);

    res.json(rows);
  } catch (err) {
    console.error(
      'FETCH APPOINTMENTS ERROR:',
      err.message
    );
    res.status(500).json({
      error: 'ไม่สามารถดึงรายการนัดหมายได้'
    });
  }
});

module.exports = router;
