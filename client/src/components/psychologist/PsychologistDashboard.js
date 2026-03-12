import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Button, Card, Row, Col, Nav, Navbar, Offcanvas, Badge, Image, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
    FaHome, FaCalendarAlt, FaList, FaSignOutAlt, 
    FaUserEdit, FaClock, FaBars, FaUserCircle,
    FaCalendarCheck, FaStethoscope, FaBullhorn,
    FaDatabase, FaCheckCircle, FaHourglassHalf, FaTimesCircle, FaClipboardCheck
} from 'react-icons/fa';

// Import Recharts (เอา Radar ออกไปแล้ว)
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

import './Psychologist.css';

// Components
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
    
    const [psychologist, setPsychologist] = useState({ fullname: 'กำลังโหลด...', profile_image: '' });
    
    // States สำหรับเก็บข้อมูลสถิติและกราฟ
    const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, cancelled: 0 });
    const [chartData, setChartData] = useState({ monthlyTrends: [], issueCategories: [] });
    
    // 🌟 State ข้อมูลแบบประเมิน (เปลี่ยนเป็น riskLevels รวม และ monthlyRisks รายเดือน)
    const [assessmentData, setAssessmentData] = useState({ riskLevels: [], monthlyRisks: [] });
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            handleLogout();
            return;
        }
        fetchProfile(token);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) fetchDashboardData(token);
    }, [activeTab]);

    const fetchProfile = async (token) => {
        try {
            const res = await axios.get('http://localhost:5000/api/profile/me', {
                headers: { 'x-auth-token': token }
            });
            setPsychologist(res.data);
        } catch (err) { 
            if (err.response && (err.response.status === 401 || err.response.status === 403)) handleLogout();
        }
    };

    // 🌟 ดึงข้อมูลและประมวลผลสำหรับ Dashboard (Real Data 100%)
    const fetchDashboardData = async (token) => {
        setLoadingStats(true);
        try {
            const config = { headers: { 'x-auth-token': token } };
            
            const [apptRes, assessRes] = await Promise.all([
                axios.get('http://localhost:5000/api/appointments/psychologist-history', config).catch(() => ({data: []})),
                axios.get('http://localhost:5000/api/assessments/all', config).catch(() => ({data: []})) 
            ]);

            const apptData = apptRes.data; 
            const assessData = assessRes.data;

            // ==========================================
            // 1. จัดการข้อมูลการนัดหมาย (Appointments)
            // ==========================================
            setStats({
                total: apptData.length,
                completed: apptData.filter(a => a.status === 'Completed').length,
                pending: apptData.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length,
                cancelled: apptData.filter(a => a.status === 'Cancelled').length
            });

            const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
            const currentMonth = new Date().getMonth(); 
            const currentYear = new Date().getFullYear();
            
            let trendsMap = {};
            // สร้างโครงสร้าง 6 เดือนย้อนหลัง สำหรับการนัดหมาย
            for(let i=5; i>=0; i--) {
                let d = new Date(currentYear, currentMonth - i, 1);
                let key = `${d.getFullYear()}-${d.getMonth()}`;
                trendsMap[key] = { month: monthNames[d.getMonth()], count: 0, sortKey: d.getTime() };
            }

            const topicCounts = {};
            apptData.forEach(app => {
                const appDate = new Date(app.date || app.appointment_date);
                const monthKey = `${appDate.getFullYear()}-${appDate.getMonth()}`;
                if(trendsMap[monthKey]) trendsMap[monthKey].count += 1;

                const topic = (app.topic && app.topic.trim() !== '') ? app.topic : 'ปรึกษาทั่วไป';
                topicCounts[topic] = (topicCounts[topic] || 0) + 1;
            });

            const realMonthlyTrends = Object.values(trendsMap).sort((a,b) => a.sortKey - b.sortKey).map(item => ({ month: item.month, count: item.count }));
            const realIssueCategories = Object.keys(topicCounts).map(key => ({
                name: key, value: topicCounts[key]
            })).sort((a, b) => b.value - a.value).slice(0, 5); 

            setChartData({ monthlyTrends: realMonthlyTrends, issueCategories: realIssueCategories });

            // ==========================================
            // 2. จัดการข้อมูลแบบประเมิน (Assessments) - ของจริง 100%
            // ==========================================
            let normalCount = 0;
            let riskCount = 0;
            let severeCount = 0;

            // โครงสร้าง 6 เดือนย้อนหลัง สำหรับแนวโน้มความเสี่ยง
            let assessTrendsMap = {};
            for(let i=5; i>=0; i--) {
                let d = new Date(currentYear, currentMonth - i, 1);
                let key = `${d.getFullYear()}-${d.getMonth()}`;
                assessTrendsMap[key] = { month: monthNames[d.getMonth()], normal: 0, risk: 0, severe: 0, sortKey: d.getTime() };
            }

            assessData.forEach(assess => {
                // หากลืมบันทึกวันที่ ให้ใช้วันปัจจุบันแทน
                const aDate = new Date(assess.created_at || new Date()); 
                const aKey = `${aDate.getFullYear()}-${aDate.getMonth()}`;

                if (assess.stress_level) {
                    let levelType = '';
                    if (assess.stress_level === 'ไม่มีภาวะซึมเศร้า') {
                        normalCount++;
                        levelType = 'normal';
                    } else if (assess.stress_level === 'ภาวะซึมเศร้าเล็กน้อย' || assess.stress_level === 'ภาวะซึมเศร้าปานกลาง') {
                        riskCount++;
                        levelType = 'risk';
                    } else if (assess.stress_level === 'ภาวะซึมเศร้ามาก' || assess.stress_level === 'ภาวะซึมเศร้ารุนแรง') {
                        severeCount++;
                        levelType = 'severe';
                    }

                    // เพิ่มค่านับลงในเดือนที่ทำแบบประเมิน
                    if(assessTrendsMap[aKey] && levelType) {
                        assessTrendsMap[aKey][levelType] += 1;
                    }
                }
            });

            // ข้อมูลสำหรับกราฟแท่งรวม
            const realRiskLevels = [
                { name: 'กลุ่มปกติ', value: normalCount, color: '#10B981' }, 
                { name: 'กลุ่มเสี่ยง', value: riskCount, color: '#F59E0B' }, 
                { name: 'กลุ่มมีปัญหา', value: severeCount, color: '#EF4444' } 
            ];

            // ข้อมูลสำหรับกราฟแท่งซ้อนกัน (รายเดือน)
            const realMonthlyRisks = Object.values(assessTrendsMap).sort((a,b) => a.sortKey - b.sortKey);

            setAssessmentData({ riskLevels: realRiskLevels, monthlyRisks: realMonthlyRisks });
            setLoadingStats(false);

        } catch (err) {
            console.error("Dashboard Data Fetch Error", err);
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
                <Button variant="link" onClick={handleLogout} className="text-white-50 text-decoration-none p-0 d-flex align-items-center hover-danger">
                    <FaSignOutAlt className="me-2" /> ออกจากระบบ
                </Button>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                const statusData = [
                    { name: 'สำเร็จ', value: stats.completed, color: '#10B981' },
                    { name: 'รอพบ', value: stats.pending, color: '#F59E0B' },
                    { name: 'ยกเลิก', value: stats.cancelled, color: '#EF4444' }
                ];

                return (
                    <div className="fade-in">
                        <div className="hero-welcome p-4 p-lg-5 mb-5 d-flex align-items-center justify-content-between shadow-lg" style={{borderRadius: '24px'}}>
                            <div className="hero-bg-pattern"></div>
                            <div className="position-relative z-1">
                                <Badge bg="warning" text="dark" className="mb-2 px-3 rounded-pill fw-bold">Psychologist Panel</Badge>
                                <h1 className="fw-title display-5 fw-bold mb-2 text-white">สวัสดี, {psychologist.fullname}</h1>
                                <p className="text-white-50 mb-4 fw-light lead" style={{maxWidth: '600px'}}>
                                    ศูนย์รวมข้อมูลสุขภาพจิตนักเรียนและการนัดหมาย <br/>โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย
                                </p>
                            </div>
                            <div className="d-none d-md-block hero-logo-container">
                                <img src={pcshsLogo} alt="Logo" className="hero-logo-img" />
                            </div>
                        </div>

                        <div className="px-2 mb-5">
                            <h4 className="fw-bold mb-4" style={{color: 'var(--pcshs-blue-deep)'}}>ภาพรวมการนัดหมาย</h4>
                            <Row className="g-4">
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

                        {loadingStats ? (
                            <div className="text-center py-5"><Spinner animation="border" variant="primary"/></div>
                        ) : (
                            <div className="px-2 pb-4">
                                <h4 className="fw-bold mb-4" style={{color: 'var(--pcshs-blue-deep)'}}>การวิเคราะห์ข้อมูลนักเรียน</h4>
                                <Row className="g-4">
                                    
                                    {/* 1. สัดส่วนสถานะการนัดหมาย */}
                                    <Col xs={12} lg={4}>
                                        <Card className="shadow-sm border-0 h-100" style={{borderRadius: '20px'}}>
                                            <Card.Body>
                                                <h6 className="fw-bold mb-4 text-secondary text-center">สัดส่วนสถานะการนัดหมาย</h6>
                                                <div style={{ width: '100%', height: 250 }}>
                                                    <ResponsiveContainer>
                                                        <PieChart>
                                                            <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                                {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                                            </Pie>
                                                            <RechartsTooltip />
                                                            <Legend verticalAlign="bottom" height={36}/>
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    {/* 2. แนวโน้มการขอนัดหมาย */}
                                    <Col xs={12} lg={8}>
                                        <Card className="shadow-sm border-0 h-100" style={{borderRadius: '20px'}}>
                                            <Card.Body>
                                                <h6 className="fw-bold mb-4 text-secondary">แนวโน้มการขอรับคำปรึกษา (6 เดือนล่าสุด)</h6>
                                                <div style={{ width: '100%', height: 250 }}>
                                                    <ResponsiveContainer>
                                                        <LineChart data={chartData.monthlyTrends}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                                            <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                                            <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                                                            <RechartsTooltip cursor={{stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2}} />
                                                            <Line type="monotone" dataKey="count" name="จำนวนนัดหมาย" stroke="var(--pcshs-blue-deep)" strokeWidth={4} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    {/* 3. ประเด็นปัญหาที่พบ */}
                                    <Col xs={12} lg={4}>
                                        <Card className="shadow-sm border-0 h-100" style={{borderRadius: '20px'}}>
                                            <Card.Body>
                                                <h6 className="fw-bold mb-4 text-secondary">ประเด็นปัญหาที่พบมากที่สุด (Top 5)</h6>
                                                <div style={{ width: '100%', height: 300 }}>
                                                    <ResponsiveContainer>
                                                        <BarChart data={chartData.issueCategories} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                                                            <XAxis type="number" hide />
                                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} />
                                                            <RechartsTooltip cursor={{fill: 'rgba(242, 92, 5, 0.05)'}} />
                                                            <Bar dataKey="value" name="จำนวนเคส" fill="var(--pcshs-orange)" radius={[0, 10, 10, 0]} barSize={20} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    {/* 4. สรุประดับความเสี่ยงรวม (PHQ-A) */}
                                    <Col xs={12} lg={8}>
                                        <Card className="shadow-sm border-0 h-100" style={{borderRadius: '20px'}}>
                                            <Card.Body>
                                                <div className="d-flex justify-content-between align-items-center mb-4">
                                                    <h6 className="fw-bold text-secondary mb-0"><FaClipboardCheck className="me-2"/>สรุปผลการคัดกรองสุขภาพจิตนักเรียน (PHQ-A)</h6>
                                                </div>
                                                <div style={{ width: '100%', height: 300 }}>
                                                    <ResponsiveContainer>
                                                        <BarChart data={assessmentData.riskLevels} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                                            <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                                                            <RechartsTooltip cursor={{fill: 'transparent'}} />
                                                            <Bar dataKey="value" name="จำนวนนักเรียน" radius={[10, 10, 0, 0]} barSize={60}>
                                                                {assessmentData.riskLevels.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                                ))}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    {/* 5. 🌟 กราฟใหม่: แนวโน้มความเสี่ยงรายเดือน (Stacked Bar Chart) */}
                                    <Col xs={12}>
                                        <Card className="shadow-sm border-0 mb-4" style={{borderRadius: '20px', background: 'linear-gradient(to right, #ffffff, #f8f9fa)'}}>
                                            <Card.Body>
                                                <h6 className="fw-bold mb-2 text-secondary text-center"><FaStethoscope className="me-2"/>แนวโน้มระดับความเสี่ยงสุขภาพจิตรายเดือน (PHQ-A)</h6>
                                                <p className="text-center text-muted small mb-4">ติดตามจำนวนนักเรียนในแต่ละระดับความเสี่ยงย้อนหลัง 6 เดือน</p>
                                                <div style={{ width: '100%', height: 350 }}>
                                                    <ResponsiveContainer>
                                                        <BarChart data={assessmentData.monthlyRisks} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                                            <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                                            <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                                                            <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                                                            <Legend verticalAlign="top" height={36}/>
                                                            {/* ซ้อนกราฟแท่งด้วย stackId เดียวกัน */}
                                                            <Bar dataKey="normal" name="กลุ่มปกติ" stackId="a" fill="#10B981" barSize={40} />
                                                            <Bar dataKey="risk" name="กลุ่มเสี่ยง" stackId="a" fill="#F59E0B" />
                                                            <Bar dataKey="severe" name="กลุ่มมีปัญหา" stackId="a" fill="#EF4444" radius={[10, 10, 0, 0]} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                </Row>
                            </div>
                        )}
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
                <Offcanvas.Header closeButton closeVariant="white" />
                <Offcanvas.Body className="p-0"><SidebarContent /></Offcanvas.Body>
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
                            <div className="fw-bold text-dark" style={{fontSize: '0.9rem'}}>
                                {psychologist.fullname === 'กำลังโหลด...' ? <Spinner animation="border" size="sm" /> : psychologist.fullname}
                            </div>
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
                
                <Container fluid className="p-4 flex-grow-1" style={{background: '#f0f4f8'}}>
                    {renderContent()}
                </Container>
            </div>
        </div>
    );
};

export default PsychologistDashboard;       