// Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Container, Form, Button, Card } from 'react-bootstrap';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const navigate = useNavigate();
    const { login } = useAuth(); // ใช้ Context Hook

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', formData);
            const { token, role, userId } = res.data; // ต้องให้ Backend ส่ง userId กลับมาด้วย

            // 1. เก็บสถานะใน Context และ Local Storage
            login(token, role, userId); 

            // 2. นำทางไปยัง Dashboard ตามบทบาท
            if (role === 'Admin') navigate('/admin/dashboard');
            else if (role === 'Psychologist') navigate('/psychologist/dashboard');
            else navigate('/student/dashboard');

        } catch (err) {
            console.error(err.response ? err.response.data : err);
            alert('Login Failed: Invalid Email or Password.');
        }
    };

    return (
        <Container className="mt-5">
            <Card style={{ maxWidth: '400px', margin: 'auto' }}>
                <Card.Header as="h3">เข้าสู่ระบบ</Card.Header>
                <Card.Body>
                    <Form onSubmit={onSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control type="email" name="email" value={formData.email} onChange={onChange} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control type="password" name="password" value={formData.password} onChange={onChange} required />
                        </Form.Group>
                        <Button variant="primary" type="submit" className="w-100">
                            เข้าสู่ระบบ
                        </Button>
                    </Form>
                    <p className="mt-3 text-center">ยังไม่มีบัญชี? <a href="/register">สมัครสมาชิก</a></p>
                </Card.Body>
            </Card>
        </Container>
    );
};
export default Login;