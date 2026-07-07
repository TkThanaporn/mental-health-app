import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    FaKey, 
    FaArrowLeft, 
    FaCheckCircle, 
    FaExclamationCircle, 
    FaEye, 
    FaEyeSlash,
    FaLock
} from 'react-icons/fa';

const ChangePassword = () => {
    const navigate = useNavigate();
    
    // States สำหรับเก็บค่าในฟอร์ม
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // States สำหรับเปิด-ปิดการมองเห็นรหัสผ่าน
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // States สำหรับการแสดงผล (โหลด, แจ้งเตือน)
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // 1. ตรวจสอบความถูกต้องฝั่งหน้าบ้าน
        if (!oldPassword || !newPassword || !confirmPassword) {
            return setError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
        }
        if (newPassword.length < 6) {
            return setError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        }
        if (newPassword !== confirmPassword) {
            return setError('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
        }
        if (oldPassword === newPassword) {
            return setError('รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม');
        }

        // 2. ส่งข้อมูลไปเปลี่ยนรหัสผ่านที่ Backend
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put('http://localhost:5000/api/auth/change-password', 
                { oldPassword, newPassword },
                { headers: { 'x-auth-token': token } }
            );

            setSuccess('เปลี่ยนรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบใหม่ด้วยรหัสผ่านใหม่');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            
            // ให้เด้งกลับไปหน้าล็อกอินหลังจากเปลี่ยนสำเร็จ
            setTimeout(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                navigate('/login');
            }, 2000);

        } catch (err) {
            console.error("Change Password Error:", err);
            setError(err.response?.data?.msg || 'เกิดข้อผิดพลาด รหัสผ่านเดิมอาจไม่ถูกต้อง');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f4f7f6' }}>
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', paddingBottom: '40px' }}>
                <Card className="shadow-lg border-0 w-100 fade-in" style={{ maxWidth: '480px', borderRadius: '20px', overflow: 'hidden' }}>
                    
                    {/* Header ของ Card */}
                    <div className="p-4 text-white text-center position-relative" style={{ background: 'linear-gradient(135deg, #002147 0%, #1B3F8B 100%)' }}>
                        <Button 
                            variant="link" 
                            className="text-white position-absolute top-0 start-0 m-3 p-0 text-decoration-none d-flex align-items-center opacity-75 hover-opacity-100"
                            onClick={() => navigate(-1)}
                            style={{ transition: 'all 0.2s' }}
                        >
                            <FaArrowLeft className="me-1" /> กลับ
                        </Button>
                        <div className="bg-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow" style={{ width: '70px', height: '70px' }}>
                            <FaKey size={30} color="#f26522" />
                        </div>
                        <h4 className="fw-bold mb-0" style={{ letterSpacing: '0.5px' }}>เปลี่ยนรหัสผ่าน</h4>
                        <p className="text-white-50 small mb-0 mt-2">ตั้งรหัสผ่านใหม่เพื่อความปลอดภัยของบัญชีคุณ</p>
                    </div>

                    <Card.Body className="p-4 p-sm-5 bg-white">
                        {/* แจ้งเตือน Error / Success */}
                        {error && (
                            <Alert variant="danger" className="d-flex align-items-center rounded-3 border-0 bg-danger bg-opacity-10 text-danger mb-4">
                                <FaExclamationCircle className="me-2 flex-shrink-0" size={20}/>
                                <div>{error}</div>
                            </Alert>
                        )}
                        {success && (
                            <Alert variant="success" className="d-flex align-items-center rounded-3 border-0 bg-success bg-opacity-10 text-success mb-4">
                                <FaCheckCircle className="me-2 flex-shrink-0" size={20}/>
                                <div>{success}</div>
                            </Alert>
                        )}

                        <Form onSubmit={handleSubmit}>
                            {/* รหัสผ่านปัจจุบัน */}
                            <Form.Group className="mb-4">
                                <Form.Label className="fw-bold text-secondary small mb-2">รหัสผ่านปัจจุบัน</Form.Label>
                                <InputGroup className="rounded-3 overflow-hidden shadow-sm" style={{ border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                                    <InputGroup.Text className="bg-transparent border-0 text-muted ps-3 pr-0">
                                        <FaLock />
                                    </InputGroup.Text>
                                    <Form.Control 
                                        type={showOldPassword ? "text" : "password"} 
                                        placeholder="กรอกรหัสผ่านปัจจุบันของคุณ"
                                        className="py-2 border-0 bg-transparent shadow-none"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        disabled={loading || success}
                                    />
                                    <Button 
                                        variant="link" 
                                        className="text-muted text-decoration-none border-0 bg-transparent pe-3"
                                        onClick={() => setShowOldPassword(!showOldPassword)}
                                        disabled={loading || success}
                                    >
                                        {showOldPassword ? <FaEyeSlash /> : <FaEye />}
                                    </Button>
                                </InputGroup>
                            </Form.Group>

                            {/* รหัสผ่านใหม่ */}
                            <Form.Group className="mb-4">
                                <Form.Label className="fw-bold text-secondary small mb-2">รหัสผ่านใหม่</Form.Label>
                                <InputGroup className="rounded-3 overflow-hidden shadow-sm" style={{ border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                                    <InputGroup.Text className="bg-transparent border-0 text-muted ps-3 pr-0">
                                        <FaLock />
                                    </InputGroup.Text>
                                    <Form.Control 
                                        type={showNewPassword ? "text" : "password"} 
                                        placeholder="ตั้งรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร"
                                        className="py-2 border-0 bg-transparent shadow-none"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        disabled={loading || success}
                                    />
                                    <Button 
                                        variant="link" 
                                        className="text-muted text-decoration-none border-0 bg-transparent pe-3"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        disabled={loading || success}
                                    >
                                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                                    </Button>
                                </InputGroup>
                            </Form.Group>

                            {/* ยืนยันรหัสผ่านใหม่ */}
                            <Form.Group className="mb-4">
                                <Form.Label className="fw-bold text-secondary small mb-2">ยืนยันรหัสผ่านใหม่</Form.Label>
                                <InputGroup className="rounded-3 overflow-hidden shadow-sm" style={{ border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                                    <InputGroup.Text className="bg-transparent border-0 text-muted ps-3 pr-0">
                                        <FaLock />
                                    </InputGroup.Text>
                                    <Form.Control 
                                        type={showConfirmPassword ? "text" : "password"} 
                                        placeholder="กรอกรหัสผ่านใหม่อีกครั้งให้ตรงกัน"
                                        className="py-2 border-0 bg-transparent shadow-none"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={loading || success}
                                    />
                                    <Button 
                                        variant="link" 
                                        className="text-muted text-decoration-none border-0 bg-transparent pe-3"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        disabled={loading || success}
                                    >
                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    </Button>
                                </InputGroup>
                            </Form.Group>

                            <Button 
                                type="submit" 
                                className="w-100 py-3 rounded-3 fw-bold border-0 mt-2"
                                style={{ 
                                    background: 'linear-gradient(135deg, #f26522 0%, #d9531e 100%)', 
                                    boxShadow: '0 4px 15px rgba(242, 101, 34, 0.3)',
                                    transition: 'all 0.3s ease'
                                }}
                                disabled={loading || success}
                            >
                                {loading ? (
                                    <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2"/> กำลังดำเนินการ...</>
                                ) : (
                                    'บันทึกรหัสผ่านใหม่'
                                )}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default ChangePassword;