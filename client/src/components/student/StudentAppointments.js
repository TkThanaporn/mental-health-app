import React, { useState, useEffect, useMemo } from 'react';
import { Container, Button, Card, Row, Col, Badge, Modal, Spinner, Table } from 'react-bootstrap';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';
import ChatRoom from '../common/ChatRoom'; 
import { 
    FaComments, FaUserMd, FaClock, FaCalendarAlt, FaHistory, 
    FaCheckCircle, FaTimesCircle, FaExclamationCircle, FaListUl, FaAtom,
    FaThLarge, FaBars, FaInfoCircle, FaCheck, FaTimes, FaCircle,
    FaVideo, FaBuilding, FaClipboardList
} from 'react-icons/fa';

import './StudentAppointments.css';
import PCSHSNavbar from '../common/Navbar/PCSHSNavbar';

const StudentAppointments = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserName, setCurrentUserName] = useState("นักเรียน");
    
    // Chat & Details States
    const [showChat, setShowChat] = useState(false);
    const [selectedChatAppt, setSelectedChatAppt] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedApptDetails, setSelectedApptDetails] = useState(null);

    const [viewMode, setViewMode] = useState('grid'); 
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const userObj = decoded.user || decoded;
                setCurrentUserId(userObj.id || userObj.user_id);
                if(userObj.name) setCurrentUserName(userObj.name);
            } catch (e) { console.error("Token Error", e); }
        }
        fetchMyHistory();
    }, []);

    const fetchMyHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/appointments/my-appointments', {
                headers: { 'x-auth-token': token }
            });
            setAppointments(res.data);
            setLoading(false);
        } catch (err) { console.error(err); setLoading(false); }
    };

    const statusCounts = useMemo(() => {
        const counts = { All: appointments.length, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
        appointments.forEach(appt => {
            const s = String(appt.status).toLowerCase();
            if (counts[s] !== undefined) counts[s]++;
        });
        return counts;
    }, [appointments]);

    const filteredAppointments = useMemo(() => {
        if (filterStatus === 'All') return appointments;
        return appointments.filter(appt => String(appt.status).toLowerCase() === filterStatus.toLowerCase());
    }, [filterStatus, appointments]);

    // ==========================================
    // Helper Functions: จัดการเวลา และสถานะแชท
    // ==========================================

    // 1. จัดรูปแบบเวลาเป็น 00.00-00.00
    const formatTimeSlot = (start, end, apptTime) => {
        let startTime = start ? start.substring(0, 5) : (apptTime ? String(apptTime).substring(0, 5) : '00:00');
        let endTime = end ? end.substring(0, 5) : '00:00';
        
        startTime = startTime.replace(':', '.');
        endTime = endTime.replace(':', '.');

        return `${startTime}-${endTime}`;
    };

    // 2. เช็คว่าเปิดแชทได้หรือยัง (ต้องถึงเวลาและสถานะต้องไม่ใช่ยกเลิก/เสร็จสิ้น)
    const isChatOpen = (appt) => {
        const status = String(appt.status).toLowerCase();
        
        // ถ้าสถานะไม่ใช่ยืนยัน หรือรอดำเนินการ จะไม่ให้แชท
        if (status !== 'confirmed' && status !== 'pending') return false;

        try {
            const now = new Date();
            const apptDate = new Date(appt.date || appt.appointment_date);
            
            // ดึงเวลาเริ่มนัดหมายมาตั้งค่า
            const timeStr = appt.start_time || appt.appointment_time || "00:00:00";
            const [hours, minutes] = timeStr.split(':').map(Number);
            apptDate.setHours(hours, minutes, 0, 0);

            // คืนค่า true ถ้าเวลาปัจจุบัน >= เวลานัดหมาย
            return now >= apptDate;
        } catch (error) {
            return false;
        }
    };

    // ==========================================
    // UI Badges
    // ==========================================
    const getStatusBadge = (status) => {
        const s = status ? String(status).toLowerCase() : '';
        if (s === 'confirmed' || s === 'ยืนยัน') return <Badge bg="success" className="px-3 py-2 rounded-pill fw-normal shadow-sm"><FaCheck className="me-1"/> ยืนยันแล้ว</Badge>;
        if (s === 'cancelled' || s === 'ยกเลิก') return <Badge bg="danger" className="px-3 py-2 rounded-pill fw-normal shadow-sm"><FaTimes className="me-1"/> ยกเลิกแล้ว</Badge>;
        if (s === 'pending' || s === 'รอดำเนินการ') return <Badge bg="warning" text="dark" className="px-3 py-2 rounded-pill fw-normal shadow-sm"><FaClock className="me-1"/> รออนุมัติ</Badge>;
        if (s === 'completed' || s === 'เสร็จสิ้น') return <Badge bg="secondary" className="px-3 py-2 rounded-pill fw-normal shadow-sm"><FaHistory className="me-1"/> เสร็จสิ้น</Badge>;
        return <Badge bg="secondary" className="px-3 py-2 rounded-pill fw-normal shadow-sm"><FaCircle className="me-1"/> {status || 'ไม่ระบุ'}</Badge>;
    };

    const getStatusColor = (status) => {
        const s = status ? String(status).toLowerCase() : '';
        if (s === 'confirmed' || s === 'ยืนยัน') return '#198754';
        if (s === 'cancelled' || s === 'ยกเลิก') return '#dc3545';
        if (s === 'pending' || s === 'รอดำเนินการ') return '#ffc107';
        if (s === 'completed' || s === 'เสร็จสิ้น') return '#6c757d';
        return '#6c757d';
    };

    const getMeetingTypeBadge = (type) => {
        const t = type ? String(type).toLowerCase() : '';
        if(t === 'online' || t === 'ออนไลน์') return <Badge bg="primary" className="px-3 py-2 rounded-pill fw-normal shadow-sm"><FaVideo className="me-1"/> ออนไลน์</Badge>;
        return <Badge bg="info" text="dark" className="px-3 py-2 rounded-pill fw-normal shadow-sm"><FaBuilding className="me-1"/> พบตัว (On-site)</Badge>;
    };

    const filterOptions = [
        { key: 'All', label: 'ทั้งหมด', icon: <FaListUl /> },
        { key: 'pending', label: 'รออนุมัติ', icon: <FaExclamationCircle /> },
        { key: 'confirmed', label: 'ยืนยันแล้ว', icon: <FaCheckCircle /> },
        { key: 'completed', label: 'เสร็จสิ้น', icon: <FaHistory /> },
        { key: 'cancelled', label: 'ยกเลิก', icon: <FaTimesCircle /> },
    ];

    const openDetails = (appt) => {
        setSelectedApptDetails(appt);
        setShowDetails(true);
    };

    return (
        <div className="pcshs-theme-page">
            <PCSHSNavbar />
            
            <Container className="py-5 position-relative" style={{ marginTop: '80px', minHeight: '80vh', zIndex: 2 }}>
                
                {/* Header & View Switcher */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                    <div>
                        <h6 className="text-primary fw-bold letter-spacing-1 text-uppercase mb-1">
                            <FaAtom className="me-2" />PCSHS Student Care
                        </h6>
                        <h2 className="fw-extrabold text-navy m-0">การนัดหมายของฉัน</h2>
                    </div>
                    
                    <div className="d-flex align-items-center gap-2">
                        <div className="view-mode-selector bg-white p-1 rounded-pill border d-flex me-2 shadow-sm">
                            <button 
                                className={`btn-view ${viewMode === 'grid' ? 'active' : ''}`} 
                                onClick={() => setViewMode('grid')}
                                title="ดูแบบการ์ด"
                            >
                                <FaThLarge />
                            </button>
                            <button 
                                className={`btn-view ${viewMode === 'table' ? 'active' : ''}`} 
                                onClick={() => setViewMode('table')}
                                title="ดูแบบตาราง"
                            >
                                <FaBars />
                            </button>
                        </div>
                        <Button className="btn-pcshs-primary rounded-pill px-4 shadow-sm fw-bold" onClick={() => navigate('/student/book')}>
                            + จองคิวปรึกษา
                        </Button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="filter-wrapper p-2 mb-4 rounded-pill shadow-sm bg-white d-inline-flex flex-wrap gap-2">
                    {filterOptions.map((opt) => (
                        <button
                            key={opt.key}
                            onClick={() => setFilterStatus(opt.key)}
                            className={`filter-tab ${filterStatus.toLowerCase() === opt.key.toLowerCase() ? 'active' : ''}`}
                        >
                            <span className="me-1">{opt.icon}</span>
                            {opt.label}
                            {statusCounts[opt.key.toLowerCase()] > 0 && <span className="count-badge ms-2">{statusCounts[opt.key.toLowerCase()]}</span>}
                        </button>
                    ))}
                </div>
                
                {loading ? (
                    <div className="text-center py-5"><Spinner animation="border" className="text-primary" /></div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="empty-state-card text-center py-5 fade-in-up bg-white rounded-4 shadow-sm border border-light">
                        <FaCalendarAlt size={50} className="text-muted opacity-25 mb-3" />
                        <h5 className="fw-bold text-navy">ไม่พบรายการนัดหมาย</h5>
                        <p className="text-muted mb-4">คุณยังไม่มีการนัดหมายในสถานะนี้</p>
                        <Button variant="outline-primary" className="rounded-pill px-4" onClick={() => navigate('/student/book')}>ไปจองคิวกันเลย!</Button>
                    </div>
                ) : (
                    viewMode === 'grid' ? (
                        <Row className="g-4">
                            {filteredAppointments.map(appt => {
                                const appDate = new Date(appt.date || appt.appointment_date);
                                const timeStr = formatTimeSlot(appt.start_time, appt.end_time, appt.appointment_time);
                                const chatOpen = isChatOpen(appt); // ตรวจสอบว่าแชทเปิดได้หรือไม่
                                
                                return (
                                    <Col lg={4} md={6} key={appt.appointment_id} className="fade-in-up">
                                        <Card className="pcshs-card h-100 border-0 shadow-sm">
                                            <div className="card-top-accent" style={{ backgroundColor: getStatusColor(appt.status) }}></div>
                                            <Card.Body className="p-4 d-flex flex-column">
                                                
                                                <div className="d-flex justify-content-between mb-3 align-items-start">
                                                    <div className="date-badge">
                                                        <span className="d-day">{appDate.getDate()}</span>
                                                        <span className="d-month">{appDate.toLocaleDateString('th-TH', {month: 'short'})}</span>
                                                    </div>
                                                    <div className="text-end d-flex flex-column gap-2 align-items-end">
                                                        {getStatusBadge(appt.status)}
                                                        {getMeetingTypeBadge(appt.type || appt.meeting_type)}
                                                    </div>
                                                </div>

                                                <h5 className="fw-bold mb-3 text-navy text-truncate">{appt.topic || 'การปรึกษาทั่วไป'}</h5>
                                                
                                                <div className="info-box bg-light p-3 rounded-3 mb-3 flex-grow-1">
                                                    <div className="mb-2 d-flex align-items-center">
                                                        <FaUserMd className="text-primary me-2"/>
                                                        <span className="fw-semibold text-dark">{appt.psychologist_name || 'รอจัดสรรนักจิตวิทยา'}</span>
                                                    </div>
                                                    <div className="d-flex align-items-center text-muted small">
                                                        <FaClock className="text-primary me-2"/> เวลา: <strong className="text-dark ms-1">{timeStr} น.</strong>
                                                    </div>
                                                </div>

                                                <div className="mt-auto d-flex gap-2">
                                                    <Button variant="light" className="flex-grow-1 text-primary fw-bold border" onClick={() => openDetails(appt)}>
                                                        <FaInfoCircle className="me-1"/> ข้อมูล
                                                    </Button>
                                                    <Button 
                                                        variant={chatOpen ? "primary" : "secondary"} 
                                                        className="flex-grow-1 fw-bold" 
                                                        onClick={() => {setSelectedChatAppt(appt); setShowChat(true);}}
                                                        disabled={!chatOpen}
                                                    >
                                                        <FaComments className="me-1"/> {chatOpen ? 'แชท' : 'ยังไม่ถึงเวลา'}
                                                    </Button>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>
                    ) : (
                        <div className="table-responsive bg-white rounded-4 shadow-sm fade-in-up p-3">
                            <Table hover className="m-0 pcshs-modern-table align-middle">
                                <thead>
                                    <tr>
                                        <th className="ps-3">วันที่ และ เวลา</th>
                                        <th>หัวข้อการปรึกษา</th>
                                        <th>นักจิตวิทยา</th>
                                        <th>รูปแบบ & สถานะ</th>
                                        <th className="text-end pe-3">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAppointments.map(appt => {
                                        const timeStr = formatTimeSlot(appt.start_time, appt.end_time, appt.appointment_time);
                                        const chatOpen = isChatOpen(appt);

                                        return (
                                            <tr key={appt.appointment_id}>
                                                <td className="ps-3">
                                                    <div className="fw-bold text-navy">{new Date(appt.date || appt.appointment_date).toLocaleDateString('th-TH', {day: 'numeric', month: 'short'})}</div>
                                                    <small className="text-muted"><FaClock className="me-1"/>{timeStr} น.</small>
                                                </td>
                                                <td className="fw-semibold text-dark">{appt.topic || 'การปรึกษาทั่วไป'}</td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="bg-light text-primary rounded-circle d-flex align-items-center justify-content-center" style={{width:'30px', height:'30px'}}><FaUserMd/></div>
                                                        <span>{appt.psychologist_name || 'รอดำเนินการ'}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex flex-column gap-1 align-items-start">
                                                        {getStatusBadge(appt.status)}
                                                        {getMeetingTypeBadge(appt.type || appt.meeting_type)}
                                                    </div>
                                                </td>
                                                <td className="text-end pe-3">
                                                    <Button size="sm" variant="light" className="rounded-pill px-3 me-2 text-primary fw-bold border" onClick={() => openDetails(appt)}>ข้อมูล</Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant={chatOpen ? "primary" : "secondary"} 
                                                        className="rounded-pill px-3 fw-bold" 
                                                        onClick={() => {setSelectedChatAppt(appt); setShowChat(true);}}
                                                        disabled={!chatOpen}
                                                    >
                                                        {chatOpen ? 'แชท' : 'ยังไม่ถึงเวลา'}
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </div>
                    )
                )}
            </Container>

            {/* --- Details Modal --- */}
            <Modal show={showDetails} onHide={() => setShowDetails(false)} size="md" centered className="details-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold text-navy"><FaClipboardList className="me-2 text-primary"/>รายละเอียดการนัดหมาย</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3">
                    {selectedApptDetails && (
                        <div className="details-content">
                            <div className="text-center mb-4">
                                <div className="bg-light text-primary rounded-circle mx-auto d-flex align-items-center justify-content-center mb-2" style={{width: '60px', height: '60px', fontSize: '1.5rem'}}><FaUserMd/></div>
                                <h5 className="fw-bold m-0">{selectedApptDetails.psychologist_name || 'รอจัดสรรนักจิตวิทยา'}</h5>
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
                                <div className="fw-semibold text-dark p-2 border rounded-3 bg-white">{selectedApptDetails.topic || 'การปรึกษาทั่วไป'}</div>
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
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="outline-secondary" className="rounded-pill w-100 fw-bold" onClick={() => setShowDetails(false)}>ปิดหน้าต่าง</Button>
                </Modal.Footer>
            </Modal>

            {/* --- Chat Modal --- */}
            <Modal show={showChat && selectedChatAppt} onHide={() => setShowChat(false)} size="lg" centered className="pcshs-modal">
                <Modal.Header closeButton className="bg-light border-0">
                    <Modal.Title className="d-flex align-items-center gap-3">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{width:40, height:40}}><FaUserMd/></div>
                        <div>
                            <div className="fw-bold text-navy fs-5">{selectedChatAppt?.psychologist_name || 'นักจิตวิทยา'}</div>
                            <div className="small text-muted fw-normal">หัวข้อ: {selectedChatAppt?.topic || 'ปรึกษาทั่วไป'}</div>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0 bg-light" style={{ height: '500px' }}>
                    {selectedChatAppt && currentUserId && (
                        <ChatRoom 
                            roomID={`appt-${selectedChatAppt.appointment_id}`} 
                            userId={String(currentUserId)} 
                            username={currentUserName} 
                            otherName={selectedChatAppt.psychologist_name || 'นักจิตวิทยา'} 
                        />
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default StudentAppointments;