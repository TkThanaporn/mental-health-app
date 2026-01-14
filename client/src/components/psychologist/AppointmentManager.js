import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Button, Row, Col, Alert, Badge, Modal } from 'react-bootstrap';
import { jwtDecode } from "jwt-decode"; 
import ChatRoom from '../common/ChatRoom'; 

const AppointmentManager = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State สำหรับแชท
    const [showChat, setShowChat] = useState(false);
    const [selectedChatAppt, setSelectedChatAppt] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null); // ✅ เปลี่ยนชื่อตัวแปรให้ชัดเจน

    useEffect(() => {
        fetchAppointments();
        
        // 🛠️ ส่วนสำคัญ: ดึง User ID จาก Token แบบครอบคลุมทุกเคส
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                console.log("🔓 Decoded Token:", decoded); // ดูใน Console Browser ว่าได้อะไร

                // 1. ลองหาใน decoded โดยตรง (เช่น decoded.id หรือ decoded.user_id)
                // 2. ถ้าไม่มี ลองหาใน decoded.user (เช่น decoded.user.id)
                const userObj = decoded.user || decoded;
                const id = userObj.id || userObj.user_id;

                if (id) {
                    console.log("✅ Found User ID:", id);
                    setCurrentUserId(id);
                } else {
                    console.error("❌ หา User ID ใน Token ไม่เจอ!");
                }
            } catch (e) {
                console.error("Token Error", e);
            }
        }
    }, []);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/appointments', {
                headers: { 'x-auth-token': token } 
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
            await axios.put(`http://localhost:5000/api/appointments/${id}/status`, 
                { status }, 
                { headers: { 'x-auth-token': token } }
            );
            alert(`อัปเดตสถานะเรียบร้อย`);
            fetchAppointments();
        } catch (err) {
            alert(`เกิดข้อผิดพลาดในการอัปเดตสถานะ`);
        }
    };

    // เปิดหน้าต่างแชท
    const openChat = (appt) => {
        if (!currentUserId) {
            alert("ไม่พบข้อมูลผู้ใช้ กรุณา Login ใหม่");
            return;
        }
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

    if (loading) return <Container className="my-4 text-center"><p>กำลังโหลด...</p></Container>;
    if (error) return <Container className="my-4"><Alert variant="danger">{error}</Alert></Container>;

    return (
        <Container className="my-4">
            <h2 className="mb-4 text-primary">📅 จัดการนัดหมาย & แชท</h2>
            
            {appointments.length === 0 ? (
                <Alert variant="info">ยังไม่มีรายการนัดหมายเข้ามา</Alert>
            ) : (
                <Row>
                    {appointments.map(app => (
                        <Col md={6} lg={4} key={app.appointment_id} className="mb-4">
                            <Card className="h-100 shadow-sm border-0">
                                <Card.Header className="d-flex justify-content-between align-items-center bg-white">
                                    <strong>{new Date(app.appointment_date).toLocaleDateString('th-TH')}</strong>
                                    <Badge bg="info" text="dark">{app.appointment_time}</Badge>
                                </Card.Header>
                                <Card.Body>
                                    <Card.Title className="text-primary">{app.topic}</Card.Title>
                                    <div className="mb-3 text-muted" style={{ fontSize: '0.9rem' }}>
                                        <p className="mb-1">👤 นักเรียน: {app.student_name}</p>
                                        <p className="mb-1">💻 รูปแบบ: {app.type}</p>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center mt-3">
                                        <Badge bg={getStatusVariant(app.status)}>{app.status}</Badge>
                                        
                                        <div>
                                            {app.status === 'Pending' && (
                                                <>
                                                    <Button variant="outline-success" size="sm" className="me-1" onClick={() => handleStatusChange(app.appointment_id, 'Confirmed')}>✅ รับ</Button>
                                                    <Button variant="outline-danger" size="sm" className="me-1" onClick={() => handleStatusChange(app.appointment_id, 'Cancelled')}>❌</Button>
                                                </>
                                            )}
                                            
                                            <Button variant="primary" size="sm" onClick={() => openChat(app)}>
                                                💬 แชท
                                            </Button>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* Modal สำหรับแชท */}
            <Modal show={showChat} onHide={() => setShowChat(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>คุยกับ: {selectedChatAppt?.student_name}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0">
                    {selectedChatAppt && currentUserId && (
                        <ChatRoom 
                            appointmentId={selectedChatAppt.appointment_id}
                            currentUserId={currentUserId} // ✅ ส่ง ID ที่ถูกต้องแน่นอนไป
                            userName="นักจิตวิทยา"
                        />
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default AppointmentManager;