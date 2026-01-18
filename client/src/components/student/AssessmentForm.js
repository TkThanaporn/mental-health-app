import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Button, Card, Row, Col, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
    FaCheckCircle, FaAtom, FaInfoCircle, FaChevronRight, FaArrowLeft 
} from 'react-icons/fa'; 

// Import Navbar ตัวกลาง
import PCSHSNavbar from '../common/Navbar/PCSHSNavbar';

// Import CSS
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
    const navigate = useNavigate();
    
    const [answers, setAnswers] = useState(new Array(PHQAQuestions.length).fill(null));
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [progress, setProgress] = useState(0);

    // คำนวณ Progress Bar เมื่อมีการตอบคำถาม
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
                className={`option-btn-new ${isSelected ? 'active' : ''}`} 
                onClick={() => handleAnswerChange(questionIndex, score)}
            >
                <div className="score-dot">{score}</div>
                <div className="label-text">{label}</div>
            </div>
        );
    };

    return (
        <div className="assessment-page">
            <PCSHSNavbar />
            
            {/* Background Pattern */}
            <div className="science-bg-pattern"></div>

            <Container className="content-container py-5">
                
                {/* Header Style (ตามรูปตัวอย่างที่ 1) */}
                <div className="header-style-custom mb-4">
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <FaAtom className="atom-icon-orange spin-anim" />
                        <span className="sub-title-orange">PCSHS STUDENT CARE</span>
                    </div>
                    <h1 className="main-title-navy">แบบประเมินสุขภาพใจ (PHQ-A)</h1>
                </div>

                {/* Progress Card (ตามรูปตัวอย่างที่ 2) */}
                <Card className="progress-card-refined shadow-sm border-0 mb-5">
                    <Card.Body className="p-4 px-md-5">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <div className="progress-label-group">
                                <span className="text-uppercase fw-bold text-muted x-small-label">PROGRESS</span>
                                <div className="d-flex align-items-baseline gap-2">
                                    <h2 className="progress-percent m-0">{progress}%</h2>
                                    <span className="text-muted fw-light">Completed</span>
                                </div>
                            </div>
                            <div className="question-counter text-muted">
                                {answers.filter(a => a !== null).length} / {PHQAQuestions.length} Questions
                            </div>
                        </div>
                        <div className="progress-bar-container-new">
                            <div className="progress-bar-fill-new" style={{width: `${progress}%`}}></div>
                        </div>
                    </Card.Body>
                </Card>
                {/* Questions List */}
                <div className="questions-stack">
                    {PHQAQuestions.map((question, index) => (
                        <Card key={index} className={`question-item-card mb-4 ${answers[index] !== null ? 'answered' : ''}`}>
                            <Card.Body className="p-4 p-md-5">
                                <div className="q-index-tag">Question {index + 1}</div>
                                <h4 className="question-text text-navy mb-4">{question}</h4>
                                
                                <Row className="g-3">
                                    <Col xs={6} md={3}>{renderOptionBtn(index, 0, "ไม่มีเลย")}</Col>
                                    <Col xs={6} md={3}>{renderOptionBtn(index, 1, "มีบางวัน")}</Col>
                                    <Col xs={6} md={3}>{renderOptionBtn(index, 2, "บ่อยครั้ง")}</Col>
                                    <Col xs={6} md={3}>{renderOptionBtn(index, 3, "แทบทุกวัน")}</Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    ))}
                </div>

                {/* Submit Section */}
                <div className="submit-area text-center mt-5 mb-5">
                    <Button 
                        onClick={handleSubmit} 
                        className="btn-grad-pcshs"
                        disabled={loading || answers.includes(null)}
                    >
                        {loading ? 'กำลังประมวลผล...' : 'ส่งแบบประเมินสุขภาพจิต'}
                        <FaChevronRight className="ms-2 small" />
                    </Button>
                    {answers.includes(null) && (
                        <div className="mt-3 text-muted small fade-in">
                            <FaInfoCircle className="me-1"/> โปรดตอบคำถามให้ครบทุกข้อเพื่อดูผลลัพธ์
                        </div>
                    )}
                </div>
            </Container>

            {/* Result Modal - สไตล์ Modern */}
            <Modal 
                show={showResultModal} 
                onHide={() => navigate('/student/dashboard')}
                centered
                backdrop="static"
                className="modal-modern-science"
            >
                <Modal.Body className="text-center p-5">
                    <div className="success-icon-anim mb-4">
                        <FaCheckCircle size={80} color="#28a745" />
                    </div>
                    <h2 className="fw-bold text-navy mb-2">วิเคราะห์ผลสำเร็จ</h2>
                    <p className="text-muted mb-4">ขอบคุณที่ให้ความสำคัญกับสุขภาพจิตของคุณ</p>
                    
                    <div className="result-score-container py-4 px-3 mb-4">
                        <div className="small-label-caps">ผลคะแนนรวม</div>
                        <div className="score-display">{result?.score}</div>
                        <div className={`status-badge ${result?.result?.includes('ปกติ') ? 'bg-success' : 'bg-orange'}`}>
                            {result?.result}
                        </div>
                    </div>

                    <Button 
                        variant="dark" 
                        className="w-100 py-3 rounded-4 fw-bold"
                        onClick={() => navigate('/student/dashboard')}
                    >
                        กลับสู่หน้าแดชบอร์ด
                    </Button>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default AssessmentForm;