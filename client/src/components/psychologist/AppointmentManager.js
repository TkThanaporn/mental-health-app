// client/src/components/psychologist/AppointmentManager.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Button, Row, Col, Alert, Badge } from 'react-bootstrap';

const AppointmentManager = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // ✅ แก้ไข 1: URL ต้องตรงกับ Backend (GET /api/appointments)
            const res = await axios.get('http://localhost:5000/api/appointments', {
                headers: { Authorization: `Bearer ${token}` } // ✅ แก้ไข 2: ใช้ Bearer Token
            });
            setAppointments(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError("ไม่สามารถดึงข้อมูลนัดหมายได้");
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, status) => {
        if (!window.confirm(`คุณต้องการเปลี่ยนสถานะเป็น "${status}" ใช่หรือไม่?`)) return;

        try {
            const token = localStorage.getItem('token');
            // ✅ Endpoint นี้ถูกต้องแล้ว (PUT /api/appointments/:id/status)
            await axios.put(`http://localhost:5000/api/appointments/${id}/status`, 
                { status }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            alert(`อัปเดตสถานะเป็น ${status} เรียบร้อยแล้ว`);
            fetchAppointments(); // ดึงข้อมูลใหม่ทันทีเพื่อให้หน้าจออัปเดต
        } catch (err) {
            console.error(err);
            alert(`เกิดข้อผิดพลาดในการอัปเดตสถานะ`);
        }
    };

    // Helper เลือกสีป้ายสถานะ
    const getStatusVariant = (status) => {
        switch (status) {
            case 'Confirmed': return 'success';
            case 'Cancelled': return 'danger';
            case 'Pending': return 'warning';
            default: return 'secondary';
        }
    };

    if (loading) return <Container className="my-4 text-center"><p>กำลังโหลดข้อมูลนัดหมาย...</p></Container>;
    if (error) return <Container className="my-4"><Alert variant="danger">{error}</Alert></Container>;

    return (
        <Container className="my-4">
            <h2 className="mb-4 text-primary">📅 จัดการนัดหมาย (Psychologist Dashboard)</h2>
            
            {appointments.length === 0 ? (
                <Alert variant="info">ยังไม่มีรายการนัดหมายเข้ามา</Alert>
            ) : (
                <Row>
                    {appointments.map(app => (
                        <Col md={6} lg={4} key={app.appointment_id} className="mb-4">
                            <Card className="h-100 shadow-sm border-0">
                                <Card.Header className="d-flex justify-content-between align-items-center bg-white">
                                    {/* ✅ แสดงวันที่และเวลาให้ชัดเจน */}
                                    <strong>{new Date(app.appointment_date).toLocaleDateString('th-TH')}</strong>
                                    <Badge bg="info" text="dark">{app.appointment_time}</Badge>
                                </Card.Header>
                                <Card.Body>
                                    <Card.Title className="text-primary">{app.topic}</Card.Title>
                                    
                                    <div className="mb-3 text-muted" style={{ fontSize: '0.9rem' }}>
                                        <p className="mb-1">
                                            👤 <strong>นักเรียน:</strong> {app.student_name}
                                        </p>
                                        <p className="mb-1">
                                            📧 {app.student_email}
                                        </p>
                                        {app.phone_number && (
                                            <p className="mb-1">📞 {app.phone_number}</p>
                                        )}
                                        <p className="mb-0">
                                            💻 รูปแบบ: {app.type}
                                        </p>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center">
                                        <Badge bg={getStatusVariant(app.status)} style={{ fontSize: '0.9rem' }}>
                                            {app.status}
                                        </Badge>
                                        
                                        {/* ปุ่มกดจะโชว์เฉพาะตอนสถานะเป็น Pending */}
                                        {app.status === 'Pending' && (
                                            <div>
                                                <Button 
                                                    variant="outline-success" 
                                                    size="sm" 
                                                    className="me-2"
                                                    onClick={() => handleStatusChange(app.appointment_id, 'Confirmed')}
                                                >
                                                    ✅ รับนัด
                                                </Button>
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm" 
                                                    onClick={() => handleStatusChange(app.appointment_id, 'Cancelled')}
                                                >
                                                    ❌ ปฏิเสธ
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
};

export default AppointmentManager;