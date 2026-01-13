// client/src/components/student/AppointmentBooking.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';

const AppointmentBooking = () => {
    // เก็บข้อมูลนักจิตวิทยาคนเดียวที่ให้บริการ
    const [psycho, setPsycho] = useState(null); 
    
    // ข้อมูล Form (รวมถึง consultation_type)
    const [formData, setFormData] = useState({ 
        date: '', 
        time: '', 
        type: 'Online', 
        topic: '', 
        consultation_type: 'Individual' // ค่าเริ่มต้นเป็นแบบเดี่ยว
    });
    
    const [message, setMessage] = useState(null);
    const [groupMembers, setGroupMembers] = useState(['']); // สำหรับ 1.3.2.9.1

    useEffect(() => {
        fetchPsychologist();
    }, []);

    // P5.3: ดึงข้อมูลนักจิตวิทยาคนเดียวจาก Backend
    const fetchPsychologist = async () => {
        try {
            const token = localStorage.getItem('token');
            // Backend ถูกตั้งค่าให้ส่งข้อมูลของนักจิตวิทยาคนเดียวกลับมา
            const res = await axios.get('http://localhost:5000/api/psychologists/available', {
                headers: { 'x-auth-token': token }
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
        
        // ถ้าเปลี่ยนเป็นเดี่ยว ให้ลบรายชื่อกลุ่ม
        if (name === 'consultation_type' && value === 'Individual') {
            setGroupMembers(['']);
        }
    };

    const handleGroupMemberChange = (index, value) => {
        const newMembers = [...groupMembers];
        newMembers[index] = value;
        setGroupMembers(newMembers);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!psycho) return setMessage({ type: 'danger', text: 'ไม่พบนักจิตวิทยาที่ให้บริการ' });

        try {
            const token = localStorage.getItem('token');
            const dataToSend = {
                ...formData,
                psychologist_id: psycho.psychologist_id, // ใช้ ID นักจิตวิทยาคนเดียวที่ดึงมา
                // กรองรายชื่อเพื่อนเฉพาะถ้าเป็นแบบกลุ่ม
                group_members: formData.consultation_type === 'Group' ? groupMembers.filter(m => m.trim() !== '') : []
            };
            
            // P5.2: ส่งข้อมูลการจองไปยัง /api/appointments
            await axios.post('http://localhost:5000/api/appointments', dataToSend, { headers: { 'x-auth-token': token } });
            
            setMessage({ type: 'success', text: 'ส่งคำขอนัดหมายสำเร็จแล้ว กรุณารอการยืนยันจากนักจิตวิทยา (1.3.2.8)' });
            // TODO: ล้าง Form
        } catch (err) {
            console.error("Booking Error:", err.response || err);
            setMessage({ type: 'danger', text: 'การจองนัดหมายล้มเหลว ตรวจสอบ Server Log.' });
        }
    };
    
    // Helper function to display availability 
    const renderAvailability = () => {
        if (!psycho || !psycho.available_settings) return <p className="text-danger">ไม่พบตารางเวลาว่าง กรุณาติดต่อผู้ดูแลระบบ</p>;
        
        try {
            const settings = JSON.parse(psycho.available_settings);
            return (
                <Row>
                    {Object.keys(settings).map(day => (
                        <Col md={6} key={day} className="mb-2">
                            <strong>{day}:</strong> 
                            {settings[day].length > 0 ? (
                                <ul className="list-unstyled small">
                                    {settings[day].map(time => <li key={time}>{time}</li>)}
                                </ul>
                            ) : (<span className="text-muted small"> ปิดให้บริการ</span>)}
                        </Col>
                    ))}
                </Row>
            );
        } catch (e) {
            return <p className="text-danger">รูปแบบการตั้งค่าตารางเวลาผิดพลาด</p>;
        }
    };

    if (!psycho) return <Container className="my-5"><p>กำลังดึงข้อมูลนักจิตวิทยา...</p></Container>;
    // หาก Psycho ID ถูกดึงมาแล้ว ให้แสดงชื่อนักจิตวิทยาที่ให้บริการ
    const psychoName = psycho.fullname || 'นักจิตวิทยาหลัก';

    return (
        <Container className="my-5">
            <h2 className="text-success">🗓️ จองคำปรึกษา (1.3.2.8)</h2>
            <Card className="mb-4 shadow-sm border-success">
                <Card.Header>ตารางเวลาว่างของ {psychoName}</Card.Header>
                <Card.Body>{renderAvailability()}</Card.Body>
            </Card>

            {message && <Alert variant={message.type}>{message.text}</Alert>}

            <Form onSubmit={handleSubmit}>
                
                {/* 1. เลือกรูปแบบปรึกษา (1.3.2.6) */}
                <Form.Group className="mb-3">
                    <Form.Label>รูปแบบการปรึกษา</Form.Label>
                    <Form.Control as="select" name="type" value={formData.type} onChange={handleFormChange} required>
                        <option value="Online">ออนไลน์ (แชท) - 1.3.2.6.2</option>
                        <option value="Onsite">ที่คลินิก (ออนไซต์) - 1.3.2.6.1</option>
                    </Form.Control>
                </Form.Group>

                {/* 2. เลือกเดี่ยว/กลุ่ม (1.3.2.9) */}
                <Form.Group className="mb-3">
                    <Form.Label>ประเภทการปรึกษา</Form.Label>
                    <Form.Control as="select" name="consultation_type" value={formData.consultation_type} onChange={handleFormChange} required>
                        <option value="Individual">แบบเดี่ยว</option>
                        <option value="Group">แบบกลุ่ม</option>
                    </Form.Control>
                </Form.Group>

                {/* 3. เพิ่มรายชื่อเพื่อน (1.3.2.9.1) */}
                {formData.consultation_type === 'Group' && (
                    <Card className="mb-3 p-3">
                        <Card.Title className="small text-muted">เพิ่มรายชื่อเพื่อนร่วมกลุ่ม (Email องค์กร)</Card.Title>
                        {groupMembers.map((member, index) => (
                            <div key={index} className="d-flex mb-2">
                                <Form.Control
                                    type="email"
                                    placeholder={`Email องค์กรเพื่อนคนที่ ${index + 1}`}
                                    value={member}
                                    onChange={(e) => handleGroupMemberChange(index, e.target.value)}
                                    required={index === 0} // ต้องมีเพื่อนอย่างน้อย 1 คน
                                />
                                {index === groupMembers.length - 1 && (
                                    <Button variant="outline-primary" size="sm" className="ms-2" onClick={() => setGroupMembers([...groupMembers, ''])}>
                                        +
                                    </Button>
                                )}
                                {groupMembers.length > 1 && (
                                    <Button variant="outline-danger" size="sm" className="ms-2" onClick={() => handleGroupMemberChange(groupMembers.filter((_, i) => i !== index))}>
                                        -
                                    </Button>
                                )}
                            </div>
                        ))}
                    </Card>
                )}

                {/* 4. ระบุปัญหา (1.3.2.7) */}
                <Form.Group className="mb-3">
                    <Form.Label>หัวข้อหรือปัญหาที่ต้องการปรึกษา (1.3.2.7)</Form.Label>
                    <Form.Control as="textarea" rows={3} name="topic" value={formData.topic} onChange={handleFormChange} required />
                </Form.Group>
                
                {/* 5. เลือก วัน/เวลา (1.3.2.8) */}
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>วันที่ต้องการปรึกษา</Form.Label>
                            <Form.Control type="date" name="date" value={formData.date} onChange={handleFormChange} required />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>ช่วงเวลา</Form.Label>
                            <Form.Control type="time" name="time" value={formData.time} onChange={handleFormChange} required />
                        </Form.Group>
                    </Col>
                </Row>
                
                <Button variant="primary" type="submit" className="w-100 mt-3">ส่งคำขอนัดหมาย (1.3.2.8)</Button>
            </Form>
        </Container>
    );
};

export default AppointmentBooking;