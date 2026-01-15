import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Form, Button, Card, Alert, Row, Col, Image, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const AppointmentBooking = () => {
    const navigate = useNavigate();
    const [psycho, setPsycho] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]); // เก็บเวลาว่างทั้งหมดจาก DB
    const [dailySlots, setDailySlots] = useState([]); // เก็บเวลาว่างของวันที่เลือก
    
    const [formData, setFormData] = useState({ 
        date: '', 
        time: '', 
        type: 'Online', 
        topic: '', 
        consultation_type: 'Individual' 
    });
    
    const [message, setMessage] = useState(null);
    const [groupMembers, setGroupMembers] = useState(['']); 

    // 1. เช็คว่าทำแบบประเมินหรือยัง
    useEffect(() => {
        const checkPrerequisite = async () => {
            try {
                const token = localStorage.getItem('token');
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

    // 2. ดึงข้อมูลนักจิตวิทยา และ ตารางงาน
    useEffect(() => {
        fetchPsychologistAndSchedule();
    }, []);

    // 3. เมื่อวันที่เปลี่ยน -> กรองหาเวลาว่างของวันนั้น
    useEffect(() => {
        if (formData.date && availableSlots.length > 0) {
            // แปลงวันที่ที่เลือก เป็นรูปแบบที่ตรงกับ DB (หรือเปรียบเทียบ string)
            const slotsForDate = availableSlots.filter(slot => {
                // slot.date มาจาก DB อาจเป็น format ISO เช่น 2024-02-14T00:00:00.000Z
                const slotDateStr = new Date(slot.date).toISOString().split('T')[0];
                return slotDateStr === formData.date;
            });
            setDailySlots(slotsForDate);
            setFormData(prev => ({ ...prev, time: '' })); // รีเซ็ตเวลาที่เลือก
        }
    }, [formData.date, availableSlots]);

    const fetchPsychologistAndSchedule = async () => {
        try {
            const token = localStorage.getItem('token');
            // 2.1 ดึงข้อมูลนักจิตวิทยา
            const resPsycho = await axios.get('http://localhost:5000/api/psychologists/available', {
                headers: { 'x-auth-token': token } 
            });

            if (Array.isArray(resPsycho.data) && resPsycho.data.length > 0) {
                const selectedPsycho = resPsycho.data[0]; // ดึงคนแรก (หรือคนที่เลือก)
                setPsycho(selectedPsycho);

                // 2.2 ดึงตารางเวลาของนักจิตคนนี้
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

    // ✅ ฟังก์ชันสร้างลิงก์ Google Calendar
    const handleAddToGoogleCalendar = () => {
        if (!formData.date || !formData.time) return;
        
        // แปลงเวลา "09:00-10:00" เป็นรูปแบบ Google Calendar (YYYYMMDDTHHmmSS)
        const [startT, endT] = formData.time.split('-');
        const cleanDate = formData.date.replace(/-/g, ''); // 20240214
        
        const startTime = `${cleanDate}T${startT.trim().replace(':', '')}00`;
        const endTime = `${cleanDate}T${endT.trim().replace(':', '')}00`;
        
        const title = encodeURIComponent(`นัดหมายปรึกษาจิตวิทยา (${formData.type})`);
        const details = encodeURIComponent(`หัวข้อ: ${formData.topic}\nกับนักจิตวิทยา: ${psycho.fullname}\nช่องทาง: ${formData.type}`);
        const location = encodeURIComponent(formData.type === 'Online' ? 'Online Meeting' : 'ห้องให้คำปรึกษา คณะ...');

        const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
        
        window.open(calendarUrl, '_blank');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!psycho) return setMessage({ type: 'danger', text: 'ไม่พบนักจิตวิทยา' });
        if (!formData.time) return setMessage({ type: 'danger', text: 'กรุณาเลือกเวลา' });

        try {
            const token = localStorage.getItem('token');
            const dataToSend = {
                ...formData,
                psychologist_id: psycho.user_id, 
                group_members: formData.consultation_type === 'Group' ? groupMembers.filter(m => m.trim() !== '') : []
            };
            
            await axios.post('http://localhost:5000/api/appointments', dataToSend, { 
                headers: { 'x-auth-token': token } 
            });
            
            setMessage({ type: 'success', text: 'จองสำเร็จ!' });
            
            // ✅ ไม่ Redirect ทันที เพื่อให้ผู้ใช้กดปุ่ม Google Calendar ได้ก่อน
            // setTimeout(() => navigate('/student/dashboard'), 5000); 

        } catch (err) {
            console.error("Booking Error:", err);
            setMessage({ type: 'danger', text: 'การจองล้มเหลว' });
        }
    };

    if (!psycho) return <Container className="my-5"><p>กำลังโหลด...</p></Container>;
    
    const psychoName = psycho.fullname || 'นักจิตวิทยา';
    const psychoImage = psycho.profile_image || "https://placehold.co/150?text=Psycho";

    return (
        <Container className="my-5">
            <h2 className="text-primary mb-4">🗓️ จองคำปรึกษา (Real-time)</h2>
            
            {/* ✅ ส่วนแสดงผลสำเร็จ + ปุ่ม Google Calendar */}
            {message && message.type === 'success' && (
                <Alert variant="success" className="text-center">
                    <h4>✅ บันทึกนัดหมายเรียบร้อยแล้ว!</h4>
                    <p>อย่าลืมบันทึกลงปฏิทินของคุณเพื่อกันลืมนะครับ</p>
                    
                    <div className="d-flex justify-content-center gap-2 mt-3">
                        <Button variant="warning" size="lg" onClick={handleAddToGoogleCalendar}>
                            📅 เพิ่มลง Google Calendar
                        </Button>
                        <Button variant="outline-primary" size="lg" onClick={() => navigate('/student/dashboard')}>
                            กลับหน้าหลัก
                        </Button>
                    </div>
                </Alert>
            )}

            {/* ถ้าจองสำเร็จแล้ว ซ่อนฟอร์ม เพื่อให้โฟกัสที่ปุ่ม Calendar */}
            {(!message || message.type !== 'success') && (
                <>
                    {message && <Alert variant={message.type}>{message.text}</Alert>}
                    
                    <Row>
                        <Col md={4} className="mb-4">
                            <Card className="shadow-sm border-0 h-100 bg-light">
                                <Card.Body className="text-center">
                                    <h5 className="text-muted mb-3">ข้อมูลผู้ให้คำปรึกษา</h5>
                                    <Image 
                                        src={psychoImage} 
                                        roundedCircle 
                                        className="mb-3 shadow-sm"
                                        style={{ width: '120px', height: '120px', objectFit: 'cover', border: '3px solid white' }} 
                                    />
                                    <h3>{psychoName}</h3>
                                    <Badge bg="info" text="dark" className="mb-3">นักจิตวิทยาประจำศูนย์</Badge>
                                    {psycho.bio && <Alert variant="secondary" className="text-start mt-2"><small>"{psycho.bio}"</small></Alert>}
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={8}>
                            <Card className="shadow-sm border-0">
                                <Card.Body className="p-4">
                                    <Form onSubmit={handleSubmit}>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-bold">1. เลือกวันที่ต้องการปรึกษา</Form.Label>
                                            <Form.Control type="date" name="date" value={formData.date} onChange={handleFormChange} required />
                                        </Form.Group>

                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-bold">2. เลือกช่วงเวลา (เฉพาะที่ว่าง)</Form.Label>
                                            {!formData.date ? (
                                                <Alert variant="secondary">กรุณาเลือกวันที่ก่อน เพื่อดูตารางว่าง</Alert>
                                            ) : dailySlots.length === 0 ? (
                                                <Alert variant="warning">❌ ไม่พบตารางว่างในวันนี้ (กรุณาเลือกวันอื่น)</Alert>
                                            ) : (
                                                <div className="d-flex flex-wrap gap-2">
                                                    {dailySlots.map((slot) => (
                                                        <Button
                                                            key={slot.schedule_id}
                                                            variant={formData.time === slot.time_slot ? "primary" : "outline-primary"}
                                                            onClick={() => setFormData({ ...formData, time: slot.time_slot })}
                                                        >
                                                            {slot.time_slot}
                                                        </Button>
                                                    ))}
                                                </div>
                                            )}
                                            {formData.time && <div className="mt-2 text-success fw-bold">คุณเลือกเวลา: {formData.time}</div>}
                                        </Form.Group>

                                        <hr className="my-4"/>

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

                                        {formData.consultation_type === 'Group' && (
                                            <div className="bg-light p-3 rounded mb-3">
                                                <Form.Label>รายชื่อเพื่อนร่วมกลุ่ม</Form.Label>
                                                {groupMembers.map((member, index) => (
                                                    <div key={index} className="d-flex mb-2 gap-2">
                                                        <Form.Control type="email" placeholder={`อีเมลเพื่อนคนที่ ${index + 1}`} value={member} onChange={(e) => handleGroupMemberChange(index, e.target.value)} />
                                                        {groupMembers.length > 1 && <Button variant="outline-danger" onClick={() => removeGroupMember(index)}>-</Button>}
                                                    </div>
                                                ))}
                                                <Button variant="outline-secondary" size="sm" onClick={() => setGroupMembers([...groupMembers, ''])}>+ เพิ่มเพื่อน</Button>
                                            </div>
                                        )}

                                        <Form.Group className="mb-4">
                                            <Form.Label>หัวข้อ/ปัญหาเบื้องต้น</Form.Label>
                                            <Form.Control as="textarea" rows={3} name="topic" value={formData.topic} onChange={handleFormChange} required />
                                        </Form.Group>

                                        <Button variant="success" size="lg" type="submit" className="w-100 shadow-sm">
                                            ✅ ยืนยันการจองนัดหมาย
                                        </Button>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </Container>
    );
};

export default AppointmentBooking;