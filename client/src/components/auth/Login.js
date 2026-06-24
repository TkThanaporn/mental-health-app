// client/src/components/auth/Login.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Container, Form, Button, Row, Col, InputGroup, Spinner, Alert, Modal } from 'react-bootstrap';
// เพิ่ม FaCheckCircle เข้ามาสำหรับป๊อปอัปสำเร็จ
import { FaEnvelope, FaLock, FaKey, FaArrowLeft, FaClock, FaEye, FaEyeSlash, FaTimesCircle, FaCheckCircle } from 'react-icons/fa';

// --- นำเข้ารูปภาพโลโก้ ---
import pcshsLogo from '../../assets/pcshs_logo.png'; 

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    // 1️⃣ State ควบคุมการแสดงผลหน้าจอ
    const [view, setView] = useState('login'); 

    // 2️⃣ State สำหรับ Login
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false); 

    // 3️⃣ State สำหรับลืมรหัสผ่าน
    const [resetEmail, setResetEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false); 
    
    // ⏱️ State สำหรับระบบจับเวลาถอยหลัง (300 วินาที = 5 นาที)
    const [timeLeft, setTimeLeft] = useState(300);

    // State ควบคุม Loading และข้อความแจ้งเตือน
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // 🚨 State ควบคุมหน้าต่าง Popup แจ้งเตือนเข้าสู่ระบบไม่สำเร็จ/สำเร็จ
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [targetRoute, setTargetRoute] = useState(''); // เก็บเส้นทางที่จะพับลิกไปหลังเข้าสู่ระบบสำเร็จ

    // Theme สีโรงเรียน
    const themeColors = {
        primaryBlue: '#002147', 
        secondaryBlue: '#1B3F8B', 
        primaryOrange: '#F26522', 
        textDark: '#002147',      
        textGold: '#FFD700'        
    };

    // ==========================================
    // ⏱️ ระบบนับเวลาถอยหลัง
    // ==========================================
    useEffect(() => {
        let timer;
        if (view === 'forgot-reset' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [view, timeLeft]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // ==========================================
    // ฟังก์ชัน Login ปกติ
    // ==========================================
    const onLoginSubmit = async e => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', formData);
            const { token, role, userId } = res.data;
            login(token, role, userId);

            // 1. กำหนดเส้นทางตาม Role
            let route = '/student/dashboard';
            if (role === 'Admin') route = '/admin/dashboard';
            else if (role === 'Psychologist') route = '/psychologist/dashboard';
            
            // 2. โชว์ Popup เข้าสู่ระบบสำเร็จ
            setTargetRoute(route);
            setShowSuccessModal(true);

            // 3. หน่วงเวลา 1.5 วินาที เพื่อให้ผู้ใช้เห็น Popup ก่อนเปลี่ยนหน้า
            setTimeout(() => {
                setShowSuccessModal(false);
                navigate(route);
            }, 1500);

        } catch (err) {
            setShowErrorModal(true); // โชว์ Popup ผิดพลาด
        }
    };

    // ==========================================
    // ฟังก์ชัน ขอ OTP ลืมรหัสผ่าน
    // ==========================================
    const handleSendOTP = async (e) => {
        if (e) e.preventDefault();
        setIsLoading(true);
        setMessage(null);
        try {
            const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email: resetEmail });
            setMessage({ type: 'success', text: res.data.msg });
            setTimeLeft(300);
            setOtp('');
            setShowNewPassword(false); 
            setView('forgot-reset');
        } catch (err) {
            setMessage({ type: 'danger', text: err.response?.data?.msg || 'ไม่สามารถส่ง OTP ได้' });
        } finally {
            setIsLoading(false);
        }
    };

    // ==========================================
    // ฟังก์ชัน เปลี่ยนรหัสผ่านใหม่
    // ==========================================
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (timeLeft === 0) return setMessage({ type: 'danger', text: 'รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่' });
        if (newPassword !== confirmPassword) return setMessage({ type: 'danger', text: 'รหัสผ่านใหม่ไม่ตรงกัน' });
        
        setIsLoading(true);
        setMessage(null);
        try {
            const res = await axios.post('http://localhost:5000/api/auth/reset-password', { 
                email: resetEmail, otp, newPassword 
            });
            setMessage({ type: 'success', text: res.data.msg });
            
            setTimeout(() => {
                setView('login');
                setMessage(null);
                setFormData({ email: resetEmail, password: '' }); 
                setNewPassword('');
                setConfirmPassword('');
                setOtp('');
            }, 2000);
        } catch (err) {
            setMessage({ type: 'danger', text: err.response?.data?.msg || 'รหัส OTP ไม่ถูกต้อง' });
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyle = { backgroundColor: '#f8f9fa', border: 'none', fontSize: '1rem' };

    return (
        <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="shadow-lg overflow-hidden bg-white" style={{ borderRadius: '20px', maxWidth: '1200px', width: '100%', minHeight: '600px', display: 'flex' }}>
                <Row className="g-0 w-100">
                    
                    {/* ================= LEFT SIDE: FORM AREA ================= */}
                    <Col lg={6} className="p-5 d-flex flex-column justify-content-center bg-white">
                        <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
                            
                            {message && view !== 'login' && <Alert variant={message.type}>{message.text}</Alert>}

                            {/* --- หน้าจอ 1: เข้าสู่ระบบปกติ --- */}
                            {view === 'login' && (
                                <div className="fade-in">
                                    <h2 className="text-center fw-bold mb-4" style={{ color: themeColors.textDark, fontSize: '2rem' }}>เข้าสู่ระบบ</h2>
                                    <Form onSubmit={onLoginSubmit}>
                                        <Form.Group className="mb-4">
                                            <InputGroup size="lg">
                                                <InputGroup.Text className="bg-light border-0"><FaEnvelope className="text-muted" /></InputGroup.Text>
                                                <Form.Control type="email" name="email" placeholder="อีเมลผู้ใช้" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required style={inputStyle} className="py-3" />
                                            </InputGroup>
                                        </Form.Group>
                                        <Form.Group className="mb-4">
                                            <InputGroup size="lg">
                                                <InputGroup.Text className="bg-light border-0"><FaLock className="text-muted" /></InputGroup.Text>
                                                <Form.Control type={showPassword ? "text" : "password"} name="password" placeholder="รหัสผ่าน" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required style={inputStyle} className="py-3" />
                                            </InputGroup>
                                        </Form.Group>
                                        
                                        <div className="d-flex justify-content-between align-items-center mb-4 text-muted">
                                            <Form.Check type="checkbox" label="แสดงรหัสผ่าน" checked={showPassword} onChange={() => setShowPassword(!showPassword)} />
                                            <Button variant="link" className="p-0 fw-bold" style={{ textDecoration: 'none', color: themeColors.primaryOrange }} onClick={() => { setView('forgot-request'); setMessage(null); }}>
                                                ลืมรหัสผ่าน?
                                            </Button>
                                        </div>

                                        <Button type="submit" className="w-100 py-3 fw-bold text-white border-0" style={{ backgroundColor: themeColors.primaryOrange, borderRadius: '30px', boxShadow: '0 4px 15px rgba(242, 101, 34, 0.4)', fontSize: '1.1rem' }}>
                                            เข้าสู่ระบบ
                                        </Button>
                                    </Form>
                                    <div className="text-center mt-5 text-muted">
                                        ผู้ใช้ใหม่ <Link to="/register" className="fw-bold" style={{ textDecoration: 'none', color: themeColors.primaryOrange }}>ลงทะเบียน</Link>
                                    </div>
                                </div>
                            )}

                            {/* --- หน้าจอ 2: ขอ OTP ลืมรหัสผ่าน --- */}
                            {view === 'forgot-request' && (
                                <div className="fade-in">
                                    <h3 className="text-center fw-bold mb-2" style={{ color: themeColors.textDark }}>ลืมรหัสผ่าน</h3>
                                    <p className="text-center text-muted mb-4">กรุณากรอกอีเมลเพื่อรับรหัส OTP (รหัสมีอายุ 5 นาที)</p>
                                    <Form onSubmit={handleSendOTP}>
                                        <Form.Group className="mb-4">
                                            <Form.Control type="email" placeholder="student@pcshs.ac.th" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required style={inputStyle} className="py-3 text-center" />
                                        </Form.Group>
                                        <Button type="submit" disabled={isLoading} className="w-100 py-3 fw-bold text-white border-0" style={{ backgroundColor: themeColors.primaryOrange, borderRadius: '30px' }}>
                                            {isLoading ? <Spinner animation="border" size="sm" /> : "ส่งรหัส OTP"}
                                        </Button>
                                    </Form>
                                    <div className="text-center mt-4">
                                        <Button variant="link" className="text-muted text-decoration-none" onClick={() => setView('login')}>
                                            <FaArrowLeft className="me-2" /> กลับไปหน้าเข้าสู่ระบบ
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* --- หน้าจอ 3: ยืนยัน OTP และตั้งรหัสใหม่ --- */}
                            {view === 'forgot-reset' && (
                                <div className="fade-in">
                                    <div className="text-center mb-3 text-primary"><FaKey size={40} color={themeColors.secondaryBlue} /></div>
                                    <h4 className="text-center fw-bold mb-2" style={{ color: themeColors.textDark }}>ตั้งรหัสผ่านใหม่</h4>
                                    
                                    <div className="text-center mb-4">
                                        <p className="text-muted m-0 small">รหัสถูกส่งไปที่ {resetEmail}</p>
                                        <div className={`fw-bold d-inline-flex align-items-center mt-2 px-3 py-1 rounded-pill ${timeLeft === 0 ? 'bg-danger text-white' : 'bg-light text-danger'}`}>
                                            <FaClock className="me-2" />
                                            {timeLeft > 0 ? `เหลือเวลา: ${formatTime(timeLeft)}` : "รหัส OTP หมดอายุแล้ว"}
                                        </div>
                                    </div>
                                    
                                    <Form onSubmit={handleResetPassword}>
                                        <Form.Group className="mb-3">
                                            <Form.Control 
                                                type="text" 
                                                maxLength="6" 
                                                placeholder="รหัส OTP 6 หลัก" 
                                                value={otp} 
                                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} 
                                                required 
                                                disabled={timeLeft === 0} 
                                                className="text-center py-3 fw-bold tracking-widest" 
                                                style={{ fontSize: '1.2rem', letterSpacing: '5px', backgroundColor: '#f8f9fa', border: `2px dashed ${timeLeft === 0 ? '#dc3545' : themeColors.primaryOrange}`, borderRadius: '10px' }} 
                                            />
                                        </Form.Group>
                                        
                                        <Form.Group className="mb-3">
                                            <InputGroup>
                                                <Form.Control type={showNewPassword ? "text" : "password"} placeholder="รหัสผ่านใหม่" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={timeLeft === 0} style={inputStyle} className="py-3" />
                                                <Button variant="light" onClick={() => setShowNewPassword(!showNewPassword)} disabled={timeLeft === 0} style={{ backgroundColor: '#f8f9fa', border: 'none' }} className="d-flex align-items-center">
                                                    {showNewPassword ? <FaEyeSlash className="text-muted" /> : <FaEye className="text-muted" />}
                                                </Button>
                                            </InputGroup>
                                        </Form.Group>
                                        
                                        <Form.Group className="mb-4">
                                            <InputGroup>
                                                <Form.Control type={showNewPassword ? "text" : "password"} placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={timeLeft === 0} style={inputStyle} className="py-3" />
                                                <Button variant="light" onClick={() => setShowNewPassword(!showNewPassword)} disabled={timeLeft === 0} style={{ backgroundColor: '#f8f9fa', border: 'none' }} className="d-flex align-items-center">
                                                    {showNewPassword ? <FaEyeSlash className="text-muted" /> : <FaEye className="text-muted" />}
                                                </Button>
                                            </InputGroup>
                                        </Form.Group>
                                        
                                        {timeLeft > 0 ? (
                                            <Button type="submit" disabled={isLoading || otp.length < 6} className="w-100 py-3 fw-bold text-white border-0" style={{ backgroundColor: themeColors.primaryBlue, borderRadius: '30px' }}>
                                                {isLoading ? <Spinner animation="border" size="sm" /> : "บันทึกรหัสผ่านใหม่"}
                                            </Button>
                                        ) : (
                                            <Button type="button" onClick={() => handleSendOTP()} disabled={isLoading} className="w-100 py-3 fw-bold text-white border-0 bg-danger" style={{ borderRadius: '30px' }}>
                                                {isLoading ? <Spinner animation="border" size="sm" /> : "ขอรหัส OTP ใหม่อีกครั้ง"}
                                            </Button>
                                        )}
                                        
                                        <div className="text-center mt-3">
                                            <Button variant="link" className="text-muted text-decoration-none" onClick={() => setView('forgot-request')} disabled={isLoading}>
                                                กลับไปแก้ไขอีเมล
                                            </Button>
                                        </div>
                                    </Form>
                                </div>
                            )}

                        </div>
                    </Col>

                    {/* ================= RIGHT SIDE: BRANDING ================= */}
                    <Col lg={6} className="text-white d-flex flex-column align-items-center justify-content-center p-5" style={{ background: `linear-gradient(135deg, ${themeColors.primaryBlue} 0%, ${themeColors.secondaryBlue} 100%)` }}>
                        <div className="mb-4 p-3 bg-white rounded-circle shadow-lg" style={{ width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={pcshsLogo} alt="PCSHS Logo" style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }} />
                        </div>
                        <h2 className="fw-bold mb-2" style={{ color: themeColors.textGold }}>PCSHS HeartCare</h2>
                        <h4 className="mb-4 fw-light">
                            {view === 'login' ? 'พื้นที่ปลอดภัยสำหรับใจคุณ' : 'ระบบกู้คืนรหัสผ่าน'}
                        </h4>
                        <p className="text-center px-5" style={{ opacity: 0.9, fontSize: '1.1rem' }}>
                            {view === 'login' 
                                ? <>ระบบสนับสนุนทางจิตวิทยาสำหรับนักเรียน<br/>โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย</>
                                : <>ไม่ต้องกังวลหากคุณลืมรหัสผ่าน<br/>เพียงยืนยันตัวตนผ่านอีเมลของคุณ</>
                            }
                        </p>
                    </Col>

                </Row>
            </div>

            {/* ================= 🔴 Modal แจ้งเตือนข้อผิดพลาด ================= */}
            <Modal show={showErrorModal} onHide={() => setShowErrorModal(false)} centered backdrop="static" keyboard={false}>
                <Modal.Body className="text-center p-5">
                    <div className="mb-4">
                        <FaTimesCircle style={{ fontSize: '4rem', color: '#dc3545' }} />
                    </div>
                    <h4 className="fw-bold mb-3" style={{ color: themeColors.textDark }}>เข้าสู่ระบบไม่สำเร็จ</h4>
                    <p className="text-muted mb-4" style={{ fontSize: '1.1rem' }}>
                        อีเมลหรือรหัสผ่านไม่ถูกต้อง<br/>กรุณาตรวจสอบข้อมูลแล้วลองใหม่อีกครั้ง
                    </p>
                    <Button 
                        variant="danger" 
                        className="w-100 py-3 rounded-pill fw-bold" 
                        onClick={() => setShowErrorModal(false)}
                        style={{ fontSize: '1.1rem', backgroundColor: '#dc3545', border: 'none' }}
                    >
                        ตกลง
                    </Button>
                </Modal.Body>
            </Modal>

            {/* ================= 🟢 Modal แจ้งเตือนเข้าสู่ระบบสำเร็จ ================= */}
            <Modal show={showSuccessModal} centered backdrop="static" keyboard={false}>
                <Modal.Body className="text-center p-5">
                    <div className="mb-4 fade-in">
                        <FaCheckCircle style={{ fontSize: '4rem', color: '#28a745' }} />
                    </div>
                    <h4 className="fw-bold mb-3" style={{ color: themeColors.textDark }}>เข้าสู่ระบบสำเร็จ!</h4>
                    <p className="text-muted mb-4" style={{ fontSize: '1.1rem' }}>
                        ยินดีต้อนรับเข้าสู่ระบบ<br/>กรุณารอสักครู่ กำลังไปยังหน้าหลัก...
                    </p>
                    <Spinner animation="border" variant="success" />
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Login;