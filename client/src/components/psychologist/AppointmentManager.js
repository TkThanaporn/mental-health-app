import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Button, Row, Col, Modal, InputGroup, Form, Dropdown } from 'react-bootstrap';
import { jwtDecode } from "jwt-decode";
import ChatRoom from '../common/ChatRoom';
import { 
    FaComments, FaCheck, FaTimes, FaHistory, FaUserGraduate, 
    FaClock, FaSearch, FaEllipsisV, FaCircle, FaCalendarAlt,
    FaUserClock, FaCalendarDay, FaRegCalendarCheck, FaUserCheck, FaCheckCircle
} from 'react-icons/fa';

import './AppointmentManager.css'; 

const AppointmentManager = () => {
    const [viewMode, setViewMode] = useState('card');
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Chat State
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

    const handleFinishConsultation = () => {
        if(window.confirm("ต้องการจบการให้คำปรึกษาและปิดหน้าต่างแชทใช่หรือไม่?")) {
            // ตรงนี้อาจจะเพิ่ม Logic ยิง API ไปอัปเดตสถานะเป็น Completed ได้ถ้าต้องการ
            setShowChat(false);
            setSelectedChatAppt(null);
        }
    };

    const openChat = (appt) => { setSelectedChatAppt(appt); setShowChat(true); };

    const filteredAppointments = appointments.filter(app => 
        app.student_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Stats Logic ---
    const isToday = (d) => {
        const today = new Date();
        const date = new Date(d);
        return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    };

    const opStats = {
        newRequests: appointments.filter(a => a.status === 'Pending').length,
        todaySchedule: appointments.filter(a => a.status === 'Confirmed' && isToday(a.appointment_date)).length,
        confirmedUpcoming: appointments.filter(a => a.status === 'Confirmed').length,
        weeklyOpenSlots: 8 
    };

    const statCardsData = [
        { title: "คำขอใหม่ (รอยืนยัน)", count: opStats.newRequests, unit: "รายการ", icon: <FaUserClock/>, type: "stat-purple" },
        { title: "นัดหมายวันนี้", count: opStats.todaySchedule, unit: "ราย", icon: <FaCalendarDay/>, type: "stat-ocean" },
        { title: "ยืนยันแล้ว (รอพบ)", count: opStats.confirmedUpcoming, unit: "คิว", icon: <FaUserCheck/>, type: "stat-sweet" },
        { title: "คิวว่างสัปดาห์นี้", count: opStats.weeklyOpenSlots, unit: "ช่วง", icon: <FaRegCalendarCheck/>, type: "stat-mint" }
    ];

    const getStatusInfo = (status) => {
        switch (status) { 
            case 'Confirmed': return { cls: 'accent-confirmed', pill: 'sp-confirmed', label: 'ยืนยันแล้ว', icon: <FaCheck/> }; 
            case 'Cancelled': return { cls: 'accent-cancelled', pill: 'sp-cancelled', label: 'ยกเลิกแล้ว', icon: <FaTimes/> }; 
            case 'Pending': return { cls: 'accent-pending', pill: 'sp-pending', label: 'รอดำเนินการ', icon: <FaClock/> }; 
            default: return { cls: '', pill: 'sp-pending', label: status, icon: <FaCircle/> }; 
        }
    };

    // --- Loading State ---
    if (loading) return (
        <div className="d-flex flex-column align-items-center justify-content-center vh-100">
            <div className="spinner-border text-primary" role="status"></div>
            <span className="mt-3 text-muted fw-bold">กำลังโหลดข้อมูล...</span>
        </div>
    );

    return (
        <div className="appt-container px-3 px-lg-5 py-4">
            
            {/* Header */}
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end mb-5 gap-4">
                <div className="d-flex align-items-center">
                    <div className="brand-icon-box me-3"><FaCalendarAlt /></div>
                    <div>
                        <h2 className="fw-bold m-0 text-navy">จัดการการนัดหมาย</h2>
                        <p className="text-muted m-0 small">ระบบบริหารจัดการคิวและให้คำปรึกษา</p>
                    </div>
                </div>
                
                <div className="d-flex gap-3 align-items-center flex-wrap">
                    <InputGroup className="search-box-modern">
                        <InputGroup.Text className="bg-white border-0 ps-3 text-muted"><FaSearch/></InputGroup.Text>
                        <Form.Control 
                            placeholder="ค้นหาชื่อนักเรียน..." 
                            className="border-0 shadow-none"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                    <div className="view-toggle-pill">
                        <button className={viewMode === 'card' ? 'active' : ''} onClick={() => setViewMode('card')}>การ์ด</button>
                        <button className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>ตาราง</button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <Row className="g-3 mb-5">
                {statCardsData.map((item, idx) => (
                    <Col xs={12} sm={6} lg={3} key={idx}>
                        <div className={`stat-card-modern ${item.type}`}>
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

            {/* Content */}
            {filteredAppointments.length === 0 ? (
                <div className="empty-state">
                    <FaHistory className="mb-3 opacity-25" size={40}/>
                    <h5>ไม่พบข้อมูลการนัดหมาย</h5>
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
                                        <Card className="appt-card h-100 border-0">
                                            <div className={`status-line ${status.cls}`}></div>
                                            <Card.Body className="p-4 d-flex flex-column">
                                                <div className="d-flex justify-content-between mb-3">
                                                    <div className="date-badge">
                                                        <span className="d-day">{date.getDate()}</span>
                                                        <span className="d-month">{date.toLocaleDateString('th-TH', {month: 'short'})}</span>
                                                    </div>
                                                    <div className="text-end">
                                                        <span className={`status-badge ${status.pill}`}>{status.icon} {status.label}</span>
                                                        <div className="mt-1 text-muted small"><FaClock className="me-1"/>{app.appointment_time} น.</div>
                                                    </div>
                                                </div>

                                                <h6 className="topic-text mb-3">{app.topic || 'ไม่ระบุหัวข้อ'}</h6>
                                                
                                                <div className="student-row mb-4">
                                                    <div className="avatar-circle"><FaUserGraduate/></div>
                                                    <div className="fw-bold text-dark">{app.student_name}</div>
                                                </div>

                                                <div className="mt-auto pt-3 border-top d-flex gap-2">
                                                    {/* ถ้าเป็น Pending ให้ปุ่มหลักคือ Chat */}
                                                    <Button 
                                                        variant={app.status === 'Pending' ? "primary" : "outline-primary"} 
                                                        className="flex-grow-1 rounded-pill fw-bold"
                                                        onClick={() => openChat(app)}
                                                    >
                                                        <FaComments className="me-2"/> 
                                                        {app.status === 'Pending' ? 'แชทสอบถาม' : 'เปิดห้องแชท'}
                                                    </Button>

                                                    <Dropdown align="end">
                                                        <Dropdown.Toggle variant="light" className="rounded-circle no-arrow"><FaEllipsisV/></Dropdown.Toggle>
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
                                        <th>หัวข้อ</th>
                                        <th>สถานะ</th>
                                        <th className="text-end pe-4">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAppointments.map(app => {
                                        const status = getStatusInfo(app.status);
                                        return (
                                            <tr key={app.appointment_id} className="table-row-hover">
                                                <td className="ps-4">
                                                    <div className="fw-bold text-navy">{new Date(app.appointment_date).toLocaleDateString('th-TH', {day: 'numeric', month: 'short'})}</div>
                                                    <small className="text-muted">{app.appointment_time} น.</small>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="avatar-circle small"><FaUserGraduate/></div>
                                                        <span className="fw-bold text-dark">{app.student_name}</span>
                                                    </div>
                                                </td>
                                                <td className="text-muted">{app.topic || '-'}</td>
                                                <td><span className={`status-badge ${status.pill}`}>{status.label}</span></td>
                                                <td className="text-end pe-4">
                                                    <Button size="sm" variant="primary" className="rounded-pill px-3 me-2" onClick={() => openChat(app)}>แชท</Button>
                                                    <Dropdown align="end" className="d-inline-block">
                                                        <Dropdown.Toggle as="div" className="cursor-pointer p-1 text-muted"><FaEllipsisV/></Dropdown.Toggle>
                                                        <Dropdown.Menu className="border-0 shadow">
                                                            <Dropdown.Item onClick={() => handleStatusChange(app.appointment_id, 'Confirmed')}>ยืนยัน</Dropdown.Item>
                                                            <Dropdown.Item className="text-danger" onClick={() => handleStatusChange(app.appointment_id, 'Cancelled')}>ยกเลิก</Dropdown.Item>
                                                        </Dropdown.Menu>
                                                    </Dropdown>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* --- Chat Modal (Pop-up) --- */}
            <Modal 
                show={showChat && selectedChatAppt} 
                onHide={() => setShowChat(false)}
                size="lg"
                centered
                className="chat-modal-custom"
            >
                <Modal.Header closeButton className="border-0 bg-light">
                    <Modal.Title className="d-flex align-items-center gap-3">
                        <div className="avatar-circle bg-primary text-white"><FaUserGraduate/></div>
                        <div>
                            <div className="fs-5 fw-bold">{selectedChatAppt?.student_name}</div>
                            <div className="fs-6 text-muted fw-normal">หัวข้อ: {selectedChatAppt?.topic || 'ปรึกษาทั่วไป'}</div>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0" style={{ height: '500px', background: '#f8f9fa' }}>
                    {/* ChatRoom Component ถูกเรียกใช้ที่นี่ */}
                    <ChatRoom 
                        roomID={`appt-${selectedChatAppt?.appointment_id}`}
                        userId={String(currentUserId)}
                        username="นักจิตวิทยา"
                        otherName={selectedChatAppt?.student_name}
                        // เราไม่ได้ใช้ onClose ของ ChatRoom แล้ว เพราะคุมด้วย Modal
                        // onComplete={handleFinishConsultation} // ถ้า ChatRoom รองรับ props นี้
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