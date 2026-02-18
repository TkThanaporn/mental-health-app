/* global google */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Form, Button, Row, Col, Alert, Spinner, Table } from 'react-bootstrap';
import { FaCalendarAlt, FaGoogle, FaTrash, FaClock, FaCheckCircle, FaPlusCircle, FaHistory, FaArrowLeft, FaRegCalendarCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

import './ScheduleManager.css';

const ScheduleManager = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [mySlots, setMySlots] = useState([]);
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(true);
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

    const fetchMySlots = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/schedule', {
                headers: { 'x-auth-token': token }
            });
            setMySlots(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching slots:", err);
            setLoading(false);
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
        tokenClient.requestAccessToken();
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
            setMessage({ type: 'success', text: `✅ ซิงค์สำเร็จ! เพิ่ม ${successCount} รายการลงปฏิทินเรียบร้อย` });
        } catch (error) {
            console.error("Google Sync Error:", error);
            setMessage({ type: 'danger', text: '❌ เกิดข้อผิดพลาดในการซิงค์' });
        } finally {
            setSyncing(false);
        }
    };

    const toggleSlot = (slot) => {
        setSelectedSlots(prev => 
            prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedDate || selectedSlots.length === 0) {
            return setMessage({ type: 'warning', text: '⚠️ กรุณาเลือกวันที่และเวลา' });
        }
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/schedule', 
                { date: selectedDate, time_slots: selectedSlots }, 
                { headers: { 'x-auth-token': token } }
            );
            setMessage({ type: 'success', text: '✅ บันทึกตารางงานสำเร็จ!' });
            setSelectedSlots([]); 
            fetchMySlots(); 
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setMessage({ type: 'danger', text: '❌ บันทึกไม่สำเร็จ' });
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm('ยืนยันการลบช่วงเวลานี้?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/schedule/${id}`, {
                headers: { 'x-auth-token': token }
            });
            fetchMySlots();
        } catch (err) { alert('ลบไม่สำเร็จ'); }
    };

    if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <div className="schedule-pcshs-container px-4 px-lg-5 py-5">
            {/* Top Navigation */}
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div className="d-flex align-items-center">
                    <div className="icon-box me-3"><FaRegCalendarCheck /></div>
                    <div>
                        <h2 className="fw-bold m-0" style={{color: '#00234B'}}>จัดการตารางปฏิบัติงาน</h2>
                        <span className="text-muted small">ระบบจัดการเวลาปฏิบัติงาน PCSHS Health Care</span>
                    </div>
                </div>
                <Button variant="white" className="btn-google-sync shadow-sm" onClick={() => navigate('/psychologist/dashboard')}>
                    <FaArrowLeft className="me-2" /> กลับหน้าหลัก
                </Button>
            </div>

            <Row className="g-4">
                <Col lg={4}>
                    <Card className="glass-card-modern border-0">
                        <div className="card-header-premium">
                            <h6 className="mb-0 fw-bold"><FaPlusCircle className="me-2 text-primary" /> เปิดตารางเวลาใหม่</h6>
                        </div>
                        <Card.Body className="p-4">
                            {message && <Alert variant={message.type} className="border-0 rounded-4 mb-4">{message.text}</Alert>}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-4">
                                    <label className="fw-bold small text-muted text-uppercase mb-2">1. เลือกวันที่</label>
                                    <Form.Control 
                                        type="date" 
                                        value={selectedDate} 
                                        onChange={(e) => setSelectedDate(e.target.value)} 
                                        min={new Date().toISOString().split('T')[0]} 
                                        className="modern-date-input"
                                    />
                                </Form.Group>
                                <div className="mb-4">
                                    <label className="fw-bold small text-muted text-uppercase mb-2">2. เลือกช่วงเวลาที่เปิดรับ</label>
                                    <div className="slot-grid-container">
                                        {availableTimeSlots.map(slot => (
                                            <button 
                                                key={slot} 
                                                type="button" 
                                                className={`time-slot-chip ${selectedSlots.includes(slot) ? 'selected' : ''}`} 
                                                onClick={() => toggleSlot(slot)}
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <Button type="submit" variant="primary" className="btn-premium-save w-100">
                                    <FaCheckCircle className="me-2" /> ยืนยันข้อมูลตาราง
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={8}>
                    <Card className="glass-card-modern border-0">
                        <div className="card-header-premium">
                            <h6 className="mb-0 fw-bold"><FaClock className="me-2 text-warning" /> ตารางที่บันทึกแล้ว ({mySlots.length})</h6>
                            <Button className="btn-google-sync" onClick={handleGoogleSync} disabled={syncing}>
                                {syncing ? <Spinner size="sm" className="me-2"/> : <FaGoogle className="me-2" color="#EA4335" />}
                                {syncing ? "กำลังเชื่อมต่อ..." : "Sync กับ Google Calendar"}
                            </Button>
                        </div>
                        <Card.Body className="p-0">
                            {mySlots.length === 0 ? (
                                <div className="text-center py-5">
                                    <FaHistory size={40} className="text-muted opacity-25 mb-2" />
                                    <p className="text-muted">ไม่พบข้อมูลการบันทึกเวลา</p>
                                </div>
                            ) : (
                                <Table hover responsive className="premium-table mb-0">
                                    <thead>
                                        <tr>
                                            <th className="ps-4">วันที่ปฏิบัติงาน</th>
                                            <th>ช่วงเวลา (น.)</th>
                                            <th className="text-end pe-4">ตัวเลือก</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mySlots.map((slot) => (
                                            <tr key={slot.schedule_id} className="premium-row">
                                                <td className="ps-4 fw-bold" style={{color: '#00234B'}}>
                                                    {new Date(slot.date).toLocaleDateString('th-TH', { 
                                                        day: 'numeric', month: 'long', year: 'numeric' 
                                                    })}
                                                </td>
                                                <td><span className="time-pill">{slot.time_slot}</span></td>
                                                <td className="text-end pe-4">
                                                    <button className="btn-delete-icon shadow-sm" onClick={() => handleDelete(slot.schedule_id)} style={{background: '#FFF5F5', border: 'none', borderRadius: '10px', padding: '8px', color: '#E53E3E'}}>
                                                        <FaTrash size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ScheduleManager;