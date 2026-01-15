import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Form, Button, Row, Col, Alert, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ScheduleManager = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [mySlots, setMySlots] = useState([]);
    const [message, setMessage] = useState(null);

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
            const res = await axios.get('http://localhost:5000/api/schedule/my-slots', {
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
            return setMessage({ type: 'warning', text: 'กรุณาเลือกวันที่และอย่างน้อย 1 ช่วงเวลา' });
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/schedule', 
                { date: selectedDate, time_slots: selectedSlots }, 
                { headers: { 'x-auth-token': token } }
            );

            setMessage({ type: 'success', text: '✅ บันทึกตารางงานเรียบร้อยแล้ว!' });
            setSelectedSlots([]); 
            fetchMySlots(); 
            
            setTimeout(() => setMessage(null), 3000);

        } catch (err) {
            console.error(err);
            setMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการบันทึก' });
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm('คุณต้องการลบเวลานี้ออกใช่หรือไม่?')) return;
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

    return (
        <Container className="my-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-primary">📅 จัดการตารางเวลา (Set Availability)</h2>
                <Button variant="outline-secondary" onClick={() => navigate('/psychologist/dashboard')}>
                    ⬅️ กลับหน้าหลัก
                </Button>
            </div>

            <Row>
                <Col md={5}>
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Header className="bg-success text-white">เพิ่มเวลาว่างใหม่</Card.Header>
                        <Card.Body>
                            {message && <Alert variant={message.type}>{message.text}</Alert>}
                            
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">เลือกวันที่</Form.Label>
                                    <Form.Control 
                                        type="date" 
                                        value={selectedDate} 
                                        onChange={(e) => setSelectedDate(e.target.value)} 
                                        min={new Date().toISOString().split('T')[0]} 
                                        required 
                                    />
                                </Form.Group>

                                <Form.Label className="fw-bold">เลือกช่วงเวลาที่ว่าง</Form.Label>
                                <div className="d-flex flex-wrap gap-2 mb-4">
                                    {availableTimeSlots.map(slot => (
                                        <Button 
                                            key={slot}
                                            variant={selectedSlots.includes(slot) ? "primary" : "outline-secondary"}
                                            size="sm"
                                            onClick={() => toggleSlot(slot)}
                                        >
                                            {slot}
                                        </Button>
                                    ))}
                                </div>

                                <Button type="submit" variant="success" className="w-100">
                                    💾 บันทึกเวลาว่าง
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={7}>
                    <Card className="shadow-sm border-0">
                        <Card.Header className="bg-primary text-white">เวลาว่างปัจจุบันของคุณ</Card.Header>
                        <Card.Body>
                            {mySlots.length === 0 ? (
                                <p className="text-muted text-center py-4">ยังไม่มีตารางเวลาว่าง</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>วันที่</th>
                                                <th>เวลา</th>
                                                <th>สถานะ</th>
                                                <th>จัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mySlots.map((slot) => (
                                                <tr key={slot.schedule_id}>
                                                    <td>{new Date(slot.date).toLocaleDateString('th-TH')}</td>
                                                    <td className="fw-bold text-primary">{slot.time_slot}</td>
                                                    <td><Badge bg="success">ว่าง</Badge></td>
                                                    <td>
                                                        <Button 
                                                            variant="outline-danger" 
                                                            size="sm" 
                                                            onClick={() => handleDelete(slot.schedule_id)}
                                                        >
                                                            🗑️ ลบ
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default ScheduleManager;