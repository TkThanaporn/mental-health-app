import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { FaUserCircle, FaGraduationCap, FaGenderless, FaSave, FaExclamationTriangle } from 'react-icons/fa';
import './Profile.css'; 

const Profile = ({ show, handleClose }) => {
    const [formData, setFormData] = useState({
        fullname: '', email: '', phone: '', gender: '', role: '', grade: '', dormitory: ''
    });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState(null);
    
    // ✅ เพิ่ม State เช็คว่าเป็นการบังคับกรอกครั้งแรกหรือไม่
    const [isMandatory, setIsMandatory] = useState(false);

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
            const data = res.data;
            setFormData(data);
            setLoading(false);

            // ✅ เช็คว่าข้อมูลสำคัญครบไหม ถ้าไม่ครบให้ล็อค Modal (isMandatory = true)
            if (data.role === 'Student') {
                if (!data.phone || !data.gender || !data.grade || !data.dormitory) {
                    setIsMandatory(true);
                } else {
                    setIsMandatory(false);
                }
            } else {
                if (!data.phone || !data.gender) {
                    setIsMandatory(true);
                } else {
                    setIsMandatory(false);
                }
            }

        } catch (err) {
            setMessage({ type: 'danger', text: 'ไม่สามารถโหลดข้อมูลได้' });
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // ✅ ดักจับก่อนบันทึก: ถ้าข้อมูลแหว่ง ไม่ให้เซฟ
        if (formData.role === 'Student' && (!formData.phone || !formData.gender || !formData.grade || !formData.dormitory)) {
            setMessage({ type: 'warning', text: 'กรุณากรอกข้อมูลให้ครบทุกช่องก่อนบันทึกครับ' });
            return;
        }

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/api/profile/me', formData, {
                headers: { 'x-auth-token': token, 'Content-Type': 'application/json' }
            });
            setMessage({ type: 'success', text: '✨ บันทึกการเปลี่ยนแปลงสำเร็จ!' });
            setTimeout(() => {
                setMessage(null);
                handleClose(); // ปิด Modal
                window.location.reload(); // รีเฟรชหน้าเพื่อให้ข้อมูลใหม่แสดงผล
            }, 1500);
        } catch (err) {
            setMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการบันทึก' });
            setIsSaving(false);
        }
    };

    return (
        <Modal 
            show={show} 
            // ✅ ถ้าเป็น Mandatory จะคลิกพื้นหลังหรือกดปุ่มปิดไม่ได้
            onHide={isMandatory ? null : handleClose} 
            backdrop={isMandatory ? 'static' : true}
            keyboard={!isMandatory}
            centered 
            size="lg" 
            className="profile-modal-premium"
        >
            {/* ✅ ซ่อนปุ่ม X ถ้าเป็นการบังคับกรอก */}
            <Modal.Header closeButton={!isMandatory} className="border-0 pb-0">
                <Modal.Title className="fw-bold px-2" style={{ color: '#002d56' }}>
                    <FaUserCircle className="me-2 mb-1"/> {isMandatory ? 'กรอกข้อมูลส่วนตัวเพื่อเริ่มใช้งาน' : 'แก้ไขโปรไฟล์ส่วนตัว'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4 pt-2">
                {loading ? (
                    <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>
                ) : (
                    <Form onSubmit={handleSubmit}>
                        {isMandatory && (
                            <Alert variant="warning" className="rounded-4 border-0 shadow-sm mb-4">
                                <FaExclamationTriangle className="me-2" />
                                <strong>ยินดีต้อนรับเข้าสู่ระบบ!</strong> กรุณาเติมเต็มข้อมูลส่วนตัวของคุณให้ครบถ้วนก่อนเริ่มใช้งานระบบนะครับ
                            </Alert>
                        )}
                        
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
                                        className="input-custom shadow-none bg-light"
                                        type="text" 
                                        value={formData.fullname || ''} 
                                        onChange={(e) => setFormData({...formData, fullname: e.target.value})} 
                                        required 
                                        disabled // ล็อคชื่อไว้ไม่ให้แก้ (ถ้าต้องการให้แก้ได้ เอาคำว่า disabled ออกครับ)
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={5}>
                                <Form.Group>
                                    <Form.Label className="label-custom">เบอร์โทรศัพท์ <span className="text-danger">*</span></Form.Label>
                                    <Form.Control 
                                        className="input-custom shadow-none"
                                        type="text" 
                                        value={formData.phone || ''} 
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                                        placeholder="08x-xxx-xxxx"
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="label-custom"><FaGenderless className="me-1"/> เพศ <span className="text-danger">*</span></Form.Label>
                                    <Form.Select 
                                        className="input-custom shadow-none"
                                        value={formData.gender || ''} 
                                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                                        required
                                    >
                                        <option value="">-- ระบุเพศ --</option>
                                        <option value="Male">ชาย</option>
                                        <option value="Female">หญิง</option>
                                        <option value="LGBTQ+">LGBTQ+</option>
                                        <option value="Other">ไม่ระบุ</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            {formData.role === 'Student' && (
                                <Col md={12}>
                                    <div className="info-box-premium p-4 rounded-4 bg-light border">
                                        <h6 className="fw-bold mb-3" style={{ color: '#f26522' }}>
                                            <FaGraduationCap className="me-2"/> ข้อมูลการเรียนและหอพัก
                                        </h6>
                                        <Row className="g-3">
                                            <Col md={6}>
                                                <Form.Label className="label-custom small">ระดับชั้น <span className="text-danger">*</span></Form.Label>
                                                <Form.Select 
                                                    className="input-custom border-0 shadow-sm"
                                                    value={formData.grade || ''} 
                                                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                                                    required
                                                >
                                                    <option value="">-- ระบุชั้นเรียน --</option>
                                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                                        <option key={i} value={`มัธยมศึกษาปีที่ ${i}`}>มัธยมศึกษาปีที่ {i}</option>
                                                    ))}
                                                </Form.Select>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Label className="label-custom small">หอพัก <span className="text-danger">*</span></Form.Label>
                                                <Form.Control 
                                                    className="input-custom border-0 shadow-sm"
                                                    type="text" 
                                                    placeholder="ชื่อหอพัก หรือ ไป-กลับ" 
                                                    value={formData.dormitory || ''} 
                                                    onChange={(e) => setFormData({...formData, dormitory: e.target.value})} 
                                                    required
                                                />
                                            </Col>
                                        </Row>
                                    </div>
                                </Col>
                            )}
                        </Row>

                        <div className="d-flex justify-content-end gap-3 mt-5">
                            {/* ✅ ซ่อนปุ่มยกเลิก ถ้าเป็นการบังคับกรอก */}
                            {!isMandatory && (
                                <Button variant="light" onClick={handleClose} className="rounded-pill px-4 fw-bold text-secondary border-0">
                                    ยกเลิก
                                </Button>
                            )}
                            <Button 
                                type="submit" 
                                className="btn-save-premium rounded-pill px-5 shadow-sm border-0"
                                disabled={isSaving}
                            >
                                {isSaving ? <Spinner size="sm" /> : <><FaSave className="me-2"/> {isMandatory ? 'บันทึกและเริ่มใช้งาน' : 'บันทึกข้อมูล'}</>}
                            </Button>
                        </div>
                    </Form>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default Profile;