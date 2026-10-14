// const cron = require('node-cron');
// const { google } = require('googleapis');
// const db = require('../config/db'); // แก้ไข Path ให้ถูกต้องแล้ว
// require('dotenv').config();

// async function syncToGoogleCalendar() {
//     console.log('🔄 [Auto Sync] เริ่มตรวจสอบข้อมูลตารางงาน...');
    
//     try {
//         // 1. ดึงข้อมูลนักจิตวิทยา "ทุกคน" ที่เปิดใช้งาน Sync
//         const [psychologists] = await db.query(
//             'SELECT user_id, fullname, google_refresh_token FROM users WHERE is_google_synced = 1'
//         );

//         if (!psychologists || psychologists.length === 0) {
//             console.log('ℹ️ ไม่มีผู้ใช้ที่เปิดระบบ Sync ในขณะนี้');
//             return; // จบการทำงานถ้ารอบนี้ไม่มีใครเปิด Sync
//         }

//         // 2. วนลูป Sync ปฏิทินให้ทีละคน
//         for (const psych of psychologists) {
//             console.log(`⏳ กำลัง Sync ปฏิทินให้: ${psych.fullname}`);

//             // สร้าง Client สำหรับหมอคนนี้โดยเฉพาะ
//             const oauth2Client = new google.auth.OAuth2(
//                 process.env.GOOGLE_CLIENT_ID,
//                 process.env.GOOGLE_CLIENT_SECRET
//             );
            
//             // ใส่ Token ส่วนตัวของหมอคนนั้น
//             oauth2Client.setCredentials({ refresh_token: psych.google_refresh_token });
//             const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

//             // 3. ดึงตารางงานเฉพาะของหมอคนนี้ และ JOIN ดูว่าใครจองบ้าง
//             const query = `
//                 SELECT s.*, a.appointment_id, u.fullname as student_name
//                 FROM schedules s
//                 LEFT JOIN appointments a ON s.schedule_id = a.schedule_id
//                 LEFT JOIN users u ON a.student_user_id = u.user_id
//                 WHERE s.psychologist_user_id = ? AND s.date >= CURDATE()
//             `;
            
//             const [schedules] = await db.query(query, [psych.user_id]);

//             // 4. นำตารางงานไปอัปเดตลง Google Calendar
//             for (const slot of schedules) {
//                 const eventId = `pcshsapp${slot.schedule_id}`;
                
//                 // แปลงรูปแบบวันที่ให้ Google เข้าใจ (YYYY-MM-DD)
//                 const d = new Date(slot.date);
//                 const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                
//                 const startDateTime = `${dateStr}T${slot.start_time}`;
//                 const endDateTime = `${dateStr}T${slot.end_time}`;
                
//                 // 👇 จัดรูปแบบเวลาให้สวยงาม (ตัด :00 ออกให้เหลือแค่ HH:MM)
//                 const startTimeFormatted = slot.start_time.substring(0, 5);
//                 const endTimeFormatted = slot.end_time.substring(0, 5);
//                 const timeLabel = `${startTimeFormatted}-${endTimeFormatted}`;
                
//                 const isBooked = !!slot.appointment_id;
//                 const isAvailable = slot.is_available === 1;

//                 // 👇 อัปเดต summary ให้นำ timeLabel มาโชว์ต่อท้ายข้อความ
//                 const event = {
//                     summary: isBooked ? `🔴 จองแล้ว: ${slot.student_name} (${timeLabel})` : (isAvailable ? `🟢 เปิดคิวว่าง ${timeLabel}` : `⛔ ปิดรับคิว ${timeLabel}`),
//                     description: isBooked ? `จองโดยนักเรียน: ${slot.student_name}` : "ช่วงเวลาให้บริการคำปรึกษา",
//                     start: { dateTime: startDateTime, timeZone: 'Asia/Bangkok' },
//                     end: { dateTime: endDateTime, timeZone: 'Asia/Bangkok' },
//                     colorId: isBooked ? '11' : (isAvailable ? '10' : '8')
//                 };

//                 try {
//                     // ลองอัปเดตข้อมูลเดิมก่อน
//                     await calendar.events.update({ calendarId: 'primary', eventId: eventId, requestBody: event });
//                 } catch (err) {
//                     // ถ้า Google หาไม่เจอ (Error 404) แปลว่ายังไม่เคยสร้าง ให้สร้างใหม่
//                     if (err.code === 404) {
//                         await calendar.events.insert({ calendarId: 'primary', requestBody: { id: eventId, ...event } });
//                     }
//                 }
//             }
//             console.log(`✅ Sync เสร็จสิ้นสำหรับ: ${psych.fullname}`);
//         }
//     } catch (error) {
//         console.error('❌ Sync System Error:', error.message);
//     }
// }

// // ตั้งเวลาให้ทำงานทุก 1 นาที (สำหรับการทดสอบ)
// cron.schedule('*/1 * * * *', syncToGoogleCalendar);

// module.exports = { syncToGoogleCalendar };


const cron = require('node-cron');
const { google } = require('googleapis');
const db = require('../config/db');
require('dotenv').config();

