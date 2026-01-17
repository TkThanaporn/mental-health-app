// client/src/components/student/AppointmentBooking.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Form, Button, Card, Alert, Row, Col, Image, Navbar, Nav, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // ต้องมี AuthContext
import { jwtDecode } from "jwt-decode";
import { 
    FaCalendarAlt, FaClock, FaVideo, FaUserFriends, FaCommentDots, 
    FaHome, FaNewspaper, FaHeartbeat, FaHistory, FaUserCircle, FaSignOutAlt, FaMapMarkerAlt 
} from 'react-icons/fa';

import pcshsLogo from '../../assets/pcshs_logo.png'; 
import './AppointmentBooking.css'; // Import CSS ที่สร้างใหม่

const AppointmentBooking = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    
    // State เดิม
    const [psycho, setPsycho] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]); 
    const [dailySlots, setDailySlots] = useState([]); 
    const [selectedScheduleId, setSelectedScheduleId] = useState(null);
    const [formData, setFormData] = useState({ 
        date: '', time: '', type: 'Online', topic: '', consultation_type: 'Individual' 
    });
    const [message, setMessage] = useState(null);
    const [groupMembers, setGroupMembers] = useState(['']); 
    
    // State สำหรับ Navbar
    const [currentUserName, setCurrentUserName] = useState("นักเรียน");

    // --- Logic ส่วน Navbar (ดึงชื่อ User) ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const userObj = decoded.user || decoded;
                if(userObj.name) setCurrentUserName(userObj.name);
            } catch (e) {
                console.error("Token Error", e);
            }
        }
    }, []);

    // --- Logic เดิม (Check Prerequisite) ---
    useEffect(() => {
        const checkPrerequisite = async () => {
            try {
                const token = localStorage.getItem('token');
                // เพิ่มเงื่อนไขเช็คว่า token มีไหมก่อนยิง request
                if (!token) return; 
                
                const res = await axios.get('http://localhost:5000/api/assessments/latest', {
                    headers: { 'x-auth-token': token }
                });

                if (!res.data) {
                    alert("⚠️ คุณจำเป็นต้องทำแบบประเมินสุขภาพจิตก่อนจองคิวครับ");
                    navigate('/student/assessment'); 
                }
            } catch (err) {
                console.error("Error checking assessment:", err);
            }
        };
        checkPrerequisite();
    }, [navigate]);

    useEffect(() => { fetchPsychologistAndSchedule(); }, []);

    useEffect(() => {
        if (formData.date && availableSlots.length > 0) {
            const slotsForDate = availableSlots.filter(slot => {
                const slotDateStr = new Date(slot.date).toISOString().split('T')[0];
                return slotDateStr === formData.date;
            });
            setDailySlots(slotsForDate);
            setFormData(prev => ({ ...prev, time: '' })); 
            setSelectedScheduleId(null); 
        }
    }, [formData.date, availableSlots]);

    const fetchPsychologistAndSchedule = async () => {
        try {
            const token = localStorage.getItem('token');
            const resPsycho = await axios.get('http://localhost:5000/api/psychologists/available', {
                headers: { 'x-auth-token': token } 
            });

            if (Array.isArray(resPsycho.data) && resPsycho.data.length > 0) {
                const selectedPsycho = resPsycho.data[0];
                setPsycho(selectedPsycho);
                const resSchedule = await axios.get(`http://localhost:5000/api/schedule/psychologist/${selectedPsycho.user_id}`);
                setAvailableSlots(resSchedule.data);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
            setMessage({ type: 'danger', text: 'ไม่สามารถดึงข้อมูลได้' });
        }
    };
    
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'consultation_type' && value === 'Individual') {
            setGroupMembers(['']);
        }
    };

    const handleGroupMemberChange = (index, value) => {
        const newMembers = [...groupMembers];
        newMembers[index] = value;
        setGroupMembers(newMembers);
    };

    const removeGroupMember = (indexToRemove) => {
        setGroupMembers(groupMembers.filter((_, index) => index !== indexToRemove));
    };

    const handleAddToGoogleCalendar = () => {
        if (!formData.date || !formData.time) return;
        const [startT, endT] = formData.time.split('-');
        const cleanDate = formData.date.replace(/-/g, '');
        const startTime = `${cleanDate}T${startT.trim().replace(':', '')}00`;
        const endTime = `${cleanDate}T${endT.trim().replace(':', '')}00`;
        const title = encodeURIComponent(`นัดหมายปรึกษาจิตวิทยา (${formData.type})`);
        const details = encodeURIComponent(`หัวข้อ: ${formData.topic}\nกับนักจิตวิทยา: ${psycho.fullname}`);
        const location = encodeURIComponent(formData.type === 'Online' ? 'Online Meeting' : 'ห้องให้คำปรึกษา');
        const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
        window.open(calendarUrl, '_blank');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!psycho) return setMessage({ type: 'danger', text: 'ไม่พบนักจิตวิทยา' });
        if (!selectedScheduleId) return setMessage({ type: 'danger', text: 'กรุณาเลือกเวลา' });

        try {
            const token = localStorage.getItem('token');
            const dataToSend = {
                schedule_id: selectedScheduleId,
                psychologist_id: psycho.user_id,
                note: formData.topic,
                type: formData.type,
                consultation_type: formData.consultation_type,
                group_members: formData.consultation_type === 'Group' ? groupMembers.filter(m => m.trim() !== '') : []
            };
            
            await axios.post('http://localhost:5000/api/appointments', dataToSend, { 
                headers: { 'x-auth-token': token } 
            });
            
            setMessage({ type: 'success', text: 'จองสำเร็จ!' });

        } catch (err) {
            console.error("Booking Error:", err);
            setMessage({ type: 'danger', text: err.response?.data?.msg || 'การจองล้มเหลว' });
        }
    };

    if (!psycho) return <div className="text-center mt-5 pt-5">กำลังโหลดข้อมูล...</div>;
    
    const psychoName = psycho.fullname || 'นักจิตวิทยา';
    const psychoImage = psycho.profile_image || "https://placehold.co/150?text=Psycho";

    return (
        <div className="booking-wrapper">
             {/* 1. Navbar Section */}
             <Navbar expand="lg" className="pcshs-navbar fixed-top bg-white border-bottom shadow-sm">
                <Container>
                    <Navbar.Brand onClick={() => navigate('/')} style={{cursor:'pointer'}} className="fw-bold d-flex align-items-center">
                        <img src={pcshsLogo} alt="Logo" height="36" className="me-2"/>
                        <div>
                            <span style={{ color: '#0035ad', fontSize: '1.1rem' }}>PCSHS</span> 
                            <span style={{ color: '#f26522', fontSize: '1.1rem' }}>Care</span>
                        </div>
                    </Navbar.Brand>
                    
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ms-auto align-items-center gap-2">
                            <Nav.Link onClick={() => navigate('/')} className="nav-link-custom"><FaHome className="me-1 mb-1"/> หน้าหลัก</Nav.Link>
                            <Nav.Link onClick={() => navigate('/news')} className="nav-link-custom"><FaNewspaper className="me-1 mb-1"/> ข่าวสาร</Nav.Link>
                            <Nav.Link onClick={() => navigate('/student/assessment')} className="nav-link-custom"><FaHeartbeat className="me-1 mb-1"/> ประเมินสุขภาพใจ</Nav.Link>
                            {/* Active Tab */}
                            <Nav.Link onClick={() => navigate('/student/book')} className="nav-link-custom active fw-bold text-primary"><FaCalendarAlt className="me-1 mb-1"/> จองคิว</Nav.Link>
                            <Nav.Link onClick={() => navigate('/student/dashboard')} className="nav-link-custom"><FaHistory className="me-1 mb-1"/> ข้อมูลการนัดหมาย</Nav.Link>
                            
                            <div className="vr mx-2 d-none d-lg-block text-secondary opacity-25"></div>

                            <Dropdown align="end">
                                <Dropdown.Toggle variant="light" className="rounded-pill border d-flex align-items-center gap-2 bg-light px-3 py-1">
                                    <FaUserCircle className="text-secondary" size={20}/>
                                    <span className="small fw-bold text-dark d-none d-lg-block">{currentUserName}</span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="border-0 shadow-lg mt-2 rounded-3">
                                    <Dropdown.Item onClick={() => navigate('/profile')}>โปรไฟล์ส่วนตัว</Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item onClick={logout} className="text-danger"><FaSignOutAlt className="me-2"/> ออกจากระบบ</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* Spacer for Fixed Navbar */}
            <div style={{ marginTop: '90px' }}></div>

            <Container className="py-4">
                {/* Header Title */}
                <div className="mb-4 text-center text-md-start">
                    <h2 className="fw-bold text-dark"><FaCalendarAlt className="text-primary me-2"/>จองคิวปรึกษา (Real-time)</h2>
                    <p className="text-muted">เลือกวันและเวลาที่คุณสะดวกเพื่อพูดคุยกับนักจิตวิทยา</p>
                </div>
                
                {message && message.type === 'success' ? (
                    <Alert variant="success" className="text-center shadow-sm border-0 rounded-4 p-5">
                        <div className="mb-3 display-1">🎉</div>
                        <h2 className="fw-bold text-success mb-3">จองคิวสำเร็จ!</h2>
                        <p className="text-secondary fs-5 mb-4">ระบบได้บันทึกการนัดหมายของคุณเรียบร้อยแล้ว</p>
                        <div className="d-flex justify-content-center gap-3 flex-wrap">
                            <Button variant="warning" size="lg" className="rounded-pill text-dark fw-bold px-4" onClick={handleAddToGoogleCalendar}>
                                📅 เพิ่มลง Calendar
                            </Button>
                            <Button variant="outline-primary" size="lg" className="rounded-pill px-4" onClick={() => navigate('/student/dashboard')}>
                                กลับหน้าหลัก
                            </Button>
                        </div>
                    </Alert>
                ) : (
                    <>
                        {message && <Alert variant={message.type} className="rounded-3 shadow-sm">{message.text}</Alert>}
                        
                        <Row className="g-4">
                            {/* Left Column: Psychologist Info */}
                            <Col lg={4}>
                                <Card className="psycho-card h-100 shadow-sm">
                                    <div className="psycho-cover-bg"></div>
                                    <Card.Body className="text-center px-4 pb-5 pt-0">
                                        <div className="psycho-avatar-container">
                                            <Image src={psychoImage} roundedCircle className="psycho-img" />
                                        </div>
                                        <h4 className="fw-bold mt-3 mb-1">{psychoName}</h4>
                                        <span className="psycho-badge mb-3 d-inline-block">นักจิตวิทยาประจำศูนย์</span>
                                        
                                        {psycho.bio && (
                                            <div className="mt-3 bg-light p-3 rounded-3 text-secondary fst-italic border small">
                                                "{psycho.bio}"
                                            </div>
                                        )}
                                        
                                        <div className="mt-4 text-start">
                                            <h6 className="fw-bold text-muted small text-uppercase ls-1">Contact Info</h6>
                                            <div className="d-flex align-items-center mb-2 text-dark small">
                                                <FaMapMarkerAlt className="text-primary me-2"/> ห้องให้คำปรึกษา ชั้น 2
                                            </div>
                                            {psycho.email && (
                                                <div className="d-flex align-items-center text-dark small">
                                                    <FaCommentDots className="text-primary me-2"/> {psycho.email}
                                                </div>
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>

                            {/* Right Column: Booking Form */}
                            <Col lg={8}>
                                <Card className="booking-card bg-white p-3 p-md-4">
                                    <Card.Body>
                                        <Form onSubmit={handleSubmit}>
                                            {/* Section 1: Date & Time */}
                                            <h5 className="fw-bold text-primary mb-3">1. เลือกวันและเวลา</h5>
                                            <Form.Group className="mb-4">
                                                <Form.Label className="form-label-custom"><FaCalendarAlt/> วันที่ต้องการปรึกษา</Form.Label>
                                                <Form.Control 
                                                    type="date" 
                                                    name="date" 
                                                    className="form-control-custom"
                                                    value={formData.date} 
                                                    onChange={handleFormChange} 
                                                    required 
                                                />
                                            </Form.Group>

                                            <Form.Group className="mb-4">
                                                <Form.Label className="form-label-custom"><FaClock/> ช่วงเวลาที่ว่าง</Form.Label>
                                                {!formData.date ? (
                                                    <div className="text-center p-4 bg-light rounded-3 border border-dashed text-muted">
                                                        กรุณาเลือกวันที่ก่อน เพื่อดูตารางเวลา
                                                    </div>
                                                ) : dailySlots.length === 0 ? (
                                                    <Alert variant="warning" className="border-0 bg-warning bg-opacity-10 text-warning-darker">
                                                        ❌ ไม่พบคิวว่างในวันนี้ กรุณาเลือกวันอื่น
                                                    </Alert>
                                                ) : (
                                                    <div className="time-slot-grid">
                                                        {dailySlots.map((slot) => (
                                                            <button
                                                                type="button"
                                                                key={slot.schedule_id}
                                                                className={`slot-btn ${selectedScheduleId === slot.schedule_id ? 'active' : ''}`}
                                                                onClick={() => {
                                                                    setFormData({ ...formData, time: slot.time_slot });
                                                                    setSelectedScheduleId(slot.schedule_id);
                                                                }}
                                                            >
                                                                {slot.time_slot}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </Form.Group>

                                            <hr className="my-4 text-muted opacity-25"/>

                                            {/* Section 2: Details */}
                                            <h5 className="fw-bold text-primary mb-3">2. รายละเอียดการปรึกษา</h5>
                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label className="form-label-custom"><FaVideo/> รูปแบบ</Form.Label>
                                                        <Form.Select className="form-select-custom" name="type" value={formData.type} onChange={handleFormChange}>
                                                            <option value="Online">Video Call / Chat (Online)</option>
                                                            <option value="Onsite">พบตัวจริง (Onsite)</option>
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label className="form-label-custom"><FaUserFriends/> ประเภท</Form.Label>
                                                        <Form.Select className="form-select-custom" name="consultation_type" value={formData.consultation_type} onChange={handleFormChange}>
                                                            <option value="Individual">ปรึกษาเดี่ยว</option>
                                                            <option value="Group">ปรึกษากลุ่ม</option>
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            {/* Group Members Section */}
                                            {formData.consultation_type === 'Group' && (
                                                <div className="bg-light p-3 rounded-3 mb-4 border">
                                                    <Form.Label className="fw-bold small text-muted mb-2">รายชื่อเพื่อนร่วมกลุ่ม (Email)</Form.Label>
                                                    {groupMembers.map((member, index) => (
                                                        <div key={index} className="d-flex mb-2 gap-2">
                                                            <Form.Control 
                                                                type="email" 
                                                                className="form-control-custom py-2"
                                                                placeholder={`อีเมลเพื่อนคนที่ ${index + 1}`} 
                                                                value={member} 
                                                                onChange={(e) => handleGroupMemberChange(index, e.target.value)} 
                                                            />
                                                            {groupMembers.length > 1 && (
                                                                <Button variant="outline-danger" className="rounded-3" onClick={() => removeGroupMember(index)}>-</Button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <Button variant="link" className="text-decoration-none p-0 mt-1" onClick={() => setGroupMembers([...groupMembers, ''])}>
                                                        + เพิ่มเพื่อนอีก
                                                    </Button>
                                                </div>
                                            )}

                                            <Form.Group className="mb-4">
                                                <Form.Label className="form-label-custom"><FaCommentDots/> เรื่องที่ต้องการปรึกษา (เบื้องต้น)</Form.Label>
                                                <Form.Control 
                                                    as="textarea" 
                                                    rows={3} 
                                                    name="topic" 
                                                    className="form-control-custom"
                                                    placeholder="เช่น เครียดเรื่องเรียน, ปัญหาครอบครัว, หรืออื่นๆ..."
                                                    value={formData.topic} 
                                                    onChange={handleFormChange} 
                                                    required 
                                                />
                                            </Form.Group>

                                            <Button variant="success" size="lg" type="submit" className="btn-confirm w-100 py-3 mt-2 shadow">
                                                ยืนยันการจองนัดหมาย
                                            </Button>
                                        </Form>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </>
                )}
            </Container>
        </div>
    );
};

export default AppointmentBooking;