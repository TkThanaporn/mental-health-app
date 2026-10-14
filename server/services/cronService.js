
const cron = require('node-cron');
const db = require('../config/db');
const { sendEmail } = require('./emailService');

// ป้องกันการแจ้งเตือนซ้ำภายในรอบการทำงานของ Server
const notifiedAppointments = new Set();

const startNotificationCron = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const [upcoming] = await db.query(`
        SELECT
          a.*,
          s.date AS appointment_date,
          s.start_time,
          s.end_time,
          u.email,
          u.fullname
        FROM appointments a
        JOIN schedules s ON a.schedule_id = s.schedule_id
        JOIN users u ON a.student_user_id = u.user_id
        WHERE a.status = 'confirmed'
          AND s.date = CURDATE()
          AND TIME_FORMAT(s.start_time, '%H:%i')
              = TIME_FORMAT(DATE_ADD(NOW(), INTERVAL 15 MINUTE), '%H:%i')
      `);

      for (const appt of upcoming) {
        if (!appt.email) continue;

        const appointmentId =
          appt.appointment_id ?? appt.id;

        if (appointmentId == null) {
          console.error(
            '[Notification Cron] ไม่พบ ID ของนัดหมาย'
          );
          continue;
        }

        const notificationKey =
          `${appointmentId}_${appt.appointment_date}_${appt.start_time}`;

        // ถ้าเคยพยายามส่งนัดนี้แล้ว ไม่ส่งซ้ำ
        if (notifiedAppointments.has(notificationKey)) {
          continue;
        }

        // บันทึกก่อนส่ง เพื่อป้องกัน Cron รอบถัดไปส่งซ้ำ
        notifiedAppointments.add(notificationKey);

        const startTime = String(appt.start_time)
          .substring(0, 5)
          .replace(':', '.');

        const endTime = String(appt.end_time)
          .substring(0, 5)
          .replace(':', '.');

        const clientUrl = (
          process.env.CLIENT_URL ||
          'http://localhost:3000'
        ).replace(/\/+$/, '');

        const html = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#f4f7f6;padding:20px;border-radius:12px">
            <div style="background:#fff;border-radius:12px;overflow:hidden">
              <div style="background:#002147;padding:30px 20px;text-align:center">
                <h1 style="color:#FFD700;margin:0">PCSHS HeartCare</h1>
                <p style="color:#fff">ระบบดูแลช่วยเหลือนักเรียน</p>
              </div>

              <div style="padding:30px;text-align:center">
                <div style="font-size:40px">⏳</div>
                <h2>เตรียมตัวให้พร้อม!</h2>
                <p>
                  สวัสดี <strong>${escapeHtml(appt.fullname || 'นักเรียน')}</strong><br>
                  อีก 15 นาทีจะถึงเวลานัดหมายของคุณ
                </p>

                <div style="background:#f8f9fa;padding:20px;text-align:left">
                  <p>📌 <strong>หัวข้อ:</strong>
                    ${escapeHtml(appt.topic || '-')}</p>
                  <p>⏰ <strong>เวลา:</strong>
                    ${startTime} - ${endTime} น.</p>
                </div>

                <p>
                  <a href="${clientUrl}/student/appointments"
                    style="background:#f26522;color:white;padding:14px 25px;text-decoration:none;border-radius:25px;display:inline-block">
                    เข้าสู่หน้าการนัดหมาย
                  </a>
                </p>
              </div>

              <div style="background:#eee;padding:20px;text-align:center">
                <small style="color:#777">
                  โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย
                </small>
              </div>
            </div>
          </div>
        `;

        try {
          const sent = await sendEmail({
            to: appt.email,
            subject: `⏰ อีก 15 นาที จะถึงเวลานัดหมาย: ${appt.topic || ''}`,
            html
          });

          if (sent) {
            console.log(
              `[Notification Cron] แจ้งเตือนสำเร็จ: นัดหมาย ${appointmentId}`
            );
          } else {
            console.error(
              `[Notification Cron] ส่งไม่สำเร็จ: นัดหมาย ${appointmentId}`
            );
          }
        } catch (error) {
          console.error(
            `[Notification Cron] เกิดข้อผิดพลาดนัดหมาย ${appointmentId}:`,
            error.message
          );
        }
      }
    } catch (err) {
      console.error('[Notification Cron] Cron Error:', err);
    }
  });

  console.log('[Notification Cron] เริ่มทำงานทุก 1 นาที');
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

module.exports = { startNotificationCron };