async function syncToGoogleCalendar() {
    console.log('🔄 [Auto Sync] เริ่มตรวจสอบข้อมูลตารางงาน...');

    try {
        const [psychologists] = await db.query(`
            SELECT user_id, fullname, google_refresh_token
            FROM users
            WHERE is_google_synced = 1
              AND google_refresh_token IS NOT NULL
              AND google_refresh_token != ''
        `);

        if (!psychologists.length) {
            console.log('ℹ️ ไม่มีนักจิตวิทยาที่เปิด Sync');
            return;
        }

        for (const psych of psychologists) {
            console.log(`⏳ กำลัง Sync: ${psych.fullname}`);

            try {
                const oauth2Client = new google.auth.OAuth2(
                    process.env.GOOGLE_CLIENT_ID,
                    process.env.GOOGLE_CLIENT_SECRET
                );

                oauth2Client.setCredentials({
                    refresh_token: psych.google_refresh_token
                });

                const calendar = google.calendar({
                    version: 'v3',
                    auth: oauth2Client
                });

                const query = `
                    SELECT
                        s.*,
                        DATE_FORMAT(s.date, '%Y-%m-%d') AS sync_date,
                        TIME_FORMAT(s.start_time, '%H:%i:%s') AS sync_start_time,
                        TIME_FORMAT(s.end_time, '%H:%i:%s') AS sync_end_time,
                        a.appointment_id,
                        u.fullname AS student_name
                    FROM schedules s
                    LEFT JOIN appointments a
                        ON s.schedule_id = a.schedule_id
                        AND a.status != 'cancelled'
                    LEFT JOIN users u
                        ON a.student_user_id = u.user_id
                    WHERE s.psychologist_user_id = ?
                      AND s.date >= CURDATE()
                    ORDER BY s.date, s.start_time
                `;

                const [schedules] = await db.query(query, [psych.user_id]);

                console.log(
                    `📅 พบตารางของ ${psych.fullname}: ${schedules.length} รายการ`
                );

                for (const slot of schedules) {
                    try {
                        // Google Event ID ต้องใช้อักขระ a-v และ 0-9
                        const eventId =
                            `a0000${Number(slot.schedule_id).toString(16)}`;

                        const dateStr = slot.sync_date;
                        const startTime = slot.sync_start_time;
                        const endTime = slot.sync_end_time;

                        if (!dateStr || !startTime || !endTime) {
                            console.error(
                                `❌ วันที่หรือเวลาไม่ครบ: ${slot.schedule_id}`
                            );
                            continue;
                        }

                        const timeLabel =
                            `${startTime.slice(0, 5)}-${endTime.slice(0, 5)}`;

                        const isBooked = slot.appointment_id != null;
                        const isAvailable =
                            Number(slot.is_available) === 1;

                        const studentName =
                            slot.student_name || 'นักเรียน';

                        const event = {
                            summary: isBooked
                                ? `🔴 จองแล้ว: ${studentName} (${timeLabel})`
                                : isAvailable
                                    ? `🟢 เปิดคิวว่าง ${timeLabel}`
                                    : `⛔ ปิดรับคิว ${timeLabel}`,

                            description: isBooked
                                ? `จองโดยนักเรียน: ${studentName}`
                                : 'ช่วงเวลาให้บริการคำปรึกษา',

                            start: {
                                dateTime: `${dateStr}T${startTime}`,
                                timeZone: 'Asia/Bangkok'
                            },

                            end: {
                                dateTime: `${dateStr}T${endTime}`,
                                timeZone: 'Asia/Bangkok'
                            },

                            colorId: isBooked
                                ? '11'
                                : isAvailable ? '10' : '8'
                        };

                        try {
                            await calendar.events.update({
                                calendarId: 'primary',
                                eventId,
                                requestBody: event
                            });

                            console.log(
                                `🔄 อัปเดตสำเร็จ: ${slot.schedule_id}`
                            );
                        } catch (err) {
                            const status =
                                err.code || err.response?.status;

                            if (Number(status) === 404) {
                                await calendar.events.insert({
                                    calendarId: 'primary',
                                    requestBody: {
                                        id: eventId,
                                        ...event
                                    }
                                });

                                console.log(
                                    `✅ สร้างกิจกรรมสำเร็จ: ${slot.schedule_id}`
                                );
                            } else {
                                console.error(
                                    '❌ Google Calendar:',
                                    err.response?.data || err.message
                                );
                            }
                        }
                    } catch (err) {
                        console.error(
                            `❌ ตาราง ${slot.schedule_id}:`,
                            err.response?.data || err.message
                        );
                    }
                }

                console.log(`✅ Sync เสร็จสิ้น: ${psych.fullname}`);
            } catch (err) {
                console.error(
                    `❌ Sync ${psych.fullname} ไม่สำเร็จ:`,
                    err.response?.data || err.message
                );
            }
        }
    } catch (err) {
        console.error(
            '❌ Sync System Error:',
            err.response?.data || err.message
        );
    }
}

cron.schedule('*/1 * * * *', syncToGoogleCalendar);

module.exports = { syncToGoogleCalendar };
