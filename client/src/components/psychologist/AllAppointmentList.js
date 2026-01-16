import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Badge, Spinner, Form, InputGroup, Row, Col, Button } from 'react-bootstrap';
import { 
    FaSearch, FaUser, FaClock, FaEnvelope, FaHistory, 
    FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaMicroscope, 
    FaDatabase, FaShieldAlt, FaFilter, FaUndo, FaCalendarAlt
} from 'react-icons/fa';

// ✅ นำเข้า CSS
import './Psychologist.css';       
import './AllAppointmentList.css'; 

const AllAppointmentList = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // --- 🔍 State สำหรับการกรองข้อมูล ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterTime, setFilterTime] = useState('');

    useEffect(() => { fetchHistory(); }, []);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/appointments/psychologist-history', {
                headers: { 'x-auth-token': token }
            });
            setAppointments(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Fetch Error:", err);
            setLoading(false);
        }
    };

    const resetFilters = () => {
        setSearchTerm(''); setFilterDate(''); setFilterYear(''); setFilterTime('');
    };

    const filteredAppointments = appointments.filter(app => {
        const appDate = new Date(app.date);
        const appYear = appDate.getFullYear().toString();
        const appDateString = app.date.split('T')[0];
        const matchesSearch = !searchTerm || (app.student_name?.toLowerCase().includes(searchTerm.toLowerCase())) || (app.topic?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesDate = !filterDate || appDateString === filterDate;
        const matchesYear = !filterYear || appYear === filterYear;
        const matchesTime = !filterTime || app.time_slot === filterTime;
        return matchesSearch && matchesDate && matchesYear && matchesTime;
    });

    const stats = {
        total: filteredAppointments.length,
        completed: filteredAppointments.filter(a => a.status === 'Completed').length,
        pending: filteredAppointments.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length,
        cancelled: filteredAppointments.filter(a => a.status === 'Cancelled').length
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'Pending': return { label: 'รอเข้าพบ', cls: 'chip-pen' };
            case 'Confirmed': return { label: 'ยืนยันนัด', cls: 'chip-conf' };
            case 'Completed': return { label: 'สำเร็จแล้ว', cls: 'chip-comp' };
            case 'Cancelled': return { label: 'ยกเลิกนัด', cls: 'chip-can' };
            default: return { label: status, cls: 'chip-def' };
        }
    };

    const availableYears = [...new Set(appointments.map(app => new Date(app.date).getFullYear().toString()))].sort();
    const timeSlots = ["09:00-10:00", "10:00-11:00", "11:00-12:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00"];

    if (loading) return (
        <div className="loading-science-container text-center py-5" style={{minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
            <Spinner animation="grow" variant="primary" style={{width: '3rem', height: '3rem'}} />
            <div className="loading-text mt-4 fw-bold pcshs-navy fs-5">กำลังประมวลผลฐานข้อมูล...</div>
        </div>
    );

    return (
        <div className="pcshs-archive-container fade-in-up px-3 px-lg-5 py-4">
            {/* Header */}
            <div className="archive-header mb-5 d-flex justify-content-between align-items-end">
                <div className="d-flex align-items-center">
                    <div className="brand-icon-box me-4"><FaMicroscope /></div>
                    <div>
                        <h1 className="fw-800 pcshs-navy m-0 display-6" style={{letterSpacing: '-1px'}}>คลังข้อมูลประวัติการนัดหมาย</h1>
                        <p className="text-muted m-0 mt-2 lead">ศูนย์กลางข้อมูลเพื่อการวิเคราะห์และติดตามการดูแลนักเรียน</p>
                    </div>
                </div>
            </div>

            {/* --- 🎛️ Modern Filter Bar (ภาษาไทย) --- */}
            <Card className="glass-panel mb-5 border-0">
                <Card.Header className="filter-header-modern">
                    <FaFilter className="me-2" /> <span>ตัวกรองข้อมูลขั้นสูง</span>
                </Card.Header>
                <Card.Body className="p-4">
                    <Row className="g-4">
                        <Col lg={4} md={6}>
                            <Form.Label className="modern-label">ค้นหา (Search)</Form.Label>
                            <InputGroup className="modern-input-group">
                                <InputGroup.Text><FaSearch/></InputGroup.Text>
                                <Form.Control placeholder="พิมพ์ชื่อนักเรียน หรือ หัวข้อ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                            </InputGroup>
                        </Col>
                        <Col lg={2} md={6}>
                            <Form.Label className="modern-label">วันที่นัดหมาย</Form.Label>
                            <Form.Control type="date" className="modern-date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}/>
                        </Col>
                        <Col lg={2} md={6}>
                            <Form.Label className="modern-label">ปีการศึกษา</Form.Label>
                            <Form.Select className="modern-select" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                                <option value="">ทุกปีทั้งหมด</option>
                                {availableYears.map(year => <option key={year} value={year}>{parseInt(year) + 543}</option>)}
                            </Form.Select>
                        </Col>
                        <Col lg={2} md={6}>
                            <Form.Label className="modern-label">ช่วงเวลา</Form.Label>
                            <Form.Select className="modern-select" value={filterTime} onChange={(e) => setFilterTime(e.target.value)}>
                                <option value="">ทุกช่วงเวลา</option>
                                {timeSlots.map(slot => <option key={slot} value={slot}>{slot} น.</option>)}
                            </Form.Select>
                        </Col>
                        <Col lg={2} md={12} className="d-flex align-items-end">
                            <Button className="btn-reset-modern w-100" onClick={resetFilters}>
                                <FaUndo className="me-2" /> ล้างค่า
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* --- 📊 Premium Stat Cards (ภาษาไทย) --- */}
            <Row className="g-4 mb-5">
                {[
                    { label: 'บันทึกทั้งหมด', value: stats.total, icon: <FaDatabase/>, type: 'navy' },
                    { label: 'ดำเนินการสำเร็จ', value: stats.completed, icon: <FaCheckCircle/>, type: 'success' },
                    { label: 'รอพบ / ยืนยันแล้ว', value: stats.pending, icon: <FaHourglassHalf/>, type: 'warning' },
                    { label: 'ยกเลิก / ไม่มา', value: stats.cancelled, icon: <FaTimesCircle/>, type: 'danger' }
                ].map((item, idx) => (
                    <Col key={idx} xl={3} md={6}>
                        <Card className={`premium-stat-card stat-${item.type}`}>
                            <FaDatabase className="stat-bg-icon"/>
                            <div className="stat-content text-center">
                                <div className="stat-top-label text-uppercase">{item.label}</div>
                                <div className="stat-value-huge">{item.value}</div>
                                <span className="stat-unit-pill">รายการ</span>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* --- 📑 Modern Table (ภาษาไทย) --- */}
            <div className="glass-panel modern-table-container p-3">
                <div className="table-top-bar-modern d-flex justify-content-between align-items-center mb-3 px-3">
                    <div className="fw-bold pcshs-blue-deep d-flex align-items-center fs-5">
                        <FaHistory className="me-3 text-primary"/> รายการประวัติที่ค้นพบ ({filteredAppointments.length})
                    </div>
                    <Badge bg="light" text="dark" className="border px-3 py-2 rounded-pill d-flex align-items-center">
                        <FaShieldAlt className="me-2 text-success"/> ข้อมูลปลอดภัย (Secure)
                    </Badge>
                </div>
                <div className="table-responsive px-2 pb-2">
                    <table className="table pcshs-archive-table align-middle m-0">
                        <thead>
                            <tr>
                                <th className="ps-4">วัน-เวลา</th>
                                <th>ข้อมูลนักเรียน</th>
                                <th>รายละเอียดการติดต่อ</th>
                                <th className="text-center">สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAppointments.length > 0 ? (
                                filteredAppointments.map((app) => {
                                    const config = getStatusConfig(app.status);
                                    const appDate = new Date(app.date);
                                    return (
                                        <tr key={app.appointment_id} className="archive-row-card">
                                            <td className="ps-4">
                                                <div className="d-flex align-items-center">
                                                    <div className="date-badge me-3 shadow-sm">
                                                        <div className="date-day">{appDate.getDate()}</div>
                                                        <div className="date-month">{appDate.toLocaleDateString('th-TH', { month: 'short' })}</div>
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold pcshs-blue-deep">{appDate.getFullYear() + 543}</div>
                                                        <div className="time-sub-modern"><FaClock className="me-1"/>{app.time_slot}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="student-avatar-glow me-3"><FaUser /></div>
                                                    <div>
                                                        <div className="student-name-text fs-5">{app.student_name}</div>
                                                        <div className="student-id-text small text-muted" style={{letterSpacing: '1px'}}>ID: #{String(app.appointment_id).padStart(6, '0')}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="info-pill mb-2 shadow-sm">
                                                    <FaEnvelope className="me-2 text-primary opacity-75"/>{app.student_email}
                                                </div>
                                                <br/>
                                                <div className="topic-badge shadow-sm">
                                                     หัวข้อ: {app.topic || 'ปรึกษาทั่วไป'}
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className={`status-chip ${config.cls} shadow-sm`}>
                                                    {config.label}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-5">
                                        <div className="glass-panel p-5 d-inline-block">
                                            <FaSearch className="display-4 text-muted mb-3 opacity-50"/>
                                            <h4 className="pcshs-blue-deep">ไม่พบข้อมูลที่ตรงกัน</h4>
                                            <p className="text-muted">ลองปรับเปลี่ยนตัวกรอง หรือกดปุ่มล้างค่าเพื่อเริ่มใหม่</p>
                                            <Button variant="outline-primary" className="rounded-pill px-4 mt-2" onClick={resetFilters}>ล้างตัวกรองทั้งหมด</Button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AllAppointmentList;