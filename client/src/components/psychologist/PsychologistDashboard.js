import React from 'react';
import { Container, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
// ✅ นำเข้า Component จัดการนัดหมายที่เราทำไว้
import AppointmentManager from './AppointmentManager'; 

const PsychologistDashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    return (
        <Container className="my-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>ยินดีต้อนรับ นักจิตวิทยา 👩‍⚕️</h1>
                <Button variant="danger" onClick={handleLogout}>
                    ออกจากระบบ
                </Button>
            </div>

            {/* ส่วนแสดงสถิติเบื้องต้น (ถ้ามี) */}
            <Card className="mb-4 bg-light border-0">
                <Card.Body>
                    <p className="mb-0 text-muted">
                        นี่คือหน้าควบคุมหลักของคุณ คุณสามารถตรวจสอบรายการนัดหมายและกดรับงานได้จากด้านล่างนี้
                    </p>
                </Card.Body>
            </Card>

            <hr />

            {/* ✅ เรียกใช้ตารางจัดการนัดหมายตรงนี้ */}
            <AppointmentManager />
            
        </Container>
    );
};

export default PsychologistDashboard;