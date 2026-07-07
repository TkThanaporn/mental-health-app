import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Button, Row, Col, Modal, InputGroup, Form, Badge, Dropdown, Spinner } from 'react-bootstrap';
import { jwtDecode } from "jwt-decode";
import ChatRoom from '../common/ChatRoom';
import { 
    FaComments, FaCheck, FaTimes, FaHistory, FaUserGraduate, 
    FaClock, FaSearch, FaCircle, FaCalendarAlt, FaUserClock, 
    FaCalendarDay, FaRegCalendarCheck, FaUserCheck, FaCheckCircle,
    FaVideo, FaBuilding, FaFileMedical, FaInfoCircle, FaClipboardList, FaFilter,
    FaUserTimes 
} from 'react-icons/fa';

import './AppointmentManager.css'; 

// 🌟 1. รับ onAppointmentUpdate มา
const AppointmentManager = ({ onAppointmentUpdate }) => {
    const [viewMode, setViewMode] = useState('card');
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState('all'); 
    const [filterMeetingType, setFilterMeetingType] = useState('all'); 
    
    const [showChat, setShowChat] = useState(false);
    const [selectedChatAppt, setSelectedChatAppt] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedApptDetails, setSelectedApptDetails] = useState(null);

    // State สำหรับบันทึกผลการให้คำปรึกษา
    const [showResultModal, setShowResultModal] = useState(false);
    const [resultData, setResultData] = useState({ summary: '', needFollowUp: false, date: '', time: '' });
    
    // State ป้องกันการกดปุ่มเบิ้ล
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        if (!window.confirm(`ยืนยันเปลี่ยนสถานะเป็น ${status === 'Confirmed' ? 'ยืนยัน' : 'ยกเลิก'}?`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/appointments/status/${id}`, { status }, { headers: { 'x-auth-token': token } });
            await fetchAppointments(); 
            if (onAppointmentUpdate) onAppointmentUpdate(); // 🌟 อัปเดต Sidebar ตัวเลข
        } catch (err) { alert(`Error updating status`); }
    };

    const handleNoShow = async (id) => {
        if (!window.confirm("ยืนยันว่านักเรียนไม่มาตามนัด (ขาดนัด) ใช่หรือไม่?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/appointments/no-show/${id}`, { 
                note: 'นักเรียนขาดนัด (No-show)' 
            }, { headers: { 'x-auth-token': token } });
            await fetchAppointments(); 
            if (onAppointmentUpdate) onAppointmentUpdate(); // 🌟 อัปเดต Sidebar ตัวเลข
        } catch (err) { alert("เกิดข้อผิดพลาดในการบันทึกสถานะ"); }
    };

    const submitResult = async () => {
        if(!resultData.summary) return alert("กรุณากรอกสรุปผลการให้คำปรึกษา");
        if(resultData.needFollowUp && (!resultData.date || !resultData.time)) {
            return alert("กรุณาระบุวันที่และเวลาสำหรับการนัดติดตามอาการให้ครบถ้วน");
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/appointments/complete/${selectedApptDetails.appointment_id}`, {
                result_summary: resultData.summary,
                follow_up_date: resultData.needFollowUp ? resultData.date : null,
                follow_up_time: resultData.needFollowUp ? resultData.time : null,
                student_id: selectedApptDetails.student_user_id
            }, { headers: { 'x-auth-token': token } });
            
            alert("บันทึกผลและเสร็จสิ้นเคสเรียบร้อย!");
            setShowResultModal(false);
            setResultData({ summary: '', needFollowUp: false, date: '', time: '' });
            await fetchAppointments();
            if (onAppointmentUpdate) onAppointmentUpdate(); // 🌟 อัปเดต Sidebar ตัวเลข
        } catch (err) { 
            alert("เกิดข้อผิดพลาดในการบันทึก"); 
        } finally {
            setIsSubmitting(false);
        }
    };

    const openChat = (appt) => { setSelectedChatAppt(appt); setShowChat(true); };
    const openDetails = (appt) => { setSelectedApptDetails(appt); setShowDetails(true); };

    const isToday = (d) => {
        if (!d) return false;
        const today = new Date();
        const date = new Date(d);
        return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    };

    const formatTimeSlot = (start, end, apptTime) => {
        let startTime = start ? start.substring(0, 5) : (apptTime ? String(apptTime).substring(0, 5) : '00:00');
        let endTime = end ? end.substring(0, 5) : '00:00';
        return `${startTime.replace(':', '.')}-${endTime.replace(':', '.')}`;
    };

    const isChatOpen = (appt) => {
        const status = String(appt.status).toLowerCase();
        const type = String(appt.type || appt.meeting_type).toLowerCase();
        
        if (status !== 'confirmed') return false; 
        if (type !== 'online' && type !== 'ออนไลน์') return false; 

        try {
            const now = new Date();
            const apptDate = new Date(appt.date || appt.appointment_date);
            const timeStr = appt.start_time || appt.appointment_time || "00:00:00";
            const [hours, minutes] = timeStr.split(':').map(Number);
            apptDate.setHours(hours, minutes, 0, 0);
            return now >= apptDate;
        } catch (error) { return false; }
    };

    let filteredAppointments = appointments.filter(a => {
        const s = String(a.status).toLowerCase();
        return s !== 'completed' && s !== 'cancelled' && s !== 'no-show';
    });
    
    if (filterStatus === 'pending') filteredAppointments = filteredAppointments.filter(a => String(a.status).toLowerCase() === 'pending');
    else if (filterStatus === 'today') filteredAppointments = filteredAppointments.filter(a => String(a.status).toLowerCase() === 'confirmed' && isToday(a.date || a.appointment_date));
    else if (filterStatus === 'confirmed') filteredAppointments = filteredAppointments.filter(a => String(a.status).toLowerCase() === 'confirmed');

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

    filteredAppointments.sort((a, b) => {
        const dateA = new Date(a.date || a.appointment_date);
        const dateB = new Date(b.date || b.appointment_date);
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        const timeA = a.start_time || a.appointment_time || '00:00';
        const timeB = b.start_time || b.appointment_time || '00:00';
        return timeA.localeCompare(timeB); 
    });

    const opStats = {
        all: filteredAppointments.length, 
        newRequests: appointments.filter(a => String(a.status).toLowerCase() === 'pending').length,
        todaySchedule: appointments.filter(a => String(a.status).toLowerCase() === 'confirmed' && isToday(a.date || a.appointment_date)).length,
        confirmedUpcoming: appointments.filter(a => String(a.status).toLowerCase() === 'confirmed').length,
    };

    const statCardsData = [
        { title: "นัดหมายที่เปิดอยู่", count: opStats.all, unit: "รายการ", icon: <FaClipboardList/>, type: "stat-blue", filterKey: 'all' },
        { title: "คำขอใหม่ (รอยืนยัน)", count: opStats.newRequests, unit: "รายการ", icon: <FaUserClock/>, type: "stat-purple", filterKey: 'pending' },
        { title: "นัดหมายวันนี้", count: opStats.todaySchedule, unit: "ราย", icon: <FaCalendarDay/>, type: "stat-ocean", filterKey: 'today' },
        { title: "ยืนยันแล้ว (รอพบ)", count: opStats.confirmedUpcoming, unit: "คิว", icon: <FaUserCheck/>, type: "stat-sweet", filterKey: 'confirmed' }
    ];

    const getStatusBadge = (status) => {
        const s = status ? String(status).toLowerCase() : '';
        if (s === 'confirmed' || s === 'ยืนยัน') return <Badge bg="success" className="px-3 py-2 rounded-pill fw-normal shadow-sm"><FaCheck className="me-1"/> ยืนยันแล้ว</Badge>;
        if (s === 'pending' || s === 'รอดำเนินการ') return <Badge bg="warning" text="dark" className="px-3 py-2 rounded-pill fw-normal shadow-sm"><FaClock className="me-1"/> รอดำเนินการ</Badge>;
        return <Badge bg="secondary" className="px-3 py-2 rounded-pill fw-normal shadow-sm"><FaCircle className="me-1"/> {status || 'ไม่ระบุ'}</Badge>;
    };

    const getStatusColor = (status) => {
        const s = status ? String(status).toLowerCase() : '';
        if (s === 'confirmed' || s === 'ยืนยัน') return '#198754';
        if (s === 'pending' || s === 'รอดำเนินการ') return '#ffc107';
        return '#6c757d';
    };

    const getMeetingTypeBadge = (type) => {
        const t = type ? String(type).toLowerCase() : '';
        if(t === 'online' || t === 'ออนไลน์') return <Badge bg="primary" className="px-3 py-2 rounded-pill fw-normal shadow-sm"><FaVideo className="me-1"/> ออนไลน์</Badge>;
        return <Badge bg="info" text="dark" className="px-3 py-2 rounded-pill fw-normal shadow-sm"><FaBuilding className="me-1"/> On-site</Badge>;
    };

    const renderActionButtons = (app) => {
        const status = String(app.status).toLowerCase();
        const type = String(app.type || app.meeting_type).toLowerCase();
        const chatOpen = isChatOpen(app);

        if (status === 'pending') {
            return (
                <>
                    <Button variant="success" className="flex-grow-1 fw-bold btn-action" onClick={() => handleStatusChange(app.appointment_id, 'Confirmed')}><FaCheck/> ยืนยัน</Button>
                    <Button variant="danger" className="flex-grow-1 fw-bold btn-action" onClick={() => handleStatusChange(app.appointment_id, 'Cancelled')}><FaTimes/> ปฏิเสธ</Button>
                </>
            );
        } else if (status === 'confirmed') {
            return (
                <div className="d-flex flex-wrap gap-2 w-100">
                    {(type === 'online' || type === 'ออนไลน์') && (
                        <Button variant={chatOpen ? "primary" : "secondary"} className="flex-grow-1 fw-bold btn-action" onClick={() => openChat(app)} disabled={!chatOpen}>
                            <FaComments className="me-1"/> {chatOpen ? 'แชท' : 'ยังไม่ถึงเวลา'}
                        </Button>
                    )}
                    <Button variant="warning" className="flex-grow-1 fw-bold text-dark btn-action" onClick={() => { setSelectedApptDetails(app); setShowResultModal(true); }}>
                        <FaClipboardList className="me-1"/> บันทึกผล
                    </Button>
                    <Button variant="outline-dark" className="fw-bold btn-action" onClick={() => handleNoShow(app.appointment_id)}>
                        <FaUserTimes /> ขาดนัด
                    </Button>
                </div>
            );
        }
        return null;
    };

    if (loading) return (
        <div className="d-flex flex-column align-items-center justify-content-center vh-100">
            <div className="spinner-border text-primary" role="status"></div><span className="mt-3 text-muted fw-bold">กำลังโหลดข้อมูล...</span>
        </div>
    );

    return (
        <div className="appt-container px-3 px-lg-5 py-4">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end mb-4 gap-4">
                <div className="d-flex align-items-center">
                    <div className="brand-icon-box me-3"><FaCalendarAlt /></div>
                    <div><h2 className="fw-bold m-0 text-navy">จัดการการนัดหมาย</h2><p className="text-muted m-0 small">จัดการคำขอและบันทึกผลการเข้าปรึกษา</p></div>
                </div>
            </div>

            <Row className="g-3 mb-4">
                {statCardsData.map((item, idx) => (
                    <Col xs={12} sm={6} lg={3} key={idx}>
                        <div className={`stat-card-modern ${item.type} ${filterStatus === item.filterKey ? 'active-filter' : ''}`} onClick={() => setFilterStatus(item.filterKey)}>
                            <div className="d-flex justify-content-between align-items-start">
                                <div><div className="stat-label">{item.title}</div><div className="stat-number">{item.count} <span className="stat-unit">{item.unit}</span></div></div>
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
                        <Form.Control placeholder="ค้นหาชื่อนักเรียน..." className="bg-light border-0 shadow-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </InputGroup>
                    <InputGroup style={{ maxWidth: '200px' }}>
                        <InputGroup.Text className="bg-light border-0 text-muted"><FaFilter/></InputGroup.Text>
                        <Form.Select className="bg-light border-0 shadow-none fw-bold text-secondary" value={filterMeetingType} onChange={(e) => setFilterMeetingType(e.target.value)}>
                            <option value="all">รูปแบบ (ทั้งหมด)</option><option value="online">ออนไลน์</option><option value="onsite">On-site</option>
                        </Form.Select>
                    </InputGroup>
                </div>
                <div className="view-toggle-pill flex-shrink-0">
                    <button className={viewMode === 'card' ? 'active' : ''} onClick={() => setViewMode('card')}>การ์ด</button>
                    <button className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>ตาราง</button>
                </div>
            </div>

            {filteredAppointments.length === 0 ? (
                <div className="empty-state text-center p-5 bg-white rounded-4 shadow-sm"><FaHistory className="mb-3 opacity-25" size={40}/><h5>ไม่พบงานที่ต้องดำเนินการ</h5></div>
            ) : (
                <>
                    {viewMode === 'card' ? (
                        <Row className="g-4">
                            {filteredAppointments.map((app) => {
                                const appDate = new Date(app.date || app.appointment_date);
                                const timeStr = formatTimeSlot(app.start_time, app.end_time, app.appointment_time);
                                return (
                                    <Col lg={4} md={6} key={app.appointment_id}>
                                        <Card className="appt-card h-100 border-0">
                                            <div className="status-line" style={{ backgroundColor: getStatusColor(app.status) }}></div>
                                            <Card.Body className="p-4 d-flex flex-column">
                                                <div className="d-flex justify-content-between mb-3 align-items-start">
                                                    <div className="date-badge">
                                                        <span className="d-day">{appDate.getDate()}</span><span className="d-month">{appDate.toLocaleDateString('th-TH', {month: 'short'})}</span>
                                                    </div>
                                                    <div className="text-end d-flex flex-column gap-2 align-items-end">
                                                        {getStatusBadge(app.status)}
                                                        {getMeetingTypeBadge(app.type || app.meeting_type)}
                                                    </div>
                                                </div>
                                                <div className="text-muted small mb-3 bg-light p-2 rounded-3 d-inline-block" style={{ width: 'fit-content' }}>
                                                    <FaClock className="me-2 text-primary"/>เวลา: <strong className="text-dark">{timeStr} น.</strong>
                                                </div>
                                                <h6 className="topic-text mb-3">{app.topic || 'ไม่ระบุหัวข้อ'}</h6>
                                                <div className="student-box mb-3">
                                                    <div className="d-flex align-items-center mb-2"><div className="avatar-circle me-2"><FaUserGraduate/></div><div className="fw-bold text-dark">{app.student_name || app.fullname}</div></div>
                                                    <div className="assessment-row"><FaFileMedical className="text-danger me-1"/> <span className="text-muted small me-1">ผลประเมิน:</span> <span className="fw-bold text-dark small">{app.stress_level || app.latest_assessment || 'ไม่มีข้อมูล'}</span></div>
                                                </div>
                                                <div className="mt-auto pt-3 border-top d-flex gap-2">
                                                    {renderActionButtons(app)}
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
                                    <tr><th className="ps-4">วัน-เวลา</th><th>นักเรียน</th><th>หัวข้อ / ผลประเมิน</th><th>สถานะ & ประเภท</th><th className="text-end pe-4">จัดการ</th></tr>
                                </thead>
                                <tbody>
                                    {filteredAppointments.map(app => (
                                        <tr key={app.appointment_id} className="table-row-hover">
                                            <td className="ps-4">
                                                <div className="fw-bold text-navy">{new Date(app.date || app.appointment_date).toLocaleDateString('th-TH', {day: 'numeric', month: 'short'})}</div>
                                                <small className="text-muted"><FaClock className="me-1"/>{formatTimeSlot(app.start_time, app.end_time, app.appointment_time)} น.</small>
                                            </td>
                                            <td><div className="d-flex align-items-center gap-2"><div className="avatar-circle small"><FaUserGraduate/></div><span className="fw-bold text-dark">{app.student_name || app.fullname}</span></div></td>
                                            <td><div className="text-dark fw-semibold text-truncate" style={{maxWidth: '200px'}}>{app.topic || '-'}</div><div className="text-danger small"><FaFileMedical className="me-1"/>{app.stress_level || app.latest_assessment || 'ไม่มีข้อมูล'}</div></td>
                                            <td><div className="d-flex flex-column gap-1 align-items-start">{getStatusBadge(app.status)}{getMeetingTypeBadge(app.type || app.meeting_type)}</div></td>
                                            <td className="text-end pe-4 d-flex gap-2 justify-content-end">{renderActionButtons(app)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Modal บันทึกผลการปรึกษา */}
            <Modal show={showResultModal} onHide={() => setShowResultModal(false)} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold"><FaClipboardList className="me-2 text-warning"/> บันทึกผลการให้คำปรึกษา</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3">
                    <Form>
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold">สรุปอาการและคำแนะนำ <span className="text-danger">*</span></Form.Label>
                            <Form.Control as="textarea" rows={4} placeholder="ระบุสิ่งที่ได้พูดคุยและการประเมินเบื้องต้น..." value={resultData.summary} onChange={(e) => setResultData({...resultData, summary: e.target.value})} />
                        </Form.Group>
                        <Form.Group className="mb-3 p-3 bg-light rounded-3 border">
                            <Form.Check type="checkbox" label="ต้องการนัดหมายนักเรียนเพื่อติดตามอาการ (Follow-up)" className="fw-bold text-primary mb-2" checked={resultData.needFollowUp} onChange={(e) => setResultData({...resultData, needFollowUp: e.target.checked})} />
                            {resultData.needFollowUp && (
                                <Row className="g-2 mt-2">
                                    <Col><Form.Label className="small text-muted mb-1">วันที่</Form.Label><Form.Control type="date" value={resultData.date} onChange={(e) => setResultData({...resultData, date: e.target.value})} /></Col>
                                    <Col><Form.Label className="small text-muted mb-1">เวลา</Form.Label><Form.Control type="time" value={resultData.time} onChange={(e) => setResultData({...resultData, time: e.target.value})} /></Col>
                                </Row>
                            )}
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="success" className="w-100 rounded-pill fw-bold shadow-sm" onClick={submitResult} disabled={isSubmitting}>
                        {isSubmitting ? <Spinner size="sm" animation="border" /> : "บันทึกผลและเสร็จสิ้นการนัดหมาย"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Chat Modal */}
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
                    <ChatRoom roomID={`appt-${selectedChatAppt?.appointment_id}`} userId={String(currentUserId)} username="นักจิตวิทยา" otherName={selectedChatAppt?.student_name || selectedChatAppt?.fullname} />
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default AppointmentManager;