import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Button, Row, Col, Badge, Modal, Form, Spinner, InputGroup, Dropdown } from 'react-bootstrap';
import { jwtDecode } from "jwt-decode";
import ChatRoom from '../common/ChatRoom';
import { 
    FaComments, FaClipboardCheck, FaGoogle, FaCheck, FaTimes, 
    FaHistory, FaUserGraduate, FaClock, FaSearch, FaEllipsisV, FaCircle 
} from 'react-icons/fa';

import './AppointmentManager.css';

const AppointmentManager = () => {
    const [viewMode, setViewMode] = useState('card');
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showChat, setShowChat] = useState(false);
    const [selectedChatAppt, setSelectedChatAppt] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [showAssessment, setShowAssessment] = useState(false);
    const [assessmentData, setAssessmentData] = useState(null);
    const [selectedStudentName, setSelectedStudentName] = useState("");
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [summaryData, setSummaryData] = useState({ summary: '', hasFollowUp: false, followDate: '', followTime: '' });

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
        if (!window.confirm(`ยืนยันการเปลี่ยนสถานะเป็น ${status}?`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/appointments/status/${id}`, { status }, { headers: { 'x-auth-token': token } });
            fetchAppointments(); 
        } catch (err) { alert(`Error updating status`); }
    };

    const openChat = (appt) => { setSelectedChatAppt(appt); setShowChat(true); };
    const handleOpenCompleteModal = () => { setShowChat(false); setShowCompleteModal(true); };

    const filteredAppointments = appointments.filter(app => 
        app.student_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusInfo = (status) => {
        switch (status) { 
            case 'Confirmed': return { cls: 'confirmed', label: 'ยืนยันแล้ว', color: '#10b981' }; 
            case 'Cancelled': return { cls: 'cancelled', label: 'ยกเลิกแล้ว', color: '#ef4444' }; 
            case 'Pending': return { cls: 'pending', label: 'รอดำเนินการ', color: '#F26522' }; 
            default: return { cls: '', label: status, color: '#64748b' }; 
        }
    };

    if (loading) return <div className="text-center py-5"><Spinner animation="grow" variant="primary" /></div>;

    return (
        <div className="appt-pcshs-container">
            <Container>
                {/* --- ส่วนหัวเว็บไซต์ --- */}
                <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end mb-5 gap-4">
                    <div className="header-brand-border">
                        <h1 className="appt-header-title mb-1">จัดการข้อมูลการนัดหมาย</h1>
                        <p className="text-muted mb-0">ระบบสนับสนุนดูแลช่วยเหลือนักเรียน จุฬาภรณราชวิทยาลัย</p>
                    </div>
                    
                    <div className="d-flex gap-3 align-items-center flex-wrap">
                        <InputGroup className="search-box-pcshs" style={{width: '280px'}}>
                            <InputGroup.Text className="bg-transparent border-0 text-muted"><FaSearch/></InputGroup.Text>
                            <Form.Control 
                                placeholder="ค้นหาชื่อนักเรียน..." 
                                className="border-0 shadow-none"
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                        <div className="bg-white p-1 rounded-pill shadow-sm border d-flex">
                            <Button variant={viewMode === 'card' ? 'primary' : 'white'} className="btn-toggle-pcshs border-0" onClick={() => setViewMode('card')}>การ์ด</Button>
                            <Button variant={viewMode === 'table' ? 'primary' : 'white'} className="btn-toggle-pcshs border-0" onClick={() => setViewMode('table')}>ตาราง</Button>
                        </div>
                    </div>
                </div>

                {filteredAppointments.length === 0 ? (
                    <div className="text-center bg-white rounded-5 py-5 shadow-sm border">
                        <FaHistory size={60} className="text-muted opacity-25 mb-3" />
                        <h4 className="text-muted">ไม่พบข้อมูลการนัดหมายในขณะนี้</h4>
                    </div>
                ) : (
                    viewMode === 'card' ? (
                        <Row className="g-4">
                            {filteredAppointments.map((app) => {
                                const status = getStatusInfo(app.status);
                                const date = new Date(app.appointment_date);
                                return (
                                    <Col lg={4} md={6} key={app.appointment_id}>
                                        <Card className="pcshs-card h-100">
                                            <div className={`card-top-accent ${status.cls}`}></div>
                                            <Card.Body className="p-4">
                                                <div className="d-flex justify-content-between mb-4">
                                                    <div className="pcshs-date-badge shadow-sm">
                                                        <div className="day">{date.getDate()}</div>
                                                        <div className="month">{date.toLocaleDateString('th-TH', {month: 'short'})}</div>
                                                    </div>
                                                    <div className="text-end">
                                                        <Badge bg="white" className="text-dark border rounded-pill px-3 py-2 small fw-bold shadow-sm">
                                                            <FaCircle className="me-1" style={{color: status.color, fontSize: '8px'}}/> {status.label}
                                                        </Badge>
                                                        <div className="mt-2 small text-muted fw-bold"><FaClock className="me-1"/> {app.appointment_time} น.</div>
                                                    </div>
                                                </div>

                                                <h5 className="fw-bold text-dark mb-3 text-truncate-2" style={{minHeight: '3rem'}}>{app.topic}</h5>
                                                
                                                <div className="py-2 px-3 rounded-4 mb-4" style={{background: '#f8fafc', border: '1px solid #edf2f7'}}>
                                                    <small className="text-muted d-block">นักเรียน</small>
                                                    <span className="fw-bold text-primary"><FaUserGraduate className="me-2"/>{app.student_name}</span>
                                                </div>

                                                <div className="d-flex gap-2">
                                                    <Button className="btn-pcshs-primary flex-grow-1 shadow" onClick={() => openChat(app)}>
                                                        <FaComments className="me-2"/> เข้าห้องแชท
                                                    </Button>
                                                    <Dropdown align="end">
                                                        <Dropdown.Toggle as="div" className="action-circle-btn">
                                                            <FaEllipsisV size={14}/>
                                                        </Dropdown.Toggle>
                                                        <Dropdown.Menu className="border-0 shadow-lg rounded-4 p-2">
                                                            <Dropdown.Item className="rounded-3 py-2" onClick={() => handleStatusChange(app.appointment_id, 'Confirmed')}><FaCheck className="me-2 text-success"/> ยืนยันนัด</Dropdown.Item>
                                                            <Dropdown.Item className="rounded-3 py-2 text-danger" onClick={() => handleStatusChange(app.appointment_id, 'Cancelled')}><FaTimes className="me-2"/> ยกเลิกนัด</Dropdown.Item>
                                                            <Dropdown.Divider />
                                                            <Dropdown.Item className="rounded-3 py-2" onClick={() => {/* Function */}}><FaClipboardCheck className="me-2 text-info"/> ผลประเมิน</Dropdown.Item>
                                                            <Dropdown.Item className="rounded-3 py-2" onClick={() => {/* Function */}}><FaGoogle className="me-2 text-warning"/> บันทึกปฏิทิน</Dropdown.Item>
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
                        <Card className="pcshs-table-card">
                            <div className="table-responsive">
                                <table className="table align-middle mb-0 pcshs-table">
                                    <thead>
                                        <tr>
                                            <th className="ps-4">วัน-เวลา</th>
                                            <th>นักเรียน</th>
                                            <th>หัวข้อที่ขอคำปรึกษา</th>
                                            <th>สถานะ</th>
                                            <th className="text-end pe-4">ตัวเลือก</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAppointments.map(app => (
                                            <tr key={app.appointment_id}>
                                                <td className="ps-4">
                                                    <div className="fw-bold text-navy">{new Date(app.appointment_date).toLocaleDateString('th-TH')}</div>
                                                    <small className="text-muted fw-bold">{app.appointment_time} น.</small>
                                                </td>
                                                <td><span className="fw-medium text-primary"><FaUserGraduate className="me-2"/>{app.student_name}</span></td>
                                                <td className="text-truncate" style={{maxWidth: '250px'}}>{app.topic}</td>
                                                <td>
                                                    <Badge pill className="px-3 py-2 border text-dark" style={{background: 'white'}}>
                                                        <FaCircle className="me-1" style={{color: getStatusInfo(app.status).color, fontSize: '8px'}}/>
                                                        {getStatusInfo(app.status).label}
                                                    </Badge>
                                                </td>
                                                <td className="text-end pe-4">
                                                    <Button variant="outline-primary" size="sm" className="rounded-pill px-3 fw-bold" onClick={() => openChat(app)}>เริ่มแชท</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )
                )}

                {/* Modals ... (ใช้โครงสร้างเดิมได้เลย สีจะเปลี่ยนตาม CSS ที่เขียนด้านบน) */}
            </Container>
        </div>
    );
};

export default AppointmentManager;