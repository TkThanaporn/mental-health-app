// client/src/components/student/AssessmentForm.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Button, Card, Row, Col, Navbar, Nav, Modal, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // 1. Import Auth Context
import { jwtDecode } from "jwt-decode"; // 2. Import JWT Decode
import { 
    FaClipboardCheck, FaInfoCircle, FaCheckCircle, 
    FaHome, FaNewspaper, FaHeartbeat, FaCalendarAlt, FaHistory, FaUserCircle, FaSignOutAlt 
} from 'react-icons/fa'; // Import Icon ให้ครบ

import pcshsLogo from '../../assets/pcshs_logo.png'; 

// Import CSS
import './StudentDashboard.css'; 
import './AssessmentForm.css';

const PHQAQuestions = [
    "ทำอะไรไม่เพลิน ไม่สนุก",
    "รู้สึกหดหู่ ซึมเศร้า ท้อแท้ หรือหมดหวัง",
    "นอนไม่หลับ หรือหลับมากเกินไป",
    "รู้สึกเหนื่อยหรือไม่มีแรง",
    "เบื่ออาหารหรือกินมากเกินไป",
    "รู้สึกแย่กับตัวเอง คิดว่าตัวเองล้มเหลว หรือทำให้ครอบครัวผิดหวัง",
    "มีปัญหาในการมีสมาธิในการทำกิจกรรม",
    "เคลื่อนไหวช้ามาก หรือกระสับกระส่ายมาก",
    "คิดว่าถ้าตายไปคงจะดี หรือคิดทำร้ายตนเอง"
];

