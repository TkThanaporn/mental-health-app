import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Container, Button, Card, Row, Col, Badge, Modal, Alert, Spinner, Navbar, Nav, Image } from 'react-bootstrap';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import ChatRoom from '../common/ChatRoom'; 
import { 
    FaComments, FaUserMd, FaClock, FaCalendarAlt, FaHistory, 
    FaCheckCircle, FaTimesCircle, FaExclamationCircle, FaTimes, FaUserCircle, FaSignOutAlt
} from 'react-icons/fa';

import './StudentDashboard.css';
import pcshsLogo from '../../assets/pcshs_logo.png';


const StudentDashboard = () => {
    const { logout } = useAuth();
    
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State สำหรับแชท
    const [showChat, setShowChat] = useState(false);
    const [selectedChatAppt, setSelectedChatAppt] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserName, setCurrentUserName] = useState("นักเรียน");

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
        <div className="pcshs-dashboard">
            {/* 1. Navbar Section */}
            <Navbar expand="lg" className="pcshs-navbar shadow-sm" fixed="top">
                <Container>
                    <Navbar.Brand href="/" className="fw-bold d-flex align-items-center text-primary">
                        {/* ใส่โลโก้เล็กๆ ตรงนี้ได้ถ้าต้องการ */}
                        <span style={{ color: '#0035ad' }}>PCSHS</span> <span style={{ color: '#f26522' }}>Care</span>
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
                        <Nav className="align-items-center gap-2">
                            <span className="text-muted me-2 d-none d-lg-block">สวัสดี, {currentUserName}</span>
                            <Button variant="outline-primary" href="/profile" className="rounded-pill btn-sm px-3">
                                <FaUserCircle className="me-1"/> โปรไฟล์
                            </Button>
                            <Button variant="danger" onClick={logout} className="rounded-pill btn-sm px-3">
                                <FaSignOutAlt className="me-1"/> ออกจากระบบ
                            </Button>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* 2. Hero Section (เลียนแบบภาพต้นฉบับ) */}
            <section className="hero-section d-flex align-items-center">
                <Container>
                    <Row className="align-items-center reverse-column-mobile">
                        {/* Left Side: Text */}
                        <Col lg={7} md={6} className="text-section fade-in-up">
                            <h4 className="text-secondary fw-bold mb-2">ยินดีต้อนรับสู่ PCSHS Care</h4>
                            <h1 className="display-4 fw-extrabold text-primary mb-3">
                                พื้นที่ปลอดภัย<br/>
                                <span style={{ color: '#f26522' }}>สำหรับใจชาวจุฬาภรณฯ</span>
                            </h1>
                            <p className="lead text-muted mb-4">
                                เราเข้าใจว่าชีวิตในรั้วโรงเรียนวิทยาศาสตร์อาจเต็มไปด้วยความท้าทาย 
                                เราพร้อมรับฟังและสนับสนุนทางจิตวิทยาเพื่อให้นักเรียนเติบโตอย่างเข้มแข็งและมีความสุข
                            </p>
                            <div className="d-flex gap-3">
                                <Button href="/student/assessment" className="btn-hero-primary shadow">
                                    แบบประเมินสุขภาพใจ
                                </Button>
                                <Button href="/student/book" variant="outline-primary" className="btn-hero-secondary">
                                    จองคิวปรึกษา
                                </Button>
                            </div>
                        </Col>

                        {/* Right Side: Logo/Image */}
                        <Col lg={5} md={6} className="text-center mb-4 mb-md-0 fade-in-up delay-100">
                            <div className="logo-container">
                                {/* เปลี่ยน src เป็น path รูปโลโก้จริงของคุณ */}
                                <img 
                                    src={pcshsLogo}
                                    alt="PCSHS Logo" 
                                    className="school-logo img-fluid floating-animation"
                                />
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* 3. Content Section (Cards & Appointments) */}
            <Container className="py-5 content-wrapper position-relative" style={{ zIndex: 2 }}>
                
                {/* Menu Cards Row - ดึงขึ้นมาทับ Hero นิดหน่อยให้ดู modern */}
                <Row className="g-4 mb-5 justify-content-center">
                    <Col md={5} lg={4}>
                         <Card className="h-100 shadow-sm border-0 rounded-4 menu-card card-assessment">
                            <Card.Body className="p-4 d-flex align-items-center">
                                <div className="icon-box bg-orange-light text-orange me-3">
                                    <FaHistory size={24}/>
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-1">ประเมินสุขภาพใจ</h5>
                                    <small className="text-muted">เช็คสภาวะอารมณ์ของคุณ (PHQ-A)</small>
                                </div>
                            </Card.Body>
                            <a href="/student/assessment" className="stretched-link"></a>
                        </Card>
                    </Col>
                    <Col md={5} lg={4}>
                        <Card className="h-100 shadow-sm border-0 rounded-4 menu-card card-booking">
                            <Card.Body className="p-4 d-flex align-items-center">
                                <div className="icon-box bg-blue-light text-blue me-3">
                                    <FaCalendarAlt size={24}/>
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-1">จองคิวปรึกษา</h5>
                                    <small className="text-muted">นัดหมายพูดคุยกับนักจิตวิทยา</small>
                                </div>
                            </Card.Body>
                            <a href="/student/book" className="stretched-link"></a>
                        </Card>
                    </Col>
                </Row>

                {/* Appointments Section */}
                <div className="section-header d-flex align-items-center mb-4 border-bottom pb-3">
                    <FaComments className="text-primary me-2" size={24}/>
                    <h3 className="fw-bold m-0 text-dark">รายการนัดหมาย & ห้องแชท</h3>
                </div>
                
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="grow" variant="primary" />
                        <p className="mt-3 text-muted">กำลังโหลดข้อมูล...</p>
                    </div>
                ) : appointments.length === 0 ? (
                    <Alert variant="light" className="text-center py-5 border-0 rounded-4 shadow-sm bg-white">
                        <div className="mb-3 text-muted opacity-25">
                             <FaCalendarAlt size={50}/>
                        </div>
                        <h5>ยังไม่มีรายการนัดหมาย</h5>
                        <p className="text-muted">เริ่มจองคิวปรึกษาได้ที่เมนูด้านบน</p>
                    </Alert>
                ) : (
                    <Row className="g-4">
                        {appointments.map(appt => {
                            const statusInfo = getStatusInfo(appt.status);
                            const isChatEnabled = appt.status === 'Pending' || appt.status === 'Confirmed';
                            
                            return (
                                <Col lg={6} key={appt.appointment_id}>
                                    <Card className="border-0 shadow-sm rounded-4 h-100 overflow-hidden appt-modern-card">
                                        <div className={`card-status-strip bg-${statusInfo.bg}`}></div>
                                        <Card.Body className="p-4">
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <Badge bg={statusInfo.bg} className="px-3 py-2 rounded-pill fw-normal shadow-sm">
                                                    {statusInfo.icon} {statusInfo.label}
                                                </Badge>
                                                <div className="text-end text-muted small fw-bold">
                                                     <FaCalendarAlt className="me-1"/>
                                                     {new Date(appt.appointment_date).toLocaleDateString('th-TH', { dateStyle: 'long' })}
                                                </div>
                                            </div>

                                            <h5 className="fw-bold mb-3 text-dark">{appt.topic || 'ไม่ระบุหัวข้อ'}</h5>

                                            <div className="info-group mb-4 p-3 rounded-3 bg-light">
                                                <div className="d-flex align-items-center mb-2 text-secondary">
                                                    <FaUserMd className="me-2 text-primary"/> 
                                                    <span className="fw-medium">{appt.psychologist_name || 'ระบบกำลังจัดสรร'}</span>
                                                </div>
                                                <div className="d-flex align-items-center text-secondary">
                                                    <FaClock className="me-2 text-warning"/> 
                                                    <span>เวลา: {appt.appointment_time} น.</span>
                                                </div>
                                            </div>
                                            
                                            <Button 
                                                variant={isChatEnabled ? "primary" : "secondary"}
                                                className={`w-100 rounded-pill py-2 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm ${isChatEnabled ? 'btn-chat-active' : ''}`}
                                                onClick={() => openChat(appt)}
                                                disabled={!isChatEnabled && appt.status !== 'Completed'}
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

                {/* Chat Modal */}
                <Modal 
                    show={showChat && selectedChatAppt} 
                    onHide={() => setShowChat(false)}
                    size="lg"
                    centered
                    className="chat-modal-custom"
                >
                    <Modal.Header closeButton className="border-0 bg-white shadow-sm" style={{zIndex: 10}}>
                        <Modal.Title className="d-flex align-items-center gap-3">
                            <div className="avatar-circle bg-gradient-primary text-white">
                                <FaUserMd size={20}/>
                            </div>
                            <div>
                                <div className="fs-5 fw-bold text-dark">{selectedChatAppt?.psychologist_name || 'นักจิตวิทยา'}</div>
                                <div className="fs-6 text-muted fw-normal">หัวข้อ: {selectedChatAppt?.topic}</div>
                            </div>
                        </Modal.Title>
                    </Modal.Header>
                    
                    <Modal.Body className="p-0 bg-light" style={{ height: '500px' }}>
                        {selectedChatAppt && currentUserId && (
                            <ChatRoom 
                                roomID={`appt-${selectedChatAppt.appointment_id}`}
                                userId={String(currentUserId)}
                                username={currentUserName}
                                otherName={selectedChatAppt.psychologist_name || 'นักจิตวิทยา'}
                            />
                        )}
                    </Modal.Body>

                    <Modal.Footer className="border-0 bg-white">
                        <span className="text-muted small me-auto">
                            <FaHistory className="me-1"/> ระบบบันทึกการสนทนาอัตโนมัติ
                        </span>
                        <Button variant="light" className="rounded-pill px-4 border" onClick={() => setShowChat(false)}>
                            ปิด
                        </Button>
                    </Modal.Footer>
                </Modal>

            </Container>
        </div>
    );
};

export default StudentDashboard;