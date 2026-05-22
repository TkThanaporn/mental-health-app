const cron = require('node-cron');
const { google } = require('googleapis');
const db = require('../config/db'); // แก้ไข Path ให้ถูกต้องแล้ว
require('dotenv').config();

async function syncToGoogleCalendar() {
    console.log('🔄 [Auto Sync] เริ่มตรวจสอบข้อมูลตารางงาน...');
    
    try {
        // 1. ดึงข้อมูลนักจิตวิทยา "ทุกคน" ที่เปิดใช้งาน Sync
        const [psychologists] = await db.query(
            'SELECT user_id, fullname, google_refresh_token FROM users WHERE is_google_synced = 1'
        );

        if (!psychologists || psychologists.length === 0) {
            console.log('ℹ️ ไม่มีผู้ใช้ที่เปิดระบบ Sync ในขณะนี้');
            return; // จบการทำงานถ้ารอบนี้ไม่มีใครเปิด Sync
        }

        // 2. วนลูป Sync ปฏิทินให้ทีละคน
        for (const psych of psychologists) {
            console.log(`⏳ กำลัง Sync ปฏิทินให้: ${psych.fullname}`);

            // สร้าง Client สำหรับหมอคนนี้โดยเฉพาะ
            const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET
            );
            
            // ใส่ Token ส่วนตัวของหมอคนนั้น
            oauth2Client.setCredentials({ refresh_token: psych.google_refresh_token });
            const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

            // 3. ดึงตารางงานเฉพาะของหมอคนนี้ และ JOIN ดูว่าใครจองบ้าง
            const query = `
                SELECT s.*, a.appointment_id, u.fullname as student_name
                FROM schedules s
                LEFT JOIN appointments a ON s.schedule_id = a.schedule_id
                LEFT JOIN users u ON a.student_user_id = u.user_id
                WHERE s.psychologist_user_id = ? AND s.date >= CURDATE()
            `;
            
            const [schedules] = await db.query(query, [psych.user_id]);

            // 4. นำตารางงานไปอัปเดตลง Google Calendar
            for (const slot of schedules) {
                const eventId = `pcshsapp${slot.schedule_id}`;
                
                // แปลงรูปแบบวันที่ให้ Google เข้าใจ (YYYY-MM-DD)
                const d = new Date(slot.date);
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                
                const startDateTime = `${dateStr}T${slot.start_time}`;
                const endDateTime = `${dateStr}T${slot.end_time}`;
                
                // 👇 จัดรูปแบบเวลาให้สวยงาม (ตัด :00 ออกให้เหลือแค่ HH:MM)
                const startTimeFormatted = slot.start_time.substring(0, 5);
                const endTimeFormatted = slot.end_time.substring(0, 5);
                const timeLabel = `${startTimeFormatted}-${endTimeFormatted}`;
                
                const isBooked = !!slot.appointment_id;
                const isAvailable = slot.is_available === 1;

                // 👇 อัปเดต summary ให้นำ timeLabel มาโชว์ต่อท้ายข้อความ
                const event = {
                    summary: isBooked ? `🔴 จองแล้ว: ${slot.student_name} (${timeLabel})` : (isAvailable ? `🟢 เปิดคิวว่าง ${timeLabel}` : `⛔ ปิดรับคิว ${timeLabel}`),
                    description: isBooked ? `จองโดยนักเรียน: ${slot.student_name}` : "ช่วงเวลาให้บริการคำปรึกษา",
                    start: { dateTime: startDateTime, timeZone: 'Asia/Bangkok' },
                    end: { dateTime: endDateTime, timeZone: 'Asia/Bangkok' },
                    colorId: isBooked ? '11' : (isAvailable ? '10' : '8')
                };

                try {
                    // ลองอัปเดตข้อมูลเดิมก่อน
                    await calendar.events.update({ calendarId: 'primary', eventId: eventId, requestBody: event });
                } catch (err) {
                    // ถ้า Google หาไม่เจอ (Error 404) แปลว่ายังไม่เคยสร้าง ให้สร้างใหม่
                    if (err.code === 404) {
                        await calendar.events.insert({ calendarId: 'primary', requestBody: { id: eventId, ...event } });
                    }
                }
            }
            console.log(`✅ Sync เสร็จสิ้นสำหรับ: ${psych.fullname}`);
        }
    } catch (error) {
        console.error('❌ Sync System Error:', error.message);
    }
}

// ตั้งเวลาให้ทำงานทุก 1 นาที (สำหรับการทดสอบ)
cron.schedule('*/1 * * * *', syncToGoogleCalendar);

module.exports = { syncToGoogleCalendar };