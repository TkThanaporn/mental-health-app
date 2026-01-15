// client/src/components/auth/Register.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Form, Button, Row, Col, InputGroup } from 'react-bootstrap';
import { FaEnvelope, FaLock, FaUser, FaGraduationCap, FaHome } from 'react-icons/fa';

// --- ส่วนจัดการรูปภาพ ---
// 1. ตรวจสอบว่าคุณมีไฟล์โลโก้ (image_1.png) วางอยู่ที่ src/assets/pcshs_logo.png หรือไม่
// 2. ถ้ามีแล้ว ให้เอา comment (//) หน้าบรรทัดข้างล่างนี้ออก เพื่อนำเข้ารูปภาพ
import pcshsLogo from '../../assets/pcshs_logo.png'; 
// ----------------------

const Register = () => {
    // กำหนดค่าเริ่มต้น (เริ่มที่ ม.1)
    const [formData, setFormData] = useState({ 
        email: '', 
        password: '', 
        role: 'Student', 
        fullname: '', 
        education_level: 'ม.1', 
        dormitory: '' 
    });
    
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    // Theme สีโรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย (PCSHS) - น้ำเงิน/แสด
    const themeColors = {
        primaryBlue: '#002147', // น้ำเงินเข้มกรมท่า
        secondaryBlue: '#1B3F8B', // น้ำเงินสว่างสำหรับไล่เฉด
        primaryOrange: '#F26522', // สีแสดประจำโรงเรียน
        textDark: '#002147',      
        textGold: '#FFD700'       // สีทอง
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
            background: '#f0f2f5', // สีพื้นหลังรวม
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '20px'
        }}>
            {/* Main Card Container - กรอบใหญ่ */}
            <div className="shadow-lg overflow-hidden bg-white" 
                 style={{ 
                     borderRadius: '20px', 
                     maxWidth: '1200px', // ความกว้างสูงสุด
                     width: '100%', 
                     minHeight: '650px', // ความสูงขั้นต่ำเพื่อให้ดูโปร่ง
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

                                {/* Row for Education Level & Dormitory */}
                                <Row>
                                    <Col md={6}>
                                        {/* Education Level (ม.1 - ม.6) */}
                                        <Form.Group className="mb-3">
                                            <InputGroup size="lg">
                                                <InputGroup.Text style={iconStyle}><FaGraduationCap className="text-muted" /></InputGroup.Text>
                                                <Form.Select name="education_level" value={formData.education_level} onChange={onChange} required style={inputStyle} className="py-3">
                                                    <option value="ม.1">มัธยมศึกษาปีที่ 1</option>
                                                    <option value="ม.2">มัธยมศึกษาปีที่ 2</option>
                                                    <option value="ม.3">มัธยมศึกษาปีที่ 3</option>
                                                    <option value="ม.4">มัธยมศึกษาปีที่ 4</option>
                                                    <option value="ม.5">มัธยมศึกษาปีที่ 5</option>
                                                    <option value="ม.6">มัธยมศึกษาปีที่ 6</option>
                                                </Form.Select>
                                            </InputGroup>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        {/* Dormitory */}
                                        <Form.Group className="mb-3">
                                            <InputGroup size="lg">
                                                <InputGroup.Text style={iconStyle}><FaHome className="text-muted" /></InputGroup.Text>
                                                <Form.Control type="text" name="dormitory" placeholder="ชื่อหอพัก" value={formData.dormitory} onChange={onChange} required style={inputStyle} className="py-3" />
                                            </InputGroup>
                                        </Form.Group>
                                    </Col>
                                </Row>

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

                                {/* Submit Button (สีแสด) */}
                                <Button 
                                    type="submit" 
                                    className="w-100 py-3 fw-bold text-white border-0"
                                    style={{ 
                                        backgroundColor: themeColors.primaryOrange, 
                                        borderRadius: '30px',
                                        boxShadow: '0 4px 15px rgba(242, 101, 34, 0.4)', // เงาสีแสด
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
                             // พื้นหลังไล่เฉดสีน้ำเงินกรมท่า
                             background: `linear-gradient(135deg, ${themeColors.primaryBlue} 0%, ${themeColors.secondaryBlue} 100%)` 
                         }}>
                        
                        {/* Logo Container - วงกลมพื้นขาว */}
                        <div className="mb-4 p-3 bg-white rounded-circle shadow-lg" style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            
                            {/* --- ส่วนแสดงรูปภาพโลโก้ --- */}
                            {/* ถ้า import รูปภาพด้านบนแล้ว ให้เอา comment ออก เพื่อแสดงรูป */}
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