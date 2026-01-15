/* global google */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Form, Button, Row, Col, Alert, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ScheduleManager = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [mySlots, setMySlots] = useState([]);
    const [message, setMessage] = useState(null);
    const [syncing, setSyncing] = useState(false);

    // ✅ Client ID ของคุณ (ใส่ให้เรียบร้อยแล้ว)
    const GOOGLE_CLIENT_ID = "236473618158-1epvinqshfo3r2p9tgk7uhc6df7hjigo.apps.googleusercontent.com"; 

    const availableTimeSlots = [
        "09:00-10:00", "10:00-11:00", "11:00-12:00",
        "13:00-14:00", "14:00-15:00", "15:00-16:00",
        "16:00-17:00", "17:00-18:00"
    ];

    useEffect(() => {
        fetchMySlots();
    }, []);

    const fetchMySlots = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/appointments/psychologist-appointments', {
                headers: { 'x-auth-token': token }
            });
            setMySlots(res.data);
        } catch (err) {
            console.error("Error fetching slots:", err);
        }
    };

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
            setMessage({ type: 'success', text: '✅ บันทึกตารางงานเรียบร้อยแล้ว!' });
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

    // ==========================================
    // 🚀 ระบบ Sync Google Calendar (API)
    // ==========================================
    const handleGoogleSync = () => {
        if (mySlots.length === 0) return alert("ไม่มีข้อมูลตารางเวลาให้ซิงค์");

        // เรียก Popup ขอ Login Google
        const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/calendar.events',
            callback: async (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) {
                    await pushEventsToGoogle(tokenResponse.access_token);
                }
            },
        });

        // 👇 แก้ตรงนี้ครับ! ใส่ { prompt: 'consent' } ลงไป
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
                    'start': {
                        'dateTime': `${dateStr}T${startT.trim()}:00`,
                        'timeZone': 'Asia/Bangkok',
                    },
                    'end': {
                        'dateTime': `${dateStr}T${endT.trim()}:00`,
                        'timeZone': 'Asia/Bangkok',
                    },
                    'colorId': '10' // สีเขียว
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
            alert("เกิดข้อผิดพลาดในการซิงค์ (ตรวจสอบ Console)");
        } finally {
            setSyncing(false);
        }
    };

    return (
        <Container className="my-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-primary">📅 จัดการตารางเวลา</h2>
                <Button variant="outline-secondary" onClick={() => navigate('/psychologist/dashboard')}>
                    ⬅️ กลับหน้าหลัก
                </Button>
            </div>

            <Row>
                <Col md={4}>
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Header className="bg-success text-white">เพิ่มเวลาว่างใหม่</Card.Header>
                        <Card.Body>
                            {message && <Alert variant={message.type}>{message.text}</Alert>}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">เลือกวันที่</Form.Label>
                                    <Form.Control 
                                        type="date" 
                                        value={selectedDate} 
                                        onChange={(e) => setSelectedDate(e.target.value)} 
                                        min={new Date().toISOString().split('T')[0]} 
                                        required 
                                    />
                                </Form.Group>
                                <Form.Label className="fw-bold">เลือกช่วงเวลาที่ว่าง</Form.Label>
                                <div className="d-flex flex-wrap gap-2 mb-4">
                                    {availableTimeSlots.map(slot => (
                                        <Button 
                                            key={slot}
                                            variant={selectedSlots.includes(slot) ? "primary" : "outline-secondary"}
                                            size="sm"
                                            onClick={() => toggleSlot(slot)}
                                        >
                                            {slot}
                                        </Button>
                                    ))}
                                </div>
                                <Button type="submit" variant="success" className="w-100">
                                    💾 บันทึกเวลาว่าง
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={8}>
                    <Card className="shadow-sm border-0">
                        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                            <span>เวลาว่างปัจจุบันของคุณ</span>
                            <Button 
                                variant="light" 
                                size="sm" 
                                className="fw-bold text-primary"
                                onClick={handleGoogleSync}
                                disabled={syncing}
                            >
                                {syncing ? (
                                    <><Spinner animation="border" size="sm" /> กำลังซิงค์...</>
                                ) : (
                                    <>🔄 Sync ทั้งหมดเข้า Google Calendar</>
                                )}
                            </Button>
                        </Card.Header>
                        <Card.Body>
                            {mySlots.length === 0 ? (
                                <p className="text-muted text-center py-4">ยังไม่มีตารางเวลาว่าง</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle">
                                        <thead>
                                            <tr>
                                                <th>วันที่</th>
                                                <th>เวลา</th>
                                                <th>สถานะ</th>
                                                <th className="text-end">จัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mySlots.map((slot) => (
                                                <tr key={slot.schedule_id}>
                                                    <td>{new Date(slot.date).toLocaleDateString('th-TH')}</td>
                                                    <td className="fw-bold text-primary">{slot.time_slot}</td>
                                                    <td><Badge bg="success">ว่าง</Badge></td>
                                                    <td className="text-end">
                                                        <Button 
                                                            variant="outline-danger" 
                                                            size="sm" 
                                                            onClick={() => handleDelete(slot.schedule_id)}
                                                        >
                                                            🗑️ ลบ
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default ScheduleManager;