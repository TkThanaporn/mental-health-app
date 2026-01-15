import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Button, Row, Col, Alert, Badge, Modal, Form } from 'react-bootstrap'; // ✅ เพิ่ม Form
import { useAuth } from '../../context/AuthContext';
import { jwtDecode } from "jwt-decode"; 
import ChatRoom from '../common/ChatRoom'; 

const AppointmentManager = () => {
    const { logout } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State Chat & Assessment
    const [showChat, setShowChat] = useState(false);
    const [selectedChatAppt, setSelectedChatAppt] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [showAssessment, setShowAssessment] = useState(false);
    const [assessmentData, setAssessmentData] = useState(null);
    const [selectedStudentName, setSelectedStudentName] = useState("");

    // ✅ State สำหรับ Modal จบงาน
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [summaryData, setSummaryData] = useState({ 
        summary: '', 
        hasFollowUp: false, 
        followDate: '', 
        followTime: '' 
    });

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
        } catch (err) {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, status) => {
        if (!window.confirm(`ยืนยันการเปลี่ยนสถานะเป็น ${status}?`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/appointments/status/${id}`, { status }, { headers: { 'x-auth-token': token } });
            fetchAppointments(); 
        } catch (err) { alert(`Error updating status`); }
    };

    const openGoogleCalendar = (app) => {
        if (!app.appointment_time || !app.appointment_date) return alert("ข้อมูลวันเวลาไม่ครบถ้วน");

        const [startT, endT] = app.appointment_time.split('-'); 
        const dateStr = new Date(app.appointment_date).toISOString().split('T')[0].replace(/-/g, ''); 
        
        const startTime = `${dateStr}T${startT.trim().replace(':', '')}00`;
        const endTime = `${dateStr}T${endT.trim().replace(':', '')}00`;
        
        const title = encodeURIComponent(`นัดหมายให้คำปรึกษา: ${app.student_name}`);
        const details = encodeURIComponent(`หัวข้อ: ${app.topic}\nประเภท: ${app.type}\nนักเรียน: ${app.student_name}`);
        
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}`;
        window.open(url, '_blank');
    };

    const openChat = (appt) => { setSelectedChatAppt(appt); setShowChat(true); };
    
    const openAssessment = async (studentId, studentName) => {
        setSelectedStudentName(studentName);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/assessments/student/${studentId}`, { headers: { 'x-auth-token': token } });
            setAssessmentData(res.data);
            setShowAssessment(true);
        } catch (err) { alert("ไม่สามารถดึงข้อมูลผลประเมินได้"); }
    };

    // ✅ ฟังก์ชันเปิด Modal จบงาน
    const handleOpenCompleteModal = () => {
        setShowChat(false); // ปิดแชทก่อน
        setShowCompleteModal(true); // เปิดหน้าจบงาน
    };

    // ✅ ฟังก์ชันบันทึกการจบงาน
    const handleCompleteJob = async () => {
        if (!summaryData.summary) return alert("กรุณากรอกผลการให้คำปรึกษา");

        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/appointments/complete/${selectedChatAppt.appointment_id}`, 
                {
                    result_summary: summaryData.summary,
                    student_id: selectedChatAppt.student_id,
                    follow_up_date: summaryData.hasFollowUp ? summaryData.followDate : null,
                    follow_up_time: summaryData.hasFollowUp ? summaryData.followTime : null
                }, 
                { headers: { 'x-auth-token': token } }
            );
            
            alert("✅ บันทึกเสร็จสิ้น! ขอบคุณสำหรับการทำงานครับ");
            setShowCompleteModal(false);
            setSummaryData({ summary: '', hasFollowUp: false, followDate: '', followTime: '' });
            fetchAppointments(); // รีโหลดข้อมูลใหม่
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาดในการบันทึก");
        }
    };

    const getStatusVariant = (status) => {
        switch (status) { case 'Confirmed': return 'success'; case 'Cancelled': return 'danger'; case 'Pending': return 'warning'; default: return 'secondary'; }
    };

    if (loading) return <p className="text-center mt-4">กำลังโหลด...</p>;

    return (
        <Container className="my-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-primary">📅 จัดการนัดหมาย & แชท</h2>
                <div>
                    <Button variant="warning" href="/psychologist/schedule" className="me-2 text-dark">📅 จัดการตารางเวลา</Button>
                    <Button variant="outline-primary" href="/profile" className="me-2">👤 แก้ไขโปรไฟล์</Button>
                    <Button variant="danger" onClick={logout}>ออกจากระบบ</Button>
                </div>
            </div>
            
            {appointments.length === 0 ? (
                <Alert variant="info">ยังไม่มีรายการนัดหมายเข้ามา</Alert>
            ) : (
                <Row>
                    {appointments.map(app => (
                        <Col md={6} lg={4} key={app.appointment_id} className="mb-4">
                            <Card className="h-100 shadow-sm border-0">
                                <Card.Header className="d-flex justify-content-between align-items-center bg-white">
                                    <strong>{new Date(app.appointment_date).toLocaleDateString('th-TH')}</strong>
                                    <Badge bg="info" text="dark">{app.appointment_time}</Badge>
                                </Card.Header>
                                <Card.Body>
                                    <Card.Title className="text-primary">{app.topic}</Card.Title>
                                    <p className="mb-1 text-muted">👤 นักเรียน: {app.student_name}</p>
                                    
                                    <div className="mt-2 mb-3">
                                        <Badge bg={getStatusVariant(app.status)} className="me-2">{app.status}</Badge>
                                        <Button variant="outline-info" size="sm" onClick={() => openAssessment(app.student_id, app.student_name)}>📄 ผลประเมิน</Button>
                                    </div>
                                    
                                    <Button 
                                        variant="warning" 
                                        size="sm" 
                                        className="w-100 mb-3 text-dark fw-bold"
                                        onClick={() => openGoogleCalendar(app)}
                                    >
                                        📅 เพิ่มลง Google Calendar
                                    </Button>

                                    <hr/>

                                    <div className="d-flex justify-content-between gap-1">
                                        {app.status === 'Pending' && (
                                            <>
                                                <Button variant="outline-success" size="sm" onClick={() => handleStatusChange(app.appointment_id, 'Confirmed')}>รับ</Button>
                                                <Button variant="outline-danger" size="sm" onClick={() => handleStatusChange(app.appointment_id, 'Cancelled')}>ปฏิเสธ</Button>
                                            </>
                                        )}
                                        {app.status === 'Confirmed' && (
                                             <Button variant="outline-danger" size="sm" onClick={() => handleStatusChange(app.appointment_id, 'Cancelled')}>ยกเลิกนัด</Button>
                                        )}
                                        <Button variant="primary" size="sm" onClick={() => openChat(app)} className="ms-auto">💬 แชท</Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* ✅ Chat Modal (เพิ่ม Footer ปุ่มจบงาน) */}
            <Modal show={showChat} onHide={() => setShowChat(false)} size="lg" centered>
                <Modal.Header closeButton><Modal.Title>แชทกับ: {selectedChatAppt?.student_name}</Modal.Title></Modal.Header>
                <Modal.Body className="p-0">
                    {selectedChatAppt && currentUserId && (
                        <ChatRoom appointmentId={selectedChatAppt.appointment_id} currentUserId={currentUserId} userName="นักจิตวิทยา" />
                    )}
                </Modal.Body>
                <Modal.Footer className="bg-light justify-content-between">
                    <small className="text-muted">เมื่อพูดคุยเสร็จแล้ว กดปุ่มเพื่อบันทึกผล</small>
                    <Button variant="success" onClick={handleOpenCompleteModal}>
                        🏁 จบการให้คำปรึกษา & บันทึกผล
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ✅ Modal จบงาน & นัดต่อ (เพิ่มใหม่) */}
            <Modal show={showCompleteModal} onHide={() => setShowCompleteModal(false)} centered>
                <Modal.Header closeButton className="bg-success text-white">
                    <Modal.Title>📝 สรุปผลการให้คำปรึกษา</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>บันทึกผลการปรึกษา / อาการเบื้องต้น</Form.Label>
                            <Form.Control 
                                as="textarea" 
                                rows={4} 
                                value={summaryData.summary}
                                onChange={(e) => setSummaryData({...summaryData, summary: e.target.value})}
                                placeholder="เช่น นักเรียนมีความเครียดลดลง ให้คำแนะนำเรื่อง..."
                            />
                        </Form.Group>

                        <hr />
                        
                        <Form.Check 
                            type="switch"
                            id="follow-up-switch"
                            label="ต้องการนัดติดตามอาการ (Follow-up) ไหม?"
                            checked={summaryData.hasFollowUp}
                            onChange={(e) => setSummaryData({...summaryData, hasFollowUp: e.target.checked})}
                            className="mb-3 fw-bold text-primary"
                        />

                        {summaryData.hasFollowUp && (
                            <div className="bg-light p-3 rounded">
                                <h6>📅 เลือกวันนัดครั้งต่อไป</h6>
                                <Row className="mb-2">
                                    <Col>
                                        <Form.Control 
                                            type="date" 
                                            value={summaryData.followDate}
                                            onChange={(e) => setSummaryData({...summaryData, followDate: e.target.value})}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </Col>
                                </Row>
                                <Row>
                                    <Col>
                                        <Form.Select 
                                            value={summaryData.followTime}
                                            onChange={(e) => setSummaryData({...summaryData, followTime: e.target.value})}
                                        >
                                            <option value="">-- เลือกเวลา --</option>
                                            <option>09:00-10:00</option>
                                            <option>10:00-11:00</option>
                                            <option>11:00-12:00</option>
                                            <option>13:00-14:00</option>
                                            <option>14:00-15:00</option>
                                            <option>15:00-16:00</option>
                                            <option>16:00-17:00</option>
                                        </Form.Select>
                                    </Col>
                                </Row>
                            </div>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCompleteModal(false)}>ยกเลิก</Button>
                    <Button variant="success" onClick={handleCompleteJob}>💾 บันทึกและจบงาน</Button>
                </Modal.Footer>
            </Modal>

            {/* Assessment Modal */}
            <Modal show={showAssessment} onHide={() => setShowAssessment(false)} centered>
                <Modal.Header closeButton><Modal.Title>ผลประเมิน: {selectedStudentName}</Modal.Title></Modal.Header>
                <Modal.Body>
                    {assessmentData ? (
                        <div className="text-center">
                            <h1>{assessmentData.score}</h1>
                            <Alert variant="info">{assessmentData.stress_level}</Alert>
                        </div>
                    ) : <p className="text-center">ไม่มีข้อมูล</p>}
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default AppointmentManager;