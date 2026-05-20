// server/services/cronService.js
const cron = require('node-cron');
const db = require('../config/db'); // ตรวจสอบว่าชื่อไฟล์เชื่อม DB ของคุณถูกไหม
const { sendEmail } = require('./emailService');

const startNotificationCron = () => {
    // สั่งให้ทำงานทุกๆ 1 นาที
    cron.schedule('* * * * *', async () => {
        try {
            // คำสั่ง SQL: ค้นหานัดที่สถานะยืนยันแล้ว และเหลืออีก 15 นาทีจะเริ่ม
            const [upcoming] = await db.query(`
                SELECT a.*, s.start_time, u.email, u.fullname
                FROM appointments a
                JOIN schedules s ON a.schedule_id = s.schedule_id
                JOIN users u ON a.student_user_id = u.user_id
                WHERE a.status = 'confirmed'
                AND s.date = CURDATE()
                AND TIME_FORMAT(s.start_time, '%H:%i') = TIME_FORMAT(DATE_ADD(NOW(), INTERVAL 15 MINUTE), '%H:%i')
            `);

            upcoming.forEach(appt => {
                sendEmail({
                    to: appt.email,
                    subject: '⏰ อีก 15 นาที ถึงเวลานัดหมายของคุณ',
                    html: `<h3>สวัสดีคุณ ${appt.fullname}</h3>
                           <p>อีก 15 นาทีจะถึงเวลานัดหมายเรื่อง: <b>${appt.topic}</b></p>
                           <p>กรุณาเตรียมตัวให้พร้อมครับ</p>`
                });
            });
        } catch (err) {
            console.error('Cron Error:', err);
        }
    });
};

module.exports = { startNotificationCron };