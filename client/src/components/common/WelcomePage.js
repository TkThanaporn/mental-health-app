import React from 'react';
import { Container, Button, Card, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const WelcomePage = () => {
    return (
        <Container className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
            <Card className="text-center shadow-lg p-5" style={{ borderRadius: '15px', maxWidth: '600px', width: '100%' }}>
                <Card.Body>
                    <h1 className="mb-4 text-primary">Mental Health Support</h1>
                    <p className="lead text-muted mb-5">
                        พื้นที่ปลอดภัยสำหรับนักเรียน ปรึกษาปัญหาสุขภาพใจกับนักจิตวิทยา
                        ได้อย่างมั่นใจและเป็นส่วนตัว
                    </p>
                    
                    <Row className="g-3 justify-content-center">
                        <Col sm={6}>
                            <Link to="/login">
                                <Button variant="primary" size="lg" className="w-100 rounded-pill">
                                    เข้าสู่ระบบ
                                </Button>
                            </Link>
                        </Col>
                        <Col sm={6}>
                            <Link to="/register">
                                <Button variant="outline-primary" size="lg" className="w-100 rounded-pill">
                                    ลงทะเบียน
                                </Button>
                            </Link>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
            
            <footer className="mt-5 text-muted">
                <small>© 2024 Mental Health Support System</small>
            </footer>
        </Container>
    );
};

export default WelcomePage; // ✅ สำคัญมาก ต้องมีบรรทัดนี้