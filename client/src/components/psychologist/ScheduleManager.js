/* global google */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Form, Button, Row, Col, Alert, Spinner, Table } from 'react-bootstrap';
import { FaCalendarPlus, FaGoogle, FaTrash, FaClock, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// Import CSS
import './Psychologist.css';

const ScheduleManager = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [mySlots, setMySlots] = useState([]);
    const [message, setMessage] = useState(null);
    const [syncing, setSyncing] = useState(false);

    const GOOGLE_CLIENT_ID = "236473618158-1epvinqshfo3r2p9tgk7uhc6df7hjigo.apps.googleusercontent.com"; 

    const availableTimeSlots = [
        "09:00-10:00", "10:00-11:00", "11:00-12:00",
        "13:00-14:00", "14:00-15:00", "15:00-16:00",
        "16:00-17:00", "17:00-18:00"
    ];

    useEffect(() => {
        fetchMySlots();
    }, []);

    // ✅✅✅ แก้ไขจุดนี้ครับ ✅✅✅
    const fetchMySlots = async () => {
        try {
            const token = localStorage.getItem('token');
            // เปลี่ยนจาก /api/appointments/... เป็น /api/schedule
            const res = await axios.get('http://localhost:5000/api/schedule', {
                headers: { 'x-auth-token': token }
            });
            setMySlots(res.data);
        } catch (err) {
            console.error("Error fetching slots:", err);
            // ถ้า Backend ยังไม่ได้ทำ route นี้ อาจจะ 404
        }
    };
    // ----------------------------

    const toggleSlot = (slot) => {
        if (selectedSlots.includes(slot)) {
            setSelectedSlots(selectedSlots.filter(s => s !== slot));
        } else {
            setSelectedSlots([...selectedSlots, slot]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedDate || selectedSlots.length === 0) {
            return setMessage({ type: 'warning', text: 'กรุณาเลือกวันที่และอย่างน้อย 1 ช่วงเวลา' });
        }
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/schedule', 
                { date: selectedDate, time_slots: selectedSlots }, 
                { headers: { 'x-auth-token': token } }
            );
            setMessage({ type: 'success', text: 'บันทึกตารางงานเรียบร้อยแล้ว!' });
            setSelectedSlots([]); 
            fetchMySlots(); 
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการบันทึก' });
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm('คุณต้องการลบเวลานี้ออกใช่หรือไม่?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/schedule/${id}`, {
                headers: { 'x-auth-token': token }
            });
            fetchMySlots();
        } catch (err) {
            alert('ลบไม่สำเร็จ');
        }
    };

    const handleGoogleSync = () => {
        if (mySlots.length === 0) return alert("ไม่มีข้อมูลตารางเวลาให้ซิงค์");
        const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/calendar.events',
            callback: async (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) {
                    await pushEventsToGoogle(tokenResponse.access_token);
                }
            },
        });
        tokenClient.requestAccessToken({ prompt: 'consent' }); 
    };

    const pushEventsToGoogle = async (accessToken) => {
        setSyncing(true);
        let successCount = 0;
        try {
            for (const slot of mySlots) {
                const [startT, endT] = slot.time_slot.split('-');
                const dateStr = new Date(slot.date).toISOString().split('T')[0]; 
                
                const event = {
                    'summary': '🟢 เปิดคิวว่าง (Mental Health App)',
                    'description': 'ช่วงเวลาที่คุณเปิดให้บริการให้คำปรึกษาในระบบ',
                    'start': { 'dateTime': `${dateStr}T${startT.trim()}:00`, 'timeZone': 'Asia/Bangkok' },
                    'end': { 'dateTime': `${dateStr}T${endT.trim()}:00`, 'timeZone': 'Asia/Bangkok' },
                    'colorId': '10' 
                };

                await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(event),
                });
                successCount++;
            }
            alert(`✅ ซิงค์สำเร็จ! เพิ่ม ${successCount} รายการลงปฏิทินเรียบร้อย`);
        } catch (error) {
            console.error("Google Sync Error:", error);
            alert("เกิดข้อผิดพลาดในการซิงค์");
        } finally {
            setSyncing(false);
        }
    };

    // ฟังก์ชันช่วยจัดรูปแบบวันที่ให้ปลอดภัย (กัน Error Invalid Date)
    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "วันที่ไม่ถูกต้อง"; // กันเหนียว
        return date.toLocaleDateString('th-TH', { 
            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' 
        });
    };

    return (
        <div className="fade-in-up">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold mb-1 pcshs-header-text">
                        <FaCalendarPlus className="me-2" /> จัดการตารางเวลาว่าง
                    </h4>
                    <p className="text-muted small mb-0">เพิ่มช่วงเวลาที่คุณสะดวกเพื่อให้คำปรึกษา</p>
                </div>
                
                <Button variant="light" className="btn-pcshs-outline" onClick={() => navigate('/psychologist/dashboard')}>
                    <FaArrowLeft className="me-2" /> กลับหน้าหลัก
                </Button>
            </div>

            <Row className="g-4">
                <Col lg={4}>
                    <Card className="pcshs-card h-100">
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-4 text-dark d-flex align-items-center">
                                <FaCalendarPlus className="me-2 text-primary" /> เพิ่มเวลาว่างใหม่
                            </h5>
                            
                            {message && (
                                <Alert variant={message.type} className="rounded-3 py-2 small">
                                    {message.type === 'success' && <FaCheckCircle className="me-2" />}
                                    {message.text}
                                </Alert>
                            )}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-semibold text-muted small">เลือกวันที่</Form.Label>
                                    <Form.Control 
                                        type="date" 
                                        value={selectedDate} 
                                        onChange={(e) => setSelectedDate(e.target.value)} 
                                        min={new Date().toISOString().split('T')[0]} 
                                        required 
                                        className="py-2 bg-light border-0 fw-bold rounded-3"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-semibold text-muted small mb-3">เลือกช่วงเวลา</Form.Label>
                                    <div className="d-flex flex-wrap gap-2">
                                        {availableTimeSlots.map(slot => (
                                            <Button 
                                                key={slot}
                                                variant={selectedSlots.includes(slot) ? "primary" : "outline-light text-dark border"}
                                                size="sm"
                                                className={`px-3 py-2 rounded-pill ${selectedSlots.includes(slot) ? 'shadow-sm btn-pcshs-blue' : ''}`}
                                                onClick={() => toggleSlot(slot)}
                                                style={{ fontSize: '0.85rem' }}
                                            >
                                                {slot}
                                            </Button>
                                        ))}
                                    </div>
                                </Form.Group>

                                <Button type="submit" className="w-100 py-2 btn-pcshs-orange fw-bold">
                                    บันทึกช่วงเวลา
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={8}>
                    <Card className="pcshs-card h-100">
                        <Card.Header className="bg-white border-0 py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <h5 className="fw-bold mb-0 text-dark d-flex align-items-center">
                                <FaClock className="me-2 text-warning" /> ตารางเวลาปัจจุบันของคุณ
                            </h5>
                            
                            <Button 
                                variant="outline-dark" 
                                size="sm" 
                                className="rounded-pill px-3 d-flex align-items-center"
                                onClick={handleGoogleSync}
                                disabled={syncing}
                            >
                                {syncing ? (
                                    <><Spinner animation="border" size="sm" className="me-2" /> กำลังซิงค์...</>
                                ) : (
                                    <><FaGoogle className="me-2 text-danger" /> Sync Google Calendar</>
                                )}
                            </Button>
                        </Card.Header>

                        <Card.Body className="p-0">
                            {mySlots.length === 0 ? (
                                <div className="text-center py-5">
                                    <div className="mb-3 text-muted opacity-25" style={{ fontSize: '3rem' }}>📅</div>
                                    <p className="text-muted">ยังไม่มีตารางเวลาที่เปิดว่างไว้</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <Table hover className="mb-0 align-middle">
                                        <thead className="bg-light text-muted small text-uppercase">
                                            <tr>
                                                <th className="ps-4 py-3 border-0">วันที่</th>
                                                <th className="py-3 border-0">ช่วงเวลา</th>
                                                <th className="py-3 border-0 text-center">สถานะ</th>
                                                <th className="pe-4 py-3 border-0 text-end">จัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mySlots.map((slot) => (
                                                <tr key={slot.schedule_id} className="border-bottom-0">
                                                    <td className="ps-4 py-3 fw-semibold text-dark">
                                                        {formatDate(slot.date)}
                                                    </td>
                                                    <td className="py-3 text-primary fw-bold font-monospace">
                                                        {slot.time_slot || "-"}
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <span className="badge-available">
                                                            ว่าง (Available)
                                                        </span>
                                                    </td>
                                                    <td className="pe-4 py-3 text-end">
                                                        <Button 
                                                            variant="light" 
                                                            className="text-danger border-0 rounded-circle p-2 hover-bg-danger-light"
                                                            onClick={() => handleDelete(slot.schedule_id)}
                                                            title="ลบรายการนี้"
                                                        >
                                                            <FaTrash />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ScheduleManager;