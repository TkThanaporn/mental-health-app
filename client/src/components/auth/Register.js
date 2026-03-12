// client/src/components/auth/Register.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Form, Button, Row, Col, InputGroup } from 'react-bootstrap';
// ✅ เอา FaGraduationCap และ FaHome ออกจาก import เพราะไม่ได้ใช้แล้ว
import { FaEnvelope, FaLock, FaUser } from 'react-icons/fa';

import pcshsLogo from '../../assets/pcshs_logo.png'; 

const Register = () => {
    // ✅ เอา education_level และ dormitory ออกจาก State เริ่มต้น
    const [formData, setFormData] = useState({ 
        email: '', 
        password: '', 
        role: 'Student', 
        fullname: '' 
    });
    
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    // Theme สีโรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย (PCSHS) - น้ำเงิน/แสด
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

    // สไตล์สำหรับ Input fields
    const inputStyle = { backgroundColor: '#f8f9fa', border: 'none', fontSize: '1rem' };
    const iconStyle = { backgroundColor: '#f8f9fa', border: 'none' };

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: '#f0f2f5', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '20px'
        }}>
            {/* Main Card Container */}
            <div className="shadow-lg overflow-hidden bg-white" 
                 style={{ 
                     borderRadius: '20px', 
                     maxWidth: '1200px', 
                     width: '100%', 
                     minHeight: '650px', 
                     display: 'flex'
                 }}>
                <Row className="g-0 w-100">
                    
                    {/* ================= LEFT SIDE: REGISTER FORM ================= */}
                    <Col lg={6} className="p-4 p-md-5 d-flex flex-column justify-content-center bg-white">
                        <div style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>
                            <h2 className="text-center fw-bold mb-4" style={{ color: themeColors.textDark, fontSize: '2rem' }}>ลงทะเบียน</h2>
                            
                            <Form onSubmit={onSubmit}>
                                
                                {/* Fullname */}
                                <Form.Group className="mb-3">
                                    <InputGroup size="lg">
                                        <InputGroup.Text style={iconStyle}><FaUser className="text-muted" /></InputGroup.Text>
                                        <Form.Control type="text" name="fullname" placeholder="ชื่อ-นามสกุล" value={formData.fullname} onChange={onChange} required style={inputStyle} className="py-3" />
                                    </InputGroup>
                                </Form.Group>

                                {/* Email */}
                                <Form.Group className="mb-3">
                                    <InputGroup size="lg">
                                        <InputGroup.Text style={iconStyle}><FaEnvelope className="text-muted" /></InputGroup.Text>
                                        <Form.Control type="email" name="email" placeholder="อีเมล (สำหรับเข้าสู่ระบบ)" value={formData.email} onChange={onChange} required style={inputStyle} className="py-3" />
                                    </InputGroup>
                                </Form.Group>

                                {/* Password */}
                                <Form.Group className="mb-3">
                                    <InputGroup size="lg">
                                        <InputGroup.Text style={iconStyle}><FaLock className="text-muted" /></InputGroup.Text>
                                        <Form.Control 
                                            type={showPassword ? "text" : "password"} 
                                            name="password" 
                                            placeholder="รหัสผ่าน" 
                                            value={formData.password} 
                                            onChange={onChange} 
                                            required 
                                            style={inputStyle}
                                            className="py-3" 
                                        />
                                    </InputGroup>
                                </Form.Group>

                                {/* Checkbox Show Password */}
                                <div className="mb-4 d-flex align-items-center">
                                    <Form.Check 
                                        type="checkbox" 
                                        id="show-password-checkbox"
                                        label="แสดงรหัสผ่าน" 
                                        className="text-muted me-2"
                                        style={{ cursor: 'pointer' }}
                                        checked={showPassword}
                                        onChange={() => setShowPassword(!showPassword)}
                                    />
                                </div>

                                {/* Submit Button */}
                                <Button 
                                    type="submit" 
                                    className="w-100 py-3 fw-bold text-white border-0"
                                    style={{ 
                                        backgroundColor: themeColors.primaryOrange, 
                                        borderRadius: '30px',
                                        boxShadow: '0 4px 15px rgba(242, 101, 34, 0.4)', 
                                        fontSize: '1.2rem'
                                    }}
                                >
                                    สมัครสมาชิก
                                </Button>
                            </Form>

                            <div className="text-center mt-4 text-muted">
                                มีบัญชีอยู่แล้ว? <Link to="/login" className="fw-bold" style={{ textDecoration: 'none', color: themeColors.primaryOrange }}>เข้าสู่ระบบ</Link>
                            </div>
                        </div>
                    </Col>

                    {/* ================= RIGHT SIDE: PCSHS BRANDING ================= */}
                    <Col lg={6} className="text-white d-flex flex-column align-items-center justify-content-center p-5"
                         style={{ 
                             background: `linear-gradient(135deg, ${themeColors.primaryBlue} 0%, ${themeColors.secondaryBlue} 100%)` 
                         }}>
                        
                        <div className="mb-4 p-3 bg-white rounded-circle shadow-lg" style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img 
                                src={pcshsLogo} 
                                alt="PCSHS Logo" 
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                            /> 
                        </div>

                        <h2 className="fw-bold mb-2" style={{ color: themeColors.textGold, fontSize: '2.5rem' }}>PCSHS HeartCare</h2>
                        <h4 className="mb-4 fw-light">ยินดีต้อนรับสมาชิกใหม่</h4>
                        
                        <p className="text-center px-5" style={{ opacity: 0.9, fontSize: '1.1rem', lineHeight: '1.6' }}>
                            "การเริ่มต้นดูแลใจ คือก้าวแรกสู่ความสำเร็จ"<br/>
                            ร่วมเป็นส่วนหนึ่งของครอบครัว<br/>โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย
                        </p>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default Register;