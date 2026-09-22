import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Container,
    Form,
    Button,
    Card,
    Alert,
    Row,
    Col,
    Image,
    Badge,
    Modal
} from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    FaCalendarAlt,
    FaClock,
    FaVideo,
    FaUserFriends,
    FaCommentDots,
    FaMapMarkerAlt,
    FaEnvelope,
    FaAtom,
    FaChevronRight,
    FaInfoCircle,
    FaClipboardList
} from 'react-icons/fa';

import PCSHSNavbar from '../common/Navbar/PCSHSNavbar';
import './AppointmentBooking.css';

const AppointmentBooking = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [psycho, setPsycho] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [dailySlots, setDailySlots] = useState([]);
    const [selectedScheduleId, setSelectedScheduleId] = useState(null);

    const [formData, setFormData] = useState({
        date: '',
        time: '',
        type: 'Online',
        topic: '',
        consultation_type: 'Individual'
    });

    const [message, setMessage] = useState(null);
    const [groupMembers, setGroupMembers] = useState(['']);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showAssessmentModal, setShowAssessmentModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // =========================================================
    // ตรวจสอบว่าผู้ใช้ทำแบบประเมินวันนี้แล้วหรือยัง
    // =========================================================
    useEffect(() => {
        const checkPrerequisite = async () => {
            try {
                const token = localStorage.getItem('token');

                if (!token) return;

                // ถ้าเพิ่งกลับมาจากหน้าแบบประเมิน
                // ให้ถือว่าผ่านขั้นตอนการประเมินแล้ว
                if (location.state?.assessmentCompleted) {
                    setShowAssessmentModal(false);
                    return;
                }

                const res = await axios.get(
                    'http://localhost:5000/api/assessments/latest',
                    {
                        headers: {
                            'x-auth-token': token
                        }
                    }
                );

                // ใช้วันที่ตามเวลาท้องถิ่น
                const todayStr = new Date().toLocaleDateString('en-CA');

                const lastAssessmentDate = res.data?.createdAt
                    ? new Date(res.data.createdAt).toLocaleDateString('en-CA')
                    : null;

                // ถ้ายังไม่มีผลประเมิน หรือผลประเมินไม่ใช่ของวันนี้
                if (!res.data || lastAssessmentDate !== todayStr) {
                    setShowAssessmentModal(true);
                } else {
                    setShowAssessmentModal(false);
                }

            } catch (err) {
                console.error(
                    'Error checking assessment status:',
                    err
                );

                // กรณีตรวจสอบไม่ได้ ให้แจ้งเตือน
                setMessage({
                    type: 'danger',
                    text: 'ไม่สามารถตรวจสอบสถานะแบบประเมินได้'
                });
            }
        };

        checkPrerequisite();
    }, [location.state]);

    // =========================================================
    // โหลดข้อมูลนักจิตวิทยาและตารางเวลา
    // =========================================================
    useEffect(() => {
        fetchPsychologistAndSchedule();
    }, []);

    // =========================================================
    // เมื่อเลือกวันที่ ให้แสดงช่วงเวลาของวันนั้น
    // =========================================================
    useEffect(() => {
        if (formData.date && availableSlots.length > 0) {
            const slotsForDate = availableSlots.filter(
                slot => slot.date === formData.date
            );

            setDailySlots(slotsForDate);

            // เปลี่ยนวันแล้วให้ล้างเวลาที่เลือก
            setFormData(prev => ({
                ...prev,
                time: ''
            }));

            setSelectedScheduleId(null);
        } else {
            setDailySlots([]);
        }
    }, [formData.date, availableSlots]);

    // =========================================================
    // ดึงข้อมูลนักจิตวิทยาและตารางเวลา
    // =========================================================
    const fetchPsychologistAndSchedule = async () => {
        try {
            const token = localStorage.getItem('token');

            const resPsycho = await axios.get(
                'http://localhost:5000/api/psychologists/available',
                {
                    headers: {
                        'x-auth-token': token
                    }
                }
            );

            if (resPsycho.data.length > 0) {
                const selectedPsycho = resPsycho.data[0];

                setPsycho(selectedPsycho);

                const resSchedule = await axios.get(
                    `http://localhost:5000/api/schedule/psychologist/${selectedPsycho.user_id}`
                );

                setAvailableSlots(resSchedule.data);
            }

        } catch (err) {
            console.error(err);

            setMessage({
                type: 'danger',
                text: 'ไม่สามารถดึงข้อมูลได้'
            });
        }
    };

    // =========================================================
    // เปลี่ยนข้อมูลในฟอร์ม
    // =========================================================
    const handleFormChange = (e) => {
        const {
            name,
            value
        } = e.target;

        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: value
            };

            // ถ้าเปลี่ยนเป็นรายบุคคล
            // ให้ล้างสมาชิกกลุ่ม
            if (
                name === 'consultation_type' &&
                value === 'Individual'
            ) {
                setGroupMembers(['']);
            }

            // กลุ่มบังคับเป็น Onsite
            if (
                name === 'consultation_type' &&
                value === 'Group'
            ) {
                newData.type = 'Onsite';
            }

            return newData;
        });
    };

    // =========================================================
    // เปลี่ยนอีเมลสมาชิกกลุ่ม
    // =========================================================
    const handleGroupMemberChange = (index, value) => {
        const newMembers = [...groupMembers];

        newMembers[index] = value;

        setGroupMembers(newMembers);
    };

    // =========================================================
    // ตรวจสอบข้อมูลก่อนเปิด Modal ยืนยัน
    // =========================================================
    const handlePreSubmit = (e) => {
        e.preventDefault();

        if (!selectedScheduleId) {
            setMessage({
                type: 'danger',
                text: 'กรุณาเลือกช่วงเวลาที่ต้องการ'
            });

            return;
        }

        if (formData.consultation_type === 'Group') {
            const validMembers = groupMembers.filter(
                m => m.trim() !== ''
            );

            if (validMembers.length === 0) {
                setMessage({
                    type: 'danger',
                    text: 'กรุณาระบุอีเมลเพื่อนร่วมกลุ่มอย่างน้อย 1 คน'
                });

                return;
            }
        }

        setMessage(null);
        setShowConfirmModal(true);
    };

    // =========================================================
    // ยืนยันการจอง
    // =========================================================
    const confirmBooking = async () => {
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('token');

            const dataToSend = {
                schedule_id: selectedScheduleId,
                psychologist_id: psycho.user_id,
                note: formData.topic,
                type: formData.type,
                consultation_type: formData.consultation_type,
                group_members:
                    formData.consultation_type === 'Group'
                        ? groupMembers.filter(
                              m => m.trim() !== ''
                          )
                        : []
            };

            await axios.post(
                'http://localhost:5000/api/appointments',
                dataToSend,
                {
                    headers: {
                        'x-auth-token': token
                    }
                }
            );

            setMessage({
                type: 'success',
                text: 'จองสำเร็จ!'
            });

            setShowConfirmModal(false);

            // ล้าง state ที่ส่งกลับมาจากหน้า Assessment
            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );

        } catch (err) {
            console.error(err);

            setMessage({
                type: 'danger',
                text:
                    err.response?.data?.msg ||
                    'การจองล้มเหลว'
            });

            setShowConfirmModal(false);

        } finally {
            setIsSubmitting(false);
        }
    };

    // =========================================================
    // Loading
    // =========================================================
    if (!psycho) {
        return (
            <div className="loader-container">
                <div className="spinner-science"></div>
            </div>
        );
    }

    return (
        <div className="booking-wrapper">

            <PCSHSNavbar />

            <div className="science-bg-grid"></div>

            <Container className="content-area py-5">

                {/* Header */}
                <div className="header-style-custom mb-5">

                    <div className="d-flex align-items-center gap-2 mb-1">

                        <FaAtom className="text-orange atom-icon-spin" />

                        <span className="text-orange fw-bold letter-spacing-2 small-title">
                            PCSHS STUDENT CARE
                        </span>

                    </div>

                    <h1 className="fw-extrabold text-navy main-title-text">
                        การนัดหมายปรึกษา
                    </h1>

                    <div className="title-underline"></div>

                </div>

                {/* Error Message */}
                {message && message.type === 'danger' && (
                    <Alert
                        variant="danger"
                        className="border-0 shadow-sm rounded-4 mb-4"
                    >
                        <FaInfoCircle className="me-2" />
                        {message.text}
                    </Alert>
                )}

                {/* Success */}
                {message && message.type === 'success' ? (

                    <Card className="success-finish-card border-0 shadow-lg text-center p-5 fade-in-up">

                        <div className="success-icon-wrapper mb-4">
                            🎉
                        </div>

                        <h2 className="fw-bold text-navy mb-3">
                            จองคิวสำเร็จแล้ว!
                        </h2>

                        <p className="text-muted mb-4">
                            นักจิตวิทยาได้รับคำขอของคุณแล้ว
                        </p>

                        <div className="d-flex justify-content-center gap-3">

                            <Button
                                className="btn-pcshs-navy rounded-pill px-4"
                                onClick={() =>
                                    navigate('/student/appointments')
                                }
                                style={{
                                    background: 'var(--navy)',
                                    color: 'white',
                                    border: 'none'
                                }}
                            >
                                ดูนัดหมายของฉัน
                            </Button>

                        </div>

                    </Card>

                ) : (

                    <Row className="g-4">

                        {/* =================================================
                            Psychologist
                        ================================================= */}
                        <Col lg={4}>

                            <Card
                                className="profile-glass-card border-0 shadow-sm sticky-top"
                                style={{ top: '100px' }}
                            >

                                <div className="card-top-accent-orange"></div>

                                <Card.Body className="p-4 text-center">

                                    <div className="avatar-container mb-3">

                                        <Image
                                            src={
                                                psycho.profile_image ||
                                                "https://placehold.co/200?text=Psycho"
                                            }
                                            roundedCircle
                                            className="profile-img-lg"
                                        />

                                    </div>

                                    <h4 className="fw-bold text-navy mb-1">
                                        {psycho.fullname}
                                    </h4>

                                    <Badge
                                        bg="light"
                                        text="dark"
                                        className="border rounded-pill px-3 py-2 fw-normal mb-4"
                                    >
                                        นักจิตวิทยาประจำศูนย์
                                    </Badge>

                                    <div className="contact-minimal text-start">

                                        <div className="contact-row">

                                            <FaMapMarkerAlt className="text-orange" />

                                            <span>
                                                ห้องแนะแนว อาคาร 1
                                            </span>

                                        </div>

                                        {psycho.email && (

                                            <div className="contact-row">

                                                <FaEnvelope className="text-orange" />

                                                <span className="text-truncate">
                                                    {psycho.email}
                                                </span>

                                            </div>

                                        )}

                                    </div>

                                </Card.Body>

                            </Card>

                        </Col>

                        {/* =================================================
                            Booking Form
                        ================================================= */}
                        <Col lg={8}>

                            <Card className="booking-form-card border-0 shadow-sm p-4">

                                <Form onSubmit={handlePreSubmit}>

                                    {/* STEP 1 */}
                                    <section className="form-step mb-5">

                                        <div className="d-flex align-items-center gap-3 mb-4">

                                            <div className="step-badge">
                                                1
                                            </div>

                                            <h5 className="fw-bold m-0 text-navy">
                                                ระบุวันและเลือกเวลา
                                            </h5>

                                        </div>

                                        <Row className="g-3">

                                            <Col md={6}>

                                                <Form.Group>

                                                    <Form.Label className="small-label">
                                                        วันที่สะดวก
                                                    </Form.Label>

                                                    <div className="input-group-custom">

                                                        <FaCalendarAlt className="input-icon-left" />

                                                        <Form.Control
                                                            type="date"
                                                            name="date"
                                                            className="custom-input-field"
                                                            value={formData.date}
                                                            onChange={handleFormChange}
                                                            min={
                                                                new Date()
                                                                    .toLocaleDateString(
                                                                        'en-CA'
                                                                    )
                                                            }
                                                            required
                                                        />

                                                    </div>

                                                </Form.Group>

                                            </Col>

                                        </Row>

                                        <div className="mt-4">

                                            <Form.Label className="small-label mb-3">
                                                ช่วงเวลาที่เปิดรับนัด
                                            </Form.Label>

                                            {!formData.date ? (

                                                <div className="placeholder-time-grid">
                                                    กรุณาเลือกวันที่เพื่อตรวจสอบคิวว่าง
                                                </div>

                                            ) : dailySlots.length === 0 ? (

                                                <Alert
                                                    variant="warning"
                                                    className="rounded-4 border-0"
                                                >

                                                    <FaInfoCircle className="me-2" />

                                                    ไม่มีคิวว่างในวันที่{' '}
                                                    {new Date(
                                                        formData.date
                                                    ).toLocaleDateString(
                                                        'th-TH',
                                                        {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        }
                                                    )}

                                                </Alert>

                                            ) : (

                                                <div className="time-chips-container">

                                                    {dailySlots.map(slot => (

                                                        <button
                                                            type="button"
                                                            key={slot.schedule_id}
                                                            className={`time-chip-btn ${
                                                                selectedScheduleId ===
                                                                slot.schedule_id
                                                                    ? 'active'
                                                                    : ''
                                                            }`}
                                                            onClick={() => {

                                                                setFormData({
                                                                    ...formData,
                                                                    time: slot.time_slot
                                                                });

                                                                setSelectedScheduleId(
                                                                    slot.schedule_id
                                                                );

                                                            }}
                                                        >
                                                            {slot.time_slot}
                                                        </button>

                                                    ))}

                                                </div>

                                            )}

                                        </div>

                                    </section>

                                    {/* STEP 2 */}
                                    <section className="form-step mb-4">

                                        <div className="d-flex align-items-center gap-3 mb-4">

                                            <div className="step-badge">
                                                2
                                            </div>

                                            <h5 className="fw-bold m-0 text-navy">
                                                ข้อมูลการปรึกษา
                                            </h5>

                                        </div>

                                        <Row className="g-3 mb-4">

                                            <Col md={6}>

                                                <Form.Group>

                                                    <Form.Label className="small-label">
                                                        ประเภท
                                                    </Form.Label>

                                                    <Form.Select
                                                        className="custom-input-field"
                                                        name="consultation_type"
                                                        value={
                                                            formData.consultation_type
                                                        }
                                                        onChange={
                                                            handleFormChange
                                                        }
                                                    >

                                                        <option value="Individual">
                                                            รายบุคคล
                                                        </option>

                                                        <option value="Group">
                                                            กลุ่ม (เพื่อน)
                                                        </option>

                                                    </Form.Select>

                                                </Form.Group>

                                            </Col>

                                            <Col md={6}>

                                                <Form.Group>

                                                    <Form.Label className="small-label">
                                                        รูปแบบ
                                                    </Form.Label>

                                                    <Form.Select
                                                        className="custom-input-field"
                                                        name="type"
                                                        value={formData.type}
                                                        onChange={
                                                            handleFormChange
                                                        }
                                                        disabled={
                                                            formData.consultation_type ===
                                                            'Group'
                                                        }
                                                    >

                                                        {formData.consultation_type !==
                                                            'Group' && (
                                                            <option value="Online">
                                                                ออนไลน์ (Chat/Video)
                                                            </option>
                                                        )}

                                                        <option value="Onsite">
                                                            พบตัวจริง (ห้องแนะแนว)
                                                        </option>

                                                    </Form.Select>

                                                </Form.Group>

                                            </Col>

                                        </Row>

                                        {/* Group */}
                                        {formData.consultation_type ===
                                            'Group' && (

                                            <div
                                                className="group-members-box p-3 rounded-4 mb-4"
                                                style={{
                                                    backgroundColor:
                                                        'var(--light-bg)'
                                                }}
                                            >

                                                <Form.Label className="small fw-bold mb-2">
                                                    อีเมลเพื่อนร่วมกลุ่ม
                                                </Form.Label>

                                                {groupMembers.map(
                                                    (member, index) => (

                                                        <div
                                                            key={index}
                                                            className="d-flex gap-2 mb-2"
                                                        >

                                                            <Form.Control
                                                                type="email"
                                                                className="custom-input-field"
                                                                placeholder="student@pcshs.ac.th"
                                                                value={member}
                                                                onChange={e =>
                                                                    handleGroupMemberChange(
                                                                        index,
                                                                        e.target.value
                                                                    )
                                                                }
                                                                required={
                                                                    index === 0
                                                                }
                                                            />

                                                            {groupMembers.length >
                                                                1 && (

                                                                <Button
                                                                    variant="outline-danger"
                                                                    className="rounded-3"
                                                                    onClick={() =>
                                                                        setGroupMembers(
                                                                            groupMembers.filter(
                                                                                (_, i) =>
                                                                                    i !==
                                                                                    index
                                                                            )
                                                                        )
                                                                    }
                                                                >
                                                                    -
                                                                </Button>

                                                            )}

                                                        </div>

                                                    )
                                                )}

                                                <Button
                                                    variant="link"
                                                    className="text-orange p-0 text-decoration-none small"
                                                    onClick={() =>
                                                        setGroupMembers([
                                                            ...groupMembers,
                                                            ''
                                                        ])
                                                    }
                                                >
                                                    + เพิ่มรายชื่อเพื่อน
                                                </Button>

                                            </div>

                                        )}

                                        {/* Topic */}
                                        <Form.Group className="mb-4">

                                            <Form.Label className="small-label">
                                                หัวข้อที่ต้องการปรึกษา
                                            </Form.Label>

                                            <Form.Select
                                                name="topic"
                                                className="custom-input-field"
                                                value={formData.topic}
                                                onChange={handleFormChange}
                                                required
                                            >

                                                <option
                                                    value=""
                                                    disabled
                                                >
                                                    -- กรุณาเลือกหัวข้อที่ต้องการปรึกษา --
                                                </option>

                                                <option value="ด้านการเรียน / ความเครียดจากการสอบ">
                                                    ด้านการเรียน / ความเครียดจากการสอบ
                                                </option>

                                                <option value="ด้านความสัมพันธ์ / เพื่อน / แฟน">
                                                    ด้านความสัมพันธ์ / เพื่อน / แฟน
                                                </option>

                                                <option value="ด้านครอบครัว / ปัญหาทางบ้าน">
                                                    ด้านครอบครัว / ปัญหาทางบ้าน
                                                </option>

                                                <option value="ด้านอารมณ์ / ซึมเศร้า / วิตกกังวล">
                                                    ด้านอารมณ์ / ซึมเศร้า / วิตกกังวล
                                                </option>

                                                <option value="ด้านการปรับตัว / การใช้ชีวิตในหอพัก">
                                                    ด้านการปรับตัว / การใช้ชีวิตในหอพัก
                                                </option>

                                                <option value="ด้านการค้นหาตัวเอง / อาชีพในอนาคต">
                                                    ด้านการค้นหาตัวเอง / อาชีพในอนาคต
                                                </option>

                                                <option value="อื่นๆ (ต้องการคุยกับนักจิตวิทยาก่อน)">
                                                    อื่นๆ (ยังไม่แน่ใจ / ต้องการประเมินร่วมกัน)
                                                </option>

                                            </Form.Select>

                                        </Form.Group>

                                    </section>

                                    {/* Submit */}
                                    <Button
                                        type="submit"
                                        className="btn-submit-main w-100 py-3 mt-2 shadow-lg"
                                    >
                                        ดำเนินการต่อ
                                        <FaChevronRight className="ms-2 small" />
                                    </Button>

                                </Form>

                            </Card>

                        </Col>

                    </Row>

                )}

            </Container>

            {/* =========================================================
                Assessment Modal
            ========================================================= */}
            <Modal
                show={showAssessmentModal}
                backdrop="static"
                keyboard={false}
                centered
                contentClassName="border-0 rounded-4 shadow-lg"
            >

                <Modal.Body className="text-center p-5 position-relative overflow-hidden bg-white rounded-4">

                    <div
                        style={{
                            position: 'absolute',
                            top: '-40px',
                            left: '-40px',
                            width: '140px',
                            height: '140px',
                            background:
                                'rgba(255, 138, 0, 0.08)',
                            borderRadius: '50%',
                            zIndex: 0
                        }}
                    ></div>

                    <div
                        style={{
                            position: 'absolute',
                            bottom: '-30px',
                            right: '-30px',
                            width: '100px',
                            height: '100px',
                            background:
                                'rgba(29, 42, 68, 0.05)',
                            borderRadius: '50%',
                            zIndex: 0
                        }}
                    ></div>

                    <div
                        className="position-relative"
                        style={{ zIndex: 1 }}
                    >

                        <div
                            className="mx-auto mb-4 d-flex align-items-center justify-content-center"
                            style={{
                                width: '85px',
                                height: '85px',
                                background:
                                    'linear-gradient(135deg, #ff8a00 0%, #ffb347 100%)',
                                borderRadius: '50%',
                                boxShadow:
                                    '0 8px 16px rgba(255, 138, 0, 0.25)'
                            }}
                        >
                            <FaClipboardList
                                size={38}
                                color="white"
                            />
                        </div>

                          <h4 className="fw-bold text-navy mb-3">รบกวนทำแบบประเมินเบื้องต้น 📝</h4>
                            <p className="text-muted mb-4 px-1" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                                เพื่อให้นักจิตวิทยาเข้าใจสภาวะอารมณ์ของคุณในวันนี้<span style={{ whiteSpace: 'nowrap' }}>ได้อย่างดีที่สุด</span>
                                <span className="text-navy fw-semibold d-block mt-2">
                                    กรุณาทำแบบประเมินสุขภาพจิต<span style={{ whiteSpace: 'nowrap' }}>ก่อนทำการจองคิวนะคะ 😊</span>
                                </span>
                            </p>

                        <Button
                            className="w-100 py-3 rounded-pill fw-bold border-0"
                            style={{
                                background:
                                    'linear-gradient(90deg, #1d2a44 0%, #2a3b5c 100%)',
                                color: 'white',
                                boxShadow:
                                    '0 4px 12px rgba(29, 42, 68, 0.2)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={e => {
                                e.target.style.transform =
                                    'translateY(-2px)';

                                e.target.style.boxShadow =
                                    '0 6px 15px rgba(29, 42, 68, 0.3)';
                            }}
                            onMouseOut={e => {
                                e.target.style.transform =
                                    'translateY(0)';

                                e.target.style.boxShadow =
                                    '0 4px 12px rgba(29, 42, 68, 0.2)';
                            }}
                            onClick={() =>
                                navigate('/student/assessment', {
                                    state: {
                                        from: 'booking'
                                    }
                                })
                            }
                        >
                            เริ่มต้นทำแบบประเมิน
                            <FaChevronRight className="ms-2 small" />
                        </Button>

                    </div>

                </Modal.Body>

            </Modal>

            {/* =========================================================
                Confirm Booking Modal
            ========================================================= */}
            <Modal
                show={showConfirmModal}
                onHide={() =>
                    !isSubmitting &&
                    setShowConfirmModal(false)
                }
                centered
                backdrop="static"
            >

                <Modal.Header
                    closeButton={!isSubmitting}
                    className="border-0 pb-0"
                >

                    <Modal.Title className="fw-bold text-navy">
                        ยืนยันข้อมูลการนัดหมาย
                    </Modal.Title>

                </Modal.Header>

                <Modal.Body className="pt-3">

                    <p className="text-muted mb-4 small">
                        กรุณาตรวจสอบรายละเอียดการนัดหมายของคุณก่อนกดยืนยัน
                    </p>

                    <div className="bg-light p-3 rounded-4 mb-3">

                        <Row className="mb-2 align-items-center">

                            <Col
                                xs={4}
                                className="text-secondary fw-bold small"
                            >
                                <FaCalendarAlt className="me-2 text-orange" />
                                วันที่:
                            </Col>

                            <Col xs={8} className="fw-medium">

                                {formData.date
                                    ? new Date(
                                          formData.date
                                      ).toLocaleDateString(
                                          'th-TH',
                                          {
                                              day: 'numeric',
                                              month: 'long',
                                              year: 'numeric'
                                          }
                                      )
                                    : '-'}

                            </Col>

                        </Row>

                        <Row className="mb-2 align-items-center">

                            <Col
                                xs={4}
                                className="text-secondary fw-bold small"
                            >
                                <FaClock className="me-2 text-orange" />
                                เวลา:
                            </Col>

                            <Col xs={8} className="fw-medium">
                                {formData.time}
                            </Col>

                        </Row>

                        <Row className="mb-2 align-items-center">

                            <Col
                                xs={4}
                                className="text-secondary fw-bold small"
                            >

                                {formData.type === 'Online'
                                    ? <FaVideo className="me-2 text-orange" />
                                    : <FaMapMarkerAlt className="me-2 text-orange" />
                                }

                                รูปแบบ:

                            </Col>

                            <Col xs={8} className="fw-medium">

                                {formData.type === 'Online'
                                    ? 'ออนไลน์ (Chat/Video)'
                                    : 'พบตัวจริง (ห้องแนะแนว)'}

                            </Col>

                        </Row>

                        <Row className="mb-2 align-items-center">

                            <Col
                                xs={4}
                                className="text-secondary fw-bold small"
                            >
                                <FaUserFriends className="me-2 text-orange" />
                                ประเภท:
                            </Col>

                            <Col xs={8} className="fw-medium">

                                {formData.consultation_type ===
                                'Individual'
                                    ? 'ปรึกษารายบุคคล'
                                    : 'ปรึกษาแบบกลุ่ม'}

                            </Col>

                        </Row>

                        {formData.consultation_type === 'Group' && (

                            <Row className="mb-2 align-items-start">

                                <Col
                                    xs={4}
                                    className="text-secondary fw-bold small pt-1"
                                >
                                    <FaEnvelope className="me-2 text-orange" />
                                    เพื่อนในกลุ่ม:
                                </Col>

                                <Col
                                    xs={8}
                                    className="fw-medium text-break small"
                                >
                                    {groupMembers
                                        .filter(
                                            m => m.trim() !== ''
                                        )
                                        .join(', ')}
                                </Col>

                            </Row>

                        )}

                        <Row className="align-items-start">

                            <Col
                                xs={4}
                                className="text-secondary fw-bold small pt-1"
                            >
                                <FaCommentDots className="me-2 text-orange" />
                                หัวข้อ:
                            </Col>

                            <Col
                                xs={8}
                                className="fw-medium text-break"
                            >
                                {formData.topic}
                            </Col>

                        </Row>

                    </div>

                </Modal.Body>

                <Modal.Footer className="border-0 pt-0">

                    <Button
                        variant="light"
                        className="rounded-pill px-4"
                        onClick={() =>
                            setShowConfirmModal(false)
                        }
                        disabled={isSubmitting}
                    >
                        แก้ไขข้อมูล
                    </Button>

                    <Button
                        className="rounded-pill px-4 border-0"
                        style={{
                            background: 'var(--orange)',
                            color: 'white'
                        }}
                        onClick={confirmBooking}
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? 'กำลังยืนยันคิว...'
                            : 'ยืนยันการจองคิว'}
                    </Button>

                </Modal.Footer>

            </Modal>

        </div>
    );
};

export default AppointmentBooking;