// ไฟล์: server/services/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// ตั้งค่าตัวส่งอีเมลผ่านระบบ OAuth2 (ปลอดภัยสูงสุดและไม่โดนบล็อก)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN
    }
});

// ตรวจสอบสถานะการเชื่อมต่อตอนที่ Server เริ่มทำงาน
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ [Email Service] เชื่อมต่อ OAuth2 ล้มเหลว:", error.message);
    } else {
        console.log("✅ [Email Service] ระบบพร้อมส่งอีเมลผ่าน OAuth2 แล้ว!");
    }
});

// สร้างฟังก์ชัน sendEmail ที่รับค่าเป็น Object { to, subject, html }
const sendEmail = async ({ to, subject, html }) => {
    try {
        const mailOptions = {
            from: `"PCSHS Care System" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: html // ใช้ html เพื่อให้ข้อความจัดหน้าได้สวยงาม
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [Email Service] ส่งอีเมลสำเร็จ! ไปที่: ${to}`);
        return true;
    } catch (error) {
        console.error(`❌ [Email Service] ส่งอีเมลไม่สำเร็จ:`, error.message);
        return false;
    }
};

module.exports = { sendEmail };