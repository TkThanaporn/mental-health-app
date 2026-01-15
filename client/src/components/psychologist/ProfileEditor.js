import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Form, Button, Row, Col, Alert, Spinner, Image } from 'react-bootstrap';
import { FaUser, FaPhone, FaVenusMars, FaIdCard, FaCamera } from 'react-icons/fa';
import './Psychologist.css';

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
            setMessage({ type: 'success', text: 'อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว' });
            fetchProfile();
        } catch (err) {
            setMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
        }
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <div className="fade-in-up">
            <h4 className="pcshs-header-text mb-4"><FaIdCard className="me-2" /> แก้ไขข้อมูลส่วนตัว</h4>
            <Card className="pcshs-card shadow-sm border-0">
                <Card.Body className="p-4">
                    {message && <Alert variant={message.type} className="rounded-3">{message.text}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={4} className="text-center mb-4">
                                <div className="position-relative d-inline-block">
                                    <Image 
                                        src={previewUrl || 'https://via.placeholder.com/150'} 
                                        roundedCircle 
                                        style={{ width: '180px', height: '180px', objectFit: 'cover', border: '5px solid #f8f9fa' }}
                                        className="shadow-sm"
                                    />
                                    <Form.Label htmlFor="imageUpload" className="position-absolute bottom-0 end-0 bg-primary text-white p-2 rounded-circle shadow" style={{ cursor: 'pointer' }}>
                                        <FaCamera />
                                    </Form.Label>
                                    <Form.Control type="file" id="imageUpload" hidden onChange={handleFileChange} accept="image/*" />
                                </div>
                                <p className="mt-3 text-muted small">คลิกไอคอนกล้องเพื่อเปลี่ยนรูปโปรไฟล์</p>
                            </Col>
                            <Col md={8}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-bold small text-uppercase text-muted"><FaUser className="me-2"/>ชื่อ-นามสกุล</Form.Label>
                                            <Form.Control className="rounded-3 bg-light border-0 py-2" value={profile.fullname} onChange={e => setProfile({...profile, fullname: e.target.value})} />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-bold small text-uppercase text-muted"><FaPhone className="me-2"/>เบอร์โทรศัพท์</Form.Label>
                                            <Form.Control className="rounded-3 bg-light border-0 py-2" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-bold small text-uppercase text-muted"><FaVenusMars className="me-2"/>เพศ</Form.Label>
                                            <Form.Select className="rounded-3 bg-light border-0 py-2" value={profile.gender} onChange={e => setProfile({...profile, gender: e.target.value})}>
                                                <option value="">ระบุเพศ</option>
                                                <option value="Male">ชาย</option>
                                                <option value="Female">หญิง</option>
                                                <option value="Other">อื่นๆ</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold small text-uppercase text-muted">แนะนำตัวสั้นๆ (Bio)</Form.Label>
                                    <Form.Control as="textarea" rows={4} className="rounded-3 bg-light border-0" value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} />
                                </Form.Group>
                                <Button type="submit" className="btn-pcshs-orange px-5 py-2 fw-bold shadow-sm">บันทึกการเปลี่ยนแปลง</Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
};

export default ProfileEditor;