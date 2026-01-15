import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Button, Row, Col, Alert, Badge, Modal } from 'react-bootstrap';
import { jwtDecode } from "jwt-decode"; 
import ChatRoom from '../common/ChatRoom'; 

const AppointmentManager = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State สำหรับแชท
    const [showChat, setShowChat] = useState(false);
    const [selectedChatAppt, setSelectedChatAppt] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);

    // ✅ State สำหรับดูผลประเมิน (เพิ่มใหม่)
    const [showAssessment, setShowAssessment] = useState(false);
    const [assessmentData, setAssessmentData] = useState(null);
    const [selectedStudentName, setSelectedStudentName] = useState("");

    useEffect(() => {
        fetchAppointments();
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const userObj = decoded.user || decoded;
                setCurrentUserId(userObj.id || userObj.user_id);
            } catch (e) { console.error("Token Error", e); }
        }
    }, []);

    const fetchAppointments = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/appointments', {
                headers: { 'x-auth-token': token } 
            });
            setAppointments(res.data);
            setLoading(false);
        } catch (err) {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, status) => {
        if (!window.confirm(`ยืนยันการเปลี่ยนสถานะ?`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/appointments/${id}/status`, { status }, { headers: { 'x-auth-token': token } });
            fetchAppointments();
        } catch (err) { alert(`Error updating status`); }
    };

    // เปิดแชท
    const openChat = (appt) => {
        setSelectedChatAppt(appt);
        setShowChat(true);
    };

    // ✅ ฟังก์ชันเปิดดูผลประเมิน (เพิ่มใหม่)
    const openAssessment = async (studentId, studentName) => {
        setSelectedStudentName(studentName);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/assessments/student/${studentId}`, {
                headers: { 'x-auth-token': token }
            });
            setAssessmentData(res.data);
            setShowAssessment(true);
        } catch (err) {
            alert("ไม่สามารถดึงข้อมูลผลประเมินได้");
        }
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'Confirmed': return 'success';
            case 'Cancelled': return 'danger';
            case 'Pending': return 'warning';
            default: return 'secondary';
        }
    };

    if (loading) return <p className="text-center mt-4">กำลังโหลด...</p>;

    return (
        <Container className="my-4">
            <h2 className="mb-4 text-primary">📅 จัดการนัดหมาย & แชท</h2>
            
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
                                <p className="mb-1 text-muted">👤 นักเรียน: {app.student_name}</p>
                                <div className="mt-3">
                                    <Badge bg={getStatusVariant(app.status)} className="me-2">{app.status}</Badge>
                                    
                                    {/* ✅ ปุ่มดูผลประเมิน */}
                                    <Button variant="outline-info" size="sm" onClick={() => openAssessment(app.student_id || app.student_email, app.student_name)}> {/* แก้ไขตรงนี้ ต้องมั่นใจว่าใน SQL join user_id มาเป็น student_id */}
                                        📄 ผลประเมิน
                                    </Button>
                                </div>
                                
                                <hr/>

                                <div className="d-flex justify-content-between">
                                    {app.status === 'Pending' && (
                                        <div>
                                            <Button variant="outline-success" size="sm" className="me-1" onClick={() => handleStatusChange(app.appointment_id, 'Confirmed')}>รับ</Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleStatusChange(app.appointment_id, 'Cancelled')}>ยกเลิก</Button>
                                        </div>
                                    )}
                                    <Button variant="primary" size="sm" onClick={() => openChat(app)}>💬 แชท</Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Modal Chat */}
            <Modal show={showChat} onHide={() => setShowChat(false)} size="lg" centered>
                <Modal.Header closeButton><Modal.Title>แชทกับ: {selectedChatAppt?.student_name}</Modal.Title></Modal.Header>
                <Modal.Body className="p-0">
                    {selectedChatAppt && currentUserId && (
                        <ChatRoom appointmentId={selectedChatAppt.appointment_id} currentUserId={currentUserId} userName="นักจิตวิทยา" />
                    )}
                </Modal.Body>
            </Modal>

            {/* ✅ Modal แสดงผลประเมิน */}
            <Modal show={showAssessment} onHide={() => setShowAssessment(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>ผลประเมิน: {selectedStudentName}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {assessmentData && assessmentData.score !== undefined ? (
                        <div className="text-center">
                            <h4>คะแนน PHQ-9</h4>
                            <h1 className="display-4 fw-bold text-primary">{assessmentData.score}</h1>
                            <Alert variant={
                                assessmentData.score < 7 ? 'success' : 
                                assessmentData.score < 13 ? 'info' : 
                                assessmentData.score < 19 ? 'warning' : 'danger'
                            }>
                                {assessmentData.stress_level}
                            </Alert>
                            <small className="text-muted">ทำเมื่อ: {new Date(assessmentData.created_at).toLocaleString('th-TH')}</small>
                        </div>
                    ) : (
                        <Alert variant="secondary" className="text-center">นักเรียนคนนี้ยังไม่เคยทำแบบประเมิน</Alert>
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default AppointmentManager;