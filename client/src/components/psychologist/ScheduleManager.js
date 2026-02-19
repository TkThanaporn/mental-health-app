/* global google */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Form, Button, Row, Col, Alert, Spinner, Table } from 'react-bootstrap';
import { 
    FaGoogle, FaTrash, FaClock, FaCheckCircle, 
    FaPlusCircle, FaHistory, FaArrowLeft, FaCalendarCheck,
    FaLock, FaLockOpen, FaUserCheck 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

import './ScheduleManager.css';

const ScheduleManager = () => {
    const navigate = useNavigate();
    
    // --- State ---
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

    // --- API Functions ---
    const fetchMySlots = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/schedule', { headers: { 'x-auth-token': token } });
            setMySlots(res.data);
            setLoading(false);
        } catch (err) { setLoading(false); }
    };

    // เปลี่ยนสถานะ (ว่าง <-> ติดธุระ)
    const handleToggleStatus = async (slot) => {
        if (slot.appointment_id) return alert("รายการนี้ถูกจองโดยนักเรียนแล้ว ไม่สามารถปิดได้ครับ");

        try {
            const token = localStorage.getItem('token');
            const newStatus = slot.is_available === 1 ? 0 : 1; // สลับค่า

            await axios.put(`http://localhost:5000/api/schedule/${slot.schedule_id}/status`, 
                { is_available: newStatus },
                { headers: { 'x-auth-token': token } }
            );

            // อัปเดต UI ทันที
            setMySlots(prev => prev.map(s => 
                s.schedule_id === slot.schedule_id ? { ...s, is_available: newStatus } : s
            ));
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
        }
    };

    const toggleDeleteId = (id) => {
        setDeleteIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const handleSelectAll = () => {
        const deletableSlots = mySlots.filter(s => !s.appointment_id).map(s => s.schedule_id);
        
        if (deleteIds.length === deletableSlots.length && deletableSlots.length > 0) {
            setDeleteIds([]);
        } else {
            setDeleteIds(deletableSlots);
        }
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
                const d = new Date(slot.date);
                const dateStr = d.getFullYear() + '-' + 
                                String(d.getMonth() + 1).padStart(2, '0') + '-' + 
                                String(d.getDate()).padStart(2, '0');
                
                const eventId = `pcshsapp${slot.schedule_id}`;
                
                let summaryText = "";
                let colorId = "";
                let description = "";

                if (slot.appointment_id) {
                    summaryText = `🔴 จองแล้ว: ${slot.student_name} (${slot.time_slot})`;
                    colorId = "11"; 
                    description = `มีการจองโดยนักเรียน: ${slot.student_name}`;
                } else if (slot.is_available === 0) {
                    summaryText = `⛔ ติดธุระ/งดรับ (${slot.time_slot})`;
                    colorId = "8"; 
                    description = "ปิดรับคิวชั่วคราว (Psychologist Busy)";
                } else {
                    summaryText = `🟢 เปิดคิวว่าง ${slot.time_slot}`;
                    colorId = "10"; 
                    description = "ช่วงเวลาที่คุณเปิดให้บริการให้คำปรึกษาในระบบ";
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

                let response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(event),
                });

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

                if (response.ok) updatedCount++;
                else errorCount++;
            }

            if (updatedCount > 0) setMessage({ type: 'success', text: `✅ อัปเดตสถานะปฏิทินสำเร็จ ${updatedCount} รายการ` });
            else setMessage({ type: 'warning', text: '⚠️ ไม่มีการเปลี่ยนแปลงข้อมูล' });

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
            
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div className="header-banner">
                    <div className="header-icon-square">
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

            <Row className="g-4">
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
                                                    checked={deleteIds.length > 0 && deleteIds.length === mySlots.filter(s => !s.appointment_id).length}
                                                    onChange={handleSelectAll}
                                                />
                                            </th>
                                            <th>วันที่ (Date)</th>
                                            <th>เวลา & สถานะ (Time & Status)</th>
                                            <th className="text-end pe-4">จัดการ (Manage)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mySlots.map((slot) => {
                                            const isBooked = slot.appointment_id ? true : false;
                                            const isClosed = !isBooked && slot.is_available === 0;

                                            return (
                                                <tr key={slot.schedule_id} className={deleteIds.includes(slot.schedule_id) ? 'table-active-row' : ''}>
                                                    <td className="ps-4 text-center">
                                                        {!isBooked && (
                                                            <Form.Check 
                                                                type="checkbox"
                                                                checked={deleteIds.includes(slot.schedule_id)}
                                                                onChange={() => toggleDeleteId(slot.schedule_id)}
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="fw-bold" style={{color: '#00234B'}}>
                                                        {new Date(slot.date).toLocaleDateString('th-TH', { 
                                                            day: 'numeric', month: 'long', year: 'numeric' 
                                                        })}
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className={`time-pill ${isBooked ? 'bg-danger text-white border-danger' : isClosed ? 'bg-secondary text-white border-secondary' : ''}`}>
                                                                {slot.time_slot} น.
                                                            </span>
                                                            
                                                            {isBooked ? (
                                                                <small className="text-danger fw-bold d-flex align-items-center">
                                                                    <FaUserCheck className="me-1"/> จองโดย: {slot.student_name}
                                                                </small>
                                                            ) : isClosed ? (
                                                                <small className="text-muted d-flex align-items-center">
                                                                    <FaLock className="me-1"/> ปิดรับ (ติดธุระ)
                                                                </small>
                                                            ) : (
                                                                <small className="text-success d-none d-lg-block">
                                                                    🟢 ว่าง
                                                                </small>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        {!isBooked && (
                                                            <Button 
                                                                // ปรับสีปุ่ม: แดง=ล็อคอยู่, เขียว=ว่าง
                                                                variant={isClosed ? "outline-danger" : "outline-success"}
                                                                size="sm"
                                                                className="rounded-circle btn-icon-only"
                                                                onClick={() => handleToggleStatus(slot)}
                                                                title={isClosed ? "เปิดรับคิว" : "ปิดรับชั่วคราว"}
                                                                style={{width: '32px', height: '32px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}}
                                                            >
                                                                {/* ปรับไอคอน: แม่กุญแจล็อค=ปิด, แม่กุญแจเปิด=ว่าง */}
                                                                {isClosed ? <FaLock size={14} /> : <FaLockOpen size={14} />}
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
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