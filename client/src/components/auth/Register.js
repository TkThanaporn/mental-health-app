// client/src/components/auth/Register.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
// เพิ่ม Modal ตรงนี้
import { Form, Button, Row, Col, InputGroup, Spinner, Modal } from 'react-bootstrap';
// เพิ่ม FaCheckCircle ตรงนี้
import { FaEnvelope, FaLock, FaUser, FaKey, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';

import pcshsLogo from '../../assets/pcshs_logo.png'; 

const Register = () => {
    // 1️⃣ State สำหรับเก็บข้อมูลฟอร์ม
    const [formData, setFormData] = useState({ 
        email: '', 
        password: '', 
        role: 'Student', 
        fullname: '' 
    });
    
    // 2️⃣ State สำหรับระบบ OTP
    const [step, setStep] = useState(1); // step 1 = กรอกข้อมูล, step 2 = กรอก OTP
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 🚨 State สำหรับหน้าต่างแจ้งเตือนสมัครสำเร็จ
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const themeColors = {
        primaryBlue: '#002147', 
        secondaryBlue: '#1B3F8B', 
        primaryOrange: '#F26522', 
        textDark: '#002147',      
        textGold: '#FFD700'       
    };

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    // ==========================================
    // ฟังก์ชัน Step 1: ส่งข้อมูลไปขอ OTP
    // ==========================================
    const onRequestOTP = async e => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // ยิง API ไปที่ register-request (ตามที่เขียนไว้ใน authRoutes.js)
            const res = await axios.post('http://localhost:5000/api/auth/register-request', formData);
            alert(res.data.msg || 'ระบบได้ส่งรหัส OTP ไปที่อีเมลของคุณแล้ว');
            setStep(2); // เปลี่ยนหน้าจอไป Step 2
        } catch (err) {
            const msg = err.response && err.response.data && err.response.data.msg 
                        ? err.response.data.msg 
                        : 'การส่งคำขอไม่สำเร็จ กรุณาตรวจสอบอีเมลหรือข้อมูล';
            alert(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // ==========================================
    // ฟังก์ชัน Step 2: ส่ง OTP ไปยืนยันการสมัคร
    // ==========================================
    const onVerifyOTP = async e => {
        e.preventDefault();
        if (otp.length !== 6) {
            return alert("กรุณากรอกรหัส OTP ให้ครบ 6 หลัก");
        }

        setIsLoading(true);
        try {
            await axios.post('http://localhost:5000/api/auth/register-verify', {
                email: formData.email,
                otp: otp
            });
            // เรียก Modal สมัครสำเร็จ แทนการใช้ alert() แบบเดิม
            setShowSuccessModal(true);
        } catch (err) {
            const msg = err.response && err.response.data && err.response.data.msg 
                        ? err.response.data.msg 
                        : 'รหัส OTP ไม่ถูกต้องหรือหมดอายุ';
            alert(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // ฟังก์ชันปิดหน้าต่างและไปหน้า Login
    const handleCloseModal = () => {
        setShowSuccessModal(false);
        navigate('/login');
    };

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
            <div className="shadow-lg overflow-hidden bg-white" 
                 style={{ 
                     borderRadius: '20px', 
                     maxWidth: '1200px', 
                     width: '100%', 
                     minHeight: '650px', 
                     display: 'flex'
                 }}>
                <Row className="g-0 w-100">
                    
                    {/* ================= LEFT SIDE: FORM ================= */}
                    <Col lg={6} className="p-4 p-md-5 d-flex flex-column justify-content-center bg-white">
                        <div style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>
                            
                            {/* 🔄 แสดงหน้าจอตาม Step */}
                            {step === 1 ? (
                                // ----------------- STEP 1: ฟอร์มสมัครสมาชิก -----------------
                                <>
                                    <h2 className="text-center fw-bold mb-4" style={{ color: themeColors.textDark, fontSize: '2rem' }}>ลงทะเบียน</h2>
                                    
                                    <Form onSubmit={onRequestOTP}>
                                        <Form.Group className="mb-3">
                                            <InputGroup size="lg">
                                                <InputGroup.Text style={iconStyle}><FaUser className="text-muted" /></InputGroup.Text>
                                                <Form.Control type="text" name="fullname" placeholder="ชื่อ-นามสกุล" value={formData.fullname} onChange={onChange} required style={inputStyle} className="py-3" />
                                            </InputGroup>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <InputGroup size="lg">
                                                <InputGroup.Text style={iconStyle}><FaEnvelope className="text-muted" /></InputGroup.Text>
                                                <Form.Control type="email" name="email" placeholder="อีเมล (สำหรับรับ OTP และเข้าสู่ระบบ)" value={formData.email} onChange={onChange} required style={inputStyle} className="py-3" />
                                            </InputGroup>
                                        </Form.Group>

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

                                        <Button 
                                            type="submit" 
                                            disabled={isLoading}
                                            className="w-100 py-3 fw-bold text-white border-0"
                                            style={{ 
                                                backgroundColor: themeColors.primaryOrange, 
                                                borderRadius: '30px',
                                                boxShadow: '0 4px 15px rgba(242, 101, 34, 0.4)', 
                                                fontSize: '1.2rem'
                                            }}
                                        >
                                            {isLoading ? <Spinner animation="border" size="sm" /> : "ดำเนินการต่อ (รับรหัส OTP)"}
                                        </Button>
                                    </Form>

                                    <div className="text-center mt-4 text-muted">
                                        มีบัญชีอยู่แล้ว? <Link to="/login" className="fw-bold" style={{ textDecoration: 'none', color: themeColors.primaryOrange }}>เข้าสู่ระบบ</Link>
                                    </div>
                                </>
                            ) : (
                                // ----------------- STEP 2: ฟอร์มยืนยัน OTP -----------------
                                <div className="text-center fade-in">
                                    <div className="mb-4 text-primary" style={{ fontSize: '3rem' }}>
                                        <FaKey />
                                    </div>
                                    <h2 className="fw-bold mb-3" style={{ color: themeColors.textDark }}>ยืนยันอีเมลของคุณ</h2>
                                    <p className="text-muted mb-4">
                                        ระบบได้ส่งรหัส OTP 6 หลัก ไปยังอีเมล<br/>
                                        <strong className="text-dark">{formData.email}</strong><br/>
                                        <small className="text-danger">รหัสจะหมดอายุภายใน 5 นาที</small>
                                    </p>
                                    
                                    <Form onSubmit={onVerifyOTP}>
                                        <Form.Group className="mb-4">
                                            <Form.Control 
                                                type="text" 
                                                maxLength="6"
                                                placeholder="------" 
                                                value={otp} 
                                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} // บังคับกรอกแต่ตัวเลข
                                                required 
                                                className="text-center py-3 fw-bold tracking-widest"
                                                style={{ 
                                                    fontSize: '2rem', 
                                                    letterSpacing: '10px', 
                                                    backgroundColor: '#f8f9fa', 
                                                    border: `2px dashed ${themeColors.primaryOrange}` 
                                                }} 
                                            />
                                        </Form.Group>

                                        <Button 
                                            type="submit" 
                                            disabled={isLoading || otp.length < 6}
                                            className="w-100 py-3 fw-bold text-white border-0 mb-3"
                                            style={{ 
                                                backgroundColor: themeColors.primaryBlue, 
                                                borderRadius: '30px',
                                                fontSize: '1.2rem'
                                            }}
                                        >
                                            {isLoading ? <Spinner animation="border" size="sm" /> : "ยืนยันรหัส OTP"}
                                        </Button>

                                        <Button 
                                            variant="link" 
                                            className="text-muted text-decoration-none"
                                            onClick={() => setStep(1)}
                                            disabled={isLoading}
                                        >
                                            <FaArrowLeft className="me-2" /> กลับไปแก้ไขข้อมูล
                                        </Button>
                                    </Form>
                                </div>
                            )}
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

            {/* ================= Modal แจ้งเตือนสมัครสำเร็จ ================= */}
            <Modal show={showSuccessModal} onHide={handleCloseModal} centered backdrop="static" keyboard={false}>
                <Modal.Body className="text-center p-5">
                    <div className="mb-4">
                        <FaCheckCircle style={{ fontSize: '5rem', color: '#198754' }} />
                    </div>
                    <h3 className="fw-bold mb-3" style={{ color: themeColors.textDark }}>ลงทะเบียนสำเร็จ!</h3>
                    <p className="text-muted mb-4" style={{ fontSize: '1.1rem' }}>
                        ยินดีต้อนรับเข้าสู่ระบบ PCSHS HeartCare<br/>คุณสามารถเข้าสู่ระบบเพื่อใช้งานได้ทันที
                    </p>
                    <Button 
                        variant="success" 
                        className="w-100 py-3 rounded-pill fw-bold text-white" 
                        onClick={handleCloseModal}
                        style={{ fontSize: '1.1rem', backgroundColor: '#198754', border: 'none' }}
                    >
                        เข้าสู่ระบบ
                    </Button>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Register;