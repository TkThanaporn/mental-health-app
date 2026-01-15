// src/components/psychologist/PsychologistDashboard.js
import React, { useState } from 'react';
import { Container, Button, Card, Row, Col, Nav, Navbar, Offcanvas, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
    FaHome, FaCalendarAlt, FaList, FaSignOutAlt, 
    FaUserEdit, FaClock, FaSearch, FaBars, FaUserCircle,
    FaCalendarCheck, FaUserClock, FaCheckCircle // เพิ่มไอคอนใหม่
} from 'react-icons/fa';

import './Psychologist.css';

// นำเข้า Component
import AppointmentManager from './AppointmentManager'; 
import ScheduleManager from './ScheduleManager'; 
import AllAppointmentList from './AllAppointmentList'; 
import ProfileEditor from './ProfileEditor';
import pcshsLogo from '../../assets/pcshs_logo.png'; 

const PsychologistDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard'); 
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    const handleCloseMobileMenu = () => setShowMobileMenu(false);
    const handleShowMobileMenu = () => setShowMobileMenu(true);

    const handleMenuClick = (tabName) => {
        setActiveTab(tabName);
        handleCloseMobileMenu();
    };

    const theme = {
        primaryBlue: '#002147',
        lightBlue: '#f4f7fa',
        orange: '#F26522',
        textGold: '#FFD700'
    };

    const SidebarContent = () => (
        <div className="d-flex flex-column h-100 text-white" style={{ background: theme.primaryBlue }}>
            <div className="mb-4 mt-4 px-4 text-center">
                <img src={pcshsLogo} alt="PCSHS" style={{ width: '60px', marginBottom: '10px' }} />
                <h5 className="fw-bold mb-0" style={{ color: 'white' }}>PCSHS <span style={{ color: theme.orange }}>HeartCare</span></h5>
                <small className="text-white-50">Psychologist Workspace</small>
            </div>

            <Nav className="flex-column w-100 px-3 mt-3">
                <Nav.Link onClick={() => handleMenuClick('dashboard')} className={`mb-2 text-white d-flex align-items-center rounded-3 p-3 transition-all ${activeTab === 'dashboard' ? 'btn-pcshs-orange shadow' : 'hover-effect'}`}>
                    <FaHome className="me-3" /> หน้าหลัก
                </Nav.Link>
                <Nav.Link onClick={() => handleMenuClick('appointments')} className={`mb-2 text-white d-flex align-items-center rounded-3 p-3 transition-all ${activeTab === 'appointments' ? 'btn-pcshs-orange shadow' : 'hover-effect'}`}>
                    <FaCalendarAlt className="me-3" /> จัดการนัดหมาย & แชท
                </Nav.Link>
                <Nav.Link onClick={() => handleMenuClick('all-list')} className={`mb-2 text-white d-flex align-items-center rounded-3 p-3 transition-all ${activeTab === 'all-list' ? 'btn-pcshs-orange shadow' : 'hover-effect'}`}>
                    <FaList className="me-3" /> ประวัตินัดหมายทั้งหมด
                </Nav.Link>
                <Nav.Link onClick={() => handleMenuClick('schedule')} className={`mb-2 text-white d-flex align-items-center rounded-3 p-3 transition-all ${activeTab === 'schedule' ? 'btn-pcshs-orange shadow' : 'hover-effect'}`}>
                    <FaClock className="me-3" /> ตั้งค่าตารางเวลา
                </Nav.Link>
                <Nav.Link onClick={() => handleMenuClick('profile')} className={`mb-2 text-white d-flex align-items-center rounded-3 p-3 transition-all ${activeTab === 'profile' ? 'btn-pcshs-orange shadow' : 'hover-effect'}`}>
                    <FaUserEdit className="me-3" /> แก้ไขข้อมูลส่วนตัว
                </Nav.Link>
            </Nav>

            <div className="mt-auto p-4 border-top border-white-10">
                <Nav.Link onClick={handleLogout} className="text-white-50 d-flex align-items-center rounded-3 p-2 hover-danger">
                    <FaSignOutAlt className="me-3" /> ออกจากระบบ
                </Nav.Link>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="fade-in-up">
                        {/* Banner ต้อนรับ (ตามรูปภาพต้นฉบับที่คุณอยากให้สวย) */}
                        <Card className="border-0 shadow-lg mb-4 text-white overflow-hidden" 
                              style={{ borderRadius: '25px', background: `linear-gradient(135deg, ${theme.primaryBlue} 0%, #1B3F8B 100%)`, position: 'relative' }}>
                            <div className="glass-circle"></div>
                            <Card.Body className="p-4 p-md-5">
                                <Row className="align-items-center">
                                    <Col md={8} className="text-center text-md-start">
                                        <Badge bg="warning" text="dark" className="mb-3 px-3 py-2 rounded-pill fw-bold shadow-sm">Psychologist Dashboard</Badge>
                                        <h1 className="display-5 fw-bold mb-2">ยินดีต้อนรับกลับมา</h1>
                                        <h4 className="fw-light mb-4" style={{ color: theme.orange }}>แดชบอร์ดส่วนตัวสำหรับการดูแลนักเรียน</h4>
                                        <div className="d-flex gap-2 justify-content-center justify-content-md-start">
                                            <Button className="btn-pcshs-orange rounded-pill px-4 py-2 fw-bold shadow" onClick={() => handleMenuClick('appointments')}>
                                                <FaCalendarCheck className="me-2"/> ดูการนัดหมายวันนี้
                                            </Button>
                                        </div>
                                    </Col>
                                    <Col md={4} className="d-none d-md-block text-center">
                                        <div className="bg-white p-3 rounded-circle shadow-lg d-inline-block animate-float" style={{ width: '180px', height: '180px' }}>
                                            <img src={pcshsLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Quick Stats */}
                        <Row className="g-4 mb-4">
                            <Col md={4}>
                                <Card className="border-0 shadow-sm rounded-4 h-100 bg-white hover-up">
                                    <Card.Body className="d-flex align-items-center p-4">
                                        <div className="rounded-circle p-3 me-3" style={{ background: '#E3F2FD', color: theme.primaryBlue }}><FaUserClock size={24} /></div>
                                        <div><h6 className="text-muted mb-1">รอยืนยันนัดหมาย</h6><h3 className="fw-bold mb-0">-- รายการ</h3></div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="border-0 shadow-sm rounded-4 h-100 bg-white hover-up">
                                    <Card.Body className="d-flex align-items-center p-4">
                                        <div className="rounded-circle p-3 me-3" style={{ background: '#FFF3E0', color: theme.orange }}><FaCalendarAlt size={24} /></div>
                                        <div><h6 className="text-muted mb-1">นัดหมายวันนี้</h6><h3 className="fw-bold mb-0">-- รายการ</h3></div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="border-0 shadow-sm rounded-4 h-100 bg-white hover-up">
                                    <Card.Body className="d-flex align-items-center p-4">
                                        <div className="rounded-circle p-3 me-3" style={{ background: '#E8F5E9', color: '#2E7D32' }}><FaCheckCircle size={24} /></div>
                                        <div><h6 className="text-muted mb-1">สำเร็จแล้วทั้งหมด</h6><h3 className="fw-bold mb-0">-- เคส</h3></div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                );
            case 'appointments': return <AppointmentManager />;
            case 'schedule': return <ScheduleManager />;
            case 'all-list': return <AllAppointmentList />;
            case 'profile': return <ProfileEditor />;
            default: return <div className="p-5 text-center text-muted"><h4>หน้ายังไม่พร้อมใช้งาน</h4></div>;
        }
    };

    return (
        <div className="d-flex dashboard-bg">
            {/* Sidebar Desktop */}
            <div className="sidebar-desktop flex-column text-white shadow" style={{ width: '280px', height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 1000, background: theme.primaryBlue }}>
                <SidebarContent />
            </div>

            {/* Sidebar Mobile */}
            <Offcanvas show={showMobileMenu} onHide={handleCloseMobileMenu} style={{ width: '280px', background: theme.primaryBlue }}>
                <Offcanvas.Body className="p-0"><SidebarContent /></Offcanvas.Body>
            </Offcanvas>

            {/* Main Content Area */}
            <div className="dashboard-content flex-grow-1 w-100" style={{ marginLeft: window.innerWidth > 992 ? '280px' : '0' }}>
                <Navbar bg="white" className="shadow-sm px-4 py-3 sticky-top">
                    <div className="d-flex align-items-center w-100 justify-content-between">
                        <Button variant="link" className="d-lg-none text-dark p-0 me-3" onClick={handleShowMobileMenu}><FaBars size={24}/></Button>
                        <div className="fw-bold text-navy d-none d-sm-block">ระบบสนับสนุนดูแลช่วยเหลือนักเรียน (Psychologist)</div>
                        <div className="d-flex align-items-center">
                            <div className="text-end me-3 d-none d-md-block">
                                <div className="fw-bold" style={{ fontSize: '0.9rem' }}>นักจิตวิทยา</div>
                                <Badge bg="success" className="rounded-pill" style={{ fontSize: '0.7rem' }}>Online</Badge>
                            </div>
                            <div className="rounded-circle shadow-sm p-1 bg-light border"><FaUserCircle size={32} color={theme.primaryBlue} /></div>
                        </div>
                    </div>
                </Navbar>

                <Container fluid className="p-4 content-wrapper">
                    {renderContent()}
                </Container>
            </div>
        </div>
    );
};

export default PsychologistDashboard;