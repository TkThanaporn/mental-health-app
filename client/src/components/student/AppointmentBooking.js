// client/src/components/student/AppointmentBooking.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Form, Button, Card, Alert, Row, Col, Badge } from 'react-bootstrap';

const AppointmentBooking = () => {
    // เก็บข้อมูลนักจิตวิทยา
    const [psycho, setPsycho] = useState(null); 
    
    // ข้อมูล Form
    const [formData, setFormData] = useState({ 
        date: '', 
        time: '', 
        type: 'Online', 
        topic: '', 
        consultation_type: 'Individual' 
    });
    
    const [message, setMessage] = useState(null);
    const [groupMembers, setGroupMembers] = useState(['']); 
    
    // ✅ เพิ่ม: State สำหรับเก็บช่วงเวลาที่ไม่ว่าง (Busy Slots)
    const [busySlots, setBusySlots] = useState([]);

    // ✅ เพิ่ม: รายการเวลาที่เปิดให้บริการ (กำหนดตายตัว หรือดึงจาก Backend ก็ได้)
    const timeSlots = [
        "09:00-10:00", "10:00-11:00", "11:00-12:00",
        "13:00-14:00", "14:00-15:00", "15:00-16:00"
    ];

    useEffect(() => {
        fetchPsychologist();
    }, []);

    // ✅ เพิ่ม: เมื่อวันที่เปลี่ยน ให้เช็คว่าวันนั้นมีเวลาไหนไม่ว่างบ้าง
    useEffect(() => {
        if (formData.date) {
            checkAvailability(formData.date);
        }
    }, [formData.date]);

    // ฟังก์ชันจำลองการเช็คเวลาว่าง (ในระบบจริงต้องยิง API ไปถาม Backend)
    const checkAvailability = async (selectedDate) => {
        // Reset ก่อน
        setBusySlots([]);

        // ตัวอย่าง Logic (Mock): สมมติว่าถ้านักเรียนเลือกวันที่ 14 เดือนกุมภาพันธ์ เวลา 10-11 จะไม่ว่าง
        // *ในการใช้งานจริง คุณต้องสร้าง API GET /api/appointments/busy?date=... มาใช้ตรงนี้*
        if (selectedDate.includes('2024-02-14')) {
            setBusySlots(["10:00-11:00"]); 
        }
    };

    const fetchPsychologist = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/psychologists/available', {
                headers: { Authorization: `Bearer ${token}` } // แก้ไข Header ให้ถูกต้อง
            });
            setPsycho(res.data);
        } catch (err) {
            console.error("Error fetching psychologist:", err);
            setMessage({ type: 'danger', text: 'ไม่สามารถดึงข้อมูลตารางเวลาของนักจิตวิทยาได้' });
        }
    };
    
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'consultation_type' && value === 'Individual') {
            setGroupMembers(['']);
        }
    };

    // ฟังก์ชันจัดการรายชื่อเพื่อน (แก้ไขให้ทำงานถูกต้อง)
    const handleGroupMemberChange = (index, value) => {
        const newMembers = [...groupMembers];
        newMembers[index] = value;
        setGroupMembers(newMembers);
    };

    const removeGroupMember = (indexToRemove) => {
        setGroupMembers(groupMembers.filter((_, index) => index !== indexToRemove));
    };

    // ✅ ฟังก์ชันสร้างลิงก์ Google Calendar แบบ Client-side
    const handleAddToGoogleCalendar = () => {
        if (!formData.date || !formData.time) return;
        
        const [startT, endT] = formData.time.split('-');
        const formatTime = (t) => t.trim().replace(':', '') + '00';
        const dateStr = formData.date.replace(/-/g, '');
        
        const dates = `${dateStr}T${formatTime(startT)}/${dateStr}T${formatTime(endT)}`;
        const title = encodeURIComponent(`นัดหมายปรึกษาจิตวิทยา (${formData.type})`);
        const details = encodeURIComponent(`หัวข้อ: ${formData.topic}`);
        
        window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`, '_blank');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!psycho) return setMessage({ type: 'danger', text: 'ไม่พบนักจิตวิทยาที่ให้บริการ' });
        if (!formData.time) return setMessage({ type: 'danger', text: 'กรุณาเลือกเวลาที่ต้องการ' });

        try {
            const token = localStorage.getItem('token');
            const dataToSend = {
                ...formData,
                psychologist_id: psycho.psychologist_id, 
                group_members: formData.consultation_type === 'Group' ? groupMembers.filter(m => m.trim() !== '') : []
            };
            
            await axios.post('http://localhost:5000/api/appointments', dataToSend, { 
                headers: { Authorization: `Bearer ${token}` } // แก้ไข Header
            });
            
            setMessage({ type: 'success', text: 'ส่งคำขอนัดหมายสำเร็จและซิงค์ลงปฏิทินเรียบร้อยแล้ว!' });
            // ไม่ต้องล้าง Form ทันที เผื่อ user อยากกด Add to Calendar ปุ่มล่าง
        } catch (err) {
            console.error("Booking Error:", err.response || err);
            setMessage({ type: 'danger', text: 'การจองนัดหมายล้มเหลว หรือเวลานี้อาจถูกจองไปแล้ว' });
        }
    };

    // (ส่วนแสดงผลตารางเวลาเดิม เอาออก หรือซ่อนไว้ก็ได้ เพราะเรามีปุ่มแล้ว)
    
    if (!psycho) return <Container className="my-5"><p>กำลังดึงข้อมูลนักจิตวิทยา...</p></Container>;
    const psychoName = psycho.fullname || 'นักจิตวิทยาหลัก';

    return (
        <Container className="my-5">
            <h2 className="text-primary mb-4">🗓️ จองคำปรึกษา (1.3.2.8)</h2>
            
            {message && <Alert variant={message.type}>{message.text}</Alert>}

            <Row>
                <Col md={4} className="mb-4">
                    <Card className="shadow-sm border-0 h-100 bg-light">
                        <Card.Body>
                            <h5 className="text-muted">ข้อมูลผู้ให้คำปรึกษา</h5>
                            <h3>{psychoName}</h3>
                            <hr />
                            <p className="small text-muted">
                                เลือกวันและเวลาที่ท่านสะดวกจากปุ่มด้านขวา <br/>
                                ระบบจะตรวจสอบเวลาว่างให้อัตโนมัติ
                            </p>
                            {/* ปุ่ม Client-side Google Calendar */}
                            {message && message.type === 'success' && (
                                <Button variant="outline-danger" className="w-100 mt-3" onClick={handleAddToGoogleCalendar}>
                                    📅 บันทึกลง Google Calendar ของฉัน
                                </Button>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={8}>
                    <Card className="shadow-sm border-0">
                        <Card.Body className="p-4">
                            <Form onSubmit={handleSubmit}>
                                {/* 1. วันที่ */}
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold">1. เลือกวันที่ต้องการปรึกษา</Form.Label>
                                    <Form.Control 
                                        type="date" 
                                        name="date" 
                                        value={formData.date} 
                                        onChange={handleFormChange} 
                                        required 
                                    />
                                </Form.Group>

                                {/* 2. เลือกเวลา (แบบปุ่ม Grid) */}
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold">2. เลือกช่วงเวลา (Time Slots)</Form.Label>
                                    {!formData.date ? (
                                        <Alert variant="secondary">กรุณาเลือกวันที่ก่อน เพื่อดูเวลาว่าง</Alert>
                                    ) : (
                                        <div className="d-flex flex-wrap gap-2">
                                            {timeSlots.map((slot) => {
                                                const isBusy = busySlots.includes(slot);
                                                const isSelected = formData.time === slot;
                                                return (
                                                    <Button
                                                        key={slot}
                                                        variant={isSelected ? "primary" : (isBusy ? "secondary" : "outline-primary")}
                                                        disabled={isBusy} // 👈 ถ้าไม่ว่าง ปุ่มจะกดไม่ได้
                                                        onClick={() => setFormData({ ...formData, time: slot })}
                                                        style={{ minWidth: '130px', opacity: isBusy ? 0.6 : 1 }}
                                                    >
                                                        {slot} <br/>
                                                        <small>{isBusy ? "(เต็ม)" : "(ว่าง)"}</small>
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {formData.time && <div className="mt-2 text-primary small">คุณเลือกเวลา: {formData.time}</div>}
                                </Form.Group>

                                <hr className="my-4"/>

                                {/* 3. ข้อมูลเพิ่มเติม */}
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>รูปแบบ</Form.Label>
                                            <Form.Select name="type" value={formData.type} onChange={handleFormChange}>
                                                <option value="Online">Video Call / Chat (Online)</option>
                                                <option value="Onsite">พบตัวจริง (Onsite)</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>ประเภท</Form.Label>
                                            <Form.Select name="consultation_type" value={formData.consultation_type} onChange={handleFormChange}>
                                                <option value="Individual">ปรึกษาเดี่ยว</option>
                                                <option value="Group">ปรึกษากลุ่ม</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {/* รายชื่อเพื่อน (กรณีกลุ่ม) */}
                                {formData.consultation_type === 'Group' && (
                                    <div className="bg-light p-3 rounded mb-3">
                                        <Form.Label>รายชื่อเพื่อนร่วมกลุ่ม</Form.Label>
                                        {groupMembers.map((member, index) => (
                                            <div key={index} className="d-flex mb-2 gap-2">
                                                <Form.Control
                                                    type="email"
                                                    placeholder={`อีเมลเพื่อนคนที่ ${index + 1}`}
                                                    value={member}
                                                    onChange={(e) => handleGroupMemberChange(index, e.target.value)}
                                                />
                                                {groupMembers.length > 1 && (
                                                    <Button variant="outline-danger" onClick={() => removeGroupMember(index)}>-</Button>
                                                )}
                                            </div>
                                        ))}
                                        <Button variant="outline-secondary" size="sm" onClick={() => setGroupMembers([...groupMembers, ''])}>+ เพิ่มเพื่อน</Button>
                                    </div>
                                )}

                                {/* 4. หัวข้อ */}
                                <Form.Group className="mb-4">
                                    <Form.Label>หัวข้อ/ปัญหาเบื้องต้น</Form.Label>
                                    <Form.Control as="textarea" rows={3} name="topic" value={formData.topic} onChange={handleFormChange} required placeholder="เช่น เครียดเรื่องเรียน, ปัญหาครอบครัว..." />
                                </Form.Group>

                                <Button variant="success" size="lg" type="submit" className="w-100 shadow-sm">
                                    ✅ ยืนยันการจองนัดหมาย
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AppointmentBooking;