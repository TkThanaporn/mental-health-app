import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Form, Button, Row, Col, Alert, Spinner, Image, Badge } from 'react-bootstrap';
import { FaUser, FaPhone, FaVenusMars, FaCamera, FaQuoteLeft, FaInfoCircle, FaUserMd } from 'react-icons/fa';

// ✅ นำเข้า CSS
import './Psychologist.css';       // CSS หลัก (Theme)
import './ProfileEditor.css';      // CSS เฉพาะหน้านี้

const ProfileEditor = () => {
    const [profile, setProfile] = useState({
        fullname: '', phone: '', gender: '', bio: '', profile_image: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/profile/me', {
                headers: { 'x-auth-token': token }
            });
            setProfile(res.data);
            setPreviewUrl(res.data.profile_image);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        const formData = new FormData();
        formData.append('fullname', profile.fullname);
        formData.append('phone', profile.phone);
        formData.append('gender', profile.gender);
        formData.append('bio', profile.bio);
        if (selectedFile) formData.append('profile_image', selectedFile);

        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/api/profile/me', formData, {
                headers: { 
                    'x-auth-token': token,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setMessage({ type: 'success', text: 'บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว' });
            fetchProfile(); // โหลดข้อมูลใหม่
        } catch (err) {
            setMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
        }
    };

    if (loading) return (
        <div className="text-center py-5">
            <Spinner animation="grow" variant="primary" />
            <div className="mt-3 fw-bold text-primary">กำลังโหลดข้อมูล...</div>
        </div>
    );

    return (
        <div className="fade-in-up">
            {/* Header Title */}
            <div className="header-brand-border">
                <h2 className="fw-bold pcshs-navy m-0 display-6">
                    <FaUserMd className="me-3 text-warning" /> 
                    การจัดการข้อมูลส่วนบุคคล
                </h2>
                <p className="text-muted small mb-0 mt-2">ปรับแต่งตัวตนดิจิทัลและข้อมูลติดต่อสำหรับให้บริการนักเรียน</p>
            </div>

            <Card className="stat-card-ultra">
                {/* Decorative Top Bar */}
                <div style={{ height: '6px', background: 'linear-gradient(90deg, var(--pcshs-blue-deep) 0%, var(--pcshs-orange) 100%)' }}></div>
                
                <Card.Body className="p-4 p-lg-5 position-relative">
                    {message && (
                        <Alert variant={message.type} className="border-0 shadow-sm rounded-4 mb-4">
                            <FaInfoCircle className="me-2"/> {message.text}
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                        <Row className="align-items-start">
                            {/* --- Left Column: Avatar --- */}
                            <Col lg={4} className="text-center mb-5 mb-lg-0">
                                <div className="avatar-wrapper">
                                    <div className="stat-orb" style={{ width: '220px', height: '220px', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.15, background: 'var(--pcshs-orange)' }}></div>
                                    
                                    <Image 
                                        src={previewUrl || 'https://via.placeholder.com/200'} 
                                        roundedCircle 
                                        className="profile-img-preview"
                                    />
                                    
                                    <Form.Label htmlFor="imageUpload" className="btn-camera-upload">
                                        <FaCamera size={20} />
                                    </Form.Label>
                                    <Form.Control type="file" id="imageUpload" hidden onChange={handleFileChange} accept="image/*" />
                                </div>
                                <div className="mt-4">
                                    <span className="badge-role">Professional Identity</span>
                                </div>
                            </Col>

                            {/* --- Right Column: Form Data --- */}
                            <Col lg={8}>
                                <div className="mb-4 pb-2 border-bottom">
                                    <h5 className="fw-bold text-dark mb-1">ข้อมูลพื้นฐานผู้เชี่ยวชาญ</h5>
                                </div>

                                <Row className="g-4">
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label className="form-label-custom"><FaUser className="me-2"/>ชื่อ-นามสกุล</Form.Label>
                                            <Form.Control 
                                                className="form-control-custom"
                                                value={profile.fullname} 
                                                onChange={e => setProfile({...profile, fullname: e.target.value})} 
                                                placeholder="ระบุชื่อจริง-นามสกุล"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="form-label-custom"><FaPhone className="me-2"/>เบอร์โทรศัพท์</Form.Label>
                                            <Form.Control 
                                                className="form-control-custom"
                                                value={profile.phone} 
                                                onChange={e => setProfile({...profile, phone: e.target.value})} 
                                                placeholder="0XX-XXX-XXXX"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="form-label-custom"><FaVenusMars className="me-2"/>เพศ</Form.Label>
                                            <Form.Select 
                                                className="form-select-custom"
                                                value={profile.gender} 
                                                onChange={e => setProfile({...profile, gender: e.target.value})}
                                            >
                                                <option value="">ระบุเพศ</option>
                                                <option value="Male">ชาย (Male)</option>
                                                <option value="Female">หญิง (Female)</option>
                                                <option value="Other">อื่นๆ (Other)</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label className="form-label-custom"><FaQuoteLeft className="me-2"/>แนะนำตัวสั้นๆ (Bio)</Form.Label>
                                            <Form.Control 
                                                as="textarea" 
                                                rows={4} 
                                                className="form-control-custom"
                                                placeholder="เขียนอธิบายความเชี่ยวชาญหรือแนวทางการดูแลนักเรียน..."
                                                value={profile.bio} 
                                                onChange={e => setProfile({...profile, bio: e.target.value})} 
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <div className="text-end mt-5">
                                    <Button type="submit" className="btn-save-profile">
                                        บันทึกการเปลี่ยนแปลง
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
};

export default ProfileEditor;