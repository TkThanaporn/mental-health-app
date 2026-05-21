// server/services/cronService.js
const cron = require('node-cron');
const db = require('../config/db'); 
const { sendEmail } = require('./emailService');

const startNotificationCron = () => {
    cron.schedule('* * * * *', async () => {
        try {
            const [upcoming] = await db.query(`
                SELECT a.*, s.start_time, s.end_time, u.email, u.fullname
                FROM appointments a
                JOIN schedules s ON a.schedule_id = s.schedule_id
                JOIN users u ON a.student_user_id = u.user_id
                WHERE a.status = 'confirmed'
                AND s.date = CURDATE()
                AND TIME_FORMAT(s.start_time, '%H:%i') = TIME_FORMAT(DATE_ADD(NOW(), INTERVAL 15 MINUTE), '%H:%i')
            `);

            upcoming.forEach(appt => {
                const startTime = appt.start_time.substring(0, 5).replace(':', '.');
                const endTime = appt.end_time.substring(0, 5).replace(':', '.');

                sendEmail({
                    to: appt.email,
                    subject: `⏰ อีก 15 นาที จะถึงเวลานัดหมาย: ${appt.topic}`,
                    html: `
                        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f7f6; padding: 20px; border-radius: 12px;">
                            <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                                
                                <div style="background: linear-gradient(135deg, #002147 0%, #1B3F8B 100%); padding: 30px 20px; text-align: center;">
                                    <h1 style="color: #FFD700; margin: 0; font-size: 26px; letter-spacing: 1px;">PCSHS HeartCare</h1>
                                    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 15px; opacity: 0.9;">ระบบดูแลช่วยเหลือนักเรียน</p>
                                </div>

                                <div style="padding: 40px 30px; text-align: center;">
                                    <div style="font-size: 40px; margin-bottom: 15px;">⏳</div>
                                    <h2 style="color: #333333; margin-top: 0; font-size: 22px;">เตรียมตัวให้พร้อม!</h2>
                                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                                        สวัสดี <strong>${appt.fullname}</strong><br>
                                        เหลือเวลาอีกเพียง <strong>15 นาที</strong> จะถึงคิวรับคำปรึกษาของคุณครับ
                                    </p>

                                    <div style="background-color: #f8f9fa; border-left: 4px solid #f26522; border-radius: 8px; padding: 20px; margin: 0 auto 30px auto; text-align: left;">
                                        <p style="margin: 0 0 10px 0; font-size: 15px; color: #333;">📌 <strong>หัวข้อ:</strong> ${appt.topic}</p>
                                        <p style="margin: 0; font-size: 15px; color: #333;">⏰ <strong>เวลา:</strong> ${startTime} - ${endTime} น.</p>
                                    </div>
                                    
                                    <div style="text-align: center;">
                                        <a href="http://localhost:3000/student/appointments" style="background-color: #f26522; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 10px rgba(242, 101, 34, 0.3);">เข้าสู่หน้าการนัดหมาย</a>
                                    </div>
                                </div>

                                <div style="background-color: #eeeeee; padding: 20px; text-align: center; border-top: 1px solid #dddddd;">
                                    <p style="color: #aaaaaa; font-size: 12px; margin: 0;">
                                        &copy; โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย
                                    </p>
                                </div>
                                
                            </div>
                        </div>
                    `
                });
            });
        } catch (err) {
            console.error('❌ Cron Error:', err);
        }
    });
};

module.exports = { startNotificationCron };