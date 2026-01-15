import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Table, Badge, Spinner, Form, InputGroup, Alert } from 'react-bootstrap';
import { FaList, FaSearch, FaUser, FaClock, FaCalendarAlt, FaPhone } from 'react-icons/fa';
import './Psychologist.css'; // ใช้ CSS ธีมเดิม

const AllAppointmentList = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            // ✅ เรียก API เส้นประวัติทั้งหมด (History)
            const res = await axios.get('http://localhost:5000/api/appointments/psychologist-history', {
                headers: { 'x-auth-token': token }
            });
            setAppointments(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching history:", err);
            setLoading(false);
        }
    };

    // ฟังก์ชันช่วยแสดง Badge สีตามสถานะ
    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pending': return <Badge bg="warning" text="dark">รออนุมัติ</Badge>;
            case 'Confirmed': return <Badge bg="success">ยืนยันแล้ว</Badge>;
            case 'Completed': return <Badge bg="primary">เสร็จสิ้น</Badge>;
            case 'Cancelled': return <Badge bg="danger">ยกเลิก</Badge>;
            default: return <Badge bg="secondary">{status}</Badge>;
        }
    };

    // ฟังก์ชันจัดรูปแบบวันที่
    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString('th-TH', {
            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    // ระบบค้นหา (Filter)
    const filteredAppointments = appointments.filter(app => 
        (app.student_name && app.student_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (app.status && app.status.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="fade-in-up">
            <h4 className="pcshs-header-text mb-4">
                <FaList className="me-2" /> ประวัติการนัดหมายทั้งหมด
            </h4>

            <Card className="pcshs-card shadow-sm border-0">
                <Card.Header className="bg-white border-0 py-3 px-4">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div>
                            <h5 className="mb-1 fw-bold text-dark">รายการทั้งหมด</h5>
                            <small className="text-muted">รวมทุกสถานะ (เสร็จสิ้น, ยกเลิก, รออนุมัติ)</small>
                        </div>
                        
                        {/* ช่องค้นหา */}
                        <InputGroup style={{ maxWidth: '300px' }}>
                            <InputGroup.Text className="bg-light border-end-0">
                                <FaSearch className="text-muted" />
                            </InputGroup.Text>
                            <Form.Control 
                                placeholder="ค้นหาชื่อ หรือ สถานะ..." 
                                className="bg-light border-start-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </div>
                </Card.Header>
                
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2 text-muted">กำลังโหลดข้อมูล...</p>
                        </div>
                    ) : filteredAppointments.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="text-muted opacity-25 mb-2" style={{ fontSize: '3rem' }}>📋</div>
                            <p className="text-muted">ไม่พบประวัติการนัดหมาย</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="align-middle mb-0">
                                <thead className="bg-light text-muted small text-uppercase">
                                    <tr>
                                        <th className="ps-4 py-3 border-0">วันที่</th>
                                        <th className="py-3 border-0">เวลา</th>
                                        <th className="py-3 border-0">นักเรียน</th>
                                        <th className="py-3 border-0">ช่องทางติดต่อ</th>
                                        <th className="py-3 border-0 text-center">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAppointments.map((app) => (
                                        <tr key={app.appointment_id}>
                                            <td className="ps-4 fw-semibold text-dark">
                                                <FaCalendarAlt className="me-2 text-muted small" />
                                                {formatDate(app.date)}
                                            </td>
                                            <td className="text-primary fw-bold font-monospace">
                                                <FaClock className="me-2 small" />
                                                {app.time_slot}
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-light rounded-circle p-2 me-2 text-secondary">
                                                        <FaUser size={12} />
                                                    </div>
                                                    <span className="fw-medium">{app.student_name || "ไม่ระบุชื่อ"}</span>
                                                </div>
                                            </td>
                                            <td className="text-muted small">
                                                {app.student_phone && (
                                                    <div className="mb-1"><FaPhone className="me-1"/> {app.student_phone}</div>
                                                )}
                                                <div className="text-truncate" style={{maxWidth: '150px'}}>{app.student_email}</div>
                                            </td>
                                            <td className="text-center">
                                                {getStatusBadge(app.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
                <div className="card-footer bg-white border-0 text-muted small text-end py-3 pe-4">
                    แสดงผล {filteredAppointments.length} รายการ
                </div>
            </Card>
        </div>
    );
};

export default AllAppointmentList;