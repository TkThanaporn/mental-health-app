import React, { useState, useEffect, useMemo } from 'react';
import { Container, Button, Card, Row, Col, Badge, Modal, Alert, Spinner, Table } from 'react-bootstrap';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';
import ChatRoom from '../common/ChatRoom'; 
import { 
    FaComments, FaUserMd, FaClock, FaCalendarAlt, FaHistory, 
    FaCheckCircle, FaTimesCircle, FaExclamationCircle, FaListUl, FaAtom,
    FaThLarge, FaBars // ไอคอนสำหรับสลับโหมด
} from 'react-icons/fa';

import './StudentAppointments.css';
import PCSHSNavbar from '../common/Navbar/PCSHSNavbar';

const StudentAppointments = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserName, setCurrentUserName] = useState("นักเรียน");
    const [showChat, setShowChat] = useState(false);
    const [selectedChatAppt, setSelectedChatAppt] = useState(null);

    // State ใหม่สำหรับสลับโหมดการดู (grid = การ์ด, table = ตาราง)
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
        const counts = { All: appointments.length, Pending: 0, Confirmed: 0, Completed: 0, Cancelled: 0 };
        appointments.forEach(appt => {
            if (counts[appt.status] !== undefined) counts[appt.status]++;
        });
        return counts;
    }, [appointments]);

    const filteredAppointments = useMemo(() => {
        if (filterStatus === 'All') return appointments;
        return appointments.filter(appt => appt.status === filterStatus);
    }, [filterStatus, appointments]);

    const getStatusInfo = (status) => {
        switch (status) {
            case 'Confirmed': return { bg: 'success', label: 'ยืนยันแล้ว', icon: <FaCheckCircle/>, color: '#198754' };
            case 'Cancelled': return { bg: 'danger', label: 'ยกเลิก', icon: <FaTimesCircle/>, color: '#dc3545' };
            case 'Pending': return { bg: 'warning', label: 'รออนุมัติ', icon: <FaExclamationCircle/>, color: '#ffc107' };
            case 'Completed': return { bg: 'secondary', label: 'เสร็จสิ้น', icon: <FaHistory/>, color: '#6c757d' };
            default: return { bg: 'secondary', label: status, icon: <FaExclamationCircle/>, color: '#6c757d' };
        }
    };

    const filterOptions = [
        { key: 'All', label: 'ทั้งหมด', icon: <FaListUl /> },
        { key: 'Pending', label: 'รออนุมัติ', icon: <FaExclamationCircle /> },
        { key: 'Confirmed', label: 'ยืนยันแล้ว', icon: <FaCheckCircle /> },
        { key: 'Completed', label: 'เสร็จสิ้น', icon: <FaHistory /> },
        { key: 'Cancelled', label: 'ยกเลิก', icon: <FaTimesCircle /> },
    ];

    return (
        <div className="pcshs-theme-page">
            <PCSHSNavbar />
            <div className="science-bg-pattern"></div>

            <Container className="py-5 position-relative" style={{ marginTop: '80px', minHeight: '80vh', zIndex: 2 }}>
                
                {/* Header & View Switcher */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                    <div>
                        <h6 className="text-orange fw-bold letter-spacing-1 text-uppercase mb-1">
                            <FaAtom className="me-2" />PCSHS Student Care
                        </h6>
                        <h2 className="fw-extrabold text-navy m-0">การนัดหมายของฉัน</h2>
                    </div>
                    
                    <div className="d-flex align-items-center gap-2">
                        {/* ปุ่มสลับโหมดการดู */}
                        <div className="view-mode-selector bg-white p-1 rounded-pill border d-flex me-2">
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
                        <Button className="btn-pcshs-primary rounded-pill px-4" onClick={() => navigate('/student/book')}>
                            + จองคิว
                        </Button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="filter-wrapper p-2 mb-4 rounded-pill shadow-sm bg-white d-inline-flex flex-wrap gap-2">
                    {filterOptions.map((opt) => (
                        <button
                            key={opt.key}
                            onClick={() => setFilterStatus(opt.key)}
                            className={`filter-tab ${filterStatus === opt.key ? 'active' : ''}`}
                        >
                            <span className="me-1">{opt.icon}</span>
                            {opt.label}
                            {statusCounts[opt.key] > 0 && <span className="count-badge ms-2">{statusCounts[opt.key]}</span>}
                        </button>
                    ))}
                </div>
                
                {loading ? (
                    <div className="text-center py-5"><Spinner animation="border" className="text-orange" /></div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="empty-state-card text-center py-5 fade-in-up">
                        <FaCalendarAlt size={50} className="text-muted opacity-25 mb-3" />
                        <h5 className="fw-bold text-navy">ไม่พบรายการนัดหมาย</h5>
                    </div>
                ) : (
                    /* ส่วนแสดงผลข้อมูล เลือกตาม viewMode */
                    viewMode === 'grid' ? (
                        <Row className="g-4">
                            {filteredAppointments.map(appt => {
                                const statusInfo = getStatusInfo(appt.status);
                                return (
                                    <Col lg={4} md={6} key={appt.appointment_id} className="fade-in-up">
                                        <Card className="pcshs-card h-100">
                                            <div className="card-top-accent" style={{ backgroundColor: statusInfo.color }}></div>
                                            <Card.Body className="p-4 d-flex flex-column">
                                                <div className="d-flex justify-content-between mb-3">
                                                    <Badge bg="light" text="dark" className="border px-2 py-1 rounded-pill fw-normal d-flex align-items-center gap-1">
                                                        <span style={{color: statusInfo.color}}>{statusInfo.icon}</span> {statusInfo.label}
                                                    </Badge>
                                                    <div className="date-badge small">{new Date(appt.appointment_date).toLocaleDateString('th-TH')}</div>
                                                </div>
                                                <h5 className="fw-bold mb-3 text-navy text-truncate">{appt.topic || 'การปรึกษาทั่วไป'}</h5>
                                                <div className="info-box mb-3 flex-grow-1">
                                                    <div className="small mb-1"><FaUserMd className="text-orange me-2"/>{appt.psychologist_name || 'รอดำเนินการ'}</div>
                                                    <div className="small"><FaClock className="text-orange me-2"/>{appt.appointment_time} น.</div>
                                                </div>
                                                <Button className="btn-action enabled w-100" onClick={() => {setSelectedChatAppt(appt); setShowChat(true);}}>
                                                    <FaComments/> เข้าสู่ห้องแชท
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>
                    ) : (
                        <div className="table-responsive bg-white rounded-4 shadow-sm fade-in-up">
                            <Table hover className="m-0 pcshs-modern-table">
                                <thead>
                                    <tr>
                                        <th>วันที่</th>
                                        <th>หัวข้อ</th>
                                        <th>นักจิตวิทยา</th>
                                        <th>เวลา</th>
                                        <th>สถานะ</th>
                                        <th>แชท</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAppointments.map(appt => {
                                        const statusInfo = getStatusInfo(appt.status);
                                        return (
                                            <tr key={appt.appointment_id}>
                                                <td className="fw-bold">{new Date(appt.appointment_date).toLocaleDateString('th-TH')}</td>
                                                <td>{appt.topic}</td>
                                                <td>{appt.psychologist_name || '-'}</td>
                                                <td>{appt.appointment_time} น.</td>
                                                <td>
                                                    <Badge bg={statusInfo.bg} className="rounded-pill px-3">{statusInfo.label}</Badge>
                                                </td>
                                                <td>
                                                    <Button variant="link" className="text-orange p-0" onClick={() => {setSelectedChatAppt(appt); setShowChat(true);}}>
                                                        <FaComments size={20}/>
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

            {/* Chat Modal */}
            <Modal show={showChat && selectedChatAppt} onHide={() => setShowChat(false)} size="lg" centered className="pcshs-modal">
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-3">
                        <div className="modal-avatar"><FaUserMd/></div>
                        <div>
                            <div className="fw-bold text-navy">{selectedChatAppt?.psychologist_name || 'นักจิตวิทยา'}</div>
                            <div className="small text-orange">หัวข้อ: {selectedChatAppt?.topic}</div>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0" style={{ height: '500px' }}>
                    {selectedChatAppt && currentUserId && (
                        <ChatRoom roomID={`appt-${selectedChatAppt.appointment_id}`} userId={String(currentUserId)} username={currentUserName} otherName={selectedChatAppt.psychologist_name} />
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default StudentAppointments;