/* global google */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Form, Button, Row, Col, Alert, Spinner, Table, Badge, Container } from 'react-bootstrap';
import { FaCalendarPlus, FaGoogle, FaTrash, FaClock, FaCheckCircle, FaArrowLeft, FaHistory, FaCalendarAlt, FaPlusCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

import './ScheduleManager.css'; // ✅ ใช้ CSS ใหม่

const ScheduleManager = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [mySlots, setMySlots] = useState([]);
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(true);

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
            return setMessage({ type: 'warning', text: '⚠️ กรุณาเลือกวันที่และอย่างน้อย 1 ช่วงเวลา' });
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
            setMessage({ type: 'danger', text: '❌ บันทึกไม่สำเร็จ กรุณาลองใหม่' });
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

    const formatDateFull = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString('th-TH', { 
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
        });
    };

    if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <div className="schedule-pcshs-container fade-in-up px-3 px-lg-5 py-4">
            
            {/* Header Area */}
            <div className="schedule-header d-flex justify-content-between align-items-end mb-5">
                <div className="d-flex align-items-center">
                    <div className="icon-box me-4"><FaCalendarAlt /></div>
                    <div>
                        <h1 className="fw-bold m-0 display-6" style={{color: '#00234B'}}>จัดการตารางปฏิบัติงาน</h1>
                        <p className="text-muted m-0 mt-2 lead">กำหนดช่วงเวลาให้คำปรึกษาสำหรับนักเรียน</p>
                    </div>
                </div>
                <Button variant="light" className="rounded-pill px-4 border shadow-sm fw-bold text-muted" onClick={() => navigate('/psychologist/dashboard')}>
                    <FaArrowLeft className="me-2" /> กลับหน้าหลัก
                </Button>
            </div>

            <Row className="g-5">
                {/* 1. Form Section (Glass Card) */}
                <Col lg={4}>
                    <Card className="glass-card-modern h-100 border-0">
                        <div className="card-header-gradient">
                            <h5 className="mb-0 fw-bold text-dark"><FaPlusCircle className="me-2 text-primary"/> เพิ่มเวลาว่างใหม่</h5>
                        </div>
                        <Card.Body className="p-4">
                            {message && <Alert variant={message.type} className="rounded-3 shadow-sm border-0 mb-4">{message.text}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="modern-label">เลือกวันที่ (Date)</label>
                                    <Form.Control 
                                        type="date" 
                                        value={selectedDate} 
                                        onChange={(e) => setSelectedDate(e.target.value)} 
                                        min={new Date().toISOString().split('T')[0]} 
                                        className="modern-date-input w-100"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="modern-label d-flex justify-content-between">
                                        ช่วงเวลา (Time Slots) 
                                        <small className="text-muted fw-normal">{selectedSlots.length} รายการที่เลือก</small>
                                    </label>
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

                                <Button type="submit" className="btn-save-modern w-100 mt-3">
                                    <FaCheckCircle className="me-2"/> ยืนยันการเปิดตาราง
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                {/* 2. Table Section (Glass Card) */}
                <Col lg={8}>
                    <Card className="glass-card-modern h-100 border-0">
                        <div className="card-header-gradient py-3">
                            <h5 className="mb-0 fw-bold" style={{ color: '#00234B' }}>
                                <FaClock className="me-2 text-warning" /> รายการที่เปิดให้บริการ ({mySlots.length})
                            </h5>
                            <Button className="btn-sync-google px-3 py-1">
                                <FaGoogle className="me-2" /> Sync Calendar
                            </Button>
                        </div>

                        <Card.Body className="p-0">
                            {mySlots.length === 0 ? (
                                <div className="text-center py-5">
                                    <FaHistory size={60} className="text-muted opacity-25 mb-3" />
                                    <p className="text-muted fw-bold mb-1">ยังไม่มีตารางเวลา</p>
                                    <small className="text-muted">เลือกวันที่และเวลาด้านซ้ายเพื่อเริ่มใช้งาน</small>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <Table hover className="schedule-table mb-0">
                                        <thead>
                                            <tr>
                                                <th className="ps-4">วันที่ปฏิบัติงาน</th>
                                                <th>ช่วงเวลา</th>
                                                <th className="text-center">สถานะ</th>
                                                <th className="pe-4 text-end">จัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mySlots.map((slot) => (
                                                <tr key={slot.schedule_id} className="schedule-row">
                                                    <td className="ps-4">
                                                        <div className="date-text-modern">{formatDateFull(slot.date)}</div>
                                                    </td>
                                                    <td>
                                                        <span className="time-badge-modern">{slot.time_slot} น.</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="status-pill-available">
                                                            <FaCheckCircle size={12}/> ว่าง (Available)
                                                        </span>
                                                    </td>
                                                    <td className="pe-4 text-end">
                                                        <button 
                                                            className="btn-delete-icon" 
                                                            onClick={() => handleDelete(slot.schedule_id)} 
                                                            title="ลบรายการ"
                                                        >
                                                            <FaTrash size={14} />
                                                        </button>
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