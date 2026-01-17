import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Container, Button, Card, Row, Col, Badge, Modal, Alert, Spinner, Navbar, Nav, Dropdown } from 'react-bootstrap';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';
import ChatRoom from '../common/ChatRoom'; 
import { 
    FaComments, FaUserMd, FaClock, FaCalendarAlt, FaHistory, 
    FaCheckCircle, FaTimesCircle, FaExclamationCircle, FaUserCircle, 
    FaSignOutAlt, FaHeartbeat, FaChevronRight, FaClipboardList, FaNewspaper, FaHome
} from 'react-icons/fa';

import './StudentDashboard.css';
import pcshsLogo from '../../assets/pcshs_logo.png';

const StudentDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserName, setCurrentUserName] = useState("นักเรียน");
    const [showChat, setShowChat] = useState(false);
    const [selectedChatAppt, setSelectedChatAppt] = useState(null);

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
            {/* 1. Navbar Section (Updated Menu) */}
            <Navbar expand="lg" className="pcshs-navbar fixed-top">
                <Container>
                    <Navbar.Brand onClick={() => navigate('/')} style={{cursor:'pointer'}} className="fw-bold d-flex align-items-center">
                        <img src={pcshsLogo} alt="Logo" height="40" className="me-2"/>
                        <div>
                            <span style={{ color: '#0035ad', fontSize: '1.2rem' }}>PCSHS</span> 
                            <span style={{ color: '#f26522', fontSize: '1.2rem' }}>Care</span>
                        </div>
                    </Navbar.Brand>
                    
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ms-auto align-items-center gap-2">
                            {/* เมนูตามคำขอ: หน้าหลัก ข่าวสาร ประเมินสุขภาพใจ จองคิว ข้อมูลการนัดหมาย */}
                            <Nav.Link onClick={() => navigate('/')} className="nav-link-custom">
                                <FaHome className="me-1 mb-1"/> หน้าหลัก
                            </Nav.Link>
                            <Nav.Link onClick={() => navigate('/news')} className="nav-link-custom">
                                <FaNewspaper className="me-1 mb-1"/> ข่าวสาร
                            </Nav.Link>
                            <Nav.Link onClick={() => navigate('/student/assessment')} className="nav-link-custom">
                                <FaHeartbeat className="me-1 mb-1"/> ประเมินสุขภาพใจ
                            </Nav.Link>
                            <Nav.Link onClick={() => navigate('/student/book')} className="nav-link-custom">
                                <FaCalendarAlt className="me-1 mb-1"/> จองคิว
                            </Nav.Link>
                            {/* ลิงก์มาที่หน้านี้แหละ แต่ตั้งชื่อให้ตรงโจทย์ */}
                            <Nav.Link onClick={() => navigate('/student/dashboard')} className="nav-link-custom active">
                                <FaHistory className="me-1 mb-1"/> ข้อมูลการนัดหมาย
                            </Nav.Link>
                            
                            <div className="vr mx-2 d-none d-lg-block text-secondary"></div>

                            {/* User Profile Dropdown */}
                            <Dropdown align="end">
                                <Dropdown.Toggle variant="light" className="rounded-pill btn-sm d-flex align-items-center gap-2 border bg-white text-dark py-1 px-3 ms-2">
                                    <FaUserCircle className="text-primary" size={20}/>
                                    <span className="d-none d-lg-inline fw-medium">{currentUserName}</span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="border-0 shadow-lg mt-2 rounded-4">
                                    <Dropdown.Header>จัดการบัญชี</Dropdown.Header>
                                    <Dropdown.Item onClick={() => navigate('/profile')}>โปรไฟล์ส่วนตัว</Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item onClick={logout} className="text-danger">
                                        <FaSignOutAlt className="me-2"/> ออกจากระบบ
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* 2. Hero Section */}
            <section className="hero-section d-flex align-items-center">
                <Container>
                    <Row className="align-items-center reverse-column-mobile">
                        <Col lg={7} md={6} className="text-section fade-in-up">
                            <h5 className="fw-bold mb-2 text-secondary letter-spacing-1">ยินดีต้อนรับสู่ระบบดูแลนักเรียน</h5>
                            <h1 className="display-4 fw-extrabold mb-3 fw-bold " style={{color: 'var(--pcshs-blue)'}}>
                                พื้นที่ปลอดภัย<br/>
                                <span style={{ color: '#f26522' }}>สำหรับใจชาวจุฬาภรณฯ</span>
                            </h1>
                            <p className="lead text-muted mb-4" style={{maxWidth: '90%'}}>
                                เราพร้อมรับฟังและสนับสนุนทางจิตวิทยา เพื่อให้นักเรียนก้าวข้ามทุกความท้าทายในรั้ววิทยาศาสตร์ได้อย่างมีความสุข
                            </p>
                            <div className="d-flex gap-3">
                                <Button onClick={() => navigate('/student/assessment')} className="btn-hero-primary">
                                    <FaHeartbeat className="me-2"/> เริ่มประเมินสุขภาพใจ
                                </Button>
                            </div>
                        </Col>

                        <Col lg={5} md={6} className="text-center mb-4 mb-md-0 fade-in-up delay-100">
                            <img src={pcshsLogo} alt="PCSHS Logo" className="school-logo img-fluid floating-animation" />
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* 3. Content Section (Cards & Appointments) */}
            <Container className="py-5 content-wrapper position-relative" style={{ marginTop: '-80px', zIndex: 5 }}>
                
                {/* Menu Cards Row - 2 ใบวางคู่กัน */}
                <Row className="g-4 mb-5 justify-content-center">
                    <Col md={5} lg={4}>
                         <Card className="h-100 menu-card rounded-4" onClick={() => navigate('/student/assessment')}>
                            <Card.Body className="p-4 d-flex align-items-center">
                                {/* Icon 1: คลิปบอร์ด (ดูเป็นแบบประเมิน/วิชาการ) */}
                                <div className="icon-box bg-orange-light me-3">
                                    <FaClipboardList />
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-1 text-dark">ประเมินสุขภาพใจ</h5>
                                    <small className="text-muted">ทำแบบทดสอบ PHQ-A</small>
                                </div>
                                <FaChevronRight className="ms-auto text-muted opacity-50"/>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={5} lg={4}>
                        <Card className="h-100 menu-card rounded-4" onClick={() => navigate('/student/book')}>
                            <Card.Body className="p-4 d-flex align-items-center">
                                {/* Icon 2: แพทย์ (ดูเป็นการปรึกษาผู้เชี่ยวชาญ) */}
                                <div className="icon-box bg-blue-light me-3">
                                    <FaUserMd />
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-1 text-dark">จองคิวปรึกษา</h5>
                                    <small className="text-muted">นัดหมายกับนักจิตวิทยา</small>
                                </div>
                                <FaChevronRight className="ms-auto text-muted opacity-50"/>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Appointments Section */}
                <div className="section-header d-flex align-items-center mb-4 pb-2 border-bottom">
                    <div className="bg-primary rounded-pill me-3" style={{width:'5px', height:'30px'}}></div>
                    <h3 className="fw-bold m-0 text-dark">ข้อมูลการนัดหมาย & ห้องแชท</h3>
                </div>
                
                {loading ? (
                    <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                ) : appointments.length === 0 ? (
                    <Alert variant="light" className="text-center py-5 border-0 rounded-4 shadow-sm bg-white">
                        <FaCalendarAlt size={50} className="text-muted opacity-25 mb-3"/>
                        <h5>ยังไม่มีรายการนัดหมายในขณะนี้</h5>
                        <p className="text-muted">หากคุณต้องการปรึกษา สามารถกดจองคิวได้ที่เมนูด้านบน</p>
                    </Alert>
                ) : (
                    <Row className="g-4">
                        {appointments.map(appt => {
                            const statusInfo = getStatusInfo(appt.status);
                            const isChatEnabled = appt.status === 'Pending' || appt.status === 'Confirmed';
                            
                            return (
                                <Col lg={6} key={appt.appointment_id}>
                                    <Card className="shadow-sm rounded-4 h-100 overflow-hidden appt-modern-card">
                                        {/* ใช้ Border-left แทนแถบสีเดิม */}
                                        <div className={`card-status-strip bg-${statusInfo.bg}`}></div>
                                        <Card.Body className="p-4">
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <Badge bg={statusInfo.bg} className="px-3 py-2 rounded-pill fw-normal">
                                                    {statusInfo.icon} <span className="ms-1">{statusInfo.label}</span>
                                                </Badge>
                                                <div className="text-muted small fw-bold">
                                                     {new Date(appt.appointment_date).toLocaleDateString('th-TH', { dateStyle: 'long' })}
                                                </div>
                                            </div>

                                            <h5 className="fw-bold mb-3 text-dark">{appt.topic || 'การปรึกษาทั่วไป'}</h5>

                                            <div className="info-group mb-4 p-3 rounded-3 bg-light">
                                                <div className="d-flex align-items-center mb-2 text-secondary">
                                                    <FaUserMd className="me-2 text-primary"/> 
                                                    <span className="fw-medium">นักจิตวิทยา: {appt.psychologist_name || 'รอดำเนินการ'}</span>
                                                </div>
                                                <div className="d-flex align-items-center text-secondary">
                                                    <FaClock className="me-2 text-warning"/> 
                                                    <span>เวลา: {appt.appointment_time} น.</span>
                                                </div>
                                            </div>
                                            
                                            <Button 
                                                variant={isChatEnabled ? "primary" : "secondary"}
                                                className={`w-100 rounded-pill py-2 fw-bold d-flex align-items-center justify-content-center gap-2 ${isChatEnabled ? '' : 'opacity-75'}`}
                                                style={{ backgroundColor: isChatEnabled ? 'var(--pcshs-blue)' : '#6c757d', border:'none' }}
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
            </Container>

            {/* Chat Modal */}
            <Modal show={showChat && selectedChatAppt} onHide={() => setShowChat(false)} size="lg" centered className="chat-modal-custom">
                <Modal.Header closeButton className="border-0 shadow-sm">
                    <Modal.Title className="d-flex align-items-center gap-3">
                        <div className="avatar-circle bg-primary text-white"><FaUserMd/></div>
                        <div>
                            <div className="fs-5 fw-bold">{selectedChatAppt?.psychologist_name || 'นักจิตวิทยา'}</div>
                            <div className="fs-6 text-muted fw-normal small">หัวข้อ: {selectedChatAppt?.topic}</div>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0" style={{ height: '500px' }}>
                    {selectedChatAppt && currentUserId && (
                        <ChatRoom 
                            roomID={`appt-${selectedChatAppt.appointment_id}`}
                            userId={String(currentUserId)}
                            username={currentUserName}
                            otherName={selectedChatAppt.psychologist_name || 'นักจิตวิทยา'}
                        />
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default StudentDashboard;