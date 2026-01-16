import React, { useState } from 'react';
import { Container, Button, Card, Row, Col, Nav, Navbar, Offcanvas, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
    FaHome, FaCalendarAlt, FaList, FaSignOutAlt, 
    FaUserEdit, FaClock, FaBars, FaUserCircle,
    FaCalendarCheck, FaStethoscope, FaClipboardCheck, FaSearch, FaBullhorn
} from 'react-icons/fa';

import './Psychologist.css';

// Import Components
import AppointmentManager from './AppointmentManager'; 
import ScheduleManager from './ScheduleManager'; 
import AllAppointmentList from './AllAppointmentList'; 
import ProfileEditor from './ProfileEditor';
import NewsManagement from './NewsManagement'; // ✅ Import component ใหม่
import pcshsLogo from '../../assets/pcshs_logo.png'; 

const PsychologistDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard'); 
    const [showMobileMenu, setShowMobileMenu] = useState(false);

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

    const SidebarContent = () => (
        <div className="d-flex flex-column h-100">
            <div className="logo-section">
                <img src={pcshsLogo} alt="PCSHS Logo" className="pcshs-logo-glow" />
                <h6 className="school-name mb-0">PCSHS HeartCare</h6>
                <div style={{ width: '40px', height: '2px', background: 'var(--pcshs-orange)', margin: '8px auto', borderRadius: '2px' }}></div>
                <small className="text-white-50" style={{fontSize: '0.75rem', fontWeight: 300}}>ระบบดูแลช่วยเหลือนักเรียน</small>
            </div>
            <Nav className="flex-column w-100 mt-3 px-2">
                <div onClick={() => handleMenuClick('dashboard')} className={`nav-item-custom ${activeTab === 'dashboard' ? 'active' : ''}`}><FaHome className="me-3" /> หน้าหลัก</div>
                <div onClick={() => handleMenuClick('appointments')} className={`nav-item-custom ${activeTab === 'appointments' ? 'active' : ''}`}><FaCalendarAlt className="me-3" /> จัดการนัดหมาย</div>
                <div onClick={() => handleMenuClick('news')} className={`nav-item-custom ${activeTab === 'news' ? 'active' : ''}`}><FaBullhorn className="me-3" /> ประกาศข่าวสาร</div>
                <div onClick={() => handleMenuClick('all-list')} className={`nav-item-custom ${activeTab === 'all-list' ? 'active' : ''}`}><FaList className="me-3" /> ประวัติทั้งหมด</div>
                <div onClick={() => handleMenuClick('schedule')} className={`nav-item-custom ${activeTab === 'schedule' ? 'active' : ''}`}><FaClock className="me-3" /> ตั้งค่าตารางเวลา</div>
                <div onClick={() => handleMenuClick('profile')} className={`nav-item-custom ${activeTab === 'profile' ? 'active' : ''}`}><FaUserEdit className="me-3" /> ข้อมูลส่วนตัว</div>
            </Nav>
            <div className="mt-auto p-4 border-top border-secondary border-opacity-25">
                <Button variant="link" onClick={handleLogout} className="text-white-50 text-decoration-none p-0 d-flex align-items-center hover-danger"><FaSignOutAlt className="me-2" /> ออกจากระบบ</Button>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="fade-in">
                        <div className="hero-welcome p-4 p-lg-5 mb-4 d-flex align-items-center justify-content-between">
                            <div className="hero-bg-pattern"></div>
                            <div className="position-relative z-1">
                                <Badge bg="warning" text="dark" className="mb-2 px-3 rounded-pill fw-bold">Psychologist Panel</Badge>
                                <h1 className="fw-title display-6 fw-bold mb-2">สวัสดี, {psychologistName}</h1>
                                <p className="text-white-50 mb-4 fw-light" style={{maxWidth: '550px'}}>ยินดีต้อนรับสู่ระบบบริหารจัดการงานจิตวิทยา</p>
                                <Button className="btn-pcshs shadow-lg" onClick={() => handleMenuClick('appointments')}><FaCalendarCheck className="me-2"/> ตรวจสอบนัดหมายวันนี้</Button>
                            </div>
                            <div className="d-none d-md-block hero-logo-container">
                                <img src={pcshsLogo} alt="Logo" className="hero-logo-img" />
                                <FaStethoscope size={200} style={{ position: 'absolute', right: '-40px', opacity: 0.05, color: 'white', transform: 'rotate(-20deg)', zIndex: -1 }} />
                            </div>
                        </div>
                        {/* Stats & Activity (ย่อไว้เพื่อประหยัดพื้นที่) */}
                        <Row className="g-4 mb-4">
                            <Col md={4}><Card className="stat-card shadow-sm"><Card.Body className="d-flex align-items-center p-4"><div className="stat-icon-wrapper bg-blue-soft"><FaClock /></div><div><small className="text-muted fw-bold">รอยืนยัน</small><h2 className="mb-0 fw-bold">5</h2></div></Card.Body></Card></Col>
                            <Col md={4}><Card className="stat-card shadow-sm"><Card.Body className="d-flex align-items-center p-4"><div className="stat-icon-wrapper bg-orange-soft"><FaCalendarAlt /></div><div><small className="text-muted fw-bold">นัดวันนี้</small><h2 className="mb-0 fw-bold">3</h2></div></Card.Body></Card></Col>
                            <Col md={4}><Card className="stat-card shadow-sm"><Card.Body className="d-flex align-items-center p-4"><div className="stat-icon-wrapper bg-green-soft"><FaClipboardCheck /></div><div><small className="text-muted fw-bold">สำเร็จแล้ว</small><h2 className="mb-0 fw-bold">128</h2></div></Card.Body></Card></Col>
                        </Row>
                    </div>
                );
            case 'appointments': return <AppointmentManager />;
            case 'news': return <NewsManagement />; // ✅ เรียกใช้ NewsManagement
            case 'schedule': return <ScheduleManager />;
            case 'all-list': return <AllAppointmentList />;
            case 'profile': return <ProfileEditor />;
            default: return null;
        }
    };

    return (
        <div className="dashboard-wrapper">
            <div className="pcshs-sidebar d-none d-lg-block"><SidebarContent /></div>
            <Offcanvas show={showMobileMenu} onHide={() => setShowMobileMenu(false)} className="offcanvas-custom text-white" style={{ width: '280px' }}>
                <Offcanvas.Header closeButton closeVariant="white" /><Offcanvas.Body className="p-0"><SidebarContent /></Offcanvas.Body>
            </Offcanvas>
            <div className="main-content d-flex flex-column">
                <Navbar className="navbar-modern justify-content-between">
                    <div className="d-flex align-items-center">
                        <Button variant="link" className="d-lg-none text-dark p-0 me-3" onClick={() => setShowMobileMenu(true)}><FaBars size={24}/></Button>
                        <h5 className="fw-title mb-0 text-dark d-none d-sm-block"><span style={{color: 'var(--pcshs-blue-deep)'}}>Psychologist</span> Workspace</h5>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <div className="text-end d-none d-md-block line-height-sm"><div className="fw-bold text-dark" style={{fontSize: '0.9rem'}}>{psychologistName}</div><small className="text-success fw-bold" style={{fontSize: '0.75rem'}}>● Online</small></div>
                        <div className="position-relative cursor-pointer"><FaUserCircle size={40} color="var(--pcshs-blue-deep)" /><span className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle p-1"></span></div>
                    </div>
                </Navbar>
                <Container fluid className="p-4 flex-grow-1">{renderContent()}</Container>
            </div>
        </div>
    );
};

export default PsychologistDashboard;