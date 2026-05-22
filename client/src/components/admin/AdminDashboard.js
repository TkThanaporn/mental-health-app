import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Button, Card, Row, Col, Nav, Navbar, Offcanvas, Badge, Image, Spinner, Form, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
    FaHome, FaSignOutAlt, FaBars, FaUserCircle,
    FaUserGraduate, FaChalkboardTeacher, FaNewspaper, FaChartPie,
    FaUserMd, FaCalendarCheck, FaUserShield, FaFileExcel, FaPrint // ✅ นำเข้า FaUserShield เพิ่ม
} from 'react-icons/fa';
import { FaFilter, FaUsers } from 'react-icons/fa';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

import './AdminDashboard.css'; 

import UserManagement from './UserManagement'; 
import NewsManagement from '../psychologist/NewsManagement'; 
import AdminProfile from './AdminProfile'; // ✅ 1. นำเข้า Component หน้าจัดการโปรไฟล์ที่เราเพิ่งสร้าง
import pcshsLogo from '../../assets/pcshs_logo.png'; 

const ROLE_COLORS = {
    Student: '#003566',
    Psychologist: '#0ea5e9',
    Admin: '#F25C05'
};

const CHART_COLORS = {
    line: '#F25C05',
    bar: '#003566',
    grade: '#0ea5e9',
    grid: '#e2e8f0'
};

