import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Button, Row, Col, Modal, InputGroup, Form, Dropdown, Badge } from 'react-bootstrap';
import { jwtDecode } from "jwt-decode";
import ChatRoom from '../common/ChatRoom';
import { 
    FaComments, FaCheck, FaTimes, FaHistory, FaUserGraduate, 
    FaClock, FaSearch, FaEllipsisV, FaCircle, FaCalendarAlt,
    FaUserClock, FaCalendarDay, FaRegCalendarCheck, FaUserCheck, FaCheckCircle,
    FaVideo, FaBuilding, FaFileMedical, FaInfoCircle, FaClipboardList, FaFilter
} from 'react-icons/fa';

import './AppointmentManager.css'; 

const AppointmentManager = () => {
    const [viewMode, setViewMode] = useState('card');
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // --- States สำหรับการกรองข้อมูล (Filters) ---
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState('all'); 
    const [filterMeetingType, setFilterMeetingType] = useState('all'); 
    
    // Chat & Modal States
    const [showChat, setShowChat] = useState(false);
    const [selectedChatAppt, setSelectedChatAppt] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedApptDetails, setSelectedApptDetails] = useState(null);

    useEffect(() => {
        fetchAppointments();
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const userObj = decoded.user || decoded;
                setCurrentUserId(userObj.id || userObj.user_id);
            } catch (e) { console.error("Token Error", e); }
        }
    }, []);

    // ดึงข้อมูลจาก API (ข้อมูลจริงจาก Database)
    const fetchAppointments = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/appointments/psychologist-appointments', {
                  headers: { 'x-auth-token': token } 
            });
            setAppointments(res.data);
            setLoading(false);
        } catch (err) { setLoading(false); }
    };

    const handleStatusChange = async (id, status) => {
        if (!window.confirm(`ยืนยันการเปลี่ยนสถานะเป็น ${status}?`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/appointments/status/${id}`, { status }, { headers: { 'x-auth-token': token } });
            fetchAppointments(); 
        } catch (err) { alert(`Error updating status`); }
    };

    const handleFinishConsultation = () => {
        if(window.confirm("ต้องการจบการให้คำปรึกษาและปิดหน้าต่างแชทใช่หรือไม่?")) {
            setShowChat(false);
            setSelectedChatAppt(null);
        }
    };

    const openChat = (appt) => { setSelectedChatAppt(appt); setShowChat(true); };
    const openDetails = (appt) => { setSelectedApptDetails(appt); setShowDetails(true); };

    // เช็คว่าเป็นวันปัจจุบันหรือไม่
    const isToday = (d) => {
        if (!d) return false;
        const today = new Date();
        const date = new Date(d);
        return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    };

    // ==========================================
    // ฟังก์ชันจัดการเวลาและสิทธิ์การเข้าแชท
    // ==========================================
    
    // 1. ฟังก์ชันจัดการเวลาให้แสดงรูปแบบ 00.00-00.00 น.
    const formatTimeSlot = (start, end, apptTime) => {
        let startTime = start ? start.substring(0, 5) : (apptTime ? String(apptTime).substring(0, 5) : '00:00');
        let endTime = end ? end.substring(0, 5) : '00:00';
        
        // แปลงเครื่องหมาย : เป็น .
        startTime = startTime.replace(':', '.');
        endTime = endTime.replace(':', '.');

        return `${startTime}-${endTime}`;
    };

    // 2. ฟังก์ชันเช็คว่าเปิดแชทได้หรือยัง (ต้องถึงเวลาและสถานะต้องไม่ใช่ยกเลิก/เสร็จสิ้น)
    const isChatOpen = (appt) => {
        const status = String(appt.status).toLowerCase();
        
        // ถ้าสถานะเป็นเสร็จสิ้น (completed) หรือยกเลิก (cancelled) จะไม่ให้แชท
        if (status !== 'confirmed' && status !== 'pending') return false;

        try {
            const now = new Date();
            const apptDate = new Date(appt.date || appt.appointment_date);
            
            // ดึงเวลาเริ่มนัดหมาย
            const timeStr = appt.start_time || appt.appointment_time || "00:00:00";
            const [hours, minutes] = timeStr.split(':').map(Number);
            
            // เซ็ตเวลาให้ตรงกับเวลานัด
            apptDate.setHours(hours, minutes, 0, 0);

            // ส่งคืนค่า true ถ้าเวลาปัจจุบัน >= เวลาที่นัดไว้
            return now >= apptDate;
        } catch (error) {
            return false;
        }
    };


    // --- Logic การกรองข้อมูล ---
    let filteredAppointments = appointments;

    if (filterStatus === 'pending') {
        filteredAppointments = filteredAppointments.filter(a => String(a.status).toLowerCase() === 'pending');
    } else if (filterStatus === 'today') {
        filteredAppointments = filteredAppointments.filter(a => String(a.status).toLowerCase() === 'confirmed' && isToday(a.date || a.appointment_date));
    } else if (filterStatus === 'confirmed') {
        filteredAppointments = filteredAppointments.filter(a => String(a.status).toLowerCase() === 'confirmed');
    }

    if (filterMeetingType !== 'all') {
        filteredAppointments = filteredAppointments.filter(a => {
            const type = String(a.type || a.meeting_type).toLowerCase();
            if (filterMeetingType === 'online') return type === 'online' || type === 'ออนไลน์';
            if (filterMeetingType === 'onsite') return type === 'onsite' || type === 'on-site' || type === 'พบตัว';
            return true;
        });
    }

    if (searchTerm) {
        filteredAppointments = filteredAppointments.filter(app => {
            const studentName = app.student_name || app.fullname || '';
            return studentName.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }

    // --- ข้อมูลสถิติ ---
    const opStats = {
        all: appointments.length,
        newRequests: appointments.filter(a => String(a.status).toLowerCase() === 'pending').length,
        todaySchedule: appointments.filter(a => String(a.status).toLowerCase() === 'confirmed' && isToday(a.date || a.appointment_date)).length,
        confirmedUpcoming: appointments.filter(a => String(a.status).toLowerCase() === 'confirmed').length,
    };

    const statCardsData = [
        { title: "นัดหมายทั้งหมด", count: opStats.all, unit: "รายการ", icon: <FaClipboardList/>, type: "stat-blue", filterKey: 'all' },
        { title: "คำขอใหม่ (รอยืนยัน)", count: opStats.newRequests, unit: "รายการ", icon: <FaUserClock/>, type: "stat-purple", filterKey: 'pending' },
        { title: "นัดหมายวันนี้", count: opStats.todaySchedule, unit: "ราย", icon: <FaCalendarDay/>, type: "stat-ocean", filterKey: 'today' },
        { title: "ยืนยันแล้ว (รอพบ)", count: opStats.confirmedUpcoming, unit: "คิว", icon: <FaUserCheck/>, type: "stat-sweet", filterKey: 'confirmed' }
    ];

    const getStatusBadge = (status) => {
        const s = status ? String(status).toLowerCase() : '';
        if (s === 'confirmed' || s === 'ยืนยัน') return <Badge bg="success" className="px-3 py-2 rounded-pill fw-normal shadow-sm"><FaCheck className="me-1"/> ยืนยันแล้ว</Badge>;
        if (s === 'cancelled' || s === 'ยกเลิก') return <Badge bg="danger" className="px-3 py-2 rounded-pill fw-normal shadow-sm"><FaTimes className="me-1"/> ยกเลิกแล้ว</Badge>;
        if (s === 'pending' || s === 'รอดำเนินการ') return <Badge bg="warning" text="dark" className="px-3 py-2 rounded-pill fw-normal shadow-sm"><FaClock className="me-1"/> รอดำเนินการ</Badge>;
        if (s === 'completed' || s === 'เสร็จสิ้น') return <Badge bg="secondary" className="px-3 py-2 rounded-pill fw-normal shadow-sm"><FaHistory className="me-1"/> เสร็จสิ้น</Badge>;
        return <Badge bg="secondary" className="px-3 py-2 rounded-pill fw-normal shadow-sm"><FaCircle className="me-1"/> {status || 'ไม่ระบุ'}</Badge>;
    };

    const getStatusColor = (status) => {
        const s = status ? String(status).toLowerCase() : '';
        if (s === 'confirmed' || s === 'ยืนยัน') return '#198754';
        if (s === 'cancelled' || s === 'ยกเลิก') return '#dc3545';
        if (s === 'pending' || s === 'รอดำเนินการ') return '#ffc107';
        return '#6c757d';
    };

    const getMeetingTypeBadge = (type) => {
        const t = type ? String(type).toLowerCase() : '';
        if(t === 'online' || t === 'ออนไลน์') return <Badge bg="primary" className="px-3 py-2 rounded-pill fw-normal shadow-sm"><FaVideo className="me-1"/> ออนไลน์</Badge>;
        return <Badge bg="info" text="dark" className="px-3 py-2 rounded-pill fw-normal shadow-sm"><FaBuilding className="me-1"/> On-site</Badge>;
    };

    if (loading) return (
        <div className="d-flex flex-column align-items-center justify-content-center vh-100">
            <div className="spinner-border text-primary" role="status"></div>
            <span className="mt-3 text-muted fw-bold">กำลังโหลดข้อมูล...</span>
        </div>
    );

    return (
        <div className="appt-container px-3 px-lg-5 py-4">
            
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end mb-4 gap-4">
                <div className="d-flex align-items-center">
                    <div className="brand-icon-box me-3"><FaCalendarAlt /></div>
                    <div>
                        <h2 className="fw-bold m-0 text-navy">จัดการการนัดหมาย</h2>
                        <p className="text-muted m-0 small">คลิกที่การ์ดด้านล่างเพื่อกรองข้อมูลตามสถานะ</p>
                    </div>
                </div>
            </div>

            <Row className="g-3 mb-4">
                {statCardsData.map((item, idx) => (
                    <Col xs={12} sm={6} lg={3} key={idx}>
                        <div 
                            className={`stat-card-modern ${item.type} ${filterStatus === item.filterKey ? 'active-filter' : ''}`}
                            onClick={() => setFilterStatus(item.filterKey)}
                        >
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <div className="stat-label">{item.title}</div>
                                    <div className="stat-number">{item.count} <span className="stat-unit">{item.unit}</span></div>
                                </div>
                                <div className="stat-icon-bg">{item.icon}</div>
                            </div>
                        </div>
                    </Col>
                ))}
            </Row>

            <div className="filter-bar bg-white p-3 rounded-4 shadow-sm mb-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                <div className="d-flex gap-3 w-100 align-items-center flex-wrap">
                    <InputGroup className="search-box-modern flex-grow-1" style={{ maxWidth: '400px' }}>
                        <InputGroup.Text className="bg-light border-0 ps-3 text-muted"><FaSearch/></InputGroup.Text>
                        <Form.Control 
                            placeholder="ค้นหาชื่อนักเรียน..." 
                            className="bg-light border-0 shadow-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>

                    <InputGroup style={{ maxWidth: '200px' }}>
                        <InputGroup.Text className="bg-light border-0 text-muted"><FaFilter/></InputGroup.Text>
                        <Form.Select 
                            className="bg-light border-0 shadow-none fw-bold text-secondary"
                            value={filterMeetingType}
                            onChange={(e) => setFilterMeetingType(e.target.value)}
                        >
                            <option value="all">รูปแบบ (ทั้งหมด)</option>
                            <option value="online">ออนไลน์</option>
                            <option value="onsite">On-site</option>
                        </Form.Select>
                    </InputGroup>
                </div>

                <div className="view-toggle-pill flex-shrink-0">
                    <button className={viewMode === 'card' ? 'active' : ''} onClick={() => setViewMode('card')}>การ์ด</button>
                    <button className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>ตาราง</button>
                </div>
            </div>

            {filteredAppointments.length === 0 ? (
                <div className="empty-state">
                    <FaHistory className="mb-3 opacity-25" size={40}/>
                    <h5>ไม่พบข้อมูลนัดหมายที่ตรงกับเงื่อนไขการกรอง</h5>
                    <Button variant="outline-primary" className="mt-3 rounded-pill" onClick={() => {
                        setFilterStatus('all'); 
                        setFilterMeetingType('all');
                        setSearchTerm('');
                    }}>ล้างตัวกรองทั้งหมด</Button>
                </div>
            ) : (
                <>
                    {viewMode === 'card' ? (
                        <Row className="g-4">
                            {filteredAppointments.map((app) => {
                                const appDate = new Date(app.date || app.appointment_date);
                                const timeStr = formatTimeSlot(app.start_time, app.end_time, app.appointment_time);
                                const studentName = app.student_name || app.fullname || 'ไม่ทราบชื่อ';
                                const chatOpen = isChatOpen(app); // เช็คว่าถึงเวลาคุยหรือยัง

                                return (
                                    <Col lg={4} md={6} key={app.appointment_id}>
                                        <Card className="appt-card h-100 border-0">
                                            <div className="status-line" style={{ backgroundColor: getStatusColor(app.status) }}></div>
                                            <Card.Body className="p-4 d-flex flex-column">
                                                
                                                <div className="d-flex justify-content-between mb-3 align-items-start">
                                                    <div className="date-badge">
                                                        <span className="d-day">{appDate.getDate()}</span>
                                                        <span className="d-month">{appDate.toLocaleDateString('th-TH', {month: 'short'})}</span>
                                                    </div>
                                                    <div className="text-end d-flex flex-column gap-2 align-items-end">
                                                        {getStatusBadge(app.status)}
                                                        {getMeetingTypeBadge(app.type || app.meeting_type)}
                                                    </div>
                                                </div>

                                                {/* แสดงเวลาแบบใหม่ */}
                                                <div className="text-muted small mb-3 bg-light p-2 rounded-3 d-inline-block" style={{ width: 'fit-content' }}>
                                                    <FaClock className="me-2 text-primary"/>
                                                    เวลา: <strong className="text-dark">{timeStr} น.</strong>
                                                </div>

                                                <h6 className="topic-text mb-3">{app.topic || 'ไม่ระบุหัวข้อ'}</h6>
                                                
                                                <div className="student-box mb-3">
                                                    <div className="d-flex align-items-center mb-2">
                                                        <div className="avatar-circle me-2"><FaUserGraduate/></div>
                                                        <div className="fw-bold text-dark">{studentName}</div>
                                                    </div>
                                                    <div className="assessment-row">
                                                        <FaFileMedical className="text-danger me-1"/> 
                                                        <span className="text-muted small me-1">ผลประเมิน:</span> 
                                                        <span className="fw-bold text-dark small">{app.stress_level || app.latest_assessment || 'ยังไม่มีการประเมิน'}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-auto pt-3 border-top d-flex gap-2">
                                                    <Button variant="light" className="btn-action flex-grow-1 text-primary fw-bold" onClick={() => openDetails(app)}>
                                                        <FaInfoCircle className="me-1"/> ข้อมูล
                                                    </Button>

                                                    {/* ปุ่มแชทที่ถูกควบคุมสิทธิ์ตามเวลา */}
                                                    <Button 
                                                        variant={chatOpen ? "primary" : "secondary"} 
                                                        className="btn-action flex-grow-1 fw-bold"
                                                        onClick={() => openChat(app)}
                                                        disabled={!chatOpen}
                                                    >
                                                        <FaComments className="me-1"/> {chatOpen ? 'แชท' : 'ยังไม่ถึงเวลา'}
                                                    </Button>

                                                    <Dropdown align="end">
                                                        <Dropdown.Toggle variant="light" className="btn-action px-2 no-arrow"><FaEllipsisV/></Dropdown.Toggle>
                                                        <Dropdown.Menu className="border-0 shadow">
                                                            <Dropdown.Item onClick={() => handleStatusChange(app.appointment_id, 'Confirmed')}><FaCheck className="text-success me-2"/>ยืนยันนัด</Dropdown.Item>
                                                            <Dropdown.Item onClick={() => handleStatusChange(app.appointment_id, 'Cancelled')}><FaTimes className="text-danger me-2"/>ยกเลิกนัด</Dropdown.Item>
                                                        </Dropdown.Menu>
                                                    </Dropdown>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>
                    ) : (
                        <div className="table-glass-container">
                            <table className="table-modern">
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
                                    {filteredAppointments.map(app => {
                                        const timeStr = formatTimeSlot(app.start_time, app.end_time, app.appointment_time);
                                        const studentName = app.student_name || app.fullname || 'ไม่ทราบชื่อ';
                                        const chatOpen = isChatOpen(app);

                                        return(
                                        <tr key={app.appointment_id} className="table-row-hover">
                                            <td className="ps-4">
                                                <div className="fw-bold text-navy">{new Date(app.date || app.appointment_date).toLocaleDateString('th-TH', {day: 'numeric', month: 'short'})}</div>
                                                <small className="text-muted"><FaClock className="me-1"/>{timeStr} น.</small>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="avatar-circle small"><FaUserGraduate/></div>
                                                    <span className="fw-bold text-dark">{studentName}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-dark fw-semibold text-truncate" style={{maxWidth: '200px'}}>{app.topic || '-'}</div>
                                                <div className="text-danger small"><FaFileMedical className="me-1"/>{app.stress_level || app.latest_assessment || 'ไม่มีข้อมูล'}</div>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column gap-1 align-items-start">
                                                    {getStatusBadge(app.status)}
                                                    {getMeetingTypeBadge(app.type || app.meeting_type)}
                                                </div>
                                            </td>
                                            <td className="text-end pe-4">
                                                <Button size="sm" variant="light" className="rounded-pill px-3 me-2 text-primary fw-bold border" onClick={() => openDetails(app)}>ข้อมูล</Button>
                                                <Button 
                                                    size="sm" 
                                                    variant={chatOpen ? "primary" : "secondary"} 
                                                    className="rounded-pill px-3 fw-bold" 
                                                    onClick={() => openChat(app)}
                                                    disabled={!chatOpen}
                                                >
                                                    {chatOpen ? 'แชท' : 'ยังไม่ถึงเวลา'}
                                                </Button>
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* --- Details Modal --- */}
            <Modal show={showDetails} onHide={() => setShowDetails(false)} size="md" centered className="details-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold text-navy"><FaClipboardList className="me-2 text-primary"/>รายละเอียดนัดหมาย</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3">
                    {selectedApptDetails && (
                        <div className="details-content">
                            <div className="text-center mb-4">
                                <div className="avatar-circle mx-auto mb-2" style={{width: '60px', height: '60px', fontSize: '1.5rem'}}><FaUserGraduate/></div>
                                <h5 className="fw-bold m-0">{selectedApptDetails.student_name || selectedApptDetails.fullname}</h5>
                                <div className="mt-3 d-flex justify-content-center gap-2">
                                    {getStatusBadge(selectedApptDetails.status)}
                                    {getMeetingTypeBadge(selectedApptDetails.type || selectedApptDetails.meeting_type)}
                                </div>
                            </div>

                            <div className="info-box bg-light p-3 rounded-3 mb-3">
                                <Row className="g-3">
                                    <Col xs={6}>
                                        <div className="text-muted small">วันที่นัดหมาย</div>
                                        <div className="fw-bold"><FaCalendarAlt className="me-2 text-primary"/>{new Date(selectedApptDetails.date || selectedApptDetails.appointment_date).toLocaleDateString('th-TH', {day: 'numeric', month: 'long', year: 'numeric'})}</div>
                                    </Col>
                                    <Col xs={6}>
                                        <div className="text-muted small">เวลา</div>
                                        <div className="fw-bold"><FaClock className="me-2 text-primary"/>{formatTimeSlot(selectedApptDetails.start_time, selectedApptDetails.end_time, selectedApptDetails.appointment_time)} น.</div>
                                    </Col>
                                </Row>
                            </div>

                            <div className="info-group mb-3">
                                <div className="text-muted small mb-1">หัวข้อการปรึกษา</div>
                                <div className="fw-semibold text-dark p-2 border rounded-3">{selectedApptDetails.topic || 'ไม่ระบุ'}</div>
                            </div>

                            <div className="info-group border-start border-danger border-4 ps-3 py-2 bg-white shadow-sm rounded-end">
                                <div className="text-danger small fw-bold mb-1"><FaFileMedical className="me-1"/> ผลประเมินสุขภาพจิตล่าสุด</div>
                                <div className="fw-semibold text-dark">{selectedApptDetails.stress_level || selectedApptDetails.latest_assessment || 'ไม่มีข้อมูล'}</div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="outline-secondary" className="rounded-pill w-100 fw-bold" onClick={() => setShowDetails(false)}>ปิดหน้าต่าง</Button>
                </Modal.Footer>
            </Modal>

            {/* --- Chat Modal --- */}
            <Modal show={showChat && selectedChatAppt} onHide={() => setShowChat(false)} size="lg" centered className="chat-modal-custom">
                <Modal.Header closeButton className="border-0 bg-light">
                    <Modal.Title className="d-flex align-items-center gap-3">
                        <div className="avatar-circle bg-primary text-white"><FaUserGraduate/></div>
                        <div>
                            <div className="fs-5 fw-bold">{selectedChatAppt?.student_name || selectedChatAppt?.fullname}</div>
                            <div className="fs-6 text-muted fw-normal">หัวข้อ: {selectedChatAppt?.topic || 'ปรึกษาทั่วไป'}</div>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0" style={{ height: '500px', background: '#f8f9fa' }}>
                    <ChatRoom 
                        roomID={`appt-${selectedChatAppt?.appointment_id}`}
                        userId={String(currentUserId)}
                        username="นักจิตวิทยา"
                        otherName={selectedChatAppt?.student_name || selectedChatAppt?.fullname}
                    />
                </Modal.Body>
                <Modal.Footer className="border-0 bg-white justify-content-between px-4 py-3">
                    <span className="text-muted small">
                        <FaHistory className="me-1"/> เริ่มการสนทนาเมื่อ: {new Date().toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <Button variant="success" className="rounded-pill px-4 fw-bold shadow-sm" onClick={handleFinishConsultation}>
                        <FaCheckCircle className="me-2"/> เสร็จสิ้นให้คำปรึกษา
                    </Button>
                </Modal.Footer>
            </Modal>

        </div>
    );
};

export default AppointmentManager;