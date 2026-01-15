// server/services/googleCalendarService.js (ฉบับ Mock Mode)

const getBusySlots = async (startDate, endDate) => {
    console.log("⚠️ [MOCK] Checking busy slots -> Returning Empty (Assume Free)");
    return []; // ส่งค่าว่างกลับไป (แปลว่าว่างตลอด)
};

const createCalendarEvent = async (appointmentDetails) => {
    console.log("---------------------------------------------------");
    console.log("✅ [MOCK] Google Calendar Event Created Successfully");
    console.log(`📝 Title: ${appointmentDetails.title}`);
    console.log(`📧 Student Email: ${appointmentDetails.studentEmail}`);
    console.log("---------------------------------------------------");
    
    // ส่งค่าหลอกๆ กลับไป เพื่อให้ API ไม่ Error
    return { htmlLink: 'https://calendar.google.com/mock-event-link' };
};

module.exports = { getBusySlots, createCalendarEvent };