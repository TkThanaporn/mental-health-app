import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, Form, Button, Row, Col, Alert, Spinner, Table } from 'react-bootstrap';
import { 
    FaGoogle, FaTrash, FaClock, FaCheckCircle, 
    FaPlusCircle, FaHistory, FaArrowLeft, FaCalendarCheck,
    FaLock, FaLockOpen, FaUserCheck, FaUnlink 
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

import './ScheduleManager.css';

const ScheduleManager = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // --- State ---
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [mySlots, setMySlots] = useState([]);
    const [deleteIds, setDeleteIds] = useState([]); 
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [isGoogleSynced, setIsGoogleSynced] = useState(false); 

    // ป้องกัน React ยิง API เบิ้ล 2 รอบในโหมด Development
    const calledOnce = useRef(false);

    const availableTimeSlots = [
        "09:00-10:00", "10:00-11:00", "11:00-12:00",
        "13:00-14:00", "14:00-15:00", "15:00-16:00",
        "16:00-17:00", "17:00-18:00"
    ];

    // --- 1. ฟังก์ชันเช็คสถานะ Google Calendar จาก Database ---
    const checkGoogleStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/calendar/status', { 
                headers: { 'x-auth-token': token } 
            });
            setIsGoogleSynced(res.data.is_google_synced); // อัปเดตปุ่มตามจริง
        } catch (err) {
            console.error("เช็คสถานะ Google ไม่สำเร็จ", err);
        }
    };

    useEffect(() => { 
        fetchMySlots(); 
        checkGoogleStatus(); // เรียกใช้ตอนโหลดหน้าเว็บ
        
        if (!calledOnce.current) {
            handleGoogleRedirect();
            calledOnce.current = true;
        }
    }, []);

    // --- 2. ตรวจสอบ URL เมื่อ Google Redirect กลับมา ---
    const handleGoogleRedirect = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
            // ลบ ?code ออกจาก URL ทันที เพื่อไม่ให้รีเฟรชแล้วยิงซ้ำ
            window.history.replaceState({}, document.title, window.location.pathname);
            
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await axios.post('http://localhost:5000/api/calendar/save-token', 
                    { code }, 
                    { headers: { 'x-auth-token': token } }
                );
                
                if (res.data.success) {
                    setMessage({ type: 'success', text: '✅ เชื่อมต่อ Google Calendar สำเร็จ! ระบบจะ Auto Sync ให้คุณ' });
                    setIsGoogleSynced(true);
                }
            } catch (err) {
                const errorMsg = err.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Google';
                setMessage({ type: 'danger', text: `❌ ${errorMsg}` });
            } finally {
                setLoading(false);
            }
        }
    };

    // --- API Functions ---
    const fetchMySlots = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/schedule', { headers: { 'x-auth-token': token } });
            setMySlots(res.data);
            setLoading(false);
        } catch (err) { 
            setLoading(false); 
        }
    };

    const handleToggleStatus = async (slot) => {
        if (slot.appointment_id) return alert("รายการนี้ถูกจองโดยนักเรียนแล้ว ไม่สามารถปิดได้ครับ");
        try {
            const token = localStorage.getItem('token');
            const newStatus = slot.is_available === 1 ? 0 : 1;
            await axios.put(`http://localhost:5000/api/schedule/${slot.schedule_id}/status`, 
                { is_available: newStatus },
                { headers: { 'x-auth-token': token } }
            );
            setMySlots(prev => prev.map(s => s.schedule_id === slot.schedule_id ? { ...s, is_available: newStatus } : s));
        } catch (err) {
            alert("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
        }
    };

    const toggleDeleteId = (id) => setDeleteIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);

    const handleSelectAll = () => {
        const deletableSlots = mySlots.filter(s => !s.appointment_id).map(s => s.schedule_id);
        if (deleteIds.length === deletableSlots.length && deletableSlots.length > 0) setDeleteIds([]);
        else setDeleteIds(deletableSlots);
    };

    const handleBatchDelete = async () => {
        if (deleteIds.length === 0) return alert("กรุณาเลือกรายการที่จะลบ");
        if (!window.confirm(`ยืนยันการลบ ${deleteIds.length} รายการ? (ระบบ Auto Sync จะลบออกจาก Google Calendar ด้วย)`)) return;
        
        setDeleting(true);
        let deletedCount = 0;
        const token = localStorage.getItem('token');
        try {
            for (const id of deleteIds) {
                try {
                    await axios.delete(`http://localhost:5000/api/schedule/${id}`, { headers: { 'x-auth-token': token } });
                    deletedCount++;
                } catch (e) {}
            }
            setMessage({ type: 'success', text: `✅ ลบสำเร็จ ${deletedCount} รายการ` });
            setDeleteIds([]); 
            fetchMySlots();
        } catch (err) { 
            setMessage({ type: 'danger', text: '❌ เกิดข้อผิดพลาดในการลบ' }); 
        } finally { 
            setDeleting(false); 
        }
    };

    const handleConnectGoogle = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/calendar/auth-url', { headers: { 'x-auth-token': token } });
            window.location.href = res.data.url;
        } catch (error) {
            setMessage({ type: 'danger', text: '❌ ไม่สามารถดึงลิงก์เชื่อมต่อ Google ได้' });
        }
    };

    const handleDisconnectGoogle = async () => {
        if (!window.confirm('คุณต้องการยกเลิกการซิงค์ตารางงานกับ Google Calendar ใช่หรือไม่?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/calendar/disconnect', {}, { headers: { 'x-auth-token': token } });
            setIsGoogleSynced(false);
            setMessage({ type: 'success', text: '✅ ยกเลิกการเชื่อมต่อสำเร็จ ระบบหยุดซิงค์อัตโนมัติแล้ว' });
        } catch (error) {
            setMessage({ type: 'danger', text: '❌ เกิดข้อผิดพลาดในการยกเลิก' });
        }
    };

    const toggleSlot = (slot) => setSelectedSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedDate || selectedSlots.length === 0) return setMessage({ type: 'warning', text: '⚠️ กรุณาเลือกข้อมูลให้ครบ' });
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/schedule', { date: selectedDate, time_slots: selectedSlots }, { headers: { 'x-auth-token': token } });
            setMessage({ type: 'success', text: '✅ บันทึกสำเร็จ ระบบกำลังซิงค์ขึ้น Google Calendar...' });
            setSelectedSlots([]); 
            fetchMySlots(); 
            setTimeout(() => setMessage(null), 3000);
        } catch (err) { 
            setMessage({ type: 'danger', text: '❌ บันทึกไม่สำเร็จ' }); 
        }
    };

    if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary"/></div>;

    return (
        <div className="container-fluid px-4 px-lg-5 py-5" style={{maxWidth: '1300px'}}>
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
                                        {deleting ? <Spinner size="sm"/> : <FaTrash className="me-1"/>} ลบ ({deleteIds.length})
                                    </Button>
                                )}
                                
                                {isGoogleSynced ? (
                                    <Button variant="outline-danger" className="rounded-pill px-3 shadow-sm" onClick={handleDisconnectGoogle}>
                                        <FaUnlink className="me-2" /> ยกเลิกการเชื่อมต่อ
                                    </Button>
                                ) : (
                                    <Button className="btn-pcshs-sync rounded-pill px-3 shadow-sm" onClick={handleConnectGoogle}>
                                        <FaGoogle className="me-2" /> เชื่อมต่อ Google Calendar
                                    </Button>
                                )}
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
                                                                variant={isClosed ? "outline-danger" : "outline-success"}
                                                                size="sm"
                                                                className="rounded-circle btn-icon-only"
                                                                onClick={() => handleToggleStatus(slot)}
                                                                title={isClosed ? "เปิดรับคิว" : "ปิดรับชั่วคราว"}
                                                                style={{width: '32px', height: '32px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}}
                                                            >
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