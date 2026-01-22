import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Button, Card, Row, Col, Nav, Navbar, Offcanvas, Badge, Image, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
    FaHome, FaSignOutAlt, FaBars, FaUserCircle,
    FaUserGraduate, FaChalkboardTeacher, FaNewspaper, FaChartPie,
    FaUserMd, FaClipboardList, FaCalendarCheck
} from 'react-icons/fa';

// ใช้ CSS เดียวกัน หรือแยกไฟล์ก็ได้ (แนะนำให้สร้าง Admin.css โดย copy มาจาก Psychologist.css)
import './AdminDashboard.css'; 

// Import Components (สมมติว่าคุณแยกไฟล์ไว้แล้ว)
// ถ้ายังไม่ได้แยก สามารถเขียน Inline ใน renderContent ได้ แต่เพื่อความสวยงามผมจะทำแบบ Component
import UserManagement from './UserManagement'; // ต้องมีไฟล์นี้ (ตารางจัดการผู้ใช้)
import NewsManagement from '../psychologist/NewsManagement'; // ใช้ร่วมกันได้
import pcshsLogo from '../../assets/pcshs_logo.png'; 

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard'); 
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    
    // ข้อมูลส่วนตัว Admin
    const [adminProfile, setAdminProfile] = useState({
        fullname: 'Administrator', 
        profile_image: ''
    });

    // State สำหรับเก็บสถิติ Admin
    const [stats, setStats] = useState({
        total_students: 0,
        pending_assessments: 0,
        confirmed_appointments: 0,
        pending_psychologists: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            handleLogout();
            return;
        }
        
        fetchProfile(token);
        fetchStats(token);
    }, [activeTab]);

    const fetchProfile = async (token) => {
        try {
            const res = await axios.get('http://localhost:5000/api/profile/me', {
                headers: { 'x-auth-token': token }
            });
            setAdminProfile(res.data);
        } catch (err) { console.error("Profile Error", err); }
    };

    const fetchStats = async (token) => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/summary', {
                headers: { 'x-auth-token': token }
            });
            setStats(res.data);
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

    // --- Sidebar Component ---
    const SidebarContent = () => (
        <div className="d-flex flex-column h-100">
            <div className="logo-section">
                <img src={pcshsLogo} alt="PCSHS Logo" className="pcshs-logo-glow" />
                <h6 className="school-name mb-0">PCSHS Admin</h6>
                <div style={{ width: '40px', height: '2px', background: '#F25C05', margin: '8px auto', borderRadius: '2px' }}></div>
                <small className="text-white-50" style={{fontSize: '0.75rem', fontWeight: 300}}>แผงควบคุมผู้ดูแลระบบ</small>
            </div>
            <Nav className="flex-column w-100 mt-3 px-2">
                {[
                    { id: 'dashboard', icon: FaHome, label: 'ภาพรวมระบบ' },
                    { id: 'users', icon: FaUserGraduate, label: 'จัดการผู้ใช้งาน' },
                    { id: 'news', icon: FaNewspaper, label: 'จัดการข่าวสาร' },
                    // { id: 'reports', icon: FaChartPie, label: 'รายงานสถิติ' } // เพิ่มในอนาคต
                ].map((item) => (
                    <div key={item.id} onClick={() => handleMenuClick(item.id)} className={`nav-item-custom ${activeTab === item.id ? 'active' : ''}`}>
                        <item.icon className="me-3" /> {item.label}
                    </div>
                ))}
            </Nav>
            <div className="mt-auto p-4 border-top border-secondary border-opacity-25">
                <Button variant="link" onClick={handleLogout} className="text-white-50 text-decoration-none p-0 d-flex align-items-center hover-danger">
                    <FaSignOutAlt className="me-2" /> ออกจากระบบ
                </Button>
            </div>
        </div>
    );

    // --- Content Switcher ---
    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="fade-in">
                        {/* Hero Section */}
                        <div className="hero-welcome p-4 p-lg-5 mb-5 d-flex align-items-center justify-content-between shadow-lg" 
                             style={{borderRadius: '24px', background: 'linear-gradient(135deg, #003566 0%, #001d36 100%)'}}>
                            <div className="hero-bg-pattern"></div>
                            <div className="position-relative z-1">
                                <Badge bg="danger" text="white" className="mb-2 px-3 rounded-pill fw-bold">Super Admin</Badge>
                                <h1 className="fw-title display-5 fw-bold mb-2 text-white">สวัสดี, {adminProfile.fullname}</h1>
                                <p className="text-white-50 mb-4 fw-light lead" style={{maxWidth: '600px'}}>
                                    ควบคุมและจัดการระบบดูแลช่วยเหลือนักเรียน <br/> โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย
                                </p>
                                <Button className="btn-pcshs shadow-lg px-4 py-2" onClick={() => handleMenuClick('users')} 
                                        style={{background: '#F25C05', border:'none'}}>
                                    <FaChalkboardTeacher className="me-2"/> จัดการผู้ใช้งาน
                                </Button>
                            </div>
                            <div className="d-none d-md-block hero-logo-container">
                                <img src={pcshsLogo} alt="Logo" className="hero-logo-img" />
                                <FaChartPie size={200} style={{ position: 'absolute', right: '-40px', opacity: 0.05, color: 'white', transform: 'rotate(-20deg)', zIndex: -1 }} />
                            </div>
                        </div>

                        {/* Stats Section */}
                        <div className="px-2">
                            <h4 className="fw-bold mb-4" style={{color: '#003566'}}>สถานะระบบปัจจุบัน</h4>
                            <Row className="g-4 mb-4">
                                {[
                                    { title: "นักเรียนทั้งหมด", count: stats.total_students, unit: "คน", icon: <FaUserGraduate/>, type: "stat-navy" },
                                    { title: "บุคลากร/นักจิตฯ", count: stats.pending_psychologists, unit: "คน", icon: <FaUserMd/>, type: "stat-info" }, // ใช้ pending_psychologists แทนจำนวนรวมไปก่อนตาม API ที่มี
                                    { title: "นัดหมายยืนยัน", count: stats.confirmed_appointments, unit: "รายการ", icon: <FaCalendarCheck/>, type: "stat-success" },
                                    { title: "แบบประเมินรอตรวจ", count: stats.pending_assessments, unit: "รายการ", icon: <FaClipboardList/>, type: "stat-warning" }
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
            case 'users': return <UserManagement />; // เรียกใช้ Component ตารางผู้ใช้ที่เราเคยทำ
            case 'news': return <NewsManagement />; // ใช้ NewsManagement เดิมได้เลย
            default: return null;
        }
    };

    return (
        <div className="dashboard-wrapper">
            <div className="pcshs-sidebar d-none d-lg-block shadow"><SidebarContent /></div>
            
            <Offcanvas show={showMobileMenu} onHide={() => setShowMobileMenu(false)} className="offcanvas-custom text-white" style={{ width: '280px', background: '#003566' }}>
                <Offcanvas.Header closeButton closeVariant="white" />
                <Offcanvas.Body className="p-0"><SidebarContent /></Offcanvas.Body>
            </Offcanvas>

            <div className="main-content d-flex flex-column" style={{ marginLeft: window.innerWidth > 992 ? '280px' : '0' }}>
                <Navbar className="navbar-modern justify-content-between shadow-sm px-4 py-3">
                    <div className="d-flex align-items-center">
                        <Button variant="link" className="d-lg-none text-dark p-0 me-3" onClick={() => setShowMobileMenu(true)}><FaBars size={24}/></Button>
                        <h5 className="fw-title mb-0 text-dark d-none d-sm-block">
                            <span style={{color: '#003566'}}>Admin</span> Console
                        </h5>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <div className="text-end d-none d-md-block line-height-sm">
                            <div className="fw-bold text-dark" style={{fontSize: '0.9rem'}}>{adminProfile.fullname}</div>
                            <small className="text-danger fw-bold" style={{fontSize: '0.75rem'}}>● System Admin</small>
                        </div>
                        <div className="position-relative cursor-pointer">
                            {adminProfile.profile_image ? (
                                <Image src={adminProfile.profile_image} roundedCircle style={{width: '40px', height: '40px', objectFit: 'cover', border: '2px solid #003566'}} />
                            ) : (
                                <FaUserCircle size={40} color="#003566" />
                            )}
                            <span className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle p-1"></span>
                        </div>
                    </div>
                </Navbar>
                
                <Container fluid className="p-4 flex-grow-1" style={{background: '#f0f4f8'}}>
                    {renderContent()}
                </Container>
            </div>
        </div>
    );
};

export default AdminDashboard;