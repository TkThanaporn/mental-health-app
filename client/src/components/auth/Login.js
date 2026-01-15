// client/src/components/auth/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Container, Form, Button, Row, Col, InputGroup } from 'react-bootstrap';
import { FaEnvelope, FaLock } from 'react-icons/fa';

// --- นำเข้ารูปภาพโลโก้ ---
// ตรวจสอบว่าไฟล์ชื่อ pcshs_logo.png อยู่ในโฟลเดอร์ src/assets/
import pcshsLogo from '../../assets/pcshs_logo.png'; 
// -----------------------

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    // Theme สีโรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย
    const themeColors = {
        primaryBlue: '#002147', 
        secondaryBlue: '#1B3F8B', 
        primaryOrange: '#F26522', 
        textDark: '#002147',      
        textGold: '#FFD700'       
    };

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', formData);
            const { token, role, userId } = res.data;

            login(token, role, userId);

            if (role === 'Admin') navigate('/admin/dashboard');
            else if (role === 'Psychologist') navigate('/psychologist/dashboard');
            else navigate('/student/dashboard');

        } catch (err) {
            console.error(err.response ? err.response.data : err);
            alert('Login Failed: Invalid Email or Password.');
        }
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: '#f0f2f5', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div className="shadow-lg overflow-hidden bg-white" 
                 style={{ 
                     borderRadius: '20px', 
                     maxWidth: '1200px', 
                     width: '100%', 
                     minHeight: '600px', 
                     display: 'flex'
                 }}>
                <Row className="g-0 w-100">
                    {/* Left Side: Form */}
                    <Col lg={6} className="p-5 d-flex flex-column justify-content-center bg-white">
                        <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
                            <h2 className="text-center fw-bold mb-4" style={{ color: themeColors.textDark, fontSize: '2rem' }}>เข้าสู่ระบบ</h2>
                            
                            <Form onSubmit={onSubmit}>
                                <Form.Group className="mb-4">
                                    <InputGroup size="lg">
                                        <InputGroup.Text className="bg-light border-0">
                                            <FaEnvelope className="text-muted" />
                                        </InputGroup.Text>
                                        <Form.Control 
                                            type="email" 
                                            name="email" 
                                            placeholder="อีเมลผู้ใช้"
                                            value={formData.email} 
                                            onChange={onChange} 
                                            required 
                                            className="bg-light border-0 py-3"
                                            style={{ fontSize: '1rem' }}
                                        />
                                    </InputGroup>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <InputGroup size="lg">
                                        <InputGroup.Text className="bg-light border-0">
                                            <FaLock className="text-muted" />
                                        </InputGroup.Text>
                                        <Form.Control 
                                            type={showPassword ? "text" : "password"} 
                                            name="password" 
                                            placeholder="รหัสผ่าน"
                                            value={formData.password} 
                                            onChange={onChange} 
                                            required 
                                            className="bg-light border-0 py-3"
                                            style={{ fontSize: '1rem' }}
                                        />
                                    </InputGroup>
                                </Form.Group>

                                <div className="d-flex justify-content-between align-items-center mb-4 text-muted">
                                    <Form.Check 
                                        type="checkbox" 
                                        label="แสดงรหัสผ่าน" 
                                        checked={showPassword}
                                        onChange={() => setShowPassword(!showPassword)}
                                    />
                                    <Link to="/forgot-password" style={{ textDecoration: 'none', color: themeColors.primaryOrange }}>
                                        ลืมรหัสผ่าน?
                                    </Link>
                                </div>

                                <Button 
                                    type="submit" 
                                    className="w-100 py-3 fw-bold text-white border-0"
                                    style={{ 
                                        backgroundColor: themeColors.primaryOrange, 
                                        borderRadius: '30px',
                                        boxShadow: '0 4px 15px rgba(242, 101, 34, 0.4)',
                                        fontSize: '1.1rem'
                                    }}
                                >
                                    เข้าสู่ระบบ
                                </Button>
                            </Form>

                            <div className="text-center mt-5 text-muted">
                                ผู้ใช้ใหม่ <Link to="/register" className="fw-bold" style={{ textDecoration: 'none', color: themeColors.primaryOrange }}>ลงทะเบียน</Link>
                            </div>
                        </div>
                    </Col>

                    {/* Right Side: PCSHS Theme */}
                    <Col lg={6} className="text-white d-flex flex-column align-items-center justify-content-center p-5"
                         style={{ 
                             background: `linear-gradient(135deg, ${themeColors.primaryBlue} 0%, ${themeColors.secondaryBlue} 100%)` 
                         }}>
                        
                        {/* ส่วนแสดง Logo */}
                        <div className="mb-4 p-3 bg-white rounded-circle shadow-lg" style={{ width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img 
                                src={pcshsLogo} 
                                alt="PCSHS Logo" 
                                style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }} 
                            />
                        </div>

                        <h2 className="fw-bold mb-2" style={{ color: themeColors.textGold }}>PCSHS HeartCare</h2>
                        <h4 className="mb-4 fw-light">พื้นที่ปลอดภัยสำหรับใจคุณ</h4>
                        
                        <p className="text-center px-5" style={{ opacity: 0.9, fontSize: '1.1rem' }}>
                            ระบบสนับสนุนทางจิตวิทยาสำหรับนักเรียน<br/>
                            โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย
                        </p>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default Login;