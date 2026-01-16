import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Button, Card, Row, Col, Nav, Navbar, Offcanvas, Badge, Image, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
    FaHome, FaCalendarAlt, FaList, FaSignOutAlt, 
    FaUserEdit, FaClock, FaBars, FaUserCircle,
    FaCalendarCheck, FaStethoscope, FaClipboardCheck, FaSearch, FaBullhorn,
    FaDatabase, FaCheckCircle, FaHourglassHalf, FaTimesCircle
} from 'react-icons/fa';

import './Psychologist.css';

// Import Components
import AppointmentManager from './AppointmentManager'; 
import ScheduleManager from './ScheduleManager'; 
import AllAppointmentList from './AllAppointmentList'; 
import ProfileEditor from './ProfileEditor';
import NewsManagement from './NewsManagement'; 
import pcshsLogo from '../../assets/pcshs_logo.png'; 

const PsychologistDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard'); 
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    
    // ข้อมูลส่วนตัว
    const [psychologist, setPsychologist] = useState({
        fullname: 'กำลังโหลด...', 
        profile_image: ''
    });

    // ✅ State สำหรับเก็บสถิติจริง
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        pending: 0,
        cancelled: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            handleLogout();
            return;
        }
        
        fetchProfile(token);
        fetchStats(token); // ดึงข้อมูลสถิติเมื่อโหลดหน้า
    }, [activeTab]);

    const fetchProfile = async (token) => {
        try {
            const res = await axios.get('http://localhost:5000/api/profile/me', {
                headers: { 'x-auth-token': token }
            });
            setPsychologist(res.data);
        } catch (err) { console.error("Profile Error", err); }
    };

    // ✅ ฟังก์ชันดึงและคำนวณสถิติ
    const fetchStats = async (token) => {
        try {
            const res = await axios.get('http://localhost:5000/api/appointments/psychologist-history', {
                headers: { 'x-auth-token': token }
            });
            const data = res.data;
            
            setStats({
                total: data.length,
                completed: data.filter(a => a.status === 'Completed').length,
                pending: data.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length,
                cancelled: data.filter(a => a.status === 'Cancelled').length
            });
            setLoadingStats(false);
        } catch (err) {
            console.error("Stats Error", err);
            setLoadingStats(false);
        }
    };

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
                {[
                    { id: 'dashboard', icon: FaHome, label: 'หน้าหลัก' },
                    { id: 'appointments', icon: FaCalendarAlt, label: 'จัดการนัดหมาย' },
                    { id: 'news', icon: FaBullhorn, label: 'ประกาศข่าวสาร' },
                    { id: 'all-list', icon: FaList, label: 'ประวัติทั้งหมด' },
                    { id: 'schedule', icon: FaClock, label: 'ตั้งค่าตารางเวลา' },
                    { id: 'profile', icon: FaUserEdit, label: 'ข้อมูลส่วนตัว' }
                ].map((item) => (
                    <div key={item.id} onClick={() => handleMenuClick(item.id)} className={`nav-item-custom ${activeTab === item.id ? 'active' : ''}`}>
                        <item.icon className="me-3" /> {item.label}
                    </div>
                ))}
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
                        {/* Hero Section */}
                        <div className="hero-welcome p-4 p-lg-5 mb-5 d-flex align-items-center justify-content-between shadow-lg" style={{borderRadius: '24px'}}>
                            <div className="hero-bg-pattern"></div>
                            <div className="position-relative z-1">
                                <Badge bg="warning" text="dark" className="mb-2 px-3 rounded-pill fw-bold">Psychologist Panel</Badge>
                                <h1 className="fw-title display-5 fw-bold mb-2 text-white">สวัสดี, {psychologist.fullname}</h1>
                                <p className="text-white-50 mb-4 fw-light lead" style={{maxWidth: '600px'}}>
                                    ยินดีต้อนรับสู่ระบบบริหารจัดการงานจิตวิทยา <br/>โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย
                                </p>
                                <Button className="btn-pcshs shadow-lg px-4 py-2" onClick={() => handleMenuClick('appointments')}>
                                    <FaCalendarCheck className="me-2"/> ตรวจสอบนัดหมายวันนี้
                                </Button>
                            </div>
                            <div className="d-none d-md-block hero-logo-container">
                                <img src={pcshsLogo} alt="Logo" className="hero-logo-img" />
                                <FaStethoscope size={200} style={{ position: 'absolute', right: '-40px', opacity: 0.05, color: 'white', transform: 'rotate(-20deg)', zIndex: -1 }} />
                            </div>
                        </div>

                        {/* ✅ Section สถิติ (ดีไซน์ใหม่เหมือนหน้า Archive) */}
                        <div className="px-2">
                            <h4 className="fw-bold mb-4" style={{color: 'var(--pcshs-blue-deep)'}}>ภาพรวมสถิติการดำเนินงาน</h4>
                            <Row className="g-4 mb-4">
                                {[
                                    { title: "บันทึกทั้งหมด", count: stats.total, unit: "รายการ", icon: <FaDatabase/>, type: "stat-navy" },
                                    { title: "ดำเนินการสำเร็จ", count: stats.completed, unit: "รายการ", icon: <FaCheckCircle/>, type: "stat-success" },
                                    { title: "รอพบ / ยืนยันแล้ว", count: stats.pending, unit: "รายการ", icon: <FaHourglassHalf/>, type: "stat-warning" },
                                    { title: "ยกเลิก / ไม่มา", count: stats.cancelled, unit: "รายการ", icon: <FaTimesCircle/>, type: "stat-danger" }
                                ].map((item, idx) => (
                                    <Col xs={12} sm={6} lg={3} key={idx}>
                                        <Card className={`premium-stat-card ${item.type}`}>
                                            <div className="stat-bg-icon">{item.icon}</div>
                                            <div className="stat-content">
                                                <div className="stat-top-label">{item.title}</div>
                                                <div className="stat-value-huge">
                                                    {loadingStats ? <Spinner animation="border" size="sm" /> : item.count}
                                                </div>
                                                <span className="stat-unit-pill">{item.unit}</span>
                                            </div>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    </div>
                );
            case 'appointments': return <AppointmentManager />;
            case 'news': return <NewsManagement />;
            case 'schedule': return <ScheduleManager />;
            case 'all-list': return <AllAppointmentList />;
            case 'profile': return <ProfileEditor />;
            default: return null;
        }
    };

    return (
        <div className="dashboard-wrapper">
            <div className="pcshs-sidebar d-none d-lg-block shadow"><SidebarContent /></div>
            <Offcanvas show={showMobileMenu} onHide={() => setShowMobileMenu(false)} className="offcanvas-custom text-white" style={{ width: '280px' }}>
                <Offcanvas.Header closeButton closeVariant="white" /><Offcanvas.Body className="p-0"><SidebarContent /></Offcanvas.Body>
            </Offcanvas>
            <div className="main-content d-flex flex-column" style={{ marginLeft: window.innerWidth > 992 ? '280px' : '0' }}>
                <Navbar className="navbar-modern justify-content-between shadow-sm px-4 py-3">
                    <div className="d-flex align-items-center">
                        <Button variant="link" className="d-lg-none text-dark p-0 me-3" onClick={() => setShowMobileMenu(true)}><FaBars size={24}/></Button>
                        <h5 className="fw-title mb-0 text-dark d-none d-sm-block">
                            <span style={{color: 'var(--pcshs-blue-deep)'}}>Psychologist</span> Workspace
                        </h5>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <div className="text-end d-none d-md-block line-height-sm">
                            <div className="fw-bold text-dark" style={{fontSize: '0.9rem'}}>{psychologist.fullname}</div>
                            <small className="text-success fw-bold" style={{fontSize: '0.75rem'}}>● Online</small>
                        </div>
                        <div className="position-relative cursor-pointer">
                            {psychologist.profile_image ? (
                                <Image src={psychologist.profile_image} roundedCircle style={{width: '40px', height: '40px', objectFit: 'cover', border: '2px solid var(--pcshs-blue-deep)'}} />
                            ) : (
                                <FaUserCircle size={40} color="var(--pcshs-blue-deep)" />
                            )}
                            <span className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle p-1"></span>
                        </div>
                    </div>
                </Navbar>
                <Container fluid className="p-4 flex-grow-1" style={{background: '#f0f4f8'}}>{renderContent()}</Container>
            </div>
        </div>
    );
};

export default PsychologistDashboard;