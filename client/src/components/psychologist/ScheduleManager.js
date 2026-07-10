import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
// เพิ่มการนำเข้า Modal จาก react-bootstrap
import { Card, Form, Button, Row, Col, Alert, Spinner, Table, Modal } from 'react-bootstrap';
import { 
    FaGoogle, FaTrash, FaClock, FaCheckCircle, 
    FaPlusCircle, FaHistory, FaCalendarCheck,
    FaLock, FaLockOpen, FaUserCheck, FaUnlink, FaFilter
} from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

import './ScheduleManager.css';

const ScheduleManager = () => {
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

    // เพิ่ม State สำหรับควบคุมหน้าต่างยืนยันการลบ
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // --- ข้อมูลเดือนภาษาไทย ---
    const thaiMonths = [
        { value: '01', name: 'มกราคม' },
        { value: '02', name: 'กุมภาพันธ์' },
        { value: '03', name: 'มีนาคม' },
        { value: '04', name: 'เมษายน' },
        { value: '05', name: 'พฤษภาคม' },
        { value: '06', name: 'มิถุนายน' },
        { value: '07', name: 'กรกฎาคม' },
        { value: '08', name: 'สิงหาคม' },
        { value: '09', name: 'กันยายน' },
        { value: '10', name: 'ตุลาคม' },
        { value: '11', name: 'พฤศจิกายน' },
        { value: '12', name: 'ธันวาคม' }
    ];

    // --- รายการปีสำหรับการเลือก (ย้อนหลัง 1 ปี และล่วงหน้า 3 ปี) ---
    const currentYear = new Date().getFullYear();
    const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

    // --- State สำหรับตัวกรอง (Filters) แยกปีและเดือนภาษาไทย ---
    const [filterYear, setFilterYear] = useState(() => String(new Date().getFullYear()));
    const [filterMonth, setFilterMonth] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'));
    const [filterDate, setFilterDate] = useState('');
    const [filterTime, setFilterTime] = useState('');

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
            setIsGoogleSynced(res.data.is_google_synced); 
        } catch (err) {
            console.error("เช็คสถานะ Google ไม่สำเร็จ", err);
        }
    };

    useEffect(() => { 
        fetchMySlots(); 
        checkGoogleStatus(); 
        
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

    // --- Logic การกรองข้อมูลตารางปฏิบัติงาน ---
    const filteredSlots = mySlots.filter(slot => {
        if (!slot.date) return true;
        
        const slotDateStr = slot.date.split('T')[0]; 
        const [sYear, sMonth, sDay] = slotDateStr.split('-'); 

        const matchYear = filterYear ? sYear === filterYear : true;
        const matchMonth = filterMonth ? sMonth === filterMonth : true;
        const matchDate = filterDate ? slotDateStr === filterDate : true;
        const matchTime = filterTime ? slot.time_slot === filterTime : true;

        return matchYear && matchMonth && matchDate && matchTime;
    });

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
        const deletableSlots = filteredSlots.filter(s => !s.appointment_id).map(s => s.schedule_id);
        if (deleteIds.length === deletableSlots.length && deletableSlots.length > 0) {
            setDeleteIds([]);
        } else {
            setDeleteIds(deletableSlots);
        }
    };

    // ฟังก์ชันทำลายข้อมูลจริงหลังกดยืนยันในหน้าต่างลบ
    const handleBatchDelete = async () => {
        if (deleteIds.length === 0) return;
        
        setShowDeleteModal(false); // ปิด Modal ทันทีที่กดตกลง
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

    const clearFilters = () => {
        setFilterYear('');
        setFilterMonth('');
        setFilterDate('');
        setFilterTime('');
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
                                <FaClock className="me-2" /> รายการที่บันทึก ({filteredSlots.length}/{mySlots.length})
                            </h6>
                            
                            <div className="d-flex gap-2">
                                {deleteIds.length > 0 && (
                                    // เปลี่ยนปุ่มลบให้ไปสั่งเปิดกล่อง Modal ยืนยัน
                                    <Button variant="danger" className="btn-sm rounded-pill px-3 shadow-sm border-0" onClick={() => setShowDeleteModal(true)} disabled={deleting}>
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

                        {/* --- โซนตัวกรองการแสดงผล --- */}
                        <div className="p-3 bg-light border-bottom">
                            <Row className="g-2 align-items-end">
                                <Col xs={6} md={3}>
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-secondary mb-1">
                                            <FaFilter className="me-1 small"/> เลือกปี (ค.ศ.)
                                        </Form.Label>
                                        <Form.Select 
                                            value={filterYear} 
                                            onChange={(e) => {
                                                setFilterYear(e.target.value);
                                                setFilterDate(''); 
                                            }}
                                            className="form-select-sm"
                                        >
                                            <option value="">ทั้งหมด</option>
                                            {availableYears.map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col xs={6} md={3}>
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-secondary mb-1">เลือกเดือน</Form.Label>
                                        <Form.Select 
                                            value={filterMonth} 
                                            onChange={(e) => {
                                                setFilterMonth(e.target.value);
                                                setFilterDate(''); 
                                            }}
                                            className="form-select-sm"
                                        >
                                            <option value="">ทั้งหมด</option>
                                            {thaiMonths.map(month => (
                                                <option key={month.value} value={month.value}>{month.name}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col xs={12} md={3}>
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-secondary mb-1">ระบุวันที่เจาะจง</Form.Label>
                                        <Form.Control 
                                            type="date" 
                                            value={filterDate} 
                                            onChange={(e) => {
                                                setFilterDate(e.target.value);
                                                if (e.target.value) {
                                                    setFilterYear('');  
                                                    setFilterMonth(''); 
                                                }
                                            }}
                                            className="form-control-sm"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col xs={12} md={3}>
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-secondary mb-1">กรองช่วงเวลา</Form.Label>
                                        <Form.Select 
                                            value={filterTime} 
                                            onChange={(e) => setFilterTime(e.target.value)}
                                            className="form-select-sm"
                                        >
                                            <option value="">ทั้งหมด</option>
                                            {availableTimeSlots.map(slot => (
                                                <option key={slot} value={slot}>{slot} น.</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                            {(filterYear || filterMonth || filterDate || filterTime) && (
                                <div className="text-end mt-2">
                                    <Button variant="link" size="sm" className="text-decoration-none p-0 text-muted small" onClick={clearFilters}>
                                        ล้างตัวกรองทั้งหมด
                                    </Button>
                                </div>
                            )}
                        </div>

                        <Card.Body className="p-0">
                            {filteredSlots.length === 0 ? (
                                <div className="text-center py-5">
                                    <FaHistory size={40} className="text-muted opacity-25 mb-2" />
                                    <p className="text-muted mb-0">ไม่พบข้อมูลตารางงานในเงื่อนไขที่เลือก</p>
                                </div>
                            ) : (
                                <Table hover responsive className="pcshs-table mb-0">
                                    <thead>
                                        <tr>
                                            <th className="ps-4 text-center" style={{width: '60px'}}>
                                                <Form.Check 
                                                    type="checkbox" 
                                                    checked={deleteIds.length > 0 && deleteIds.length === filteredSlots.filter(s => !s.appointment_id).length}
                                                    onChange={handleSelectAll}
                                                />
                                            </th>
                                            <th>วันที่ (Date)</th>
                                            <th>เวลา & สถานะ (Time & Status)</th>
                                            <th className="text-end pe-4">จัดการ (Manage)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSlots.map((slot) => {
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

            {/* 🛠️ Modal ยืนยันการลบตารางงานแบบเป็นกลุ่ม (Batch Delete) สไตล์พรีเมียม */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered className="delete-confirmation-modal">
                <Modal.Body className="p-4 text-center">
                    <div className="delete-icon-box mx-auto mb-4">
                        <FaTrash size={28} />
                    </div>
                    
                    <h4 className="fw-bold text-navy mb-2" style={{ fontFamily: 'Prompt' }}>ยืนยันการลบตารางงาน?</h4>
                    <p className="text-muted px-3 mb-4" style={{ fontSize: '0.95rem' }}>
                        คุณแน่ใจหรือไม่ที่จะลบตารางปฏิบัติงานที่เลือกทั้งหมดจำนวน <strong className="text-danger">{deleteIds.length} รายการ</strong>?<br/>
                        <span className="small text-muted mt-1 d-block">(ระบบ Auto Sync จะทำการลบเวลานี้ออกจาก Google Calendar ด้วย)</span>
                    </p>

                    <div className="d-flex justify-content-center gap-3">
                        <Button 
                            variant="light" 
                            className="rounded-pill px-4 py-2 border fw-bold text-secondary"
                            onClick={() => setShowDeleteModal(false)}
                            style={{ minWidth: '120px' }}
                        >
                            ยกเลิก
                        </Button>
                        <Button 
                            variant="danger" 
                            className="rounded-pill px-4 py-2 fw-bold shadow-sm btn-delete-confirm"
                            onClick={handleBatchDelete}
                            style={{ minWidth: '120px', background: 'linear-gradient(135deg, #dc3545 0%, #bd2130 100%)', border: 'none' }}
                        >
                            ยืนยันการลบ
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>

        </div>
    );
};

export default ScheduleManager;