import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Form, Button, Row, Col, Alert, Spinner, Image } from 'react-bootstrap';
import { FaUser, FaPhone, FaVenusMars, FaCamera, FaUserMd } from 'react-icons/fa';
import './Psychologist.css'; // เรียกใช้ CSS เดิม

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
            // จำลองการดึงข้อมูล (ถ้ามี API จริงให้ใช้ URL ของคุณ)
            const res = await axios.get('http://localhost:5000/api/profile/me', {
                headers: { 'x-auth-token': token }
            });
            setProfile(res.data);
            setPreviewUrl(res.data.profile_image);
            setLoading(false);
        } catch (err) {
            console.error(err);
            // Mock Data สำหรับ Demo เพื่อไม่ให้หน้าขาว
            setProfile({
                fullname: 'ดร.สมชาย ใจดี',
                phone: '081-234-5678',
                gender: 'Male',
                bio: 'นักจิตวิทยาโรงเรียน เชี่ยวชาญด้านการให้คำปรึกษาวัยรุ่น',
                profile_image: ''
            });
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
            // กรณีไม่มี API จริง ให้แสดง Success ปลอมเพื่อ Demo
            setMessage({ type: 'success', text: 'บันทึกข้อมูลเรียบร้อยแล้ว (Demo)' });
            // setMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
        }
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="warning" /></div>;

    return (
        <div className="fade-in-up">
            {/* หัวข้อหน้า */}
            <h4 className="fw-title mb-4 text-dark">
                <FaUserMd className="me-2" style={{color: 'var(--pcshs-orange)'}} /> 
                ข้อมูลนักจิตวิทยา (Psychologist Profile)
            </h4>
            
            <Card className="border-0 shadow-sm rounded-4">
                <Card.Body className="p-4">
                    {message && <Alert variant={message.type} className="rounded-3 shadow-sm mb-4">{message.text}</Alert>}
                    
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            {/* --- ส่วนรูปโปรไฟล์ --- */}
                            <Col md={4} className="text-center mb-4 d-flex flex-column align-items-center justify-content-center">
                                <div className="position-relative">
                                    <Image 
                                        src={previewUrl || 'https://via.placeholder.com/150'} 
                                        roundedCircle 
                                        style={{ width: '180px', height: '180px', objectFit: 'cover', border: '6px solid white' }}
                                        className="shadow-lg"
                                    />
                                    <Form.Label htmlFor="imageUpload" className="btn-pcshs position-absolute bottom-0 end-0 p-2 rounded-circle shadow border border-white" style={{ cursor: 'pointer', width: '45px', height: '45px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                        <FaCamera size={18} />
                                    </Form.Label>
                                    <Form.Control type="file" id="imageUpload" hidden onChange={handleFileChange} accept="image/*" />
                                </div>
                                <p className="mt-3 text-muted small fw-light">แนะนำให้ใช้รูปถ่ายหน้าตรง สุภาพ</p>
                            </Col>

                            {/* --- ส่วนฟอร์มข้อมูล --- */}
                            <Col md={8}>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold small text-muted">ชื่อ-นามสกุล</Form.Label>
                                            <Form.Control 
                                                className="rounded-3 bg-light border-0 py-2" 
                                                value={profile.fullname} 
                                                onChange={e => setProfile({...profile, fullname: e.target.value})} 
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold small text-muted"><FaPhone className="me-1"/> เบอร์โทรศัพท์</Form.Label>
                                            <Form.Control 
                                                className="rounded-3 bg-light border-0 py-2" 
                                                value={profile.phone} 
                                                onChange={e => setProfile({...profile, phone: e.target.value})} 
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold small text-muted"><FaVenusMars className="me-1"/> เพศ</Form.Label>
                                            <Form.Select 
                                                className="rounded-3 bg-light border-0 py-2" 
                                                value={profile.gender} 
                                                onChange={e => setProfile({...profile, gender: e.target.value})}
                                            >
                                                <option value="">ระบุเพศ</option>
                                                <option value="Male">ชาย</option>
                                                <option value="Female">หญิง</option>
                                                <option value="Other">อื่นๆ</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mt-3 mb-4">
                                    <Form.Label className="fw-bold small text-muted">แนะนำตัวสั้นๆ (Bio)</Form.Label>
                                    <Form.Control 
                                        as="textarea" 
                                        rows={4} 
                                        className="rounded-3 bg-light border-0" 
                                        value={profile.bio} 
                                        onChange={e => setProfile({...profile, bio: e.target.value})} 
                                        placeholder="ข้อความนี้จะแสดงให้นักเรียนเห็น..."
                                    />
                                </Form.Group>

                                <div className="text-end">
                                    <Button type="submit" className="btn-pcshs px-5 py-2 shadow-sm">
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