import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { FaUserCircle, FaPhoneAlt, FaGraduationCap, FaHome, FaGenderless, FaSave } from 'react-icons/fa';
import './Profile.css'; 

const Profile = ({ show, handleClose }) => {
    const [formData, setFormData] = useState({
        fullname: '', email: '', phone: '', gender: '', role: '', grade: '', dormitory: ''
    });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (show) {
            fetchProfile();
        }
    }, [show]);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/profile/me', {
                headers: { 'x-auth-token': token }
            });
            setFormData(res.data);
            setLoading(false);
        } catch (err) {
            setMessage({ type: 'danger', text: 'ไม่สามารถโหลดข้อมูลได้' });
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/api/profile/me', formData, {
                headers: { 'x-auth-token': token, 'Content-Type': 'application/json' }
            });
            setMessage({ type: 'success', text: '✨ บันทึกการเปลี่ยนแปลงสำเร็จ!' });
            setTimeout(() => {
                setMessage(null);
                handleClose();
                window.location.reload();
            }, 1500);
        } catch (err) {
            setMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการบันทึก' });
            setIsSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered size="lg" className="profile-modal-premium">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold px-2" style={{ color: '#002d56' }}>
                    <FaUserCircle className="me-2 mb-1"/> แก้ไขโปรไฟล์ส่วนตัว
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4 pt-2">
                {loading ? (
                    <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>
                ) : (
                    <Form onSubmit={handleSubmit}>
                        {message && <Alert variant={message.type} className="rounded-4 text-center mb-4 border-0 shadow-sm">{message.text}</Alert>}

                        <div className="avatar-preview-section text-center mb-4">
                            <div className="avatar-placeholder-circle shadow-sm">🎓</div>
                            <h5 className="mt-3 fw-bold text-navy mb-1">{formData.fullname}</h5>
                            <div className="badge bg-soft-orange text-orange rounded-pill px-3 py-2">{formData.role}</div>
                        </div>

                        <Row className="g-4">
                            <Col md={7}>
                                <Form.Group>
                                    <Form.Label className="label-custom">ชื่อ-นามสกุล</Form.Label>
                                    <Form.Control 
                                        className="input-custom shadow-none"
                                        type="text" 
                                        value={formData.fullname || ''} 
                                        onChange={(e) => setFormData({...formData, fullname: e.target.value})} 
                                        required 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={5}>
                                <Form.Group>
                                    <Form.Label className="label-custom">เบอร์โทรศัพท์</Form.Label>
                                    <Form.Control 
                                        className="input-custom shadow-none"
                                        type="text" 
                                        value={formData.phone || ''} 
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                                        placeholder="08x-xxx-xxxx"
                                    />
                                </Form.Group>
                            </Col>

                            {formData.role === 'Student' && (
                                <Col md={12}>
                                    <div className="info-box-premium p-4 rounded-4">
                                        <h6 className="fw-bold mb-3" style={{ color: '#f26522' }}>
                                            <FaGraduationCap className="me-2"/> ข้อมูลการเรียนและหอพัก
                                        </h6>
                                        <Row className="g-3">
                                            <Col md={6}>
                                                <Form.Label className="label-custom small">ระดับชั้น</Form.Label>
                                                <Form.Select 
                                                    className="input-custom border-0 shadow-sm"
                                                    value={formData.grade || ''} 
                                                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                                                >
                                                    <option value="">-- ระบุชั้นเรียน --</option>
                                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                                        <option key={i} value={`มัธยมศึกษาปีที่ ${i}`}>มัธยมศึกษาปีที่ {i}</option>
                                                    ))}
                                                </Form.Select>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Label className="label-custom small">หอพัก</Form.Label>
                                                <Form.Control 
                                                    className="input-custom border-0 shadow-sm"
                                                    type="text" 
                                                    placeholder="ชื่อหอพัก หรือ ไป-กลับ" 
                                                    value={formData.dormitory || ''} 
                                                    onChange={(e) => setFormData({...formData, dormitory: e.target.value})} 
                                                />
                                            </Col>
                                        </Row>
                                    </div>
                                </Col>
                            )}

                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="label-custom"><FaGenderless className="me-1"/> เพศ</Form.Label>
                                    <Form.Select 
                                        className="input-custom shadow-none"
                                        value={formData.gender || ''} 
                                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                                    >
                                        <option value="">-- ระบุเพศ --</option>
                                        <option value="Male">ชาย</option>
                                        <option value="Female">หญิง</option>
                                        <option value="LGBTQ+">LGBTQ+</option>
                                        <option value="Other">ไม่ระบุ</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-end gap-3 mt-5">
                            <Button variant="light" onClick={handleClose} className="rounded-pill px-4 fw-bold text-secondary border-0">
                                ยกเลิก
                            </Button>
                            <Button 
                                type="submit" 
                                className="btn-save-premium rounded-pill px-5 shadow-sm border-0"
                                disabled={isSaving}
                            >
                                {isSaving ? <Spinner size="sm" /> : <><FaSave className="me-2"/> บันทึกข้อมูล</>}
                            </Button>
                        </div>
                    </Form>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default Profile;