import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Button, Row, Col, Badge, Spinner, InputGroup, Form, Dropdown } from 'react-bootstrap';
import { jwtDecode } from "jwt-decode";
import ChatRoom from '../common/ChatRoom';
import { 
    FaComments, FaClipboardCheck, FaGoogle, FaCheck, FaTimes, 
    FaHistory, FaUserGraduate, FaClock, FaSearch, FaEllipsisV, FaCircle, FaCalendarAlt
} from 'react-icons/fa';

import './AppointmentManager.css'; // ✅ ใช้ CSS ใหม่

const AppointmentManager = () => {
    const [viewMode, setViewMode] = useState('card');
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showChat, setShowChat] = useState(false);
    const [selectedChatAppt, setSelectedChatAppt] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);

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

    const filteredAppointments = appointments.filter(app => 
        app.student_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusInfo = (status) => {
        switch (status) { 
            case 'Confirmed': return { cls: 'accent-confirmed', pill: 'sp-confirmed', label: 'ยืนยันแล้ว', icon: <FaCheck/> }; 
            case 'Cancelled': return { cls: 'accent-cancelled', pill: 'sp-cancelled', label: 'ยกเลิกแล้ว', icon: <FaTimes/> }; 
            case 'Pending': return { cls: 'accent-pending', pill: 'sp-pending', label: 'รอดำเนินการ', icon: <FaClock/> }; 
            default: return { cls: '', pill: 'sp-pending', label: status, icon: <FaCircle/> }; 
        }
    };

    if (loading) return (
        <div className="text-center py-5" style={{minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
            <Spinner animation="grow" variant="primary" style={{width: '3rem', height: '3rem'}} />
            <div className="mt-4 fw-bold text-muted fs-5">กำลังโหลดข้อมูลนัดหมาย...</div>
        </div>
    );

    return (
        <div className="appt-pcshs-container fade-in-up px-3 px-lg-5 py-4">
            
            {/* --- Header Section --- */}
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end mb-5 gap-4">
                <div className="d-flex align-items-center">
                    <div className="brand-icon-box me-4"><FaCalendarAlt /></div>
                    <div>
                        <h1 className="appt-header-title m-0 display-6 fw-bold">จัดการข้อมูลการนัดหมาย</h1>
                        <p className="text-muted m-0 mt-1 lead">ตรวจสอบและจัดการคิวให้คำปรึกษานักเรียน</p>
                    </div>
                </div>
                
                <div className="d-flex gap-3 align-items-center flex-wrap">
                    <InputGroup className="search-box-modern" style={{width: '300px'}}>
                        <InputGroup.Text className="bg-transparent border-0 text-muted ps-3"><FaSearch/></InputGroup.Text>
                        <Form.Control 
                            placeholder="ค้นหาชื่อนักเรียน..." 
                            className="border-0 shadow-none bg-transparent"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                    <div className="view-toggle-container">
                        <button className={`btn-toggle-modern ${viewMode === 'card' ? 'active' : ''}`} onClick={() => setViewMode('card')}>การ์ด</button>
                        <button className={`btn-toggle-modern ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>ตาราง</button>
                    </div>
                </div>
            </div>

            {/* --- Content Area --- */}
            {filteredAppointments.length === 0 ? (
                <div className="text-center bg-white rounded-5 py-5 shadow-sm border">
                    <FaHistory size={60} className="text-muted opacity-25 mb-3" />
                    <h4 className="text-muted fw-bold">ไม่พบข้อมูลการนัดหมายในขณะนี้</h4>
                    <p className="text-muted small">ลองค้นหาด้วยคำอื่น หรือรอการนัดหมายใหม่</p>
                </div>
            ) : (
                <>
                    {viewMode === 'card' ? (
                        <Row className="g-4">
                            {filteredAppointments.map((app) => {
                                const status = getStatusInfo(app.status);
                                const date = new Date(app.appointment_date);
                                return (
                                    <Col lg={4} md={6} key={app.appointment_id}>
                                        <Card className="appt-modern-card">
                                            <div className={`card-accent-bar ${status.cls}`}></div>
                                            <Card.Body className="p-4 d-flex flex-column">
                                                <div className="d-flex justify-content-between mb-3">
                                                    <div className="date-box-card shadow-sm">
                                                        <div className="date-d">{date.getDate()}</div>
                                                        <div className="date-m">{date.toLocaleDateString('th-TH', {month: 'short'})}</div>
                                                    </div>
                                                    <div className="text-end">
                                                        <div className={`status-pill ${status.pill} mb-2`}>
                                                            {status.icon} {status.label}
                                                        </div>
                                                        <div className="small text-muted fw-bold"><FaClock className="me-1 text-primary"/> {app.appointment_time} น.</div>
                                                    </div>
                                                </div>

                                                <h5 className="fw-bold text-dark mb-3 text-truncate-2" style={{minHeight: '3.5rem', lineHeight: '1.4'}}>
                                                    {app.topic || 'ไม่ระบุหัวข้อ'}
                                                </h5>
                                                
                                                <div className="mb-4">
                                                    <div className="student-badge">
                                                        <FaUserGraduate className="me-2"/>{app.student_name}
                                                    </div>
                                                </div>

                                                <div className="mt-auto d-flex gap-2 card-actions">
                                                    <Button className="btn-chat-modern flex-grow-1 py-2" onClick={() => openChat(app)}>
                                                        <FaComments className="me-2"/> เข้าห้องแชท
                                                    </Button>
                                                    <Dropdown align="end" className="modern-dropdown">
                                                        <Dropdown.Toggle as="div" className="btn btn-light rounded-circle d-flex align-items-center justify-content-center" style={{width:40, height:40}}>
                                                            <FaEllipsisV size={14} color="#64748b"/>
                                                        </Dropdown.Toggle>
                                                        <Dropdown.Menu>
                                                            <Dropdown.Item onClick={() => handleStatusChange(app.appointment_id, 'Confirmed')}><FaCheck className="me-2 text-success"/> ยืนยันนัด</Dropdown.Item>
                                                            <Dropdown.Item className="danger" onClick={() => handleStatusChange(app.appointment_id, 'Cancelled')}><FaTimes className="me-2"/> ยกเลิกนัด</Dropdown.Item>
                                                            <Dropdown.Divider />
                                                            <Dropdown.Item><FaClipboardCheck className="me-2 text-info"/> บันทึกผล</Dropdown.Item>
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
                        <div className="modern-table-wrapper">
                            <div className="table-responsive">
                                <table className="pcshs-table-modern">
                                    <thead>
                                        <tr>
                                            <th className="ps-4">วัน-เวลา</th>
                                            <th>ข้อมูลนักเรียน</th>
                                            <th>หัวข้อที่ปรึกษา</th>
                                            <th>สถานะ</th>
                                            <th className="text-end pe-4">ตัวเลือก</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAppointments.map(app => {
                                            const status = getStatusInfo(app.status);
                                            return (
                                                <tr key={app.appointment_id} className="table-row-card">
                                                    <td className="ps-4">
                                                        <div className="fw-bold text-navy fs-5">{new Date(app.appointment_date).toLocaleDateString('th-TH', {day: 'numeric', month: 'short', year: 'numeric'})}</div>
                                                        <small className="text-muted fw-bold"><FaClock className="me-1"/>{app.appointment_time} น.</small>
                                                    </td>
                                                    <td>
                                                        <span className="fw-bold text-primary fs-6"><FaUserGraduate className="me-2"/>{app.student_name}</span>
                                                    </td>
                                                    <td className="text-muted fw-medium">{app.topic || '-'}</td>
                                                    <td>
                                                        <div className={`status-pill ${status.pill}`}>
                                                            {status.icon} {status.label}
                                                        </div>
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        <Button variant="outline-primary" size="sm" className="rounded-pill px-3 fw-bold me-2" onClick={() => openChat(app)}>แชท</Button>
                                                        <Dropdown align="end" className="d-inline-block modern-dropdown">
                                                            <Dropdown.Toggle as="div" style={{cursor:'pointer', padding:'5px'}}><FaEllipsisV color="#94a3b8"/></Dropdown.Toggle>
                                                            <Dropdown.Menu>
                                                                <Dropdown.Item onClick={() => handleStatusChange(app.appointment_id, 'Confirmed')}>ยืนยัน</Dropdown.Item>
                                                                <Dropdown.Item className="danger" onClick={() => handleStatusChange(app.appointment_id, 'Cancelled')}>ยกเลิก</Dropdown.Item>
                                                            </Dropdown.Menu>
                                                        </Dropdown>
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

            {/* Chat Room Modal */}
            {showChat && selectedChatAppt && (
                <ChatRoom 
                    roomID={`appt-${selectedChatAppt.appointment_id}`}
                    userId={String(currentUserId)}
                    username="นักจิตวิทยา"
                    otherName={selectedChatAppt.student_name}
                    onClose={() => setShowChat(false)}
                    onComplete={() => console.log('Chat Ended')}
                />
            )}
        </div>
    );
};

export default AppointmentManager;