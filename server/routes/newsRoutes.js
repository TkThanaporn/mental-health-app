
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');

// ==========================================
// ตั้งค่า URL ของ Server
// Render ใช้ SERVER_URL จาก Environment
// ในเครื่องใช้ localhost:5000
// ==========================================
const SERVER_URL = (
  process.env.SERVER_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

// ==========================================
// ตั้งค่าโฟลเดอร์เก็บรูป
// ใช้ path แบบ absolute เพื่อไม่ให้ขึ้นกับ
// ตำแหน่งที่ใช้สั่งรัน Node.js
// ==========================================
const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `news-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // จำกัดขนาด 5 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('กรุณาเลือกไฟล์รูปภาพเท่านั้น'));
    }
  }
});

// ==========================================
// 1. ดึงหมวดหมู่ข่าว
// ==========================================
router.get('/categories', async (req, res) => {
  const categories = [
    { category_id: 'ประกาศ', category_name: 'ประกาศ' },
    { category_id: 'กิจกรรม', category_name: 'กิจกรรม' },
    { category_id: 'สุขภาพจิต', category_name: 'สุขภาพจิต' },
    { category_id: 'ทั่วไป', category_name: 'ทั่วไป' }
  ];

  res.json(categories);
});

// ==========================================
// 2. ดึงข่าวทั้งหมด
// ==========================================
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT
        n.*,
        n.category AS category_name,
        u.fullname AS author_name
      FROM system_news n
      LEFT JOIN users u ON n.user_id = u.user_id
      ORDER BY n.created_at DESC
    `;

    const [rows] = await db.query(sql);

    // แปลง URL รูปเก่าที่บันทึกเป็น localhost
    // ให้เป็น URL ของ Server ปัจจุบัน
    const news = rows.map((item) => {
      if (item.image_url) {
        const filename = item.image_url.split('/').pop();

        if (
          item.image_url.includes('localhost:5000/uploads/') ||
          !item.image_url.startsWith('http')
        ) {
          item.image_url = `${SERVER_URL}/uploads/${filename}`;
        }
      }

      return item;
    });

    res.json(news);
  } catch (err) {
    console.error('FETCH NEWS ERROR:', err.message);
    res.status(500).json({ error: 'ไม่สามารถดึงข่าวได้' });
  }
});

// ==========================================
// 3. เพิ่มข่าวใหม่
// ==========================================
router.post(
  '/',
  authMiddleware,
  upload.single('image'),
  async (req, res) => {
    try {
      const { title, content, category_id, category } = req.body;
      const user_id = req.user.id || req.user.user_id;

      if (!title || !content) {
        return res.status(400).json({
          error: 'กรุณากรอกหัวข้อข่าวและเนื้อหา'
        });
      }

      const image_url = req.file
        ? `${SERVER_URL}/uploads/${req.file.filename}`
        : null;

      const finalCategory = category || category_id || 'ทั่วไป';

      const sql = `
        INSERT INTO system_news
          (title, content, image_url, category, user_id, status)
        VALUES (?, ?, ?, ?, ?, 'published')
      `;

      await db.query(sql, [
        title,
        content,
        image_url,
        finalCategory,
        user_id
      ]);

      res.json({
        msg: 'เพิ่มข่าวเรียบร้อยแล้ว',
        image_url
      });
    } catch (err) {
      console.error('CREATE NEWS ERROR:', err.message);
      res.status(500).json({
        error: 'ไม่สามารถเพิ่มข่าวได้'
      });
    }
  }
);

// ==========================================
// 4. แก้ไขข่าว
// ==========================================
router.put(
  '/:id',
  authMiddleware,
  upload.single('image'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, category_id, category } = req.body;

      const finalCategory = category || category_id || 'ทั่วไป';

      let sql;
      let params;

      if (req.file) {
        const image_url =
          `${SERVER_URL}/uploads/${req.file.filename}`;

        sql = `
          UPDATE system_news
          SET title = ?,
              content = ?,
              category = ?,
              image_url = ?
          WHERE news_id = ?
        `;

        params = [
          title,
          content,
          finalCategory,
          image_url,
          id
        ];
      } else {
        sql = `
          UPDATE system_news
          SET title = ?,
              content = ?,
              category = ?
          WHERE news_id = ?
        `;

        params = [
          title,
          content,
          finalCategory,
          id
        ];
      }

      const [result] = await db.query(sql, params);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          error: 'ไม่พบข่าวที่ต้องการแก้ไข'
        });
      }

      res.json({
        msg: 'แก้ไขข่าวเรียบร้อยแล้ว'
      });
    } catch (err) {
      console.error('UPDATE NEWS ERROR:', err.message);
      res.status(500).json({
        error: 'ไม่สามารถแก้ไขข่าวได้'
      });
    }
  }
);

// ==========================================
// 5. ลบข่าว
// ==========================================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM system_news WHERE news_id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'ไม่พบข่าวที่ต้องการลบ'
      });
    }

    res.json({ msg: 'ลบข่าวเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('DELETE NEWS ERROR:', err.message);
    res.status(500).json({
      error: 'ไม่สามารถลบข่าวได้'
    });
  }
});

module.exports = router;
