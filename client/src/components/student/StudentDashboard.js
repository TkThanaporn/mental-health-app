import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Container, Button, Card, Row, Col, Badge, Modal, Alert } from 'react-bootstrap';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import ChatRoom from '../common/ChatRoom'; 

const StudentDashboard = () => {
    const { logout } = useAuth();
    
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State สำหรับแชท
    const [showChat, setShowChat] = useState(false);
    const [selectedChatAppt, setSelectedChatAppt] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        fetchMyHistory();
        
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const userObj = decoded.user || decoded;
                setCurrentUserId(userObj.id || userObj.user_id);
            } catch (e) {
                console.error("Token Error", e);
            }
        }
    }, []);

    const fetchMyHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/appointments/my-appointments', {
                    headers: { 'x-auth-token': token }
            });
            setAppointments(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const openChat = (appt) => {
        setSelectedChatAppt(appt);
        setShowChat(true);
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'Confirmed': return 'success';
            case 'Cancelled': return 'danger';
            case 'Pending': return 'warning';
            default: return 'secondary';
        }
    };

    return (
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1>👋 ยินดีต้อนรับนักศึกษา</h1>
                    <p className="text-muted">นี่คือศูนย์รวมบริการสุขภาพจิตของคุณ</p>
                </div>
                <div>
                    {/* ✅ เพิ่มปุ่มแก้ไขโปรไฟล์ ตรงนี้ครับ */}
                    <Button variant="outline-primary" href="/profile" className="me-2">
                        👤 แก้ไขโปรไฟล์
                    </Button>
                    <Button variant="danger" onClick={logout}>ออกจากระบบ</Button>
                </div>
            </div>
            
            <hr />

            {/* ส่วนเมนูหลัก */}
            <Row className="mb-5 text-center">
                <Col md={6} className="mb-3">
                    <Card className="h-100 shadow-sm p-3">
                        <Card.Body>
                            <h3>📝 1. ประเมินสุขภาพใจ</h3>
                            <p>ทำแบบประเมิน PHQ-A เพื่อเช็คสภาวะอารมณ์</p>
                            <Button variant="primary" href="/student/assessment" className="w-100">เริ่มทำแบบประเมิน</Button>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} className="mb-3">
                    <Card className="h-100 shadow-sm p-3">
                        <Card.Body>
                            <h3>📅 2. จองคิวปรึกษา</h3>
                            <p>นัดหมายพูดคุยกับนักจิตวิทยา</p>
                            <Button variant="success" href="/student/book" className="w-100">จองวัน/เวลา</Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* ส่วนรายการนัดหมายและแชท */}
            <h3 className="mb-3">💬 รายการนัดหมายของคุณ (แชทได้ที่นี่)</h3>
            
            {loading ? (
                <p>กำลังโหลดข้อมูล...</p>
            ) : appointments.length === 0 ? (
                <Alert variant="info">คุณยังไม่มีรายการนัดหมาย</Alert>
            ) : (
                <Row>
                    {appointments.map(appt => (
                        <Col md={6} key={appt.appointment_id} className="mb-3">
                            <Card className="shadow-sm border-0">
                                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                                    <strong>{new Date(appt.appointment_date).toLocaleDateString('th-TH')}</strong>
                                    <Badge bg={getStatusVariant(appt.status)}>{appt.status}</Badge>
                                </Card.Header>
                                <Card.Body>
                                    <Card.Title>หัวข้อ: {appt.topic}</Card.Title>
                                    <Card.Text>
                                        👨‍⚕️ นักจิตวิทยา: {appt.psychologist_name || 'ไม่ระบุ'}<br/>
                                        🕒 เวลา: {appt.appointment_time}
                                    </Card.Text>
                                    
                                    <Button 
                                        variant="outline-primary" 
                                        className="w-100" 
                                        onClick={() => openChat(appt)}
                                    >
                                        💬 เข้าห้องแชท
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            <Modal show={showChat} onHide={() => setShowChat(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>คุยกับ: {selectedChatAppt?.psychologist_name}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0">
                    {selectedChatAppt && currentUserId && (
                        <ChatRoom 
                            appointmentId={selectedChatAppt.appointment_id}
                            currentUserId={currentUserId}
                            userName="นักศึกษา" 
                        />
                    )}
                </Modal.Body>
            </Modal>

        </Container>
    );
};

export default StudentDashboard;