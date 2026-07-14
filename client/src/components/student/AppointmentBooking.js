import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Form, Button, Card, Alert, Row, Col, Image, Badge, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
    FaCalendarAlt, FaClock, FaVideo, FaUserFriends, FaCommentDots, FaMapMarkerAlt,
    FaPhone, FaQuoteLeft, FaVenusMars, FaEnvelope, FaAtom, FaChevronRight, FaInfoCircle
} from 'react-icons/fa';

import PCSHSNavbar from '../common/Navbar/PCSHSNavbar';
import './AppointmentBooking.css';

const AppointmentBooking = () => {
    const navigate = useNavigate();
    
    const [psycho, setPsycho] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]); 
    const [dailySlots, setDailySlots] = useState([]); 
    const [selectedScheduleId, setSelectedScheduleId] = useState(null);
    const [formData, setFormData] = useState({ 
        date: '', time: '', type: 'Online', topic: '', consultation_type: 'Individual' 
    });
    const [message, setMessage] = useState(null);
    const [groupMembers, setGroupMembers] = useState(['']); 
    
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    // 🌟 เพิ่ม State ป้องกันการกดปุ่ม Submit ซ้ำ
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const checkPrerequisite = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return; 
                const res = await axios.get('http://localhost:5000/api/assessments/latest', {
                    headers: { 'x-auth-token': token }
                });
                if (!res.data) {
                    alert("⚠️ คุณจำเป็นต้องทำแบบประเมินสุขภาพจิตก่อนจองคิวครับ");
                    navigate('/student/assessment'); 
                }
            } catch (err) { console.error(err); }
        };
        checkPrerequisite();
    }, [navigate]);

    useEffect(() => { fetchPsychologistAndSchedule(); }, []);

    useEffect(() => {
        if (formData.date && availableSlots.length > 0) {
            const slotsForDate = availableSlots.filter(slot => {
                return slot.date === formData.date;
            });
            setDailySlots(slotsForDate);
            setFormData(prev => ({ ...prev, time: '' })); 
            setSelectedScheduleId(null); 
        } else {
            setDailySlots([]); 
        }
    }, [formData.date, availableSlots]);

    const fetchPsychologistAndSchedule = async () => {
        try {
            const token = localStorage.getItem('token');
            const resPsycho = await axios.get('http://localhost:5000/api/psychologists/available', {
                headers: { 'x-auth-token': token } 
            });
            if (resPsycho.data.length > 0) {
                const selectedPsycho = resPsycho.data[0];
                setPsycho(selectedPsycho);
                const resSchedule = await axios.get(`http://localhost:5000/api/schedule/psychologist/${selectedPsycho.user_id}`);
                setAvailableSlots(resSchedule.data);
            }
        } catch (err) { setMessage({ type: 'danger', text: 'ไม่สามารถดึงข้อมูลได้' }); }
    };
    
    // 🌟 อัปเดต handleFormChange เพื่อบังคับ Onsite เมื่อเลือก Group
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            
            if (name === 'consultation_type' && value === 'Individual') {
                setGroupMembers(['']); // เคลียร์สมาชิกกลุ่ม
            }
            
            // ถ้าเลือกแบบกลุ่ม บังคับให้เป็น Onsite
            if (name === 'consultation_type' && value === 'Group') {
                newData.type = 'Onsite';
            }
            
            return newData;
        });
    };

    const handleGroupMemberChange = (index, value) => {
        const newMembers = [...groupMembers];
        newMembers[index] = value;
        setGroupMembers(newMembers);
    };

    const handlePreSubmit = (e) => {
        e.preventDefault();
        if (!selectedScheduleId) return setMessage({ type: 'danger', text: 'กรุณาเลือกช่วงเวลาที่ต้องการ' });
        
        // เช็คว่าถ้าเป็นกลุ่ม ต้องกรอกอีเมลเพื่อนอย่างน้อย 1 คน
        if (formData.consultation_type === 'Group') {
            const validMembers = groupMembers.filter(m => m.trim() !== '');
            if (validMembers.length === 0) {
                return setMessage({ type: 'danger', text: 'กรุณาระบุอีเมลเพื่อนร่วมกลุ่มอย่างน้อย 1 คน' });
            }
        }

        setMessage(null);
        setShowConfirmModal(true);
    };

    // 🌟 เพิ่ม isSubmitting ป้องกันการกดซ้ำระหว่างรอ Backend
    const confirmBooking = async () => {
        setIsSubmitting(true);
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
            setShowConfirmModal(false);
        } catch (err) { 
            setMessage({ type: 'danger', text: err.response?.data?.msg || 'การจองล้มเหลว' }); 
            setShowConfirmModal(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!psycho) return <div className="loader-container"><div className="spinner-science"></div></div>;

    return (
        <div className="booking-wrapper">
            <PCSHSNavbar />
            <div className="science-bg-grid"></div>

            <Container className="content-area py-5">
                <div className="header-style-custom mb-5">
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <FaAtom className="text-orange atom-icon-spin" />
                        <span className="text-orange fw-bold letter-spacing-2 small-title">PCSHS STUDENT CARE</span>
                    </div>
                    <h1 className="fw-extrabold text-navy main-title-text">การนัดหมายปรึกษา</h1>
                    <div className="title-underline"></div>
                </div>

                {message && message.type === 'danger' && (
                    <Alert variant="danger" className="border-0 shadow-sm rounded-4 mb-4">
                        <FaInfoCircle className="me-2"/> {message.text}
                    </Alert>
                )}

                {message && message.type === 'success' ? (
                    <Card className="success-finish-card border-0 shadow-lg text-center p-5 fade-in-up">
                        <div className="success-icon-wrapper mb-4">🎉</div>
                        <h2 className="fw-bold text-navy mb-3">จองคิวสำเร็จแล้ว!</h2>
                        <p className="text-muted mb-4">นักจิตวิทยาได้รับคำขอของคุณแล้ว</p>
                        <div className="d-flex justify-content-center gap-3">
                            <Button className="btn-pcshs-navy rounded-pill px-4" onClick={() => navigate('/student/appointments')} style={{ background: 'var(--navy)', color: 'white', border: 'none' }}>ดูนัดหมายของฉัน</Button>
                        </div>
                    </Card>
                ) : (
                    <Row className="g-4">
                        <Col lg={4}>
                            <Card className="profile-glass-card border-0 shadow-sm sticky-top" style={{ top: '100px' }}>
                                <div className="card-top-accent-orange"></div>
                                <Card.Body className="p-4 text-center">
                                    <div className="avatar-container mb-3">
                                        <Image src={psycho.profile_image || "https://placehold.co/200?text=Psycho"} roundedCircle className="profile-img-lg" />
                                    </div>
                                    <h4 className="fw-bold text-navy mb-1">{psycho.fullname}</h4>
                                    <Badge bg="light" text="dark" className="border rounded-pill px-3 py-2 fw-normal mb-4">
                                        นักจิตวิทยาประจำศูนย์
                                    </Badge>
                                    <div className="bio-box mb-4">
                                        <FaQuoteLeft className="quote-icon-small" />
                                        <p className="m-0 italic-text">{psycho.bio || "พร้อมรับฟังและเคียงข้างนักเรียนทุกคนในทุกปัญหาครับ"}</p>
                                    </div>
                                    <div className="contact-minimal text-start">
                                        <div className="contact-row">
                                            <FaMapMarkerAlt className="text-orange" />
                                            <span>ห้องแนะแนว อาคาร 1</span>
                                        </div>
                                        {psycho.email && (
                                            <div className="contact-row">
                                                <FaEnvelope className="text-orange" />
                                                <span className="text-truncate">{psycho.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={8}>
                            <Card className="booking-form-card border-0 shadow-sm p-4">
                                <Form onSubmit={handlePreSubmit}>
                                    <section className="form-step mb-5">
                                        <div className="d-flex align-items-center gap-3 mb-4">
                                            <div className="step-badge">1</div>
                                            <h5 className="fw-bold m-0 text-navy">ระบุวันและเลือกเวลา</h5>
                                        </div>
                                        
                                        <Row className="g-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label className="small-label">วันที่สะดวก</Form.Label>
                                                    <div className="input-group-custom">
                                                        <FaCalendarAlt className="input-icon-left" />
                                                        <Form.Control 
                                                            type="date" 
                                                            name="date" 
                                                            className="custom-input-field" 
                                                            value={formData.date} 
                                                            onChange={handleFormChange} 
                                                            min={new Date().toISOString().split('T')[0]}
                                                            required 
                                                        />
                                                    </div>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <div className="mt-4">
                                            <Form.Label className="small-label mb-3">ช่วงเวลาที่เปิดรับนัด</Form.Label>
                                            {!formData.date ? (
                                                <div className="placeholder-time-grid">กรุณาเลือกวันที่เพื่อตรวจสอบคิวว่าง</div>
                                            ) : dailySlots.length === 0 ? (
                                                <Alert variant="warning" className="rounded-4 border-0">
                                                    <FaInfoCircle className="me-2"/> 
                                                    ไม่มีคิวว่างในวันที่ {new Date(formData.date).toLocaleDateString('th-TH', {day: 'numeric', month: 'long', year: 'numeric'})}
                                                </Alert>
                                            ) : (
                                                <div className="time-chips-container">
                                                    {dailySlots.map((slot) => (
                                                        <button
                                                            type="button" key={slot.schedule_id}
                                                            className={`time-chip-btn ${selectedScheduleId === slot.schedule_id ? 'active' : ''}`}
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
                                        </div>
                                    </section>

                                    <section className="form-step mb-4">
                                        <div className="d-flex align-items-center gap-3 mb-4">
                                            <div className="step-badge">2</div>
                                            <h5 className="fw-bold m-0 text-navy">ข้อมูลการปรึกษา</h5>
                                        </div>
                                        
                                        <Row className="g-3 mb-4">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label className="small-label">ประเภท</Form.Label>
                                                    <Form.Select className="custom-input-field" name="consultation_type" value={formData.consultation_type} onChange={handleFormChange}>
                                                        <option value="Individual">รายบุคคล</option>
                                                        <option value="Group">กลุ่ม (เพื่อน)</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label className="small-label">รูปแบบ</Form.Label>
                                                    {/* 🌟 อัปเดต Select ของ รูปแบบ ให้ล็อคถ้าเป็น Group */}
                                                    <Form.Select 
                                                        className="custom-input-field" 
                                                        name="type" 
                                                        value={formData.type} 
                                                        onChange={handleFormChange}
                                                        disabled={formData.consultation_type === 'Group'}
                                                    >
                                                        {formData.consultation_type !== 'Group' && (
                                                            <option value="Online">ออนไลน์ (Chat/Video)</option>
                                                        )}
                                                        <option value="Onsite">พบตัวจริง (ห้องแนะแนว)</option>
                                                    </Form.Select>
                                                    {formData.consultation_type === 'Group' && (
                                                        <Form.Text className="text-orange small mt-1 d-block">
                                                            * การปรึกษาแบบกลุ่มรองรับเฉพาะพบตัวจริงเท่านั้น
                                                        </Form.Text>
                                                    )}
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        {formData.consultation_type === 'Group' && (
                                            <div className="group-members-box p-3 rounded-4 mb-4" style={{ backgroundColor: 'var(--light-bg)' }}>
                                                <Form.Label className="small fw-bold mb-2">อีเมลเพื่อนร่วมกลุ่ม</Form.Label>
                                                {groupMembers.map((member, index) => (
                                                    <div key={index} className="d-flex gap-2 mb-2">
                                                        <Form.Control 
                                                            type="email" 
                                                            className="custom-input-field" 
                                                            placeholder="student@pcshs.ac.th" 
                                                            value={member} 
                                                            onChange={(e) => handleGroupMemberChange(index, e.target.value)} 
                                                            required={index === 0} // 🌟 บังคับกรอกอย่างน้อยช่องแรก
                                                        />
                                                        {groupMembers.length > 1 && (
                                                            <Button variant="outline-danger" className="rounded-3" onClick={() => setGroupMembers(groupMembers.filter((_, i) => i !== index))}>-</Button>
                                                        )}
                                                    </div>
                                                ))}
                                                <Button variant="link" className="text-orange p-0 text-decoration-none small" onClick={() => setGroupMembers([...groupMembers, ''])}>+ เพิ่มรายชื่อเพื่อน</Button>
                                            </div>
                                        )}

                                        <Form.Group className="mb-4">
                                            <Form.Label className="small-label">หัวข้อที่ต้องการปรึกษา</Form.Label>
                                            <Form.Control as="textarea" rows={3} name="topic" className="custom-input-field" placeholder="ระบุสิ่งที่กังวลใจเบื้องต้น..." value={formData.topic} onChange={handleFormChange} required />
                                        </Form.Group>
                                    </section>

                                    <Button type="submit" className="btn-submit-main w-100 py-3 mt-2 shadow-lg">
                                        ดำเนินการต่อ <FaChevronRight className="ms-2 small" />
                                    </Button>
                                </Form>
                            </Card>
                        </Col>
                    </Row>
                )}
            </Container>

            {/* Modal สำหรับยืนยันข้อมูลการจอง */}
            <Modal show={showConfirmModal} onHide={() => !isSubmitting && setShowConfirmModal(false)} centered backdrop="static">
                <Modal.Header closeButton={!isSubmitting} className="border-0 pb-0">
                    <Modal.Title className="fw-bold text-navy">ยืนยันข้อมูลการนัดหมาย</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3">
                    <p className="text-muted mb-4 small">กรุณาตรวจสอบรายละเอียดการนัดหมายของคุณก่อนกดยืนยัน</p>
                    
                    <div className="bg-light p-3 rounded-4 mb-3">
                        <Row className="mb-2 align-items-center">
                            <Col xs={4} className="text-secondary fw-bold small"><FaCalendarAlt className="me-2 text-orange"/>วันที่:</Col>
                            <Col xs={8} className="fw-medium">
                                {formData.date ? new Date(formData.date).toLocaleDateString('th-TH', {day: 'numeric', month: 'long', year: 'numeric'}) : '-'}
                            </Col>
                        </Row>
                        <Row className="mb-2 align-items-center">
                            <Col xs={4} className="text-secondary fw-bold small"><FaClock className="me-2 text-orange"/>เวลา:</Col>
                            <Col xs={8} className="fw-medium">{formData.time}</Col>
                        </Row>
                        <Row className="mb-2 align-items-center">
                            <Col xs={4} className="text-secondary fw-bold small">
                                {formData.type === 'Online' ? <FaVideo className="me-2 text-orange"/> : <FaMapMarkerAlt className="me-2 text-orange"/>}
                                รูปแบบ:
                            </Col>
                            <Col xs={8} className="fw-medium">
                                {formData.type === 'Online' ? 'ออนไลน์ (Chat/Video)' : 'พบตัวจริง (ห้องแนะแนว)'}
                            </Col>
                        </Row>
                        <Row className="mb-2 align-items-center">
                            <Col xs={4} className="text-secondary fw-bold small"><FaUserFriends className="me-2 text-orange"/>ประเภท:</Col>
                            <Col xs={8} className="fw-medium">
                                {formData.consultation_type === 'Individual' ? 'ปรึกษารายบุคคล' : 'ปรึกษาแบบกลุ่ม'}
                            </Col>
                        </Row>
                        {formData.consultation_type === 'Group' && (
                            <Row className="mb-2 align-items-start">
                                <Col xs={4} className="text-secondary fw-bold small pt-1"><FaEnvelope className="me-2 text-orange"/>เพื่อนในกลุ่ม:</Col>
                                <Col xs={8} className="fw-medium text-break small">
                                    {groupMembers.filter(m => m.trim() !== '').join(', ')}
                                </Col>
                            </Row>
                        )}
                        <Row className="align-items-start">
                            <Col xs={4} className="text-secondary fw-bold small pt-1"><FaCommentDots className="me-2 text-orange"/>หัวข้อ:</Col>
                            <Col xs={8} className="fw-medium text-break">{formData.topic}</Col>
                        </Row>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="light" className="rounded-pill px-4" onClick={() => setShowConfirmModal(false)} disabled={isSubmitting}>
                        แก้ไขข้อมูล
                    </Button>
                    {/* 🌟 แสดงข้อความกำลังจอง หากผู้ใช้กดแล้ว */}
                    <Button className="rounded-pill px-4 border-0" style={{ background: 'var(--orange)', color: 'white' }} onClick={confirmBooking} disabled={isSubmitting}>
                        {isSubmitting ? 'กำลังยืนยันคิว...' : 'ยืนยันการจองคิว'}
                    </Button>
                </Modal.Footer>
            </Modal>

        </div>
    );
};

export default AppointmentBooking;