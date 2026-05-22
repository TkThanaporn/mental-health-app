import React, { useState, useEffect, useMemo } from 'react';
import { Container, Button, Card, Row, Col, Badge, Modal, Spinner, Table, Form } from 'react-bootstrap';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';
import ChatRoom from '../common/ChatRoom'; 
import { 
    FaComments, FaUserMd, FaClock, FaCalendarAlt, FaHistory, 
    FaCheckCircle, FaTimesCircle, FaExclamationCircle, FaListUl, FaAtom,
    FaThLarge, FaBars, FaInfoCircle, FaCheck, FaTimes, FaCircle,
    FaVideo, FaBuilding, FaClipboardList, FaStar, FaUserTimes
} from 'react-icons/fa';

import './StudentAppointments.css';
import PCSHSNavbar from '../common/Navbar/PCSHSNavbar';

const StudentAppointments = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserName, setCurrentUserName] = useState("นักเรียน");
    
    const [showChat, setShowChat] = useState(false);
    const [selectedChatAppt, setSelectedChatAppt] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedApptDetails, setSelectedApptDetails] = useState(null);

    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewData, setReviewData] = useState({ appointment_id: null, rating: 5, comment: '' });

    const [viewMode, setViewMode] = useState('grid'); 
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const userObj = decoded.user || decoded;
                setCurrentUserId(userObj.id || userObj.user_id);
                if(userObj.name) setCurrentUserName(userObj.name);
            } catch (e) { console.error("Token Error", e); }
        }
        fetchMyHistory();
    }, []);

    const fetchMyHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/appointments/my-appointments', {
                headers: { 'x-auth-token': token }
            });
            setAppointments(res.data);
            setLoading(false);
        } catch (err) { console.error(err); setLoading(false); }
    };

    const submitReview = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/appointments/feedback`, reviewData, {
                headers: { 'x-auth-token': token }
            });
            alert("ขอบคุณสำหรับการประเมินครับ! ความคิดเห็นของคุณช่วยให้เราพัฒนาได้ดียิ่งขึ้น");
            setShowReviewModal(false);
            fetchMyHistory(); 
        } catch (err) { alert("เกิดข้อผิดพลาดในการส่งข้อมูล"); }
    };

    const statusCounts = useMemo(() => {
        const counts = { All: appointments.length, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
        appointments.forEach(appt => {
            const s = String(appt.status).toLowerCase();
            if (s === 'no-show') {
                counts['cancelled']++;
            } else if (counts[s] !== undefined) {
                counts[s]++;
            }
        });
        return counts;
    }, [appointments]);

    const filteredAppointments = useMemo(() => {
        if (filterStatus === 'All') return appointments;
        if (filterStatus === 'cancelled') {
            return appointments.filter(appt => ['cancelled', 'no-show'].includes(String(appt.status).toLowerCase()));
        }
        return appointments.filter(appt => String(appt.status).toLowerCase() === filterStatus.toLowerCase());
    }, [filterStatus, appointments]);

    const formatTimeSlot = (start, end, apptTime) => {
        let startTime = start ? start.substring(0, 5) : (apptTime ? String(apptTime).substring(0, 5) : '00:00');
        let endTime = end ? end.substring(0, 5) : '00:00';
        return `${startTime.replace(':', '.')}-${endTime.replace(':', '.')}`;
    };

    const isChatOpen = (appt) => {
        const status = String(appt.status).toLowerCase();
        const type = String(appt.type || appt.meeting_type).toLowerCase();
        
        if (status !== 'confirmed') return false;
        if (type !== 'online' && type !== 'ออนไลน์') return false; 

        try {
            const now = new Date();
            const apptDate = new Date(appt.date || appt.appointment_date);
            const timeStr = appt.start_time || appt.appointment_time || "00:00:00";
            const [hours, minutes] = timeStr.split(':').map(Number);
            apptDate.setHours(hours, minutes, 0, 0);
            return now >= apptDate;
        } catch (error) { return false; }
    };

// ✅ อัปเดตป้ายสถานะ
    const getStatusBadge = (status) => {
        const s = status ? String(status).toLowerCase() : '';
        
        if (s === 'confirmed' || s === 'ยืนยัน' || s === 'ยืนยันแล้ว') 
            return <span style={{ backgroundColor: '#198754' }} className="badge px-3 py-2 rounded-pill fw-normal shadow-sm text-white"><FaCheck className="me-1"/> ยืนยันแล้ว</span>;
        
        if (s === 'cancelled' || s === 'ยกเลิก') 
            return <span style={{ backgroundColor: '#DC3545' }} className="badge px-3 py-2 rounded-pill fw-normal shadow-sm text-white"><FaTimes className="me-1"/> ยกเลิกแล้ว</span>;
        
        // 🛠️ แก้ไขตรงนี้: บังคับพิมพ์คำว่า "รออนุมัติ" ทับลงไปเลย ไม่เอาข้อความจากตัวแปร status มาแสดงแล้ว
        if (s === 'pending' || s === 'รอดำเนินการ' || s === 'รออนุมัติ') 
            return <span style={{ backgroundColor: '#FFC107' }} className="badge px-3 py-2 rounded-pill fw-normal shadow-sm text-dark"><FaClock className="me-1"/> รออนุมัติ</span>;
        
        if (s === 'completed' || s === 'เสร็จสิ้น') 
            return <span style={{ backgroundColor: '#6C757D' }} className="badge px-3 py-2 rounded-pill fw-normal shadow-sm text-white"><FaHistory className="me-1"/> เสร็จสิ้น</span>;
        
        if (s === 'no-show' || s === 'ขาดนัด') 
            return <span style={{ backgroundColor: '#212529' }} className="badge px-3 py-2 rounded-pill fw-normal shadow-sm text-white"><FaUserTimes className="me-1"/> ขาดนัด</span>;
        
        return <span className="badge bg-secondary px-3 py-2 rounded-pill fw-normal shadow-sm"><FaCircle className="me-1"/> {status || 'ไม่ระบุ'}</span>;
    };
    // ✅ อัปเดตสีเส้นขอบการ์ดให้ตรงกัน
    const getStatusColor = (status) => {
        const s = status ? String(status).toLowerCase() : '';
        if (s === 'confirmed' || s === 'ยืนยัน' || s === 'ยืนยันแล้ว') return '#198754';
        if (s === 'cancelled' || s === 'ยกเลิก') return '#DC3545';
        if (s === 'pending' || s === 'รอดำเนินการ' || s === 'รออนุมัติ') return '#FFC107';
        if (s === 'completed' || s === 'เสร็จสิ้น') return '#6C757D';
        if (s === 'no-show' || s === 'ขาดนัด') return '#212529';
        return '#6C757D'; 
    };

    // ✅ ปรับรูปแบบให้เป็นทางการ ไม่มีสีพื้นหลัง
    const getMeetingTypeBadge = (type) => {
        const t = type ? String(type).toLowerCase() : '';
        if(t === 'online' || t === 'ออนไลน์') {
            return <span className="text-dark fw-semibold d-flex align-items-center"><FaVideo className="text-muted me-2"/> ออนไลน์</span>;
        }
        return <span className="text-dark fw-semibold d-flex align-items-center"><FaBuilding className="text-muted me-2"/> พบตัว (On-site)</span>;
    };

    const filterOptions = [
        { key: 'All', label: 'ทั้งหมด', icon: <FaListUl /> },
        { key: 'pending', label: 'รออนุมัติ', icon: <FaExclamationCircle /> },
        { key: 'confirmed', label: 'ยืนยันแล้ว', icon: <FaCheckCircle /> },
        { key: 'completed', label: 'เสร็จสิ้น', icon: <FaHistory /> },
        { key: 'cancelled', label: 'ยกเลิก / ขาดนัด', icon: <FaTimesCircle /> },
    ];

    const openDetails = (appt) => { setSelectedApptDetails(appt); setShowDetails(true); };

    const renderActionButtons = (appt) => {
        const status = String(appt.status).toLowerCase();
        const type = String(appt.type || appt.meeting_type).toLowerCase();
        const chatOpen = isChatOpen(appt);

        if (status === 'completed') {
            if (appt.is_reviewed > 0) {
                return (
                    <Button variant="outline-success" className="flex-grow-1 fw-bold btn-action" disabled>
                        <FaCheckCircle className="me-1 mb-1"/> ประเมินแล้ว
                    </Button>
                );
            } else {
                return (
                    <Button variant="success" className="flex-grow-1 fw-bold btn-action" onClick={() => { setReviewData({...reviewData, appointment_id: appt.appointment_id}); setShowReviewModal(true); }}>
                        <FaStar className="me-1 mb-1"/> ประเมินความพึงพอใจ
                    </Button>
                );
            }
        } else {
            return (
                <>
                    <Button variant="light" className="flex-grow-1 text-primary fw-bold border btn-action" onClick={() => openDetails(appt)}>
                        <FaInfoCircle className="me-1"/> ข้อมูล
                    </Button>

                    {(type === 'online' || type === 'ออนไลน์') ? (
                        <Button variant={chatOpen ? "primary" : "secondary"} className="flex-grow-1 fw-bold btn-action" onClick={() => {setSelectedChatAppt(appt); setShowChat(true);}} disabled={!chatOpen}>
                            <FaComments className="me-1"/> {chatOpen ? 'แชท' : 'ยังไม่ถึงเวลา'}
                        </Button>
                    ) : (
                        <Button variant="secondary" className="flex-grow-1 fw-bold btn-action" disabled>
                            <FaBuilding className="me-1"/> รอพบตามนัด
                        </Button>
                    )}
                </>
            );
        }
    };

    return (
        <div className="pcshs-theme-page">
            <PCSHSNavbar />
            
            <Container className="py-5 position-relative" style={{ marginTop: '80px', minHeight: '80vh', zIndex: 2 }}>
                
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                    <div>
                        <h6 className="text-primary fw-bold letter-spacing-1 text-uppercase mb-1"><FaAtom className="me-2" />PCSHS Student Care</h6>
                        <h2 className="fw-extrabold text-navy m-0">การนัดหมายของฉัน</h2>
                    </div>
                    
                    <div className="d-flex align-items-center gap-2">
                        <div className="view-mode-selector bg-white p-1 rounded-pill border d-flex me-2 shadow-sm">
                            <button className={`btn-view ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><FaThLarge /></button>
                            <button className={`btn-view ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}><FaBars /></button>
                        </div>
                        <Button className="btn-pcshs-primary rounded-pill px-4 shadow-sm fw-bold" onClick={() => navigate('/student/book')}>+ จองคิวปรึกษา</Button>
                    </div>
                </div>

                <div className="filter-wrapper p-2 mb-4 rounded-pill shadow-sm bg-white d-inline-flex flex-wrap gap-2">
                    {filterOptions.map((opt) => (
                        <button key={opt.key} onClick={() => setFilterStatus(opt.key)} className={`filter-tab ${filterStatus.toLowerCase() === opt.key.toLowerCase() ? 'active' : ''}`}>
                            <span className="me-1">{opt.icon}</span>{opt.label}{statusCounts[opt.key.toLowerCase()] > 0 && <span className="count-badge ms-2">{statusCounts[opt.key.toLowerCase()]}</span>}
                        </button>
                    ))}
                </div>
                
                {loading ? (
                    <div className="text-center py-5"><Spinner animation="border" className="text-primary" /></div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="empty-state-card text-center py-5 fade-in-up bg-white rounded-4 shadow-sm border border-light">
                        <FaCalendarAlt size={50} className="text-muted opacity-25 mb-3" />
                        <h5 className="fw-bold text-navy">ไม่พบรายการนัดหมาย</h5>
                        <p className="text-muted mb-4">คุณยังไม่มีการนัดหมายในสถานะนี้</p>
                        <Button variant="outline-primary" className="rounded-pill px-4" onClick={() => navigate('/student/book')}>ไปจองคิวกันเลย!</Button>
                    </div>
                ) : (
                    viewMode === 'grid' ? (
                        <Row className="g-4">
                            {filteredAppointments.map(appt => {
                                const appDate = new Date(appt.date || appt.appointment_date);
                                const timeStr = formatTimeSlot(appt.start_time, appt.end_time, appt.appointment_time);
                                
                                return (
                                    <Col lg={4} md={6} key={appt.appointment_id} className="fade-in-up">
                                        <Card className="pcshs-card h-100 border-0 shadow-sm">
                                            <div className="card-top-accent" style={{ backgroundColor: getStatusColor(appt.status) }}></div>
                                            <Card.Body className="p-4 d-flex flex-column">
                                                <div className="d-flex justify-content-between mb-3 align-items-start">
                                                    <div className="date-badge"><span className="d-day">{appDate.getDate()}</span><span className="d-month">{appDate.toLocaleDateString('th-TH', {month: 'short'})}</span></div>
                                                    <div className="text-end d-flex flex-column gap-2 align-items-end">
                                                        {getStatusBadge(appt.status)}
                                                        <div className="small mt-1">{getMeetingTypeBadge(appt.type || appt.meeting_type)}</div>
                                                    </div>
                                                </div>
                                                <h5 className="fw-bold mb-3 text-navy text-truncate">{appt.topic || 'การปรึกษาทั่วไป'}</h5>
                                                <div className="info-box bg-light p-3 rounded-3 mb-3 flex-grow-1">
                                                    <div className="mb-2 d-flex align-items-center"><FaUserMd className="text-primary me-2"/><span className="fw-semibold text-dark">{appt.psychologist_name || 'รอจัดสรรนักจิตวิทยา'}</span></div>
                                                    <div className="d-flex align-items-center text-muted small"><FaClock className="text-primary me-2"/> เวลา: <strong className="text-dark ms-1">{timeStr} น.</strong></div>
                                                </div>
                                                <div className="mt-auto d-flex gap-2">
                                                    {renderActionButtons(appt)}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>
                    ) : (
                        <div className="table-responsive bg-white rounded-4 shadow-sm fade-in-up p-3">
                            {/* ✅ แก้ไขหัวตารางให้แยก รูปแบบ ออกจาก สถานะ และใช้ text-nowrap เพื่อให้ไม่บีบ */}
                            <Table hover className="m-0 pcshs-modern-table align-middle">
                                <thead>
                                    <tr>
                                        <th className="ps-3 text-nowrap">วันที่ และ เวลา</th>
                                        <th className="text-nowrap">หัวข้อการปรึกษา</th>
                                        <th className="text-nowrap">นักจิตวิทยา</th>
                                        <th className="text-nowrap">รูปแบบ</th>
                                        <th className="text-nowrap">สถานะ</th>
                                        <th className="text-end pe-3 text-nowrap">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAppointments.map(appt => (
                                        <tr key={appt.appointment_id}>
                                            <td className="ps-3 text-nowrap">
                                                <div className="fw-bold text-navy">{new Date(appt.date || appt.appointment_date).toLocaleDateString('th-TH', {day: 'numeric', month: 'short', year: 'numeric'})}</div>
                                                <small className="text-muted"><FaClock className="me-1"/>{formatTimeSlot(appt.start_time, appt.end_time, appt.appointment_time)} น.</small>
                                            </td>
                                            <td className="fw-semibold text-dark text-nowrap">{appt.topic || 'การปรึกษาทั่วไป'}</td>
                                            <td className="text-nowrap">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="bg-light text-primary rounded-circle d-flex align-items-center justify-content-center" style={{width:'30px', height:'30px'}}><FaUserMd/></div>
                                                    <span>{appt.psychologist_name || 'รอดำเนินการ'}</span>
                                                </div>
                                            </td>
                                            {/* ✅ แสดงรูปแบบแบบทางการ */}
                                            <td className="text-nowrap">{getMeetingTypeBadge(appt.type || appt.meeting_type)}</td>
                                            {/* ✅ แสดงสถานะพร้อมสี */}
                                            <td className="text-nowrap">{getStatusBadge(appt.status)}</td>
                                            <td className="text-end pe-3 text-nowrap">
                                                <div className="d-flex gap-2 justify-content-end">{renderActionButtons(appt)}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )
                )}
            </Container>

            {/* Modal ประเมินความพึงพอใจ */}
            <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold text-navy"><FaStar className="me-2 text-warning"/>ประเมินความพึงพอใจ</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center pt-4">
                    <h6 className="text-muted mb-4">การพูดคุยครั้งนี้เป็นอย่างไรบ้าง?</h6>
                    <div className="mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar 
                                key={star} size={45} className="mx-1" 
                                style={{ cursor: 'pointer', color: star <= reviewData.rating ? '#ffc107' : '#e4e5e9', transition: 'color 0.2s' }}
                                onClick={() => setReviewData({...reviewData, rating: star})}
                            />
                        ))}
                    </div>
                    <Form.Group className="text-start">
                        <Form.Label className="fw-bold small text-muted">ความคิดเห็นเพิ่มเติม (ไม่บังคับ)</Form.Label>
                        <Form.Control as="textarea" rows={3} placeholder="บอกเราหน่อยว่าคุณรู้สึกอย่างไร..." value={reviewData.comment} onChange={(e) => setReviewData({...reviewData, comment: e.target.value})} />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0 mt-3">
                    <Button variant="primary" className="w-100 rounded-pill fw-bold shadow-sm" onClick={submitReview}>ส่งผลการประเมิน</Button>
                </Modal.Footer>
            </Modal>

            {/* Details Modal */}
            <Modal show={showDetails} onHide={() => setShowDetails(false)} size="md" centered className="details-modal">
                <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold text-navy"><FaClipboardList className="me-2 text-primary"/>รายละเอียดการนัดหมาย</Modal.Title></Modal.Header>
                <Modal.Body className="pt-3">
                    {selectedApptDetails && (
                        <div className="details-content">
                            <div className="text-center mb-4">
                                <div className="bg-light text-primary rounded-circle mx-auto d-flex align-items-center justify-content-center mb-2" style={{width: '60px', height: '60px', fontSize: '1.5rem'}}><FaUserMd/></div>
                                <h5 className="fw-bold m-0">{selectedApptDetails.psychologist_name || 'รอจัดสรรนักจิตวิทยา'}</h5>
                                <div className="mt-3 d-flex justify-content-center gap-3 align-items-center">
                                    {getMeetingTypeBadge(selectedApptDetails.type || selectedApptDetails.meeting_type)}
                                    {getStatusBadge(selectedApptDetails.status)}
                                </div>
                            </div>
                            <div className="info-box bg-light p-3 rounded-3 mb-3">
                                <Row className="g-3">
                                    <Col xs={6}>
                                        <div className="text-muted small">วันที่นัดหมาย</div>
                                        <div className="fw-bold"><FaCalendarAlt className="me-2 text-primary"/>{new Date(selectedApptDetails.date || selectedApptDetails.appointment_date).toLocaleDateString('th-TH')}</div>
                                    </Col>
                                    <Col xs={6}>
                                        <div className="text-muted small">เวลา</div>
                                        <div className="fw-bold"><FaClock className="me-2 text-primary"/>{formatTimeSlot(selectedApptDetails.start_time, selectedApptDetails.end_time, selectedApptDetails.appointment_time)} น.</div>
                                    </Col>
                                </Row>
                            </div>
                            <div className="info-group mb-3"><div className="text-muted small mb-1">หัวข้อการปรึกษา</div><div className="fw-semibold text-dark p-2 border rounded-3 bg-white">{selectedApptDetails.topic || 'การปรึกษาทั่วไป'}</div></div>
                            {selectedApptDetails.result_summary && (<div className="info-group border-start border-success border-4 ps-3 py-2 bg-white shadow-sm rounded-end mt-3"><div className="text-success small fw-bold mb-1"><FaCheckCircle className="me-1"/> สรุปผลการให้คำปรึกษา</div><div className="fw-semibold text-dark">{selectedApptDetails.result_summary}</div></div>)}
                        </div>
                    )}
                </Modal.Body>
            </Modal>

            {/* Chat Modal */}
            <Modal show={showChat && selectedChatAppt} onHide={() => setShowChat(false)} size="lg" centered className="pcshs-modal">
                <Modal.Header closeButton className="bg-light border-0"><Modal.Title className="d-flex align-items-center gap-3"><div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{width:40, height:40}}><FaUserMd/></div><div><div className="fw-bold text-navy fs-5">{selectedChatAppt?.psychologist_name || 'นักจิตวิทยา'}</div><div className="small text-muted fw-normal">หัวข้อ: {selectedChatAppt?.topic || 'ปรึกษาทั่วไป'}</div></div></Modal.Title></Modal.Header>
                <Modal.Body className="p-0 bg-light" style={{ height: '500px' }}>
                    {selectedChatAppt && currentUserId && (
                        <ChatRoom roomID={`appt-${selectedChatAppt.appointment_id}`} userId={String(currentUserId)} username={currentUserName} otherName={selectedChatAppt.psychologist_name || 'นักจิตวิทยา'} />
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};
export default StudentAppointments;