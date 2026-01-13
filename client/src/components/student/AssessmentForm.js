// client/src/components/student/AssessmentForm.js
import React, { useState } from 'react';
import axios from 'axios';
import { Container, Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

// คำถาม PHQ-A (9 ข้อ)
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
    // กำหนดค่าเริ่มต้นเป็น null เพื่อบังคับให้ตอบทุกข้อ
    const [answers, setAnswers] = useState(new Array(PHQAQuestions.length).fill(null));
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleAnswerChange = (index, value) => {
        const newAnswers = [...answers];
        newAnswers[index] = parseInt(value);
        setAnswers(newAnswers);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (answers.includes(null)) {
            return setError("กรุณาตอบคำถามให้ครบทุกข้อก่อนส่งแบบประเมิน");
        }
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                'http://localhost:5000/api/assessments', 
                { type: 'PHQ-A', answers },
                { headers: { 'x-auth-token': token } } // ส่ง JWT Token เพื่อยืนยันตัวตน
            );
            
            setResult(res.data);
            alert(`แบบประเมินสำเร็จ! คะแนนรวม: ${res.data.score}. ผล: ${res.data.result}`);
            navigate('/student/dashboard'); // นำกลับไปหน้า Dashboard

        } catch (err) {
            console.error("Submission Error:", err.response || err);
            setError("การส่งแบบประเมินล้มเหลว กรุณาตรวจสอบ Server Log.");
        }
    };

    return (
        <Container className="my-5">
            <h2 className="text-center text-primary">📝 แบบประเมินสุขภาพจิตเบื้องต้น (PHQ-A)</h2>
            <p className="text-center text-muted">โปรดตอบคำถามโดยอิงจากอาการที่เกิดขึ้นในช่วง **2 สัปดาห์ที่ผ่านมา**</p>
            
            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
            {result && <Alert variant="success" className="mt-3">คะแนนรวม: **{result.score}**. ผลการประเมิน: **{result.result}**</Alert>}

            <Form onSubmit={handleSubmit} className="mt-4">
                {PHQAQuestions.map((question, index) => (
                    <Card key={index} className="mb-3 shadow-sm">
                        <Card.Body>
                            <Card.Title className="text-dark">{index + 1}. {question}</Card.Title>
                            <hr />
                            <Row className="text-center">
                                {/* 0=ไม่มีเลย, 1=มีบางวัน, 2=มี > 7 วัน, 3=มีแทบทุกวัน */}
                                {[0, 1, 2, 3].map(score => (
                                    <Col key={score} xs={3}>
                                        <Form.Check 
                                            type="radio" 
                                            label={
                                                score === 0 ? '0: ไม่มีเลย' : 
                                                score === 1 ? '1: มีบางวัน' : 
                                                score === 2 ? '2: มี > 7 วัน' : 
                                                '3: มีแทบทุกวัน'
                                            }
                                            name={`q${index}`} 
                                            id={`q${index}-${score}`}
                                            value={score} 
                                            onChange={(e) => handleAnswerChange(index, e.target.value)} 
                                            required
                                        />
                                    </Col>
                                ))}
                            </Row>
                        </Card.Body>
                    </Card>
                ))}
                <Button variant="primary" type="submit" className="w-100 mt-4">ส่งแบบประเมิน (1.3.2.5)</Button>
            </Form>
        </Container>
    );
};

// **สำคัญมาก:** ต้องใช้ Default Export
export default AssessmentForm;