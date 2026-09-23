import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Container,
    Button,
    Card,
    Row,
    Col,
    Modal
} from 'react-bootstrap';
import {
    useNavigate,
    useLocation
} from 'react-router-dom';

import {
    FaCheckCircle,
    FaAtom,
    FaInfoCircle,
    FaChevronRight,
    FaArrowLeft,
    FaCalendarCheck
} from 'react-icons/fa';

import PCSHSNavbar from '../common/Navbar/PCSHSNavbar';
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
    const location = useLocation();

    // ตรวจสอบว่าผู้ใช้เข้ามาจากหน้าจองคิวหรือไม่
    const isFromBooking =
        location.state?.from === 'booking' ||
        new URLSearchParams(
            location.search
        ).get('from') === 'booking';

    const [answers, setAnswers] = useState(
        new Array(PHQAQuestions.length).fill(null)
    );

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showResultModal, setShowResultModal] =
        useState(false);

    const [progress, setProgress] = useState(0);

    // =========================================================
    // คำนวณ Progress
    // =========================================================
    useEffect(() => {

        const answeredCount =
            answers.filter(
                a => a !== null
            ).length;

        setProgress(
            Math.round(
                (answeredCount /
                    PHQAQuestions.length) *
                    100
            )
        );

    }, [answers]);

    // =========================================================
    // เปลี่ยนคำตอบ
    // =========================================================
    const handleAnswerChange = (
        index,
        value
    ) => {

        const newAnswers = [...answers];

        newAnswers[index] = value;

        setAnswers(newAnswers);
    };

    // =========================================================
    // ส่งแบบประเมิน
    // =========================================================
    const handleSubmit = async () => {

        if (answers.includes(null)) {

            alert(
                "กรุณาตอบคำถามให้ครบทุกข้อครับ"
            );

            return;
        }

        setLoading(true);

        try {

            const token =
                localStorage.getItem('token');

            const res = await axios.post(
                'http://localhost:5000/api/assessments',
                {
                    type: 'PHQ-A',
                    answers
                },
                {
                    headers: {
                        'x-auth-token': token
                    }
                }
            );

            // เก็บผลลัพธ์จาก Backend
            setResult(res.data);

            // เปิด Modal แสดงผล
            setShowResultModal(true);

        } catch (err) {

            console.error(
                "Submission Error:",
                err
            );

            alert(
                "เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง"
            );

        } finally {

            setLoading(false);

        }
    };

    // =========================================================
    // ปุ่มตัวเลือก
    // =========================================================
    const renderOptionBtn = (
        questionIndex,
        score,
        label
    ) => {

        const isSelected =
            answers[questionIndex] === score;

        return (

            <div
                className={`option-btn-new ${
                    isSelected
                        ? 'active'
                        : ''
                }`}
                onClick={() =>
                    handleAnswerChange(
                        questionIndex,
                        score
                    )
                }
            >

                <div className="score-dot">
                    {score}
                </div>

                <div className="label-text">
                    {label}
                </div>

            </div>

        );
    };

    // =========================================================
    // สี Badge ตามผลประเมิน
    // =========================================================
    const getBadgeVariant = (
        resText
    ) => {

        if (!resText) {
            return 'bg-secondary';
        }

        if (
            resText.includes('ปกติ') ||
            resText.includes('ต่ำ')
        ) {
            return 'bg-success';
        }

        if (
            resText.includes('ปานกลาง')
        ) {
            return 'bg-warning text-dark';
        }

        return 'bg-danger';
    };

    return (

        <div className="assessment-page">

            <PCSHSNavbar />

            <div className="science-bg-pattern"></div>

            <Container className="content-container py-5">

                {/* =================================================
                    Back
                ================================================= */}
                <div className="mb-3">

                    <Button
                        variant="link"
                        className="text-decoration-none text-secondary p-0 d-inline-flex align-items-center gap-2 fw-medium"
                        onClick={() =>
                            navigate(-1)
                        }
                    >

                        <FaArrowLeft size={14} />

                        ย้อนกลับ

                    </Button>

                </div>

                {/* =================================================
                    Header
                ================================================= */}
                <div className="header-style-custom mb-4">

                    <div className="d-flex align-items-center gap-2 mb-1">

                        <FaAtom className="atom-icon-orange spin-anim" />

                        <span className="sub-title-orange">
                            PCSHS STUDENT CARE
                        </span>

                    </div>

                    <h1 className="main-title-navy">
                        แบบประเมินสุขภาพใจ (PHQ-A)
                    </h1>

                </div>

                {/* =================================================
                    Progress
                ================================================= */}
                <Card className="progress-card-refined shadow-sm border-0 mb-5">

                    <Card.Body className="p-4 px-md-5">

                        <div className="d-flex justify-content-between align-items-center mb-1">

                            <div className="progress-label-group">

                                <span className="text-uppercase fw-bold text-muted x-small-label">
                                    PROGRESS
                                </span>

                                <div className="d-flex align-items-baseline gap-2">

                                    <h2 className="progress-percent m-0">
                                        {progress}%
                                    </h2>

                                    <span className="text-muted fw-light">
                                        Completed
                                    </span>

                                </div>

                            </div>

                            <div className="question-counter text-muted">

                                {
                                    answers.filter(
                                        a => a !== null
                                    ).length
                                }

                                {' / '}

                                {PHQAQuestions.length}

                                {' Questions'}

                            </div>

                        </div>

                        <div className="progress-bar-container-new">

                            <div
                                className="progress-bar-fill-new"
                                style={{
                                    width: `${progress}%`
                                }}
                            ></div>

                        </div>

                    </Card.Body>

                </Card>

                {/* =================================================
                    Questions
                ================================================= */}
                <div className="questions-stack">

                    {PHQAQuestions.map(
                        (question, index) => (

                            <Card
                                key={index}
                                className={`question-item-card mb-4 ${
                                    answers[index] !== null
                                        ? 'answered'
                                        : ''
                                }`}
                            >

                                <Card.Body className="p-4 p-md-5">

                                    <div className="q-index-tag">
                                        Question {index + 1}
                                    </div>

                                    <h4 className="question-text text-navy mb-4">
                                        {question}
                                    </h4>

                                    <Row className="g-3">

                                        <Col
                                            xs={6}
                                            md={3}
                                        >
                                            {renderOptionBtn(
                                                index,
                                                0,
                                                "ไม่มีเลย"
                                            )}
                                        </Col>

                                        <Col
                                            xs={6}
                                            md={3}
                                        >
                                            {renderOptionBtn(
                                                index,
                                                1,
                                                "มีบางวัน"
                                            )}
                                        </Col>

                                        <Col
                                            xs={6}
                                            md={3}
                                        >
                                            {renderOptionBtn(
                                                index,
                                                2,
                                                "บ่อยครั้ง"
                                            )}
                                        </Col>

                                        <Col
                                            xs={6}
                                            md={3}
                                        >
                                            {renderOptionBtn(
                                                index,
                                                3,
                                                "แทบทุกวัน"
                                            )}
                                        </Col>

                                    </Row>

                                </Card.Body>

                            </Card>

                        )
                    )}

                </div>

                {/* =================================================
                    Submit
                ================================================= */}
                <div className="submit-area text-center mt-5 mb-5">

                    <Button
                        onClick={handleSubmit}
                        className="btn-grad-pcshs"
                        disabled={
                            loading ||
                            answers.includes(null)
                        }
                    >

                        {loading
                            ? 'กำลังประมวลผล...'
                            : 'ส่งแบบประเมินสุขภาพจิต'}

                        <FaChevronRight className="ms-2 small" />

                    </Button>

                    {answers.includes(null) && (

                        <div className="mt-3 text-muted small fade-in">

                            <FaInfoCircle className="me-1" />

                            โปรดตอบคำถามให้ครบทุกข้อเพื่อดูผลลัพธ์

                        </div>

                    )}

                </div>

            </Container>

            {/* =========================================================
                Result Modal
            ========================================================= */}
            <Modal
                show={showResultModal}
                onHide={() => {
                    if (isFromBooking) {
                        navigate('/student/book', {
                            state: {
                                assessmentCompleted: true
                            }
                        });
                    } else {
                        navigate('/student/dashboard');
                    }
                }}
                centered
                backdrop="static"
                className="modal-modern-science"
            >

                <Modal.Body className="text-center p-5">

                    <div className="success-icon-anim mb-4">

                        <FaCheckCircle
                            size={75}
                            color="#28a745"
                        />

                    </div>

                    <h3 className="fw-bold text-navy mb-2">
                        วิเคราะห์ผลสำเร็จแล้ว!
                    </h3>

                    <p className="text-muted mb-4 small">
                        ขอบคุณที่ให้ความสำคัญและดูแลสุขภาพจิตของตนเอง
                    </p>

                    <div
                        className="result-score-container py-4 px-3 mb-4 rounded-4"
                        style={{
                            backgroundColor: '#f8fafc'
                        }}
                    >

                        <div
                            className="small-label-caps text-muted mb-1"
                            style={{
                                fontSize: '0.8rem',
                                letterSpacing: '1px'
                            }}
                        >
                            ผลคะแนนรวม
                        </div>

                        <div className="score-display fw-bold display-5 text-navy mb-2">
                            {result?.score ?? 0}
                        </div>

                        <div
                            className={`status-badge d-inline-block px-3 py-1 rounded-pill fw-semibold ${getBadgeVariant(
                                result?.result
                            )}`}
                        >
                            {result?.result ||
                                'วิเคราะห์ผลเรียบร้อย'}
                        </div>

                    </div>

                    <div className="d-grid gap-2">

                        {/* =================================================
                            ถ้ามาจากหน้าจอง
                            ให้กลับไปหน้าจองพร้อมสถานะว่าประเมินแล้ว
                        ================================================= */}
                        <Button
                            className="py-3 rounded-pill fw-bold border-0 shadow-sm"
                            style={{
                                background:
                                    'linear-gradient(90deg, #f26522 0%, #ff8d59 100%)',
                                color: 'white'
                            }}
                            onClick={() => {

                                if (isFromBooking) {

                                    navigate(
                                        '/student/book',
                                        {
                                            state: {
                                                assessmentCompleted:
                                                    true
                                            }
                                        }
                                    );

                                } else {

                                    navigate(
                                        '/student/book'
                                    );

                                }

                            }}
                        >

                            <FaCalendarCheck className="me-2" />

                            {isFromBooking
                                ? 'ดำเนินการจองคิวนัดหมายต่อ'
                                : 'ไปที่หน้าจองคิวปรึกษา'}

                        </Button>

                        <Button
                            variant="outline-secondary"
                            className="py-2.5 rounded-pill border-0 text-muted"
                            onClick={() =>
                                navigate(
                                    '/student/dashboard'
                                )
                            }
                        >
                            กลับสู่หน้าแดชบอร์ด
                        </Button>

                    </div>

                </Modal.Body>

            </Modal>

        </div>
    );
};

export default AssessmentForm;