const DASHBOARD_FALLBACK_YEARS = [...new Set([new Date().getFullYear(), 2025])].sort((a, b) => b - a);

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
        selectedYear: new Date().getFullYear(),
        availableYears: DASHBOARD_FALLBACK_YEARS,
        total_users: 0,
        total_students: 0,
        total_admins: 0,
        pending_assessments: 0,
        confirmed_appointments: 0,
        yearly_appointments: 0,
        pending_psychologists: 0,
        roleSummary: [],
        monthlyConsultations: [],
        dormitoryUsage: [],
        gradeUsage: []
    });
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [loadingStats, setLoadingStats] = useState(true);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            handleLogout();
            return;
        }
        
        fetchProfile(token);
        fetchStats(token);
    }, [activeTab, selectedYear]);

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
            setLoadingStats(true);
            const res = await axios.get(`http://localhost:5000/api/admin/summary?year=${selectedYear}`, {
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

    const handleExportExcel = async () => {
        const token = localStorage.getItem('token');
        if (!token) return handleLogout();

        try {
            setExporting(true);
            const res = await axios.get(`http://localhost:5000/api/admin/export/excel?year=${selectedYear}`, {
                headers: { 'x-auth-token': token },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.ms-excel' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `pcshs-heartcare-report-${selectedYear}.xls`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export Excel Error", err);
            alert('ไม่สามารถสร้างไฟล์ Excel ได้');
        } finally {
            setExporting(false);
        }
    };

    const handleOpenPrintableReport = async () => {
        const token = localStorage.getItem('token');
        if (!token) return handleLogout();

        try {
            setExporting(true);
            const res = await axios.get(`http://localhost:5000/api/admin/export/report?year=${selectedYear}`, {
                headers: { 'x-auth-token': token },
                responseType: 'text'
            });

            const reportWindow = window.open('', '_blank');
            if (!reportWindow) {
                alert('กรุณาอนุญาต pop-up เพื่อเปิดรายงาน');
                return;
            }
            reportWindow.document.open();
            reportWindow.document.write(res.data);
            reportWindow.document.close();
        } catch (err) {
            console.error("Printable Report Error", err);
            alert('ไม่สามารถเปิดรายงานได้');
        } finally {
            setExporting(false);
        }
    };

    const availableYears = [...new Set([
        ...(stats.availableYears?.length ? stats.availableYears : DASHBOARD_FALLBACK_YEARS),
        selectedYear
    ].map(Number))].sort((a, b) => b - a);
    const roleChartData = stats.roleSummary?.length ? stats.roleSummary : [
        { role: 'Student', label: 'นักเรียน', count: 0 },
        { role: 'Psychologist', label: 'นักจิตวิทยา', count: 0 },
        { role: 'Admin', label: 'ผู้ดูแลระบบ', count: 0 }
    ];
    const monthlyChartData = stats.monthlyConsultations || [];
    const dormitoryChartData = stats.dormitoryUsage?.length ? stats.dormitoryUsage : [{ dormitory: 'ไม่มีข้อมูล', count: 0 }];
    const gradeChartData = stats.gradeUsage?.length ? stats.gradeUsage : ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'].map((grade) => ({ grade, count: 0 }));
    const roleTotal = roleChartData.reduce((sum, item) => sum + Number(item.count || 0), 0);

    const chartTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="chart-tooltip">
                <div className="fw-bold">{label || payload[0].name}</div>
                <div>{payload[0].value} คน/รายการ</div>
            </div>
        );
    };

    // --- Sidebar Component ---//
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
                    { id: 'profile', icon: FaUserShield, label: 'โปรไฟล์ของฉัน' } // ✅ 2. เพิ่มเมนูจัดการโปรไฟล์ใน Sidebar
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
                            <div className="dashboard-section-heading mb-4">
                                <div>
                                    <h4 className="fw-bold mb-1" style={{color: '#003566'}}>สถานะระบบปัจจุบัน</h4>
                                    <p className="text-muted mb-0">เลือกปีเพื่อดูแนวโน้มคำขอและกลุ่มนักเรียนที่ใช้บริการ</p>
                                </div>
                                <div className="year-filter">
                                    <FaFilter className="text-orange" />
                                    <Form.Select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="year-select shadow-none"
                                        aria-label="เลือกปีข้อมูล"
                                    >
                                        {availableYears.map((year) => (
                                            <option key={year} value={year}>ปี {year}</option>
                                        ))}
                                    </Form.Select>
                                </div>
                                <Dropdown align="end" className="export-dropdown">
                                    <Dropdown.Toggle className="export-toggle" disabled={exporting}>
                                        {exporting ? <Spinner animation="border" size="sm" className="me-2" /> : <FaPrint className="me-2" />}
                                        Export รายงาน
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className="export-menu shadow-sm border-0">
                                        <Dropdown.Item onClick={handleExportExcel}>
                                            <FaFileExcel className="me-2 text-success" /> Excel (.xls)
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={handleOpenPrintableReport}>
                                            <FaPrint className="me-2 text-orange" /> พิมพ์ / Save as PDF
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                            <Row className="g-4 mb-4">
                                {[
                                    { title: "ผู้ใช้ทั้งหมด", count: stats.total_users, unit: "คน", icon: <FaUsers/>, type: "stat-navy" },
                                    { title: "นักเรียนทั้งหมด", count: stats.total_students, unit: "คน", icon: <FaUserGraduate/>, type: "stat-info" },
                                    { title: `คำขอปี ${selectedYear}`, count: stats.yearly_appointments, unit: "รายการ", icon: <FaCalendarCheck/>, type: "stat-success" },
                                    { title: "นักจิตวิทยา", count: stats.pending_psychologists, unit: "คน", icon: <FaUserMd/>, type: "stat-warning" }
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
                            <Row className="g-4 mb-4">
                                <Col xs={12} xl={5}>
                                    <Card className="dashboard-chart-card">
                                        <div className="chart-card-header">
                                            <div>
                                                <h5>สัดส่วนผู้ใช้งานทั้งหมด</h5>
                                                {/* นับจาก role ในตาราง users */}
                                                <p>จำนวนผู้ใช้งานทั้งหมด</p>
                                            </div>
                                            <span className="chart-total-pill">{roleTotal} คน</span>
                                        </div>
                                        <div className="donut-chart-wrap">
                                            {loadingStats ? (
                                                <div className="chart-loading"><Spinner animation="border" /></div>
                                            ) : (
                                                <ResponsiveContainer width="100%" height={280}>
                                                    <PieChart>
                                                        <Pie
                                                            data={roleChartData}
                                                            dataKey="count"
                                                            nameKey="label"
                                                            innerRadius={72}
                                                            outerRadius={105}
                                                            paddingAngle={4}
                                                        >
                                                            {roleChartData.map((entry) => (
                                                                <Cell key={entry.role} fill={ROLE_COLORS[entry.role] || '#64748b'} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip content={chartTooltip} />
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            )}
                                            <div className="donut-center-label">
                                                <strong>{roleTotal}</strong>
                                                <span>ผู้ใช้ทั้งหมด</span>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                                <Col xs={12} xl={7}>
                                    <Card className="dashboard-chart-card">
                                        <div className="chart-card-header">
                                            <div>
                                                <h5>จำนวนผู้ขอรับคำปรึกษารายเดือน</h5>
                                                <p>แสดง 12 เดือนของปี {selectedYear}</p>
                                            </div>
                                        </div>
                                        {loadingStats ? (
                                            <div className="chart-loading"><Spinner animation="border" /></div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={320}>
                                                <LineChart data={monthlyChartData} margin={{ top: 12, right: 18, bottom: 4, left: -12 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                                                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                                                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                                                    <Tooltip content={chartTooltip} />
                                                    <Line type="monotone" dataKey="count" name="คำขอ" stroke={CHART_COLORS.line} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        )}
                                    </Card>
                                </Col>
                            </Row>

                            <Row className="g-4">
                                <Col xs={12} xl={6}>
                                    <Card className="dashboard-chart-card">
                                        <div className="chart-card-header">
                                            <div>
                                                <h5>หอพักที่ใช้บริการมากที่สุด</h5>
                                                {/* นับนักเรียนไม่ซ้ำที่มีคำขอในปี */}
                                                <p>จำนวนนักเรียนที่มีคำขอในปี {selectedYear}</p>
                                            </div>
                                        </div>
                                        {loadingStats ? (
                                            <div className="chart-loading"><Spinner animation="border" /></div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={330}>
                                                <BarChart data={dormitoryChartData} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 52 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
                                                    <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                                                    <YAxis type="category" dataKey="dormitory" width={96} tickLine={false} axisLine={false} />
                                                    <Tooltip content={chartTooltip} />
                                                    <Bar dataKey="count" name="นักเรียน" fill={CHART_COLORS.bar} radius={[0, 8, 8, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </Card>
                                </Col>
                                <Col xs={12} xl={6}>
                                    <Card className="dashboard-chart-card">
                                        <div className="chart-card-header">
                                            <div>
                                                <h5>ระดับชั้นที่ใช้บริการมากที่สุด</h5>
                                                {/* ม.1 ถึง ม.6 นับนักเรียนไม่ซ้ำในปี */}
                                                <p>จำนวนนักเรียน ม.1 ถึง ม.6 ในปี {selectedYear}</p>
                                            </div>
                                        </div>
                                        {loadingStats ? (
                                            <div className="chart-loading"><Spinner animation="border" /></div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={330}>
                                                <BarChart data={gradeChartData} margin={{ top: 8, right: 18, bottom: 4, left: -12 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                                                    <XAxis dataKey="grade" tickLine={false} axisLine={false} />
                                                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                                                    <Tooltip content={chartTooltip} />
                                                    <Bar dataKey="count" name="นักเรียน" fill={CHART_COLORS.grade} radius={[8, 8, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </Card>
                                </Col>
                            </Row>
                        </div>
                    </div>
                );
            case 'users': return <UserManagement />; 
            case 'news': return <NewsManagement />; 
            case 'profile': return <AdminProfile />; // ✅ 3. ผูกคำสั่งเมื่อกดแท็บ 'profile' ให้ดึงหน้า AdminProfile มาแสดง
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

            <div className="main-content d-flex flex-column">
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
                        {/* ✅ 4. เพิ่ม onClick ที่รูปโปรไฟล์ด้านบนขวา ให้คลิกแล้วเปิดหน้าโปรไฟล์ได้ด้วย */}
                        <div className="position-relative cursor-pointer" onClick={() => handleMenuClick('profile')} style={{cursor: 'pointer'}}>
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
