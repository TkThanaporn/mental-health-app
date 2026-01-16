import React, { useState } from 'react';
import { Container, Button, Card, Row, Col, Nav, Navbar, Offcanvas, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
    FaHome, FaCalendarAlt, FaList, FaSignOutAlt, 
    FaUserEdit, FaClock, FaBars, FaUserCircle,
    FaCalendarCheck, FaStethoscope, FaClipboardCheck, FaSearch
} from 'react-icons/fa';

import './Psychologist.css';

// Import Components (สมมติว่ามีไฟล์เหล่านี้อยู่)
import AppointmentManager from './AppointmentManager'; 
import ScheduleManager from './ScheduleManager'; 
import AllAppointmentList from './AllAppointmentList'; 
import ProfileEditor from './ProfileEditor';

// Logo โรงเรียน
import pcshsLogo from '../../assets/pcshs_logo.png'; 

const PsychologistDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard'); 
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    // Mock Data (ข้อมูลจำลอง)
    const psychologistName = "ดร.สมชาย ใจดี";

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    const handleMenuClick = (tabName) => {
        setActiveTab(tabName);
        setShowMobileMenu(false);
    };

    // --- Sidebar Component (ส่วนเมนูด้านซ้าย) ---
    const SidebarContent = () => (
        <div className="d-flex flex-column h-100">
            {/* Logo Section : จุดเด่นที่มีแสง Glow */}
            <div className="logo-section">
                <img 
                    src={pcshsLogo} 
                    alt="PCSHS Logo" 
                    className="pcshs-logo-glow" 
                />
                <h6 className="school-name mb-0">PCSHS HeartCare</h6>
                {/* เส้นขีดสีส้มเอกลักษณ์ */}
                <div style={{ width: '40px', height: '2px', background: 'var(--pcshs-orange)', margin: '8px auto', borderRadius: '2px' }}></div>
                <small className="text-white-50" style={{fontSize: '0.75rem', fontWeight: 300}}>
                    ระบบดูแลช่วยเหลือนักเรียน
                </small>
            </div>

            {/* Menu List */}
            <Nav className="flex-column w-100 mt-3 px-2">
                <div onClick={() => handleMenuClick('dashboard')} className={`nav-item-custom ${activeTab === 'dashboard' ? 'active' : ''}`}>
                    <FaHome className="me-3" /> หน้าหลัก
                </div>
                <div onClick={() => handleMenuClick('appointments')} className={`nav-item-custom ${activeTab === 'appointments' ? 'active' : ''}`}>
                    <FaCalendarAlt className="me-3" /> จัดการนัดหมาย
                </div>
                <div onClick={() => handleMenuClick('all-list')} className={`nav-item-custom ${activeTab === 'all-list' ? 'active' : ''}`}>
                    <FaList className="me-3" /> ประวัติทั้งหมด
                </div>
                <div onClick={() => handleMenuClick('schedule')} className={`nav-item-custom ${activeTab === 'schedule' ? 'active' : ''}`}>
                    <FaClock className="me-3" /> ตั้งค่าตารางเวลา
                </div>
                <div onClick={() => handleMenuClick('profile')} className={`nav-item-custom ${activeTab === 'profile' ? 'active' : ''}`}>
                    <FaUserEdit className="me-3" /> ข้อมูลส่วนตัว
                </div>
            </Nav>

            {/* Logout Section */}
            <div className="mt-auto p-4 border-top border-secondary border-opacity-25">
                <Button variant="link" onClick={handleLogout} className="text-white-50 text-decoration-none p-0 d-flex align-items-center hover-danger">
                    <FaSignOutAlt className="me-2" /> ออกจากระบบ
                </Button>
            </div>
        </div>
    );

    // --- Main Content Renderer (ส่วนแสดงเนื้อหา) ---
    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="fade-in">
                        {/* 1. Hero Banner: แก้ไขส่วนนี้เพื่อใส่โลโก้ทางขวา */}
                        <div className="hero-welcome p-4 p-lg-5 mb-4 d-flex align-items-center justify-content-between">
                            <div className="hero-bg-pattern"></div>
                            
                            {/* ฝั่งซ้าย: ข้อความต้อนรับ */}
                            <div className="position-relative z-1">
                                <Badge bg="warning" text="dark" className="mb-2 px-3 rounded-pill fw-bold">Psychologist Panel</Badge>
                                <h1 className="fw-title display-6 fw-bold mb-2">สวัสดี, {psychologistName}</h1>
                                <p className="text-white-50 mb-4 fw-light" style={{maxWidth: '550px'}}>
                                    ยินดีต้อนรับสู่ระบบบริหารจัดการงานจิตวิทยา โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย
                                </p>
                                <Button className="btn-pcshs shadow-lg" onClick={() => handleMenuClick('appointments')}>
                                    <FaCalendarCheck className="me-2"/> ตรวจสอบนัดหมายวันนี้
                                </Button>
                            </div>

                            {/* ฝั่งขวา: ใส่โลโก้โรงเรียนแบบเรืองแสงตามรูป */}
                            <div className="d-none d-md-block hero-logo-container">
                                <img 
                                    src={pcshsLogo} 
                                    alt="PCSHS School Logo" 
                                    className="hero-logo-img" 
                                />
                                {/* ไอคอนหูฟังหมอแบบจางๆ เป็นพื้นหลังเพิ่มความสวยงาม */}
                                <FaStethoscope 
                                    size={200} 
                                    style={{
                                        position: 'absolute', 
                                        right: '-40px', 
                                        opacity: 0.05, 
                                        color: 'white', 
                                        transform: 'rotate(-20deg)',
                                        zIndex: -1
                                    }} 
                                />
                            </div>
                        </div>

                        {/* 2. Stats Cards: สถิติสำคัญ */}
                        <Row className="g-4 mb-4">
                            <Col md={4}>
                                <Card className="stat-card border-0 shadow-sm">
                                    <Card.Body className="d-flex align-items-center p-4">
                                        <div className="stat-icon-wrapper bg-blue-soft">
                                            <FaClock />
                                        </div>
                                        <div>
                                            <small className="text-muted fw-bold font-prompt">รอยืนยันนัดหมาย</small>
                                            <h2 className="mb-0 fw-bold text-dark">5 <span className="fs-6 text-muted fw-light">รายการ</span></h2>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="stat-card border-0 shadow-sm">
                                    <Card.Body className="d-flex align-items-center p-4">
                                        <div className="stat-icon-wrapper bg-orange-soft">
                                            <FaCalendarAlt />
                                        </div>
                                        <div>
                                            <small className="text-muted fw-bold font-prompt">นัดหมายวันนี้</small>
                                            <h2 className="mb-0 fw-bold text-dark">3 <span className="fs-6 text-muted fw-light">ราย</span></h2>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="stat-card border-0 shadow-sm">
                                    <Card.Body className="d-flex align-items-center p-4">
                                        <div className="stat-icon-wrapper bg-green-soft">
                                            <FaClipboardCheck />
                                        </div>
                                        <div>
                                            <small className="text-muted fw-bold font-prompt">ดูแลสำเร็จแล้ว</small>
                                            <h2 className="mb-0 fw-bold text-dark">128 <span className="fs-6 text-muted fw-light">เคส</span></h2>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                        
                        {/* 3. Placeholder for Activity: ส่วนเนื้อหาเพิ่มเติม */}
                        <Card className="border-0 shadow-sm rounded-4 bg-white">
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="fw-title mb-0">กิจกรรมการนัดหมายล่าสุด</h5>
                                    <Button variant="light" size="sm" className="rounded-pill text-muted"><FaSearch className="me-1"/> ค้นหา</Button>
                                </div>
                                <div className="text-center py-5 bg-light rounded-3 border border-dashed">
                                    <p className="text-muted mb-0">
                                        - พื้นที่สำหรับแสดงตารางนัดหมาย หรือ กราฟสรุปผลการดำเนินงาน -
                                    </p>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                );
            case 'appointments': return <AppointmentManager />;
            case 'schedule': return <ScheduleManager />;
            case 'all-list': return <AllAppointmentList />;
            case 'profile': return <ProfileEditor />;
            default: return null;
        }
    };

    return (
        <div className="dashboard-wrapper">
            {/* 1. Desktop Sidebar (แสดงเมื่อจอใหญ่) */}
            <div className="pcshs-sidebar d-none d-lg-block">
                <SidebarContent />
            </div>

            {/* 2. Mobile Sidebar (Offcanvas) */}
            <Offcanvas 
                show={showMobileMenu} 
                onHide={() => setShowMobileMenu(false)} 
                className="offcanvas-custom text-white"
                style={{ width: '280px' }}
            >
                <Offcanvas.Header closeButton closeVariant="white" />
                <Offcanvas.Body className="p-0">
                    <SidebarContent />
                </Offcanvas.Body>
            </Offcanvas>

            {/* 3. Main Content Area */}
            <div className="main-content d-flex flex-column">
                {/* 3.1 Navbar */}
                <Navbar className="navbar-modern justify-content-between">
                    <div className="d-flex align-items-center">
                        <Button variant="link" className="d-lg-none text-dark p-0 me-3" onClick={() => setShowMobileMenu(true)}>
                            <FaBars size={24}/>
                        </Button>
                        <h5 className="fw-title mb-0 text-dark d-none d-sm-block">
                            <span style={{color: 'var(--pcshs-blue-deep)'}}>Psychologist</span> Workspace
                        </h5>
                    </div>
                    
                    <div className="d-flex align-items-center gap-3">
                        <div className="text-end d-none d-md-block line-height-sm">
                            <div className="fw-bold text-dark" style={{fontSize: '0.9rem'}}>{psychologistName}</div>
                            <small className="text-success fw-bold" style={{fontSize: '0.75rem'}}>● Online</small>
                        </div>
                        <div className="position-relative cursor-pointer">
                             <FaUserCircle size={40} color="var(--pcshs-blue-deep)" />
                             <span className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle p-1"></span>
                        </div>
                    </div>
                </Navbar>

                {/* 3.2 Dynamic Body Content */}
                <Container fluid className="p-4 flex-grow-1">
                    {renderContent()}
                </Container>
            </div>
        </div>
    );
};

export default PsychologistDashboard;