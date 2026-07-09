import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Button, Row, Col, Modal, InputGroup, Form, Spinner } from 'react-bootstrap';
import { jwtDecode } from "jwt-decode";
import ChatRoom from '../common/ChatRoom';
import { 
    FaComments, FaCheck, FaTimes, FaHistory, FaUserGraduate, 
    FaClock, FaSearch, FaCircle, FaCalendarAlt, FaUserClock, 
    FaCalendarDay, FaUserCheck, FaCheckCircle, FaVideo, FaBuilding, 
    FaFileMedical, FaInfoCircle, FaClipboardList, FaFilter, FaUserTimes, 
    FaUserFriends, FaEnvelope
} from 'react-icons/fa';

import './AppointmentManager.css'; 
import './AllAppointmentList.css'; // 👈 นำเข้าไฟล์สไตล์สำหรับคลาสพรีเมียม

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

    const [showResultModal, setShowResultModal] = useState(false);
    const [resultData, setResultData] = useState({ summary: '', needFollowUp: false, date: '', time: '' });
    
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
        const statusTh = status === 'Confirmed' ? 'ยืนยันการนัดหมาย' : 'ปฏิเสธการนัดหมาย';
        if (!window.confirm(`คุณต้องการ ${statusTh} ใช่หรือไม่?`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/appointments/status/${id}`, { status }, { headers: { 'x-auth-token': token } });
            await fetchAppointments(); 
            if (onAppointmentUpdate) onAppointmentUpdate(); 
        } catch (err) { alert(`เกิดข้อผิดพลาดในการอัปเดตสถานะ`); }
    };

    const handleNoShow = async (id) => {
        if (!window.confirm("ยืนยันว่านักเรียนไม่มาตามนัด (ขาดนัด) ใช่หรือไม่?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/appointments/no-show/${id}`, { 
                note: 'นักเรียนขาดนัด (No-show)' 
            }, { headers: { 'x-auth-token': token } });
            await fetchAppointments(); 
            if (onAppointmentUpdate) onAppointmentUpdate(); 
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
            
            alert("บันทึกผลและเสร็จสิ้นเคสเรียบร้อยแล้ว!");
            setShowResultModal(false);
            setResultData({ summary: '', needFollowUp: false, date: '', time: '' });
            await fetchAppointments();
            if (onAppointmentUpdate) onAppointmentUpdate(); 
        } catch (err) { 
            alert("เกิดข้อผิดพลาดในการบันทึกผล"); 
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
        const type = String(appt.type || appt.meeting_type).toLowerCase().trim();
        
        if (status !== 'confirmed') return false; 
        if (type !== 'online' && type !== 'ออนไลน์' && type !== 'video') return false; 

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
            const type = String(a.type || a.meeting_type).toLowerCase().trim();
            if (filterMeetingType === 'online') {
                return type === 'online' || type === 'ออนไลน์' || type === 'video';
            }
            if (filterMeetingType === 'onsite') {
                return type === 'onsite' || type === 'on-site' || type === 'พบตัว' || type === 'ออนไซต์' || type === 'room';
            }
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
        { title: "นัดหมายวันนี้", count: opStats.todaySchedule, unit: "คิว", icon: <FaCalendarDay/>, type: "stat-ocean", filterKey: 'today' },
        { title: "ยืนยันแล้ว (รอพบ)", count: opStats.confirmedUpcoming, unit: "คิว", icon: <FaUserCheck/>, type: "stat-sweet", filterKey: 'confirmed' }
    ];

    // --- 🎨 ปรับปรุงฟังก์ชันแปลงป้ายกำกับให้เรียกใช้ Premium CSS Classes ---
    const getStatusBadge = (status) => {
        const s = status ? String(status).toLowerCase() : '';
        if (s === 'confirmed' || s === 'ยืนยัน') return <span className="status-chip chip-conf"><FaCheck className="me-1"/> ยืนยันแล้ว</span>;
        if (s === 'pending' || s === 'รอดำเนินการ') return <span className="status-chip chip-pen"><FaClock className="me-1"/> รอดำเนินการ</span>;
        return <span className="status-chip chip-dark"><FaCircle className="me-1"/> {status || 'ไม่ระบุ'}</span>;
    };

    const getStatusColor = (status) => {
        const s = status ? String(status).toLowerCase() : '';
        if (s === 'confirmed' || s === 'ยืนยัน') return '#198754';
        if (s === 'pending' || s === 'รอดำเนินการ') return '#ffc107';
        return '#6c757d';
    };

    const getMeetingTypeBadge = (type) => {
        if (!type) return <span className="info-pill text-muted">ไม่ระบุสถานที่</span>;
        const t = String(type).toLowerCase().trim();
        if (t === 'online' || t === 'ออนไลน์' || t === 'video') {
            return <span className="info-pill"><FaVideo className="me-1 text-primary"/> แชทออนไลน์</span>;
        }
        return <span className="info-pill"><FaBuilding className="me-1 text-info"/> เข้าพบที่ห้องให้คำปรึกษา</span>;
    };

    const getConsultationTypeBadge = (cType) => {
        const t = cType ? String(cType).toLowerCase() : '';
        if (t === 'group' || t === 'กลุ่ม') {
            return <span className="info-pill" style={{ color: '#6f42c1', backgroundColor: '#f4eeff' }}><FaUserFriends className="me-1"/> แบบกลุ่ม</span>;
        }
        return <span className="info-pill"><FaUserGraduate className="me-1 text-secondary"/> รายบุคคล</span>;
    };

    const renderActionButtons = (app) => {
        const status = String(app.status).toLowerCase();
        const type = String(app.type || app.meeting_type).toLowerCase().trim();
        const chatOpen = isChatOpen(app);
        const isOnline = (type === 'online' || type === 'ออนไลน์' || type === 'video');

        const detailsBtn = (
            <Button variant="light" className="flex-grow-1 text-primary fw-bold border btn-action rounded-pill shadow-sm" onClick={() => openDetails(app)}>
                <FaInfoCircle className="me-1"/> ข้อมูล
            </Button>
        );

        if (status === 'pending') {
            return (
                <div className="d-flex flex-wrap gap-2 w-100">
                    {detailsBtn}
                    <Button variant="success" className="flex-grow-1 fw-bold btn-action rounded-pill shadow-sm" onClick={() => handleStatusChange(app.appointment_id, 'Confirmed')}><FaCheck/> ยืนยัน</Button>
                    <Button variant="danger" className="flex-grow-1 fw-bold btn-action rounded-pill shadow-sm" onClick={() => handleStatusChange(app.appointment_id, 'Cancelled')}><FaTimes/> ปฏิเสธ</Button>
                </div>
            );
        } else if (status === 'confirmed') {
            return (
                <div className="d-flex flex-wrap gap-2 w-100">
                    {detailsBtn}
                    {isOnline && (
                        <Button variant={chatOpen ? "primary" : "secondary"} className="flex-grow-1 fw-bold btn-action rounded-pill shadow-sm" onClick={() => openChat(app)} disabled={!chatOpen}>
                            <FaComments className="me-1"/> {chatOpen ? 'แชท' : 'ยังไม่ถึงเวลา'}
                        </Button>
                    )}
                    <Button variant="warning" className="flex-grow-1 fw-bold text-dark btn-action rounded-pill shadow-sm" onClick={() => { setSelectedApptDetails(app); setShowResultModal(true); }}>
                        <FaClipboardList className="me-1"/> บันทึกผล
                    </Button>
                    <Button variant="outline-dark" className="fw-bold btn-action flex-grow-1 rounded-pill shadow-sm" onClick={() => handleNoShow(app.appointment_id)}>
                        <FaUserTimes /> ขาดนัด
                    </Button>
                </div>
            );
        }
        return <div className="d-flex w-100">{detailsBtn}</div>;
    };

    if (loading) return (
        <div className="loading-science-container text-center py-5" style={{minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
            <Spinner animation="grow" variant="primary" style={{width: '3rem', height: '3rem'}} />
            <div className="loading-text mt-4 fw-bold pcshs-navy fs-5">กำลังเรียกข้อมูลการนัดหมาย...</div>
        </div>
    );

    return (
        <div className="pcshs-archive-container fade-in-up px-3 px-lg-5 py-4">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end mb-4 gap-4">
                <div className="d-flex align-items-center">
                    <div className="brand-icon-box me-3"><FaCalendarAlt /></div>
                    <div>
                        <h2 className="fw-bold m-0 text-navy display-6 fw-bold" style={{letterSpacing: '-1px'}}>จัดการการนัดหมาย</h2>
                        <p className="text-muted m-0 mt-1 lead fs-6">จัดการคำขอเร่งด่วนและบันทึกผลการเข้าปรึกษาทางจิตวิทยา</p>
                    </div>
                </div>
            </div>

            {/* แผง Stat สไตล์พรีเมียม */}
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

            {/* แผงตัวกรองดีไซน์กระจก (Glassmorphism) */}
            <div className="filter-bar glass-panel p-3 mb-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 border-0 shadow-sm">
                <div className="d-flex gap-3 w-100 align-items-center flex-wrap">
                    <InputGroup className="search-box-modern flex-grow-1" style={{ maxWidth: '400px' }}>
                        <InputGroup.Text className="bg-light border-0 ps-3 text-muted"><FaSearch/></InputGroup.Text>
                        <Form.Control placeholder="ค้นหาชื่อนักเรียน..." className="bg-light border-0 shadow-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </InputGroup>
                    <InputGroup style={{ maxWidth: '200px' }}>
                        <InputGroup.Text className="bg-light border-0 text-muted"><FaFilter/></InputGroup.Text>
                        <Form.Select className="bg-light border-0 shadow-none fw-bold text-secondary" value={filterMeetingType} onChange={(e) => setFilterMeetingType(e.target.value)}>
                            <option value="all">รูปแบบ (ทั้งหมด)</option><option value="online">ออนไลน์</option><option value="onsite">พบตัวจริง</option>
                        </Form.Select>
                    </InputGroup>
                </div>
                <div className="view-toggle-pill flex-shrink-0">
                    <button className={viewMode === 'card' ? 'active' : ''} onClick={() => setViewMode('card')}>การ์ด</button>
                    <button className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>ตาราง</button>
                </div>
            </div>

            {filteredAppointments.length === 0 ? (
                <div className="empty-state text-center p-5 bg-white rounded-4 shadow-sm glass-panel border-0"><FaHistory className="mb-3 opacity-25" size={40}/><h5>ไม่พบรายการที่ต้องดำเนินการ</h5></div>
            ) : (
                <>
                    {viewMode === 'card' ? (
                        <Row className="g-4">
                            {filteredAppointments.map((app) => {
                                const appDate = new Date(app.date || app.appointment_date);
                                const timeStr = formatTimeSlot(app.start_time, app.end_time, app.appointment_time);
                                return (
                                    <Col lg={4} md={6} key={app.appointment_id}>
                                        <Card className="appt-card h-100 border-0 shadow-sm glass-panel">
                                            <div className="status-line" style={{ backgroundColor: getStatusColor(app.status) }}></div>
                                            <Card.Body className="p-4 d-flex flex-column">
                                                <div className="d-flex justify-content-between mb-3 align-items-start">
                                                    <div className="date-badge">
                                                        <span className="date-day d-block">{appDate.getDate()}</span>
                                                        <span className="date-month">{appDate.toLocaleDateString('th-TH', {month: 'short'})}</span>
                                                    </div>
                                                    <div className="text-end d-flex flex-column gap-2 align-items-end">
                                                        {getStatusBadge(app.status)}
                                                        {getMeetingTypeBadge(app.type || app.meeting_type)}
                                                    </div>
                                                </div>
                                                <div className="text-muted small mb-3 bg-light p-2 rounded-3 d-inline-block" style={{ width: 'fit-content' }}>
                                                    <FaClock className="me-2 text-primary"/>เวลา: <strong className="text-dark">{timeStr} น.</strong>
                                                </div>
                                                <div className="student-box mb-3">
                                                    <div className="d-flex align-items-center mb-2">
                                                        <div className="student-avatar-glow me-2" style={{width: '35px', height: '35px', fontSize: '1rem'}}><FaUserGraduate/></div>
                                                        <div className="fw-bold text-dark">{app.student_name || app.fullname}</div>
                                                    </div>
                                                    <div className="topic-badge mt-2">
                                                        <FaFileMedical className="text-danger me-1"/> 
                                                        <span className="text-muted small me-1">ผลประเมิน:</span> 
                                                        <span className="fw-bold text-dark small">{app.stress_level || app.latest_assessment || 'ไม่มีข้อมูล'}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-auto pt-3 border-top d-flex flex-wrap gap-2">
                                                    {renderActionButtons(app)}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>
                    ) : (
                        /* --- 📑 เปลี่ยนเป็นระบบตารางพรีเมียมแบบเดียวกับคลังประวัติ --- */
                        <div className="glass-panel modern-table-container p-3">
                            <div className="table-responsive px-2 pb-2 overflow-visible">
                                <table className="pcshs-archive-table w-100">
                                    <thead>
                                        <tr>
                                            <th className="ps-4">วัน-เวลา</th>
                                            <th>นักเรียน</th>
                                            <th>ผลประเมิน</th>
                                            <th>สถานะ & ประเภท</th>
                                            <th className="text-end pe-4">จัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAppointments.map(app => {
                                            const appDate = new Date(app.date || app.appointment_date);
                                            return (
                                                <tr key={app.appointment_id} className="archive-row-card">
                                                    <td className="ps-4">
                                                        <div className="date-badge">
                                                            <span className="date-day d-block">{appDate.getDate()}</span>
                                                            <span className="date-month">{appDate.toLocaleDateString('th-TH', {day: 'numeric', month: 'short'}).replace(appDate.getDate(),'')}</span>
                                                        </div>
                                                        <div className="time-sub-modern">
                                                            <FaClock className="me-1"/>
                                                            {formatTimeSlot(app.start_time, app.end_time, app.appointment_time)} น.
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
                                                        <div className="topic-badge">
                                                            <FaFileMedical className="me-1 text-danger"/>
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
                                                        <div className="d-flex gap-2 justify-content-end align-items-center">
                                                            {renderActionButtons(app)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal บันทึกผล */}
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

            {/* Modal รายละเอียด */}
            <Modal show={showDetails} onHide={() => setShowDetails(false)} size="md" centered className="details-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold text-navy"><FaClipboardList className="me-2 text-primary"/>รายละเอียดการนัดหมาย</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3">
                    {selectedApptDetails && (
                        <div className="details-content">
                            <div className="text-center mb-4">
                                <div className="student-avatar-glow mx-auto mb-2" style={{width: '70px', height: '70px', fontSize: '1.8rem'}}><FaUserGraduate/></div>
                                <h5 className="fw-bold m-0">{selectedApptDetails.student_name || selectedApptDetails.fullname || 'ไม่ระบุชื่อนักเรียน'}</h5>
                                
                                <div className="mt-3 d-flex flex-wrap justify-content-center gap-2 align-items-center">
                                    {getMeetingTypeBadge(selectedApptDetails.type || selectedApptDetails.meeting_type)}
                                    {getConsultationTypeBadge(selectedApptDetails.consultation_type)}
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
                                        <div className="fw-bold"><FaClock className="me-2 text-primary"/>{formatTimeSlot(selectedApptDetails.start_time, selectedApptDetails.end_time, selectedApptDetails.appointment_time)} น.</div>
                                    </Col>
                                </Row>
                            </div>

                            {(selectedApptDetails.consultation_type?.toLowerCase() === 'group' || selectedApptDetails.consultation_type === 'กลุ่ม') && (
                                <div className="info-group mb-3 p-3 rounded-4" style={{backgroundColor: '#f9f6ff', border: '1px solid #e1d5f5'}}>
                                    <div className="text-purple small fw-bold mb-2 d-flex align-items-center" style={{color: '#6f42c1'}}>
                                        <FaUserFriends className="me-2"/> อีเมลเพื่อนร่วมกลุ่ม
                                    </div>
                                    {selectedApptDetails.group_members && selectedApptDetails.group_members.length > 0 ? (
                                        <div className="d-flex flex-column gap-2">
                                            {selectedApptDetails.group_members.map((email, i) => (
                                                <div key={i} className="small d-flex align-items-center gap-2 bg-white px-3 py-2 rounded-3 border-0 shadow-sm">
                                                    <FaEnvelope className="text-muted text-secondary"/>
                                                    <span className="fw-medium text-dark">{email}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="small text-muted italic py-1">ไม่มีข้อมูลรายชื่ออีเมลเพื่อนในระบบ</div>
                                    )}
                                </div>
                            )}

                            <div className="info-group mb-3">
                                <div className="text-muted small mb-1">หัวข้อการปรึกษา</div>
                                <div className="fw-semibold text-dark p-2 border rounded-3 bg-white shadow-sm">
                                    {selectedApptDetails.topic || selectedApptDetails.note || 'การปรึกษาทั่วไป'}
                                </div>
                            </div>

                            <div className="info-group border-start border-danger border-4 ps-3 py-2 bg-white shadow-sm rounded-end mb-3">
                                <div className="text-danger small fw-bold mb-1"><FaFileMedical className="me-1"/> ผลการประเมินความเครียดเบื้องต้น</div>
                                <div className="fw-semibold text-dark">{selectedApptDetails.stress_level || selectedApptDetails.latest_assessment || 'ไม่มีข้อมูลการประเมิน'}</div>
                            </div>

                            {selectedApptDetails.result_summary && (
                                <div className="info-group border-start border-success border-4 ps-3 py-2 bg-white shadow-sm rounded-end mt-3">
                                    <div className="text-success small fw-bold mb-1"><FaCheckCircle className="me-1"/> สรุปผลการให้คำปรึกษา</div>
                                    <div className="fw-semibold text-dark">{selectedApptDetails.result_summary}</div>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
            </Modal>

            {/* Chat Modal */}
            <Modal show={showChat && selectedChatAppt} onHide={() => setShowChat(false)} size="lg" centered className="chat-modal-custom">
                <Modal.Header closeButton className="border-0 bg-light">
                    <Modal.Title className="d-flex align-items-center gap-3">
                        <div className="student-avatar-glow" style={{width:'40px', height:'40px', fontSize:'1.1rem'}}><FaUserGraduate/></div>
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