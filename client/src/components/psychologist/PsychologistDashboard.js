// src/components/psychologist/PsychologistDashboard.js
import React, { useState } from 'react';
import { Container, Button, Card, Row, Col, Nav, Navbar, Offcanvas } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
    FaHome, FaCalendarAlt, FaList, FaSignOutAlt, 
    FaUserEdit, FaClock, FaSearch, FaBars, FaUserCircle 
} from 'react-icons/fa';

// ✅ 1. นำเข้า CSS
import './Psychologist.css';

// ✅ 2. นำเข้า Component หน้าจัดการต่างๆ
import AppointmentManager from './AppointmentManager'; 
import ScheduleManager from './ScheduleManager'; 
import AllAppointmentList from './AllAppointmentList'; // <<< ✅ นำเข้าไฟล์หน้ารายการทั้งหมดรทย
import ProfileEditor from './ProfileEditor';
// นำเข้ารูปโลโก้
import pcshsLogo from '../../assets/pcshs_logo.png'; 

const PsychologistDashboard = () => {
    const navigate = useNavigate();
    
    // State สำหรับควบคุมหน้า (เริ่มต้นที่หน้าหลัก)
    const [activeTab, setActiveTab] = useState('dashboard'); 
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    const handleCloseMobileMenu = () => setShowMobileMenu(false);
    const handleShowMobileMenu = () => setShowMobileMenu(true);

    // ฟังก์ชันเปลี่ยนหน้า
    const handleMenuClick = (tabName) => {
        setActiveTab(tabName);
        handleCloseMobileMenu();
    };

    // ฟังก์ชันนำทางเมนูย่อย
    const goToSchedule = () => handleMenuClick('schedule');
    const goToEditProfile = () => handleMenuClick('profile');

    // 🎨 Theme สี PCSHS
    const theme = {
        primaryBlue: '#002147',
        lightBlue: '#f4f7fa',
        orange: '#F26522',
        textGold: '#FFD700'
    };

    // --- ส่วนเนื้อหา Sidebar ---
    const SidebarContent = () => (
        <div className="d-flex flex-column h-100 text-white" style={{ background: theme.primaryBlue }}>
            <div className="mb-4 mt-3 px-3">
                <h4 className="fw-bold mb-0" style={{ color: theme.orange }}>PCSHS HeartCare</h4>
                <small className="text-white-50">สำหรับนักจิตวิทยา</small>
            </div>

            <Nav className="flex-column w-100 px-2">
                <Nav.Link 
                    onClick={() => handleMenuClick('dashboard')} 
                    className={`mb-2 text-white d-flex align-items-center rounded p-3 ${activeTab === 'dashboard' ? 'btn-pcshs-orange' : 'hover-effect'}`}
                >
                    <FaHome className="me-3" /> หน้าหลัก
                </Nav.Link>

                <Nav.Link 
                    onClick={() => handleMenuClick('appointments')} 
                    className={`mb-2 text-white d-flex align-items-center rounded p-3 ${activeTab === 'appointments' ? 'btn-pcshs-orange' : 'hover-effect'}`}
                >
                    <FaCalendarAlt className="me-3" /> จัดการข้อมูลการนัดหมาย
                </Nav.Link>

                <Nav.Link 
                    onClick={() => handleMenuClick('all-list')} 
                    className={`mb-2 text-white d-flex align-items-center rounded p-3 ${activeTab === 'all-list' ? 'btn-pcshs-orange' : 'hover-effect'}`}
                >
                    <FaList className="me-3" /> การนัดหมายทั้งหมด
                </Nav.Link>

                <Nav.Link 
                    onClick={goToSchedule} 
                    className={`mb-2 text-white d-flex align-items-center rounded p-3 ${activeTab === 'schedule' ? 'btn-pcshs-orange' : 'hover-effect'}`}
                >
                    <FaClock className="me-3" /> จัดตารางเวลา
                </Nav.Link>

                <Nav.Link 
                    onClick={goToEditProfile} 
                    className={`mb-2 text-white d-flex align-items-center rounded p-3 ${activeTab === 'profile' ? 'btn-pcshs-orange' : 'hover-effect'}`}
                >
                    <FaUserEdit className="me-3" /> แก้ไขข้อมูลส่วนตัว
                </Nav.Link>
            </Nav>

            <div className="mt-auto p-3">
                <Nav.Link onClick={handleLogout} className="text-white-50 d-flex align-items-center rounded p-3 hover-effect">
                    <FaSignOutAlt className="me-3" /> ออกจากระบบ
                </Nav.Link>
            </div>
        </div>
    );

    // --- ส่วนแสดงผลเนื้อหาตาม Tab (Render Content) ---
    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <Card className="pcshs-card mb-4 text-white" style={{ background: `linear-gradient(135deg, ${theme.primaryBlue} 0%, #1B3F8B 100%)` }}>
                        <Card.Body className="p-4 p-md-5 position-relative">
                            <Row className="align-items-center">
                                <Col md={8} className="text-center text-md-start mb-4 mb-md-0">
                                    <h1 className="fw-bold mb-2">ยินดีต้อนรับ</h1>
                                    <h3 className="fw-light mb-4 text-warning">แดชบอร์ดส่วนตัวของคุณ</h3>
                                    <p className="mb-4 mx-auto mx-md-0" style={{ opacity: 0.9, maxWidth: '600px' }}>
                                        คุณสามารถจัดการตารางเวลาและอัปเดตข้อมูลส่วนตัวได้จากแถบเมนูด้านบน
                                    </p>
                                    <Button variant="light" className="rounded-pill px-4 py-2 fw-bold shadow-sm text-primary" onClick={() => handleMenuClick('appointments')}>
                                        ดูการนัดหมายวันนี้
                                    </Button>
                                </Col>
                                <Col md={4} className="text-center">
                                    <div className="bg-white rounded-circle shadow-lg d-flex align-items-center justify-content-center mx-auto" style={{ width: '160px', height: '160px', opacity: '0.95' }}>
                                        <img src={pcshsLogo} alt="Logo" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                );

            case 'appointments':
                return (
                    <div className="pcshs-card p-3 p-md-4">
                        <div className="mb-4">
                            <h4 className="fw-bold mb-0 pcshs-header-text">
                                <FaCalendarAlt className="me-2" />
                                จัดการนัดหมาย & แชท
                            </h4>
                        </div>
                        <div className="table-responsive">
                            <AppointmentManager />
                        </div>
                    </div>
                );

            case 'schedule':
                return <ScheduleManager />;

            case 'all-list':
                // ✅ 3. เรียกใช้ Component AllAppointmentList ตรงนี้
                return <AllAppointmentList />;

            case 'profile':
                return <ProfileEditor />
            default:
                return <div className="p-5 text-center text-muted"><h4>หน้ายังไม่พร้อมใช้งาน</h4></div>;
        }
    };

    return (
        <div className="d-flex dashboard-bg">
             <style>
                {`
                    .dashboard-content { margin-left: 0; transition: margin-left 0.3s; }
                    @media (min-width: 992px) {
                        .dashboard-content { margin-left: 280px; }
                        .sidebar-desktop { display: flex !important; }
                        .navbar-toggle-btn { display: none !important; }
                    }
                    @media (max-width: 991.98px) {
                        .sidebar-desktop { display: none !important; }
                        .navbar-toggle-btn { display: block !important; }
                    }
                    .hover-effect:hover { background: rgba(255,255,255,0.1); color: white !important; }
                `}
            </style>

            <div className="sidebar-desktop flex-column text-white shadow" style={{ width: '280px', height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 1000, background: theme.primaryBlue }}>
                <SidebarContent />
            </div>

            <Offcanvas show={showMobileMenu} onHide={handleCloseMobileMenu} className="bg-dark text-white" style={{ width: '280px', border: 'none', background: theme.primaryBlue }}>
                <Offcanvas.Body className="p-0" style={{ background: theme.primaryBlue }}>
                    <SidebarContent />
                </Offcanvas.Body>
            </Offcanvas>

            <div className="dashboard-content flex-grow-1 w-100">
                <Navbar bg="white" className="shadow-sm px-3 py-3 justify-content-between sticky-top">
                     <div className="d-flex align-items-center">
                        <Button variant="link" className="navbar-toggle-btn text-dark p-0 me-3" onClick={handleShowMobileMenu}>
                            <FaBars size={24} color={theme.primaryBlue} />
                        </Button>
                        <span className="d-lg-none fw-bold" style={{ color: theme.primaryBlue }}>PCSHS HeartCare</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-end w-100">
                        <div className="me-4 position-relative d-none d-md-block">
                             <input type="text" placeholder="ค้นหา..." className="form-control rounded-pill px-4 bg-light border-0" style={{ width: '250px' }} />
                             <FaSearch className="text-muted position-absolute" style={{ top: '10px', right: '15px' }} />
                        </div>
                        <div className="d-flex align-items-center text-dark" style={{ cursor: 'pointer' }}>
                            <div className="text-end me-2 d-none d-sm-block">
                                <div className="fw-bold" style={{ fontSize: '0.9rem' }}>นักจิตวิทยา</div>
                                <div className="small text-muted" style={{ fontSize: '0.75rem' }}>ออนไลน์</div>
                            </div>
                            <div className="bg-light rounded-circle p-1">
                                <FaUserCircle size={36} color={theme.primaryBlue} />
                            </div>
                        </div>
                    </div>
                </Navbar>

                <Container fluid className="p-3 p-md-4">
                    {renderContent()}
                </Container>
            </div>
        </div>
    );
};

export default PsychologistDashboard;