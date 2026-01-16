import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Container, Button, Card, Row, Col, Badge, Modal, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import ChatRoom from '../common/ChatRoom'; 
import { 
    FaComments, FaUserMd, FaClock, FaCalendarAlt, FaHistory, 
    FaCheckCircle, FaTimesCircle, FaExclamationCircle, FaTimes
} from 'react-icons/fa';

import './StudentDashboard.css';

const StudentDashboard = () => {
    const { logout } = useAuth();
    
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State สำหรับแชท
    const [showChat, setShowChat] = useState(false);
    const [selectedChatAppt, setSelectedChatAppt] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserName, setCurrentUserName] = useState("นักศึกษา"); // เก็บชื่อนักศึกษา

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const userObj = decoded.user || decoded;
                setCurrentUserId(userObj.id || userObj.user_id);
                if(userObj.name) setCurrentUserName(userObj.name);
            } catch (e) {
                console.error("Token Error", e);
            }
        }
        fetchMyHistory();
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

    const getStatusInfo = (status) => {
        switch (status) {
            case 'Confirmed': return { bg: 'success', label: 'ยืนยันแล้ว', icon: <FaCheckCircle/> };
            case 'Cancelled': return { bg: 'danger', label: 'ยกเลิก', icon: <FaTimesCircle/> };
            case 'Pending': return { bg: 'warning', label: 'รออนุมัติ', icon: <FaExclamationCircle/> };
            case 'Completed': return { bg: 'secondary', label: 'เสร็จสิ้น', icon: <FaHistory/> };
            default: return { bg: 'secondary', label: status, icon: <FaExclamationCircle/> };
        }
    };

    return (
        <Container className="py-4 fade-in-up">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-5 border-bottom pb-4">
                <div>
                    <h1 className="fw-bold text-dark display-6">👋 สวัสดี, {currentUserName}</h1>
                    <p className="text-muted mb-0">ศูนย์รวมบริการสุขภาพจิตและการนัดหมายของคุณ</p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-primary" href="/profile" className="rounded-pill px-4">
                        👤 โปรไฟล์
                    </Button>
                    <Button variant="danger" onClick={logout} className="rounded-pill px-4">
                        ออกจากระบบ
                    </Button>
                </div>
            </div>

            {/* Menu Cards */}
            <Row className="mb-5 g-4">
                <Col md={6}>
                    <Card className="h-100 shadow-sm border-0 rounded-4 overflow-hidden" style={{background: 'linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)'}}>
                        <Card.Body className="p-4 d-flex flex-column align-items-center text-center">
                            <div className="bg-white p-3 rounded-circle shadow-sm mb-3">
                                <FaHistory className="text-primary" size={30}/>
                            </div>
                            <h3 className="fw-bold">ประเมินสุขภาพใจ</h3>
                            <p className="text-muted">ทำแบบประเมิน PHQ-A เพื่อเช็คสภาวะอารมณ์ของคุณ</p>
                            <Button variant="primary" href="/student/assessment" className="w-100 mt-auto rounded-pill py-2 shadow-sm">
                                เริ่มทำแบบประเมิน
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="h-100 shadow-sm border-0 rounded-4 overflow-hidden" style={{background: 'linear-gradient(135deg, #e8f5e9 0%, #ffffff 100%)'}}>
                        <Card.Body className="p-4 d-flex flex-column align-items-center text-center">
                            <div className="bg-white p-3 rounded-circle shadow-sm mb-3">
                                <FaCalendarAlt className="text-success" size={30}/>
                            </div>
                            <h3 className="fw-bold">จองคิวปรึกษา</h3>
                            <p className="text-muted">นัดหมายวันและเวลาเพื่อพูดคุยกับนักจิตวิทยา</p>
                            <Button variant="success" href="/student/book" className="w-100 mt-auto rounded-pill py-2 shadow-sm">
                                จองวัน/เวลา
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Appointments Section */}
            <div className="d-flex align-items-center mb-4">
                <FaComments className="text-primary me-2" size={24}/>
                <h3 className="fw-bold m-0">รายการนัดหมาย & ห้องแชท</h3>
            </div>
            
            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="grow" variant="primary" />
                    <p className="mt-3 text-muted">กำลังโหลดข้อมูล...</p>
                </div>
            ) : appointments.length === 0 ? (
                <Alert variant="light" className="text-center py-5 border rounded-4 shadow-sm">
                    <FaHistory size={40} className="text-muted opacity-50 mb-3"/>
                    <h5>ยังไม่มีรายการนัดหมาย</h5>
                    <p className="text-muted">คุณสามารถจองคิวปรึกษาได้ที่เมนูด้านบน</p>
                </Alert>
            ) : (
                <Row className="g-4">
                    {appointments.map(appt => {
                        const statusInfo = getStatusInfo(appt.status);
                        const isChatEnabled = appt.status === 'Pending' || appt.status === 'Confirmed';
                        
                        return (
                            <Col lg={6} key={appt.appointment_id}>
                                <Card className="border-0 shadow-sm rounded-4 h-100 overflow-hidden appt-modern-card">
                                    <div className={`card-accent-bar bg-${statusInfo.bg}`} style={{height: '6px'}}></div>
                                    <Card.Body className="p-4">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div>
                                                <Badge bg={statusInfo.bg} className="px-3 py-2 rounded-pill fw-normal">
                                                    {statusInfo.icon} {statusInfo.label}
                                                </Badge>
                                            </div>
                                            <div className="text-end text-muted small fw-bold">
                                                 <FaCalendarAlt className="me-1"/>
                                                 {new Date(appt.appointment_date).toLocaleDateString('th-TH', { dateStyle: 'long' })}
                                            </div>
                                        </div>

                                        <h5 className="fw-bold mb-3">{appt.topic || 'ไม่ระบุหัวข้อ'}</h5>

                                        <div className="d-flex align-items-center mb-2 text-secondary">
                                            <FaUserMd className="me-2"/> 
                                            <span className="fw-medium">นักจิตวิทยา: {appt.psychologist_name || 'ระบบกำลังจัดสรร'}</span>
                                        </div>
                                        <div className="d-flex align-items-center mb-4 text-secondary">
                                            <FaClock className="me-2"/> 
                                            <span>เวลา: {appt.appointment_time} น.</span>
                                        </div>
                                        
                                        <Button 
                                            variant={isChatEnabled ? "primary" : "secondary"}
                                            className="w-100 rounded-pill py-2 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                                            onClick={() => openChat(appt)}
                                            disabled={!isChatEnabled && appt.status !== 'Completed'} // อนุญาตให้ดูแชทเก่าได้ถ้า Completed (แล้วแต่ Logic)
                                        >
                                            <FaComments/> {isChatEnabled ? 'เข้าห้องแชท' : 'ดูประวัติแชท'}
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {/* Chat Modal (Style เดียวกับ AppointmentManager) */}
            <Modal 
                show={showChat && selectedChatAppt} 
                onHide={() => setShowChat(false)}
                size="lg"
                centered
                className="chat-modal-custom" // ใช้ class เดิมเพื่อให้ style เหมือนกัน
            >
                <Modal.Header closeButton className="border-0 bg-light">
                    <Modal.Title className="d-flex align-items-center gap-3">
                        {/* เปลี่ยน icon เป็นหมอ */}
                        <div className="avatar-circle bg-primary text-white" style={{width: 45, height: 45, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%'}}>
                            <FaUserMd size={20}/>
                        </div>
                        <div>
                            <div className="fs-5 fw-bold">{selectedChatAppt?.psychologist_name || 'นักจิตวิทยา'}</div>
                            <div className="fs-6 text-muted fw-normal">หัวข้อ: {selectedChatAppt?.topic || 'ปรึกษาทั่วไป'}</div>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                
                <Modal.Body className="p-0" style={{ height: '500px', background: '#f8f9fa' }}>
                    {selectedChatAppt && currentUserId && (
                        <ChatRoom 
                            // ใช้ Format เดียวกับ AppointmentManager: appt-{id}
                            roomID={`appt-${selectedChatAppt.appointment_id}`}
                            userId={String(currentUserId)}
                            // ฝั่งนักเรียน: username คือ ตัวเอง, otherName คือ นักจิตวิทยา
                            username={currentUserName}
                            otherName={selectedChatAppt.psychologist_name || 'นักจิตวิทยา'}
                        />
                    )}
                </Modal.Body>

                <Modal.Footer className="border-0 bg-white justify-content-between px-4 py-3">
                     <span className="text-muted small">
                        <FaHistory className="me-1"/> ประวัติการสนทนาจะถูกบันทึกไว้
                    </span>
                    <Button variant="secondary" className="rounded-pill px-4" onClick={() => setShowChat(false)}>
                        <FaTimes className="me-2"/> ปิดหน้าต่าง
                    </Button>
                </Modal.Footer>
            </Modal>

        </Container>
    );
};

export default StudentDashboard;