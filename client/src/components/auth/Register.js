// client/src/components/auth/Register.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Form, Button, Card, Row, Col } from 'react-bootstrap';

const Register = () => {
    // กำหนดค่าเริ่มต้นสำหรับ Student Role
    const [formData, setFormData] = useState({ 
        email: '', 
        password: '', 
        role: 'Student', // กำหนดเป็น Student เสมอสำหรับการลงทะเบียนสาธารณะ
        fullname: '', 
        education_level: 'ม.4', 
        dormitory: '' 
    });
    const navigate = useNavigate();

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            // ส่งข้อมูลทั้งหมดไปยัง Backend
            await axios.post('http://localhost:5000/api/auth/register', formData);
            
            alert('การสมัครสมาชิกสำเร็จแล้ว! กรุณาเข้าสู่ระบบ');
            navigate('/login');
        } catch (err) {
            const msg = err.response && err.response.data && err.response.data.msg 
                        ? err.response.data.msg 
                        : 'การสมัครสมาชิกไม่สำเร็จ กรุณาตรวจสอบอีเมลหรือข้อมูล';
            
            console.error("Registration Failed:", err.response || err);
            alert(msg);
        }
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card>
                        <Card.Header as="h3" className="text-center">สมัครสมาชิก (นักศึกษา)</Card.Header>
                        <Card.Body>
                            <Form onSubmit={onSubmit}>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control type="email" name="email" value={formData.email} onChange={onChange} required />
                                </Form.Group>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>รหัสผ่าน</Form.Label>
                                    <Form.Control type="password" name="password" value={formData.password} onChange={onChange} required />
                                </Form.Group>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>ชื่อ-นามสกุล</Form.Label>
                                    <Form.Control type="text" name="fullname" value={formData.fullname} onChange={onChange} required />
                                </Form.Group>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>ระดับการศึกษา</Form.Label>
                                    <Form.Control 
                                        as="select" 
                                        name="education_level" 
                                        value={formData.education_level} 
                                        onChange={onChange} 
                                        required
                                    >
                                        <option value="ม.4">มัธยมศึกษาปีที่ 4</option>
                                        <option value="ม.5">มัธยมศึกษาปีที่ 5</option>
                                        <option value="ม.6">มัธยมศึกษาปีที่ 6</option>
                                    </Form.Control>
                                </Form.Group>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>หอพัก</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="dormitory" 
                                        value={formData.dormitory} 
                                        onChange={onChange} 
                                        placeholder="ระบุชื่อหอพัก" 
                                        required 
                                    />
                                </Form.Group>
                                
                                {/* Role Selection (Hidden) */}
                                <Form.Control type="hidden" name="role" value="Student" />

                                <Button variant="success" type="submit" className="w-100 mt-3">
                                    สมัครสมาชิก (นักศึกษา)
                                </Button>
                                
                                <p className="mt-3 text-center">
                                    มีบัญชีอยู่แล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
                                </p>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Register;