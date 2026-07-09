import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Spinner, Form, InputGroup, Row, Col, Button, Modal } from 'react-bootstrap';
import { 
    FaSearch, FaClock, FaHistory, FaCheckCircle, FaTimesCircle, 
    FaHourglassHalf, FaMicroscope, FaDatabase, FaFilter, FaUndo, 
    FaUserGraduate, FaFileMedical, FaVideo, FaBuilding, FaCheck,
    FaTimes, FaUserTimes, FaCircle, FaInfoCircle, FaCalendarAlt, FaClipboardList
} from 'react-icons/fa';

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

    // --- State สำหรับ Modal ดูรายละเอียด ---
    const [showDetails, setShowDetails] = useState(false);
    const [selectedApptDetails, setSelectedApptDetails] = useState(null);

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

    const openDetails = (appt) => { 
        setSelectedApptDetails(appt); 
        setShowDetails(true); 
    };

    // --- 🎨 ฟังก์ชันจัดการ UI (ปรับให้ใช้ CSS Classes ใหม่) ---
    const formatTimeSlot = (start, end, apptTime, timeSlotStr) => {
        if (timeSlotStr) return timeSlotStr;
        let startTime = start ? start.substring(0, 5) : (apptTime ? String(apptTime).substring(0, 5) : '00:00');
        let endTime = end ? end.substring(0, 5) : '00:00';
        return `${startTime.replace(':', '.')}-${endTime.replace(':', '.')}`;
    };

    const getStatusBadge = (status) => {
        const s = status ? String(status).toLowerCase() : '';
        if (s === 'confirmed' || s === 'ยืนยัน') return <span className="status-chip chip-conf"><FaCheck className="me-1"/> ยืนยันแล้ว</span>;
        if (s === 'cancelled' || s === 'ยกเลิก') return <span className="status-chip chip-can"><FaTimes className="me-1"/> ยกเลิกแล้ว</span>;
        if (s === 'pending' || s === 'รอดำเนินการ') return <span className="status-chip chip-pen"><FaClock className="me-1"/> รอดำเนินการ</span>;
        if (s === 'completed' || s === 'เสร็จสิ้น') return <span className="status-chip chip-comp"><FaHistory className="me-1"/> เสร็จสิ้น</span>;
        if (s === 'no-show' || s === 'ขาดนัด') return <span className="status-chip chip-dark"><FaUserTimes className="me-1"/> ขาดนัด</span>;
        return <span className="status-chip chip-dark"><FaCircle className="me-1"/> {status || 'ไม่ระบุ'}</span>;
    };

    const getMeetingTypeBadge = (type) => {
        const t = type ? String(type).toLowerCase() : '';
        if(t === 'online' || t === 'ออนไลน์') return <span className="info-pill mt-1"><FaVideo className="me-1 text-primary"/> แชทออนไลน์</span>;
        return <span className="info-pill mt-1"><FaBuilding className="me-1 text-info"/> พบที่ห้องให้คำปรึกษา</span>;
    };

    // --- ⚙️ ประมวลผลข้อมูล (กรอง และ เรียงลำดับ) ---
    let filteredAppointments = appointments.filter(app => {
        const appDate = new Date(app.date || app.appointment_date);
        const appYear = appDate.getFullYear().toString();
        const appDateString = (app.date || app.appointment_date).split('T')[0];
        
        const matchesSearch = !searchTerm || (app.student_name?.toLowerCase().includes(searchTerm.toLowerCase())) || (app.topic?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesDate = !filterDate || appDateString === filterDate;
        const matchesYear = !filterYear || appYear === filterYear;
        const matchesTime = !filterTime || (app.time_slot === filterTime || formatTimeSlot(app.start_time, app.end_time, app.appointment_time) === filterTime);
        
        return matchesSearch && matchesDate && matchesYear && matchesTime;
    });

    // 🔽 เรียงลำดับสำหรับหน้าประวัติ: ล่าสุด(ใหม่สุด) อยู่บนสุด (Descending)
    const sortedAppointments = [...filteredAppointments].sort((a, b) => {
        const dateA = new Date(`${a.date || a.appointment_date}T${a.start_time || a.appointment_time || "00:00:00"}`);
        const dateB = new Date(`${b.date || b.appointment_date}T${b.start_time || b.appointment_time || "00:00:00"}`);
        return dateB - dateA; 
    });

    const stats = {
        total: filteredAppointments.length,
        completed: filteredAppointments.filter(a => a.status?.toLowerCase() === 'completed').length,
        pending: filteredAppointments.filter(a => ['pending', 'confirmed'].includes(a.status?.toLowerCase())).length,
        cancelled: filteredAppointments.filter(a => ['cancelled', 'no-show'].includes(a.status?.toLowerCase())).length
    };

    const availableYears = [...new Set(appointments.map(app => new Date(app.date || app.appointment_date).getFullYear().toString()))].sort();
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
                        <h1 className="fw-800 pcshs-navy m-0 display-6 fw-bold" style={{letterSpacing: '-1px'}}>คลังข้อมูลประวัติการนัดหมาย</h1>
                        <p className="text-muted m-0 mt-2 lead">ศูนย์กลางข้อมูลเพื่อการวิเคราะห์และติดตามการดูแลนักเรียน</p>
                    </div>
                </div>
            </div>

            {/* --- 🎛️ Modern Filter Bar --- */}
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

            {/* --- 📊 Premium Stat Cards --- */}
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

            {/* --- 📑 Modern Table --- */}
            <div className="glass-panel modern-table-container p-3">
                <div className="table-top-bar-modern d-flex justify-content-between align-items-center mb-3 px-3">
                    <div className="fw-bold pcshs-blue-deep d-flex align-items-center fs-5">
                        <FaHistory className="me-3 text-primary"/> รายการประวัติที่ค้นพบ ({sortedAppointments.length})
                    </div>
                </div>
                <div className="table-responsive px-2 pb-2 overflow-visible">
                    {/* เปลี่ยนมาใช้คลาสตารางแบบใหม่จาก CSS */}
                    <table className="pcshs-archive-table w-100">
                        <thead>
                            <tr>
                                <th className="ps-4">วัน-เวลา</th>
                                <th>นักเรียน</th>
                                <th>หัวข้อ / ผลประเมิน</th>
                                <th>สถานะ & ประเภท</th>
                                <th className="text-end pe-4">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAppointments.length > 0 ? (
                                sortedAppointments.map((app) => {
                                    const appDate = new Date(app.date || app.appointment_date);
                                    return (
                                        // ใช้งาน row-card สำหรับตารางที่มีลักษณะเป็นการ์ด
                                        <tr key={app.appointment_id} className="archive-row-card">
                                            <td className="ps-4">
                                                <div className="date-badge">
                                                    <span className="date-day d-block">{appDate.getDate()}</span>
                                                    <span className="date-month">{appDate.toLocaleDateString('th-TH', { month: 'short' })}</span>
                                                </div>
                                                <div className="time-sub-modern">
                                                    <FaClock className="me-1"/>
                                                    {formatTimeSlot(app.start_time, app.end_time, app.appointment_time, app.time_slot)} น.
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="student-avatar-glow"><FaUserGraduate/></div>
                                                    <div>
                                                        <span className="fw-bold text-dark d-block fs-6">{app.student_name || app.fullname}</span>
                                                        <span className="info-pill mt-1 text-muted">ID: #{String(app.appointment_id).padStart(6, '0')}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-dark fw-semibold text-truncate mb-2" style={{maxWidth: '220px'}}>{app.topic || '-'}</div>
                                                <div className="topic-badge">
                                                    <FaFileMedical className="me-1"/>
                                                    {app.stress_level || app.latest_assessment || 'ไม่มีข้อมูล'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column gap-2 align-items-start">
                                                    {getStatusBadge(app.status)}
                                                    {getMeetingTypeBadge(app.type || app.meeting_type)}
                                                </div>
                                            </td>
                                            <td className="text-end pe-4">
                                                <Button variant="light" className="btn-sm fw-bold border text-muted px-4 py-2 rounded-pill shadow-sm" onClick={() => openDetails(app)} style={{ transition: 'all 0.3s' }}>
                                                    <FaInfoCircle className="me-1"/> ข้อมูล
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-5">
                                        <div className="p-5 d-inline-block">
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

            {/* Modal ดูรายละเอียด */}
            <Modal show={showDetails} onHide={() => setShowDetails(false)} size="md" centered className="details-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold text-navy"><FaClipboardList className="me-2 text-primary"/>รายละเอียดประวัติ</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3">
                    {selectedApptDetails && (
                        <div className="details-content">
                            <div className="text-center mb-4">
                                <div className="student-avatar-glow mx-auto mb-2" style={{width: '70px', height: '70px', fontSize: '1.8rem'}}><FaUserGraduate/></div>
                                <h5 className="fw-bold m-0">{selectedApptDetails.student_name || selectedApptDetails.fullname}</h5>
                                <div className="mt-3 d-flex justify-content-center gap-2">
                                    {getStatusBadge(selectedApptDetails.status)}
                                </div>
                            </div>
                            
                            <div className="info-box bg-light p-3 rounded-3 mb-3 border">
                                <Row className="g-3">
                                    <Col xs={6}>
                                        <div className="text-muted small">วันที่นัดหมาย</div>
                                        <div className="fw-bold"><FaCalendarAlt className="me-2 text-primary"/>{new Date(selectedApptDetails.date || selectedApptDetails.appointment_date).toLocaleDateString('th-TH')}</div>
                                    </Col>
                                    <Col xs={6}>
                                        <div className="text-muted small">เวลา</div>
                                        <div className="fw-bold"><FaClock className="me-2 text-primary"/>{formatTimeSlot(selectedApptDetails.start_time, selectedApptDetails.end_time, selectedApptDetails.appointment_time, selectedApptDetails.time_slot)} น.</div>
                                    </Col>
                                </Row>
                            </div>
                            
                            <div className="info-group mb-3">
                                <div className="text-muted small mb-1">หัวข้อการปรึกษา</div>
                                <div className="fw-semibold text-dark p-2 border rounded-3 bg-white shadow-sm">{selectedApptDetails.topic || 'ไม่ระบุ'}</div>
                            </div>
                            
                            <div className="info-group border-start border-danger border-4 ps-3 py-2 bg-white shadow-sm rounded-end mb-3">
                                <div className="text-danger small fw-bold mb-1"><FaFileMedical className="me-1"/> ผลประเมินเบื้องต้น</div>
                                <div className="fw-semibold text-dark">{selectedApptDetails.stress_level || selectedApptDetails.latest_assessment || 'ไม่มีข้อมูล'}</div>
                            </div>

                            {/* แสดงผลสรุปการให้คำปรึกษา ถ้าเคสเสร็จสิ้นแล้ว */}
                            {selectedApptDetails.status?.toLowerCase() === 'completed' && selectedApptDetails.result_summary && (
                                <div className="info-group border-start border-success border-4 ps-3 py-3 bg-white shadow-sm rounded-end mt-3">
                                    <div className="text-success small fw-bold mb-2"><FaCheckCircle className="me-1"/> สรุปผลการให้คำปรึกษาจากนักจิตวิทยา</div>
                                    <div className="fw-semibold text-dark" style={{whiteSpace: 'pre-line'}}>{selectedApptDetails.result_summary}</div>
                                </div>
                            )}

                            {selectedApptDetails.note && selectedApptDetails.status?.toLowerCase() === 'no-show' && (
                                <div className="info-group border-start border-dark border-4 ps-3 py-2 bg-light shadow-sm rounded-end mt-3">
                                    <div className="text-dark small fw-bold mb-1"><FaUserTimes className="me-1"/> หมายเหตุ (ขาดนัด)</div>
                                    <div className="fw-semibold text-dark">{selectedApptDetails.note}</div>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default AllAppointmentList;