const AssessmentForm = () => {
    const { logout } = useAuth(); // ดึงฟังก์ชัน Logout
    const navigate = useNavigate();
    
    // State สำหรับฟอร์ม
    const [answers, setAnswers] = useState(new Array(PHQAQuestions.length).fill(null));
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [progress, setProgress] = useState(0);

    // State สำหรับ Navbar (ชื่อผู้ใช้)
    const [currentUserName, setCurrentUserName] = useState("นักเรียน");

    // ดึงชื่อผู้ใช้จาก Token (เหมือนหน้า Dashboard)
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

    // คำนวณ Progress Bar
    useEffect(() => {
        const answeredCount = answers.filter(a => a !== null).length;
        setProgress(Math.round((answeredCount / PHQAQuestions.length) * 100));
    }, [answers]);

    const handleAnswerChange = (index, value) => {
        const newAnswers = [...answers];
        newAnswers[index] = value;
        setAnswers(newAnswers);
    };

    const handleSubmit = async () => {
        if (answers.includes(null)) {
            alert("กรุณาตอบคำถามให้ครบทุกข้อครับ");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                'http://localhost:5000/api/assessments', 
                { type: 'PHQ-A', answers },
                { headers: { 'x-auth-token': token } }
            );
            
            setResult(res.data);
            setShowResultModal(true);
        } catch (err) {
            console.error("Submission Error:", err);
            alert("เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่");
        } finally {
            setLoading(false);
        }
    };

    const renderOptionBtn = (questionIndex, score, label) => {
        const isSelected = answers[questionIndex] === score;
        return (
            <div 
                className={`option-btn ${isSelected ? 'active' : ''}`} 
                onClick={() => handleAnswerChange(questionIndex, score)}
                data-score={score}
            >
                <div className="score-circle">{score}</div>
                <div className="option-label">{label}</div>
            </div>
        );
    };

    return (
        <div className="assessment-wrapper pcshs-dashboard">
            {/* 1. Full Navbar (Same as StudentDashboard) */}
            <Navbar expand="lg" className="pcshs-navbar fixed-top">
                <Container>
                    <Navbar.Brand onClick={() => navigate('/')} style={{cursor:'pointer'}} className="fw-bold d-flex align-items-center">
                        <img src={pcshsLogo} alt="Logo" height="40" className="me-2"/>
                        <div>
                            <span style={{ color: '#0035ad', fontSize: '1.2rem' }}>PCSHS</span> 
                            <span style={{ color: '#f26522', fontSize: '1.2rem' }}>Care</span>
                        </div>
                    </Navbar.Brand>
                    
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ms-auto align-items-center gap-2">
                            <Nav.Link onClick={() => navigate('/')} className="nav-link-custom">
                                <FaHome className="me-1 mb-1"/> หน้าหลัก
                            </Nav.Link>
                            <Nav.Link onClick={() => navigate('/news')} className="nav-link-custom">
                                <FaNewspaper className="me-1 mb-1"/> ข่าวสาร
                            </Nav.Link>
                            {/* Highlight เมนูนี้เป็น Active */}
                            <Nav.Link onClick={() => navigate('/student/assessment')} className="nav-link-custom active">
                                <FaHeartbeat className="me-1 mb-1"/> ประเมินสุขภาพใจ
                            </Nav.Link>
                            <Nav.Link onClick={() => navigate('/student/book')} className="nav-link-custom">
                                <FaCalendarAlt className="me-1 mb-1"/> จองคิว
                            </Nav.Link>
                            <Nav.Link onClick={() => navigate('/student/dashboard')} className="nav-link-custom">
                                <FaHistory className="me-1 mb-1"/> ข้อมูลการนัดหมาย
                            </Nav.Link>
                            
                            <div className="vr mx-2 d-none d-lg-block text-secondary"></div>

                            {/* User Profile Dropdown */}
                            <Dropdown align="end">
                                <Dropdown.Toggle variant="light" className="rounded-pill btn-sm d-flex align-items-center gap-2 border bg-white text-dark py-1 px-3 ms-2">
                                    <FaUserCircle className="text-primary" size={20}/>
                                    <span className="d-none d-lg-inline fw-medium">{currentUserName}</span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="border-0 shadow-lg mt-2 rounded-4">
                                    <Dropdown.Header>จัดการบัญชี</Dropdown.Header>
                                    <Dropdown.Item onClick={() => navigate('/profile')}>โปรไฟล์ส่วนตัว</Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item onClick={logout} className="text-danger">
                                        <FaSignOutAlt className="me-2"/> ออกจากระบบ
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* เพิ่มระยะห่างเพราะ Navbar เป็น fixed-top */}
            <div style={{ marginTop: '100px' }}></div>

            {/* 2. Header & Progress Section */}
            <div className="header-section pb-5 pt-4">
                <Container style={{maxWidth: '800px'}}>
                    <div className="text-center mb-4">
                        <div className="icon-box-header">
                            <FaClipboardCheck />
                        </div>
                        <h2 className="fw-bold mb-2 text-dark">ประเมินสุขภาพใจ (PHQ-A)</h2>
                        <p className="text-muted">
                            โปรดตอบคำถามตามความรู้สึกจริงของน้องในช่วง <span className="text-primary fw-bold">2 สัปดาห์ที่ผ่านมา</span>
                            <br/>ข้อมูลของน้องจะถูกเก็บเป็นความลับ
                        </p>
                    </div>

                    <div className="px-md-5">
                        <div className="d-flex justify-content-between small text-muted mb-2 fw-bold">
                            <span>ความคืบหน้า</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="progress-container">
                            <div className="custom-progress-bar h-100" style={{width: `${progress}%`}}></div>
                        </div>
                    </div>
                </Container>
            </div>

            {/* 3. Questions List */}
            <Container className="py-5" style={{maxWidth: '800px'}}>
                {PHQAQuestions.map((question, index) => (
                    <Card key={index} className={`mb-4 question-card ${answers[index] !== null ? 'answered' : ''}`}>
                        <Card.Body className="p-4">
                            <h5 className="fw-bold text-dark mb-4 d-flex">
                                <span className="me-3 text-secondary opacity-50">{index + 1}.</span>
                                {question}
                            </h5>
                            
                            <Row className="g-2 g-md-3">
                                <Col xs={6} md={3}>{renderOptionBtn(index, 0, "ไม่มีเลย")}</Col>
                                <Col xs={6} md={3}>{renderOptionBtn(index, 1, "มีบางวัน")}</Col>
                                <Col xs={6} md={3}>{renderOptionBtn(index, 2, "บ่อยกว่า 7 วัน")}</Col>
                                <Col xs={6} md={3}>{renderOptionBtn(index, 3, "แทบทุกวัน")}</Col>
                            </Row>
                        </Card.Body>
                    </Card>
                ))}

                <div className="d-grid gap-2 mt-5 mb-5">
                    <Button 
                        onClick={handleSubmit} 
                        className="btn-hero-primary py-3 fs-5 border-0 shadow-lg"
                        disabled={loading || answers.includes(null)}
                        style={{ 
                            background: 'linear-gradient(135deg, #F26522 0%, #FF8F5C 100%)',
                            opacity: answers.includes(null) ? 0.6 : 1 
                        }}
                    >
                        {loading ? 'กำลังประมวลผล...' : 'ส่งแบบประเมิน'}
                    </Button>
                    {answers.includes(null) && (
                        <div className="text-center text-muted small mt-2">
                            <FaInfoCircle className="me-1"/> กรุณาตอบให้ครบทุกข้อเพื่อส่งแบบประเมิน
                        </div>
                    )}
                </div>
            </Container>

            {/* 4. Result Modal */}
            <Modal 
                show={showResultModal} 
                onHide={() => {
                    setShowResultModal(false);
                    navigate('/student/dashboard');
                }}
                centered
                backdrop="static"
                className="modal-custom"
            >
                <Modal.Body className="text-center p-5">
                    <div className="mb-4 text-success">
                        <FaCheckCircle size={80} style={{animation: 'float 3s ease-in-out infinite'}}/>
                    </div>
                    <h3 className="fw-bold mb-3">บันทึกผลเรียบร้อย</h3>
                    <p className="text-muted mb-4">
                        ขอบคุณที่ร่วมประเมินสุขภาพใจ<br/>
                        ผลการประเมินเบื้องต้นของคุณคือ:
                    </p>
                    
                    <div className="bg-light rounded-4 p-4 mb-4 border">
                        <h1 className="display-4 fw-bold text-primary mb-0">{result?.score}</h1>
                        <span className="text-secondary small">คะแนนรวม</span>
                        <div className="mt-3">
                            <span className="badge bg-primary px-3 py-2 rounded-pill fs-6 fw-normal">
                                {result?.result}
                            </span>
                        </div>
                    </div>

                    <Button 
                        variant="outline-primary" 
                        className="rounded-pill px-4 py-2"
                        onClick={() => navigate('/student/dashboard')}
                    >
                        กลับสู่หน้าหลัก
                    </Button>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default AssessmentForm;