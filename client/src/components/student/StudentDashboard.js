// StudentDashboard.js
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Container, Button } from 'react-bootstrap';
// TODO: นำเข้า ChatRoom (สมมติว่าต้องเข้า ChatRoom จาก Dashboard)
// import ChatRoom from '../common/ChatRoom'; 

const StudentDashboard = () => {
    const { logout, userId } = useAuth();
    
    // **ตัวอย่าง:** สมมติว่านักศึกษามีนัดหมาย ID 1 ที่ต้องการแชท
    const mockAppointmentId = 1; 
    const mockRecipientId = 2; // ID ของนักจิตวิทยา

    return (
        <Container className="mt-4">
            <h1>ยินดีต้อนรับ, นักศึกษา ({userId})</h1>
            <p>นี่คือศูนย์รวมบริการสุขภาพจิตของคุณ</p>
            
            <Button variant="danger" onClick={logout}>ออกจากระบบ</Button>
            
            {/* **ส่วนการทำงานหลักของนักศึกษา (1.3.2):** */}
            
            <hr />
            <h3>1. ทำแบบประเมิน (1.3.2.3)</h3>
            <Button variant="primary" href="/student/assessment">เริ่มทำแบบประเมิน PHQ-A</Button>
            
            <h3 className="mt-4">2. จองคำปรึกษา (1.3.2.4)</h3>
            <Button variant="success" href="/student/book">จองวัน/เวลานัดหมาย</Button>
            
            {/* <h3 className="mt-4">3. สนทนาออนไลน์ (1.3.2.5)</h3>
            <ChatRoom appointmentId={mockAppointmentId} userId={userId} recipientId={mockRecipientId} /> */}
        </Container>
    );
};
export default StudentDashboard;