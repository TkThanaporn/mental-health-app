import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Table, Badge, Spinner, Form, InputGroup, Row, Col, Button } from 'react-bootstrap';
import { 
    FaSearch, FaUser, FaClock, FaCalendarAlt, 
    FaEnvelope, FaHistory, FaCheckCircle, FaTimesCircle, 
    FaHourglassHalf, FaMicroscope, FaDatabase, FaShieldAlt, FaFilter, FaUndo
} from 'react-icons/fa';
import './Psychologist.css';

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

    // --- 🛠 ฟังก์ชันรีเซ็ตตัวกรอง ---
    const resetFilters = () => {
        setSearchTerm('');
        setFilterDate('');
        setFilterYear('');
        setFilterTime('');
    };

    // --- 🔍 Logic การกรองข้อมูลขั้นสูง ---
    const filteredAppointments = appointments.filter(app => {
        const appDate = new Date(app.date);
        const appYear = appDate.getFullYear().toString();
        const appDateString = app.date.split('T')[0]; // ดึง YYYY-MM-DD

        const matchesSearch = !searchTerm || 
            (app.student_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (app.topic?.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesDate = !filterDate || appDateString === filterDate;
        const matchesYear = !filterYear || appYear === filterYear;
        const matchesTime = !filterTime || app.time_slot === filterTime;

        return matchesSearch && matchesDate && matchesYear && matchesTime;
    });

    // --- 📊 คำนวณสถิติจากข้อมูลที่กรองแล้ว ---
    const stats = {
        total: filteredAppointments.length,
        completed: filteredAppointments.filter(a => a.status === 'Completed').length,
        pending: filteredAppointments.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length,
        cancelled: filteredAppointments.filter(a => a.status === 'Cancelled').length
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'Pending': return { label: 'รอเข้าพบ', cls: 'st-pen-pcshs' };
            case 'Confirmed': return { label: 'ยืนยันนัด', cls: 'st-conf-pcshs' };
            case 'Completed': return { label: 'สำเร็จแล้ว', cls: 'st-comp-pcshs' };
            case 'Cancelled': return { label: 'ยกเลิกนัด', cls: 'st-can-pcshs' };
            default: return { label: status, cls: 'st-def-pcshs' };
        }
    };

    // สร้างรายการปีที่มีข้อมูลให้เลือกอัตโนมัติ
    const availableYears = [...new Set(appointments.map(app => new Date(app.date).getFullYear().toString()))].sort();

    // รายการช่วงเวลา (อิงตามระบบนัดหมาย)
    const timeSlots = ["09:00-10:00", "10:00-11:00", "11:00-12:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00"];

    if (loading) return (
        <div className="loading-science-container text-center py-5">
            <Spinner animation="border" variant="primary" />
            <div className="loading-text mt-3 fw-bold pcshs-navy">กำลังเชื่อมต่อฐานข้อมูลจัดเก็บ...</div>
        </div>
    );

    return (
        <div className="pcshs-archive-container fade-in-up">
            {/* Header */}
            <div className="archive-header mb-4">
                <div className="d-flex align-items-center mb-3">
                    <div className="brand-icon-box me-3"><FaMicroscope /></div>
                    <div>
                        <h1 className="fw-800 pcshs-navy m-0">คลังข้อมูลประวัติการนัดหมาย</h1>
                        <p className="text-muted m-0">ค้นหาและวิเคราะห์ประวัติการดูแลช่วยเหลือนักเรียน</p>
                    </div>
                </div>
            </div>

            {/* --- 🛠 แผงควบคุมตัวกรอง (Scientific Filter Bar) --- */}
            <Card className="filter-card shadow-sm border-0 mb-4 rounded-4 overflow-hidden">
                <Card.Header className="bg-navy text-white py-2 px-3 d-flex align-items-center">
                    <FaFilter className="me-2 small" /> <span className="small fw-bold">ตัวกรองข้อมูลขั้นสูง</span>
                </Card.Header>
                <Card.Body className="bg-white p-3">
                    <Row className="g-3">
                        <Col lg={3} md={6}>
                            <Form.Label className="small fw-bold text-muted">ค้นหาชื่อ/หัวข้อ</Form.Label>
                            <InputGroup size="sm">
                                <InputGroup.Text className="bg-light border-0"><FaSearch className="text-muted"/></InputGroup.Text>
                                <Form.Control 
                                    className="bg-light border-0 shadow-none"
                                    placeholder="ชื่อนักเรียน..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col lg={2} md={6}>
                            <Form.Label className="small fw-bold text-muted">วันที่นัดหมาย</Form.Label>
                            <Form.Control 
                                size="sm" type="date" className="bg-light border-0 shadow-none"
                                value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
                            />
                        </Col>
                        <Col lg={2} md={6}>
                            <Form.Label className="small fw-bold text-muted">ปีการศึกษา (พ.ศ.)</Form.Label>
                            <Form.Select 
                                size="sm" className="bg-light border-0 shadow-none"
                                value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
                            >
                                <option value="">ทุกปี</option>
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{parseInt(year) + 543}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col lg={3} md={6}>
                            <Form.Label className="small fw-bold text-muted">ช่วงเวลา</Form.Label>
                            <Form.Select 
                                size="sm" className="bg-light border-0 shadow-none"
                                value={filterTime} onChange={(e) => setFilterTime(e.target.value)}
                            >
                                <option value="">ทุกช่วงเวลา</option>
                                {timeSlots.map(slot => <option key={slot} value={slot}>{slot} น.</option>)}
                            </Form.Select>
                        </Col>
                        <Col lg={2} md={12} className="d-flex align-items-end">
                            <Button variant="outline-danger" size="sm" className="w-100 rounded-pill fw-bold border-0" onClick={resetFilters}>
                                <FaUndo className="me-1" /> ล้างตัวกรอง
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* สถิติรวม */}
            <Row className="g-4 mb-5">
                {[
                    { label: 'ผลลัพธ์ที่พบ', value: stats.total, icon: <FaDatabase/>, type: 'navy' },
                    { label: 'ดำเนินการสำเร็จ', value: stats.completed, icon: <FaCheckCircle/>, type: 'success' },
                    { label: 'รอการเข้าพบ', value: stats.pending, icon: <FaHourglassHalf/>, type: 'warning' },
                    { label: 'ยกเลิก/ไม่มา', value: stats.cancelled, icon: <FaTimesCircle/>, type: 'danger' }
                ].map((item, idx) => (
                    <Col key={idx} lg={3} sm={6}>
                        <div className={`archive-stat-card card-${item.type}`}>
                            <div className="stat-body p-3">
                                <div className="stat-top d-flex align-items-center mb-1">
                                    <span className="icon-circle-sm me-2">{item.icon}</span>
                                    <span className="label-text-sm text-uppercase">{item.label}</span>
                                </div>
                                <div className="stat-bottom d-flex align-items-baseline">
                                    <span className="value-text-md">{item.value}</span>
                                    <span className="unit-text ms-2">รายการ</span>
                                </div>
                            </div>
                        </div>
                    </Col>
                ))}
            </Row>

            {/* ตารางแสดงผล */}
            <div className="scientific-table-card shadow-lg border-0">
                <div className="table-top-bar d-flex justify-content-between align-items-center px-4 py-3 bg-navy rounded-top-4">
                    <div className="fw-700 text-white"><FaHistory className="me-2"/> ผลการกรองข้อมูลล่าสุด</div>
                    <Badge bg="info" className="status-online"><FaShieldAlt className="me-1"/> ข้อมูลได้รับการเข้ารหัส</Badge>
                </div>
                <div className="table-responsive">
                    <table className="table pcshs-archive-table align-middle m-0">
                        <thead>
                            <tr>
                                <th className="ps-4">วัน-เวลา</th>
                                <th>ข้อมูลนักเรียน</th>
                                <th>รายละเอียด</th>
                                <th className="text-center">สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAppointments.length > 0 ? (
                                filteredAppointments.map((app) => {
                                    const config = getStatusConfig(app.status);
                                    return (
                                        <tr key={app.appointment_id} className="archive-row">
                                            <td className="ps-4">
                                                <div className="date-main fw-bold">{new Date(app.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                <div className="time-sub text-primary small fw-bold"><FaClock className="me-1"/>{app.time_slot}</div>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="student-icon me-3 bg-light p-2 rounded-circle text-navy"><FaUser /></div>
                                                    <div>
                                                        <div className="student-name-text fw-bold">{app.student_name}</div>
                                                        <div className="student-id-text small text-muted">ID: #{app.appointment_id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="contact-pill bg-light px-2 py-1 rounded-pill small mb-1">
                                                    <FaEnvelope className="me-2 opacity-50"/>{app.student_email}
                                                </div>
                                                <div className="topic-highlight small fw-bold text-navy">{app.topic || 'ปรึกษาทั่วไป'}</div>
                                            </td>
                                            <td className="text-center">
                                                <div className={`status-tag ${config.cls}`}>{config.label}</div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-5">
                                        <div className="text-muted fw-bold">ไม่พบข้อมูลที่ตรงกับเงื่อนไขการกรองของคุณ</div>
                                        <Button variant="link" size="sm" onClick={resetFilters}>คลิกที่นี่เพื่อล้างค่าทั้งหมด</Button>
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