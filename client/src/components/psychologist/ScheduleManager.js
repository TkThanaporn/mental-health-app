/* global google */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Form, Button, Row, Col, Alert, Spinner, Table, Badge } from 'react-bootstrap';
import { FaCalendarPlus, FaGoogle, FaTrash, FaClock, FaCheckCircle, FaArrowLeft, FaHistory } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// Import CSS ใหม่
import './ScheduleManager.css';

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

    const fetchMySlots = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/schedule', {
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
            return setMessage({ type: 'warning', text: 'กรุณาเลือกวันที่และช่วงเวลา' });
        }
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/schedule', 
                { date: selectedDate, time_slots: selectedSlots }, 
                { headers: { 'x-auth-token': token } }
            );
            setMessage({ type: 'success', text: 'บันทึกตารางงานสำเร็จ!' });
            setSelectedSlots([]); 
            fetchMySlots(); 
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setMessage({ type: 'danger', text: 'บันทึกไม่สำเร็จ' });
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm('ลบเวลานี้ออกใช่หรือไม่?')) return;
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

    // จัดรูปแบบวันที่ภาษาไทยแบบเต็ม
    const formatDateFull = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', { 
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
        });
    };

    return (
        <div className="schedule-pcshs-container fade-in-up">
            {/* Header Area */}
            <div className="d-flex justify-content-between align-items-center mb-5 mt-2">
                <div>
                    <h2 className="fw-bold mb-1" style={{ color: '#002147' }}>จัดการตารางปฏิบัติงาน</h2>
                    <p className="text-muted mb-0">กำหนดช่วงเวลาให้คำปรึกษาสำหรับนักเรียน PCSHS</p>
                </div>
                <Button variant="light" className="rounded-pill px-4 border shadow-sm fw-bold" onClick={() => navigate('/psychologist/dashboard')}>
                    <FaArrowLeft className="me-2" /> กลับไปหน้าหลัก
                </Button>
            </div>

            <Row className="g-4">
                {/* ส่วนที่ 1: ฟอร์มเพิ่มเวลา */}
                <Col lg={4}>
                    <Card className="pcshs-card-premium h-100">
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-4 d-flex align-items-center" style={{ color: '#F26522' }}>
                                <FaCalendarPlus className="me-2" /> ตั้งค่าเวลาว่างใหม่
                            </h5>
                            
                            {message && <Alert variant={message.type} className="rounded-3 small py-2">{message.text}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold text-muted small">เลือกวันที่ปฏิบัติงาน</Form.Label>
                                    <Form.Control 
                                        type="date" 
                                        value={selectedDate} 
                                        onChange={(e) => setSelectedDate(e.target.value)} 
                                        min={new Date().toISOString().split('T')[0]} 
                                        className="py-3 bg-light border-0 fw-bold rounded-4"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold text-muted small mb-3">ช่วงเวลา (เลือกได้หลายช่วง)</Form.Label>
                                    <div className="slot-selector-grid">
                                        {availableTimeSlots.map(slot => (
                                            <Button 
                                                key={slot}
                                                variant="none"
                                                className={`slot-chip shadow-none ${selectedSlots.includes(slot) ? 'active' : ''}`}
                                                onClick={() => toggleSlot(slot)}
                                            >
                                                {slot}
                                            </Button>
                                        ))}
                                    </div>
                                </Form.Group>

                                <Button type="submit" className="w-100 py-3 btn-pcshs-orange fw-bold rounded-pill shadow-sm mt-2">
                                    ยืนยันการเปิดตาราง
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                {/* ส่วนที่ 2: ตารางแสดงรายการ */}
                <Col lg={8}>
                    <Card className="pcshs-card-premium h-100 overflow-hidden">
                        <Card.Header className="bg-white border-0 py-4 px-4 d-flex justify-content-between align-items-center">
                            <h5 className="fw-bold mb-0" style={{ color: '#002147' }}>
                                <FaClock className="me-2 text-warning" /> รายการที่เปิดให้บริการ
                            </h5>
                            <Button className="btn-google-sync-premium px-4 py-2 small shadow-sm d-flex align-items-center">
                                <FaGoogle className="me-2 text-danger" /> Sync Google Calendar
                            </Button>
                        </Card.Header>

                        <Card.Body className="p-0">
                            {mySlots.length === 0 ? (
                                <div className="text-center py-5">
                                    <FaHistory size={50} className="text-muted opacity-25 mb-3" />
                                    <p className="text-muted fw-bold">ไม่พบข้อมูลตารางเวลา</p>
                                    <small className="text-muted">คุณสามารถเริ่มเปิดตารางได้จากเมนูทางซ้ายมือ</small>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <Table hover className="mb-0">
                                        <thead className="pcshs-table-header small text-uppercase">
                                            <tr>
                                                <th className="ps-4 py-3">วันที่ปฏิบัติงาน</th>
                                                <th className="py-3">ช่วงเวลา</th>
                                                <th className="py-3 text-center">สถานะ</th>
                                                <th className="pe-4 py-3 text-end">ลบ</th>
                                            </tr>
                                        </thead>
                                        <tbody style={{ borderTop: 'none' }}>
                                            {mySlots.map((slot) => (
                                                <tr key={slot.schedule_id} className="pcshs-row">
                                                    <td className="ps-4 py-4 fw-bold text-dark">
                                                        {formatDateFull(slot.date)}
                                                    </td>
                                                    <td className="py-4">
                                                        <Badge bg="light" text="primary" className="p-2 border fw-bold font-monospace" style={{ fontSize: '0.9rem' }}>
                                                            {slot.time_slot}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-4 text-center">
                                                        <span className="status-badge-available">● ว่าง (Available)</span>
                                                    </td>
                                                    <td className="pe-4 py-4 text-end">
                                                        <Button 
                                                            variant="none" 
                                                            className="text-danger rounded-circle p-2 hover-bg-danger-light"
                                                            onClick={() => handleDelete(slot.schedule_id)}
                                                        >
                                                            <FaTrash size={14} />
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