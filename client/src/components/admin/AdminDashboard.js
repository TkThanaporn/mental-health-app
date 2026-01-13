// client/src/components/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
    const { logout } = useAuth();
    const [summary, setSummary] = useState({
        total_students: 0,
        pending_assessments: 0,
        confirmed_appointments: 0,
        pending_psychologists: 0 
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAdminSummary();
    }, []);

    const fetchAdminSummary = async () => {
        try {
            const token = localStorage.getItem('token');
            // TODO: สร้าง API Endpoint นี้ใน server/routes/adminRoutes.js
            const res = await axios.get('http://localhost:5000/api/admin/summary', {
                headers: { 'x-auth-token': token }
            });
            setSummary(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Admin Summary Fetch Error:", err);
            setError("ไม่สามารถดึงข้อมูลสรุปภาพรวมระบบได้");
            setLoading(false);
        }
    };

    if (loading) return <Container className="my-5"><p>Loading Admin Dashboard...</p></Container>;
    
    return (
        <Container className="my-5">
            <Row className="justify-content-between align-items-center mb-4">
                <Col>
                    <h1 className="text-success">👑 แดชบอร์ดผู้ดูแลระบบ (P1.3.1.5)</h1>
                </Col>
                <Col xs="auto">
                    <Button variant="danger" onClick={logout}>ออกจากระบบ</Button>
                </Col>
            </Row>

            {error && <Alert variant="danger">{error}</Alert>}

            {/* ส่วนสรุปสถิติภาพรวม (P10) */}
            <Row className="mb-5">
                <Col md={3}>
                    <Card className="shadow-sm border-info">
                        <Card.Body>
                            <h5 className="text-info">นักเรียนทั้งหมด</h5>
                            <h2>{summary.total_students}</h2>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm border-warning">
                        <Card.Body>
                            <h5 className="text-warning">แบบประเมินรอตรวจสอบ</h5>
                            <h2>{summary.pending_assessments}</h2>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm border-success">
                        <Card.Body>
                            <h5 className="text-success">นัดหมายยืนยันแล้ว</h5>
                            <h2>{summary.confirmed_appointments}</h2>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm border-secondary">
                        <Card.Body>
                            <h5 className="text-secondary">นักจิตวิทยาที่รออนุมัติ</h5>
                            <h2>{summary.pending_psychologists}</h2>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* ส่วนเมนูจัดการระบบ */}
            <Row>
                <Col md={4} className="mb-3">
                    <Card>
                        <Card.Body>
                            <Card.Title>👥 จัดการผู้ใช้งาน (P2)</Card.Title>
                            <Card.Text>จัดการข้อมูลนักจิตวิทยาและนักเรียนทั้งหมดในระบบ</Card.Text>
                            {/* TODO: สร้าง Route สำหรับ User Management */}
                            <Link to="/admin/users" className="btn btn-primary">จัดการ (1.3.1.2)</Link>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4} className="mb-3">
                    <Card>
                        <Card.Body>
                            <Card.Title>📰 จัดการเนื้อหา (P7)</Card.Title>
                            <Card.Text>เพิ่ม/ลบ/แก้ไขข่าวสาร กิจกรรม และข้อความให้กำลังใจ (P1.3.1.4)</Card.Text>
                            {/* TODO: สร้าง Route สำหรับ Content Management */}
                            <Link to="/admin/content" className="btn btn-primary">จัดการ (1.3.1.4)</Link>
                        </Card.Body>
                    </Card>
                </Col>
                
                <Col md={4} className="mb-3">
                    <Card>
                        <Card.Body>
                            <Card.Title>📊 รายงานสถิติ (P10)</Card.Title>
                            <Card.Text>สร้างรายงานจำนวนการนัดหมายและสถิติการใช้งาน (P1.3.1.6)</Card.Text>
                            {/* TODO: สร้าง Route สำหรับ Reports */}
                            <Link to="/admin/reports" className="btn btn-primary">สร้างรายงาน (1.3.1.6)</Link>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

// **สำคัญ:** ต้องมี export default เพื่อแก้ไขปัญหา Element type is invalid
export default AdminDashboard;