import React, { useState, useEffect } from 'react';
import { Container, Button, Card, Row, Col, Badge } from 'react-bootstrap';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';
import { 
    FaUserMd, FaHeartbeat, FaChevronRight, FaClipboardList,
    FaClipboardCheck, FaCalendarCheck, FaSmile, FaHistory,
    FaBookOpen, FaPhoneAlt, FaBed, FaBrain,
    FaMapMarkerAlt, FaEnvelope, FaFacebookSquare, FaGlobe
} from 'react-icons/fa';

import './StudentDashboard.css';
import pcshsLogo from '../../assets/pcshs_logo.png';

// Import Navbar ตัวกลาง
import PCSHSNavbar from '../common/Navbar/PCSHSNavbar';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [currentUserName, setCurrentUserName] = useState("นักเรียน");

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const userObj = decoded.user || decoded;
                if(userObj.name) setCurrentUserName(userObj.name);
            } catch (e) {
                console.error("Token Error", e);
            }
        }
    }, []);

    return (
        <div className="pcshs-dashboard d-flex flex-column min-vh-100">
            <PCSHSNavbar />

            {/* --- Hero Section --- */}
            <section className="hero-section d-flex align-items-center" style={{ marginTop: '70px' }}>
                <Container>
                    <Row className="align-items-center reverse-column-mobile">
                        <Col lg={7} md={6} className="text-section fade-in-up">
                            <h5 className="fw-bold mb-2 text-secondary letter-spacing-1">ยินดีต้อนรับ, {currentUserName}</h5>
                            <h1 className="display-4 fw-extrabold mb-3 fw-bold " style={{color: 'var(--pcshs-blue)'}}>
                                พื้นที่ปลอดภัย<br/>
                                <span style={{ color: '#f26522' }}>สำหรับใจชาวจุฬาภรณฯ</span>
                            </h1>
                            <p className="lead text-muted mb-4" style={{maxWidth: '90%'}}>
                                เราพร้อมรับฟังและสนับสนุนทางจิตวิทยา เพื่อให้นักเรียนก้าวข้ามทุกความท้าทายในรั้ววิทยาศาสตร์ได้อย่างมีความสุข
                            </p>
                            <div className="d-flex gap-3">
                                <Button onClick={() => navigate('/student/assessment')} className="btn-hero-primary">
                                    <FaHeartbeat className="me-2"/> เริ่มประเมินสุขภาพใจ
                                </Button>
                            </div>
                        </Col>

                        <Col lg={5} md={6} className="text-center mb-4 mb-md-0 fade-in-up delay-100">
                            <img src={pcshsLogo} alt="PCSHS Logo" className="school-logo img-fluid floating-animation" />
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* --- Content Section --- */}
            {/* เพิ่ม flex-grow-1 เพื่อดัน Footer ลงล่างสุดเสมอถ้าเนื้อหาน้อย */}
            <Container className="py-5 content-wrapper position-relative flex-grow-1" style={{ zIndex: 5 }}>
                
                {/* System Overview */}
                <Card className="border-0 shadow-sm rounded-4 mb-5 overflow-hidden overview-card-bg">
                    <Card.Body className="p-4 p-lg-5">
                        <div className="text-center mb-4">
                            <Badge bg="light" text="primary" className="mb-2 px-3 py-2 rounded-pill border">System Overview</Badge>
                            <h3 className="fw-bold text-dark">3 ขั้นตอนง่ายๆ ในการดูแลใจ</h3>
                            <p className="text-muted">ระบบของเราออกแบบมาเพื่อช่วยให้นักเรียนเข้าถึงคำปรึกษาได้อย่างรวดเร็ว</p>
                        </div>
                        <Row className="text-center g-4">
                            <Col md={4} className="position-relative">
                                <div className="step-item">
                                    <div className="step-icon-wrapper bg-soft-orange mx-auto mb-3">
                                        <FaClipboardCheck size={28} />
                                    </div>
                                    <h5 className="fw-bold">1. ประเมินตนเอง</h5>
                                    <p className="text-muted small px-3">
                                        ทำแบบทดสอบจิตวิทยา (PHQ-A) เพื่อเช็คระดับความเครียดและสุขภาพใจเบื้องต้น
                                    </p>
                                </div>
                                <div className="d-none d-md-block step-connector">
                                    <FaChevronRight className="text-muted opacity-25" />
                                </div>
                            </Col>
                            <Col md={4} className="position-relative">
                                <div className="step-item">
                                    <div className="step-icon-wrapper bg-soft-blue mx-auto mb-3">
                                        <FaCalendarCheck size={28} />
                                    </div>
                                    <h5 className="fw-bold">2. จองคิวปรึกษา</h5>
                                    <p className="text-muted small px-3">
                                        เลือกวันและเวลาที่สะดวก เพื่อนัดหมายพูดคุยกับนักจิตวิทยาโรงเรียน
                                    </p>
                                </div>
                                <div className="d-none d-md-block step-connector">
                                    <FaChevronRight className="text-muted opacity-25" />
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="step-item">
                                    <div className="step-icon-wrapper bg-soft-green mx-auto mb-3">
                                        <FaSmile size={28} />
                                    </div>
                                    <h5 className="fw-bold">3. พูดคุยและติดตามผล</h5>
                                    <p className="text-muted small px-3">
                                        รับคำปรึกษาผ่านระบบแชทหรือวิดีโอคอลในพื้นที่ที่ปลอดภัยและเป็นส่วนตัว
                                    </p>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* --- Main Menu Cards --- */}
                <Row className="g-4 mb-5 justify-content-center">
                    <Col md={4}>
                         <Card className="h-100 menu-card rounded-4" onClick={() => navigate('/student/assessment')}>
                            <Card.Body className="p-4 d-flex align-items-center">
                                <div className="icon-box bg-orange-light me-3">
                                    <FaClipboardList />
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-1 text-dark">ประเมินสุขภาพใจ</h5>
                                    <small className="text-muted">ทำแบบทดสอบ PHQ-A</small>
                                </div>
                                <FaChevronRight className="ms-auto text-muted opacity-50"/>
                            </Card.Body>
                        </Card>
                    </Col>
                    
                    <Col md={4}>
                        <Card className="h-100 menu-card rounded-4" onClick={() => navigate('/student/book')}>
                            <Card.Body className="p-4 d-flex align-items-center">
                                <div className="icon-box bg-blue-light me-3">
                                    <FaUserMd />
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-1 text-dark">จองคิวปรึกษา</h5>
                                    <small className="text-muted">นัดหมายกับนักจิตวิทยา</small>
                                </div>
                                <FaChevronRight className="ms-auto text-muted opacity-50"/>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={4}>
                        <Card className="h-100 menu-card rounded-4" onClick={() => navigate('/student/appointments')}>
                            <Card.Body className="p-4 d-flex align-items-center">
                                <div className="icon-box bg-green-light me-3" style={{backgroundColor: '#e6f9f0', color: '#00b074'}}>
                                    <FaHistory />
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-1 text-dark">รายการนัดหมาย</h5>
                                    <small className="text-muted">ดูประวัติและห้องแชท</small>
                                </div>
                                <FaChevronRight className="ms-auto text-muted opacity-50"/>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* --- Self-Care Highlights --- */}
                <div className="mb-5">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="fw-bold m-0 text-dark">
                            <FaBookOpen className="me-2 text-primary"/> 
                            ดูแลใจตัวเองเบื้องต้น
                        </h4>
                        <div 
                            className="text-primary fw-bold" 
                            style={{ cursor: 'pointer', fontSize: '0.9rem' }}
                            onClick={() => navigate('/student/news')}
                        >
                            ดูทั้งหมด <FaChevronRight size={12}/>
                        </div>
                    </div>
                    
                    <Row className="g-4">
                        <Col md={4}>
                            <Card className="border-0 shadow-sm h-100 rounded-4 article-card hover-lift" onClick={() => navigate('/student/news')}>
                                <div className="p-3 pb-0">
                                    <div className="rounded-3 bg-light d-flex align-items-center justify-content-center text-secondary" style={{height: '140px'}}>
                                        <FaBrain size={40} className="opacity-50"/>
                                    </div>
                                </div>
                                <Card.Body>
                                    <Badge bg="info" className="mb-2 text-dark bg-opacity-25">Stress</Badge>
                                    <h5 className="fw-bold mb-2">เทคนิคการจัดการความเครียดก่อนสอบ</h5>
                                    <p className="text-muted small">วิธีง่ายๆ ในการผ่อนคลายสมองเมื่อต้องอ่านหนังสือหนักๆ...</p>
                                    <Button variant="link" className="p-0 text-decoration-none fw-bold small">อ่านต่อ <FaChevronRight size={10}/></Button>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="border-0 shadow-sm h-100 rounded-4 article-card hover-lift" onClick={() => navigate('/student/news')}>
                                <div className="p-3 pb-0">
                                    <div className="rounded-3 bg-light d-flex align-items-center justify-content-center text-secondary" style={{height: '140px'}}>
                                        <FaBed size={40} className="opacity-50"/>
                                    </div>
                                </div>
                                <Card.Body>
                                    <Badge bg="success" className="mb-2 text-dark bg-opacity-25">Sleep</Badge>
                                    <h5 className="fw-bold mb-2">นอนไม่หลับทำอย่างไร?</h5>
                                    <p className="text-muted small">ปรับเปลี่ยนพฤติกรรมเล็กน้อย เพื่อการนอนหลับที่มีคุณภาพมากขึ้น...</p>
                                    <Button variant="link" className="p-0 text-decoration-none fw-bold small">อ่านต่อ <FaChevronRight size={10}/></Button>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="border-0 shadow-sm h-100 rounded-4 article-card hover-lift" onClick={() => navigate('/student/news')}>
                                <div className="p-3 pb-0">
                                    <div className="rounded-3 bg-light d-flex align-items-center justify-content-center text-secondary" style={{height: '140px'}}>
                                        <FaSmile size={40} className="opacity-50"/>
                                    </div>
                                </div>
                                <Card.Body>
                                    <Badge bg="warning" className="mb-2 text-dark bg-opacity-25">Mood</Badge>
                                    <h5 className="fw-bold mb-2">วิธีสร้างพลังบวกในวันที่แย่</h5>
                                    <p className="text-muted small">มองโลกในมุมใหม่ เพื่อใจที่สดใสกว่าเดิม...</p>
                                    <Button variant="link" className="p-0 text-decoration-none fw-bold small">อ่านต่อ <FaChevronRight size={10}/></Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>

                {/* --- Emergency Contact --- */}
                <div className="bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded-4 p-4 d-flex flex-column flex-md-row align-items-center justify-content-between mb-5">
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <div className="bg-danger text-white rounded-circle p-3 me-3">
                            <FaPhoneAlt size={24} />
                        </div>
                        <div>
                            <h5 className="fw-bold text-danger mb-1">ต้องการความช่วยเหลือเร่งด่วน?</h5>
                            <p className="mb-0 text-muted small">หากรู้สึกไม่ไหว หรือต้องการคนคุยด้วยทันที (24 ชม.)</p>
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        <Button variant="danger" className="rounded-pill px-4 fw-bold shadow-sm">
                            โทร 1323 (กรมสุขภาพจิต)
                        </Button>
                    </div>
                </div>

            </Container>

            {/* =========================================
               [NEW] PCSHS FOOTER
               ธีมสีน้ำเงินเข้ม (Brand Color) + ส้ม
               ========================================= */}
            <footer style={{ backgroundColor: '#002d56', color: '#ecf0f1' }} className="pt-5 pb-3 mt-auto">
                <Container>
                    <Row className="g-4 mb-4">
                        <Col md={5}>
                            <div className="d-flex align-items-center mb-3">
                                {/* ใส่ Logo เล็กๆ ขาวดำ หรือ Filter ขาว ตรงนี้ได้ */}
                                <div style={{width: 40, height: 40, backgroundColor: 'white', borderRadius: '50%', padding: 5, marginRight: 10}}>
                                    <img src={pcshsLogo} alt="Logo" style={{width:'100%', height:'100%', objectFit:'contain'}} />
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-0" style={{color: '#fff'}}>PCSHS Care System</h5>
                                    <small style={{color: '#f26522', fontWeight: 'bold'}}>โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย</small>
                                </div>
                            </div>
                            <p className="small opacity-75 pe-md-5">
                                ระบบดูแลช่วยเหลือนักเรียนออนไลน์ มุ่งเน้นการส่งเสริมสุขภาพจิตที่ดี 
                                และสร้างพื้นที่ปลอดภัยสำหรับนักเรียนทุกคน ภายใต้การดูแลของผู้เชี่ยวชาญและคณะครู
                            </p>
                        </Col>
                        
                        <Col md={3}>
                            <h6 className="fw-bold mb-3 text-white border-bottom border-warning d-inline-block pb-1" style={{borderColor: '#f26522 !important'}}>เมนูด่วน</h6>
                            <ul className="list-unstyled small opacity-75">
                                <li className="mb-2"><a href="/student/assessment" className="text-decoration-none text-white hover-orange">ประเมินสุขภาพใจ</a></li>
                                <li className="mb-2"><a href="/student/book" className="text-decoration-none text-white hover-orange">จองคิวปรึกษา</a></li>
                                <li className="mb-2"><a href="/student/news" className="text-decoration-none text-white hover-orange">บทความน่ารู้</a></li>
                                <li className="mb-2"><a href="#" className="text-decoration-none text-white hover-orange">แจ้งเหตุความรุนแรง</a></li>
                            </ul>
                        </Col>

                        <Col md={4}>
                            <h6 className="fw-bold mb-3 text-white border-bottom border-warning d-inline-block pb-1" style={{borderColor: '#f26522 !important'}}>ติดต่อเรา</h6>
                            <ul className="list-unstyled small opacity-75">
                                <li className="mb-3 d-flex">
                                    <FaMapMarkerAlt className="me-2 mt-1 flex-shrink-0" style={{color: '#f26522'}} />
                                    <span>งานแนะแนวและให้คำปรึกษา<br/>โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย</span>
                                </li>
                                <li className="mb-3 d-flex align-items-center">
                                    <FaPhoneAlt className="me-2" style={{color: '#f26522'}} />
                                    <span>0xx-xxx-xxxx (ครูจิตวิทยาของโรงเรียน)</span>
                                </li>
                                <li className="mb-3 d-flex align-items-center">
                                    <FaEnvelope className="me-2" style={{color: '#f26522'}} />
                                    <span>guidance@pcshsloei.ac.th</span>
                                </li>
                            </ul>
                            <div className="d-flex gap-3 mt-3">
                                <a href="#" className="text-white fs-5 hover-orange"><FaFacebookSquare /></a>
                                <a href="#" className="text-white fs-5 hover-orange"><FaGlobe /></a>
                            </div>
                        </Col>
                    </Row>
                    
                    <hr className="opacity-25" />
                    
                    <Row className="align-items-center small opacity-50">
                        <Col md={6} className="text-center text-md-start">
                            &copy; 2024 Princess Chulabhorn Science High Schools. All rights reserved.
                        </Col>
                        <Col md={6} className="text-center text-md-end">
                            <span className="me-3">Privacy Policy</span>
                            <span>Terms of Service</span>
                        </Col>
                    </Row>
                </Container>
            </footer>

        </div>
    );
};

export default StudentDashboard;