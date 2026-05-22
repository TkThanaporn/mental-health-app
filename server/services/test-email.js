require('dotenv').config();
const nodemailer = require('nodemailer');

// ตรวจสอบว่าไฟล์ .env โหลดมาถูกต้องไหม
console.log("📧 Email User:", process.env.EMAIL_USER);
console.log("🔑 Email Pass:", process.env.EMAIL_PASS ? "โหลดรหัสผ่านแล้ว" : "หาไม่เจอ!");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function runTest() {
    try {
        console.log("⏳ กำลังพยายามส่งอีเมล...");
        
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // ส่งเข้าตัวเองเพื่อทดสอบ
            subject: "🚀 ทดสอบระบบอีเมล PCSHS",
            text: "ถ้ารับข้อความนี้ได้ แปลว่าระบบอีเมลของ Node.js ทำงานปกติ 100% ครับ!"
        });

        console.log("✅ ส่งอีเมลสำเร็จ! Message ID:", info.messageId);
    } catch (error) {
        console.error("❌ ส่งไม่สำเร็จ! สาเหตุจาก:", error.message);
    }
}

runTest();