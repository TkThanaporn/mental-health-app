import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Form, Button, Row, Col, Alert, Image } from 'react-bootstrap';

const Profile = () => {
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        phone: '',
        gender: '',
        bio: '',
        role: ''
    });
    const [currentImage, setCurrentImage] = useState(null); // รูปปัจจุบันที่โชว์
    const [selectedFile, setSelectedFile] = useState(null); // ไฟล์ใหม่ที่เลือก
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/profile/me', {
                    headers: { 'x-auth-token': token }
                });
                setFormData(res.data);
                setCurrentImage(res.data.profile_image); // เก็บ URL รูปเดิม
                setLoading(false);
            } catch (err) {
                console.error(err);
                setMessage({ type: 'danger', text: 'ไม่สามารถดึงข้อมูลโปรไฟล์ได้' });
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // เมื่อเลือกไฟล์
    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // สร้าง FormData เพื่อส่งไฟล์
        const data = new FormData();
        data.append('fullname', formData.fullname);
        data.append('phone', formData.phone || '');
        data.append('gender', formData.gender || '');
        data.append('bio', formData.bio || '');

        // ถ้ามีการเลือกไฟล์ใหม่ ให้ใส่เข้าไปด้วย
        if (selectedFile) {
            data.append('profile_image', selectedFile);
        }

        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/api/profile/me', data, {
                headers: { 
                    'x-auth-token': token,
                    'Content-Type': 'multipart/form-data' // สำคัญมาก!
                }
            });
            setMessage({ type: 'success', text: '✅ บันทึกข้อมูลเรียบร้อยแล้ว!' });
            
            // รีเฟรชหน้านี้ใหม่เพื่อให้เห็นรูปใหม่
            setTimeout(() => window.location.reload(), 1500);

        } catch (err) {
            console.error(err);
            setMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการบันทึก' });
        }
    };

    if (loading) return <Container className="mt-5"><p>กำลังโหลด...</p></Container>;

    // ✅ แก้ไข: เปลี่ยน Link Placeholder เป็น placehold.co (เสถียรกว่า)
    const displayImage = currentImage || "https://placehold.co/150?text=User";

    return (
        <Container className="my-5">
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card className="shadow-sm border-0">
                        <Card.Header className="bg-primary text-white">
                            <h4 className="mb-0">👤 แก้ไขโปรไฟล์ส่วนตัว</h4>
                        </Card.Header>
                        <Card.Body className="p-4">
                            
                            {message && <Alert variant={message.type}>{message.text}</Alert>}

                            <div className="text-center mb-4">
                                {formData.role === 'Psychologist' ? (
                                    <Image 
                                        src={displayImage} 
                                        roundedCircle 
                                        style={{ width: '120px', height: '120px', objectFit: 'cover', border: '3px solid #eee' }} 
                                    />
                                ) : (
                                    <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center" style={{width: '100px', height: '100px'}}>
                                        <span className="h1 mb-0">🎓</span>
                                    </div>
                                )}
                                
                                <h3 className="mt-2">{formData.fullname}</h3>
                                <div className="text-muted small">{formData.email}</div>
                                <div className="badge bg-info text-dark mt-1">{formData.role}</div>
                            </div>

                            <Form onSubmit={handleSubmit}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>ชื่อ-นามสกุล</Form.Label>
                                            {/* ✅ แก้ไข: เพิ่ม || '' เพื่อกันค่า null */}
                                            <Form.Control type="text" name="fullname" value={formData.fullname || ''} onChange={handleChange} required />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>เบอร์โทรศัพท์</Form.Label>
                                            {/* ✅ แก้ไข: เพิ่ม || '' เพื่อกันค่า null */}
                                            <Form.Control type="text" name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="08x-xxx-xxxx" />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>เพศ</Form.Label>
                                            {/* ✅ แก้ไข: เพิ่ม || '' เพื่อกันค่า null */}
                                            <Form.Select name="gender" value={formData.gender || ''} onChange={handleChange}>
                                                <option value="">-- ระบุ --</option>
                                                <option value="Male">ชาย</option>
                                                <option value="Female">หญิง</option>
                                                <option value="LGBTQ+">LGBTQ+</option>
                                                <option value="Other">ไม่ระบุ</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    
                                    {/* ✅ แสดงปุ่มอัปโหลดรูปเฉพาะ 'Psychologist' */}
                                    {formData.role === 'Psychologist' && (
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>รูปโปรไฟล์ (อัปโหลดไฟล์)</Form.Label>
                                                <Form.Control 
                                                    type="file" 
                                                    name="profile_image" 
                                                    onChange={handleFileChange} 
                                                    accept="image/*"
                                                />
                                                <Form.Text className="text-muted">
                                                    *เฉพาะนักจิตวิทยา (รองรับ .jpg, .png)
                                                </Form.Text>
                                            </Form.Group>
                                        </Col>
                                    )}
                                </Row>

                                <Form.Group className="mb-4">
                                    <Form.Label>แนะนำตัว / สิ่งที่อยากบอก (Bio)</Form.Label>
                                    {/* ✅ แก้ไข: เพิ่ม || '' เพื่อกันค่า null */}
                                    <Form.Control as="textarea" rows={3} name="bio" value={formData.bio || ''} onChange={handleChange} placeholder="เขียนแนะนำตัวสั้นๆ หรือสิ่งที่สนใจ..." />
                                </Form.Group>

                                <div className="d-grid gap-2">
                                    <Button variant="success" size="lg" type="submit">
                                        💾 บันทึกการเปลี่ยนแปลง
                                    </Button>
                                    <Button variant="outline-secondary" href={formData.role === 'Student' ? "/student/dashboard" : "/psychologist/dashboard"}>
                                        กลับหน้าหลัก
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Profile;