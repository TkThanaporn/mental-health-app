// ไฟล์: server/services/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// ตั้งค่าตัวส่งอีเมล
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
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