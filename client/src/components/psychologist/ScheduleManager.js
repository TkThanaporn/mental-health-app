/* global google */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Form, Button, Row, Col, Alert, Spinner, Table } from 'react-bootstrap';
// เปลี่ยนไอคอนให้สื่อความหมาย (ใช้ CalendarCheck)
import { 
    FaGoogle, FaTrash, FaClock, FaCheckCircle, 
    FaPlusCircle, FaHistory, FaArrowLeft, FaCalendarCheck 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

import './ScheduleManager.css';

const ScheduleManager = () => {
    const navigate = useNavigate();
    
    // --- (ส่วน State และ Logic เดิมทั้งหมด ไม่ต้องแก้) ---
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [mySlots, setMySlots] = useState([]);
    const [deleteIds, setDeleteIds] = useState([]); 
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const GOOGLE_CLIENT_ID = "236473618158-1epvinqshfo3r2p9tgk7uhc6df7hjigo.apps.googleusercontent.com"; 

    const availableTimeSlots = [
        "09:00-10:00", "10:00-11:00", "11:00-12:00",
        "13:00-14:00", "14:00-15:00", "15:00-16:00",
        "16:00-17:00", "17:00-18:00"
    ];

    useEffect(() => { fetchMySlots(); }, []);

    // --- (API Functions เดิม) ---
    const fetchMySlots = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/schedule', { headers: { 'x-auth-token': token } });
            setMySlots(res.data);
            setLoading(false);
        } catch (err) { setLoading(false); }
    };

    const toggleDeleteId = (id) => {
        setDeleteIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const handleSelectAll = () => {
        deleteIds.length === mySlots.length ? setDeleteIds([]) : setDeleteIds(mySlots.map(s => s.schedule_id));
    };

    const handleBatchDelete = () => {
        if (deleteIds.length === 0) return alert("กรุณาเลือกรายการที่จะลบ");
        if (!window.confirm(`ยืนยันการลบ ${deleteIds.length} รายการ?`)) return;
        const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/calendar.events',
            callback: async (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) await executeBatchDelete(tokenResponse.access_token);
            },
        });
        tokenClient.requestAccessToken();
    };

    const executeBatchDelete = async (accessToken) => {
        setDeleting(true);
        let deletedCount = 0;
        const token = localStorage.getItem('token');
        try {
            for (const id of deleteIds) {
                try {
                    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/pcshsapp${id}`, {
                        method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` }
                    });
                } catch (e) {}
                try {
                    await axios.delete(`http://localhost:5000/api/schedule/${id}`, { headers: { 'x-auth-token': token } });
                    deletedCount++;
                } catch (e) {}
            }
            setMessage({ type: 'success', text: `✅ ลบสำเร็จ ${deletedCount} รายการ` });
            setDeleteIds([]); fetchMySlots();
        } catch (err) { setMessage({ type: 'danger', text: '❌ ผิดพลาด' }); }
        finally { setDeleting(false); }
    };

    const handleGoogleSync = () => {
        if (mySlots.length === 0) return alert("ไม่มีข้อมูล");
        const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/calendar.events',
            callback: async (res) => { if (res && res.access_token) await pushEventsToGoogle(res.access_token); },
        });
        tokenClient.requestAccessToken();
    };

   const pushEventsToGoogle = async (accessToken) => {
        setSyncing(true);
        let updatedCount = 0;
        let errorCount = 0;

        try {
            for (const slot of mySlots) {
                const [startT, endT] = slot.time_slot.split('-');
                
                // แปลงวันที่
                const d = new Date(slot.date);
                const dateStr = d.getFullYear() + '-' + 
                                String(d.getMonth() + 1).padStart(2, '0') + '-' + 
                                String(d.getDate()).padStart(2, '0');
                
                const eventId = `pcshsapp${slot.schedule_id}`;
                
                // ✅ LOGIC เปลี่ยนสีและข้อความตามสถานะ
                let summaryText = "";
                let colorId = "";
                let description = "";

                if (slot.is_available === 1) {
                    // กรณีว่าง: สีเขียว (10)
                    summaryText = `🟢 เปิดคิวว่าง ${slot.time_slot} (Mental Health App)`;
                    colorId = "10"; // Green
                    description = "ช่วงเวลาที่คุณเปิดให้บริการให้คำปรึกษาในระบบ";
                } else {
                    // กรณีถูกจองแล้ว: สีแดง (11)
                    summaryText = `🔴 ถูกจองแล้ว ${slot.time_slot} (งดรับคิวเพิ่ม)`;
                    colorId = "11"; // Red (Tomato)
                    description = "เวลานี้มีนักเรียนจองเข้ามาแล้ว กรุณาตรวจสอบรายละเอียดในระบบ";
                }

                const event = {
                    'id': eventId,
                    'summary': summaryText,
                    'description': description,
                    'start': {
                        'dateTime': `${dateStr}T${startT.trim()}:00`,
                        'timeZone': 'Asia/Bangkok',
                    },
                    'end': {
                        'dateTime': `${dateStr}T${endT.trim()}:00`,
                        'timeZone': 'Asia/Bangkok',
                    },
                    'colorId': colorId
                };

                // ✅ ใช้ PUT เพื่ออัปเดตข้อมูลทับอันเดิม (ถ้ามีอยู่แล้วจะเปลี่ยนสี ถ้าไม่มีจะ Error 404)
                let response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
                    method: 'PUT', // ลองแก้ไขก่อน
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(event),
                });

                // ถ้า PUT ไม่ผ่าน (404) แปลว่ายังไม่มี Event นี้ -> ให้ POST (สร้างใหม่)
                if (response.status === 404) {
                    response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(event),
                    });
                }

                if (response.ok) {
                    updatedCount++;
                } else {
                    console.error("Sync Error for ID " + eventId, await response.json());
                    errorCount++;
                }
            }

            if (updatedCount > 0) {
                setMessage({ type: 'success', text: `✅ อัปเดตสถานะปฏิทินสำเร็จ ${updatedCount} รายการ` });
            } else {
                setMessage({ type: 'warning', text: '⚠️ ไม่มีการเปลี่ยนแปลงข้อมูล' });
            }

        } catch (error) {
            console.error("System Error:", error);
            setMessage({ type: 'danger', text: '❌ เกิดข้อผิดพลาดในการเชื่อมต่อ' });
        } finally {
            setSyncing(false);
        }
    };
    const toggleSlot = (slot) => setSelectedSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedDate || selectedSlots.length === 0) return setMessage({ type: 'warning', text: '⚠️ กรุณาเลือกข้อมูลให้ครบ' });
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/schedule', { date: selectedDate, time_slots: selectedSlots }, { headers: { 'x-auth-token': token } });
            setMessage({ type: 'success', text: '✅ บันทึกสำเร็จ' });
            setSelectedSlots([]); fetchMySlots(); setTimeout(() => setMessage(null), 3000);
        } catch (err) { setMessage({ type: 'danger', text: '❌ บันทึกไม่สำเร็จ' }); }
    };

    if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary"/></div>;

    return (
        <div className="container-fluid px-4 px-lg-5 py-5" style={{maxWidth: '1300px'}}>
            
            {/* --- ส่วน Header ที่แก้ใหม่ (เหมือนภาพต้นแบบ) --- */}
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div className="header-banner">
                    <div className="header-icon-square">
                        {/* ไอคอนสีขาว บนพื้นน้ำเงินเข้ม */}
                        <FaCalendarCheck size={32} color="#ffffff" />
                    </div>
                    <div className="header-text-content">
                        <h2>จัดการตารางปฏิบัติงาน</h2>
                        <p>ระบบจัดการเวลาปฏิบัติงาน PCSHS Health Care</p>
                    </div>
                </div>
                
                <Button className="btn-back-custom" onClick={() => navigate('/psychologist/dashboard')}>
                    <FaArrowLeft className="me-2" /> กลับหน้าหลัก
                </Button>
            </div>
            {/* ------------------------------------------- */}

            <Row className="g-4">
                {/* ฝั่งซ้าย: Form */}
                <Col lg={4}>
                    <Card className="glass-card-modern">
                        <div className="card-header-premium">
                            <h6 className="mb-0 fw-bold header-title" style={{color: '#00234B'}}>
                                <FaPlusCircle className="me-2 text-warning" /> เพิ่มช่วงเวลาปฏิบัติงาน
                            </h6>
                        </div>
                        <Card.Body className="p-4">
                            {message && <Alert variant={message.type} className="border-0 rounded-3 mb-4 shadow-sm">{message.text}</Alert>}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-4">
                                    <label className="fw-bold small text-secondary text-uppercase mb-2">1. วันที่ (Date)</label>
                                    <Form.Control 
                                        type="date" 
                                        value={selectedDate} 
                                        onChange={(e) => setSelectedDate(e.target.value)} 
                                        min={new Date().toISOString().split('T')[0]} 
                                        className="modern-date-input"
                                    />
                                </Form.Group>
                                <div className="mb-4">
                                    <label className="fw-bold small text-secondary text-uppercase mb-2">2. เวลา (Time Slots)</label>
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
                                <Button type="submit" className="btn-pcshs-save w-100">
                                    <FaCheckCircle className="me-2" /> บันทึกตารางงาน
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                {/* ฝั่งขวา: Table */}
                <Col lg={8}>
                    <Card className="glass-card-modern">
                        <div className="card-header-premium d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 fw-bold header-title" style={{color: '#00234B'}}>
                                <FaClock className="me-2" /> รายการที่บันทึก ({mySlots.length})
                            </h6>
                            
                            <div className="d-flex gap-2">
                                {deleteIds.length > 0 && (
                                    <Button variant="danger" className="btn-sm rounded-pill px-3 shadow-sm border-0" onClick={handleBatchDelete} disabled={deleting}>
                                        {deleting ? <Spinner size="sm"/> : <FaTrash className="me-1"/>} 
                                        ลบ ({deleteIds.length})
                                    </Button>
                                )}
                                <button className="btn-pcshs-sync" onClick={handleGoogleSync} disabled={syncing}>
                                    {syncing ? <Spinner size="sm" className="me-2"/> : <FaGoogle className="me-2" />}
                                    Sync Google
                                </button>
                            </div>
                        </div>
                        <Card.Body className="p-0">
                            {mySlots.length === 0 ? (
                                <div className="text-center py-5">
                                    <FaHistory size={40} className="text-muted opacity-25 mb-2" />
                                    <p className="text-muted">ยังไม่มีข้อมูลตารางงาน</p>
                                </div>
                            ) : (
                                <Table hover responsive className="pcshs-table mb-0">
                                    <thead>
                                        <tr>
                                            <th className="ps-4 text-center" style={{width: '60px'}}>
                                                <Form.Check 
                                                    type="checkbox" 
                                                    checked={deleteIds.length === mySlots.length && mySlots.length > 0}
                                                    onChange={handleSelectAll}
                                                />
                                            </th>
                                            <th>วันที่ (Date)</th>
                                            <th>เวลา (Time)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mySlots.map((slot) => (
                                            <tr key={slot.schedule_id} className={deleteIds.includes(slot.schedule_id) ? 'table-active-row' : ''}>
                                                <td className="ps-4 text-center">
                                                    <Form.Check 
                                                        type="checkbox"
                                                        checked={deleteIds.includes(slot.schedule_id)}
                                                        onChange={() => toggleDeleteId(slot.schedule_id)}
                                                    />
                                                </td>
                                                <td className="fw-bold" style={{color: '#00234B'}}>
                                                    {new Date(slot.date).toLocaleDateString('th-TH', { 
                                                        day: 'numeric', month: 'long', year: 'numeric' 
                                                    })}
                                                </td>
                                                <td><span className="time-pill">{slot.time_slot} น.</span></td>
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