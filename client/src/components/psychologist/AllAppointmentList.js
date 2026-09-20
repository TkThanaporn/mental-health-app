import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Spinner, Form, InputGroup, Row, Col, Button, Modal } from 'react-bootstrap';
import { 
    FaSearch, FaClock, FaHistory, FaCheckCircle, FaTimesCircle, 
    FaHourglassHalf, FaMicroscope, FaDatabase, FaFilter, FaUndo, 
    FaUserGraduate, FaFileMedical, FaVideo, FaBuilding, FaCheck,
    FaTimes, FaUserTimes, FaCircle, FaInfoCircle, FaCalendarAlt, FaClipboardList, FaPrint
} from 'react-icons/fa';

import './Psychologist.css';       
import './AllAppointmentList.css'; 
import pcshsLogo from '../../assets/pcshs_logo.png'; // ✅ เพิ่มนำเข้าโลโก้โรงเรียน

const AllAppointmentList = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // --- 🔍 State สำหรับการกรองข้อมูล ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterTime, setFilterTime] = useState('');

    // --- State สำหรับ Modal ดูรายละเอียด ---
    const [showDetails, setShowDetails] = useState(false);
    const [selectedApptDetails, setSelectedApptDetails] = useState(null);

    // --- State โปรไฟล์ เพื่อเอาชื่อมาเซ็นในใบรายงาน ---
    const [psychologistName, setPsychologistName] = useState('นักจิตวิทยา');

    useEffect(() => { 
        fetchHistory(); 
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            if(token) {
                const res = await axios.get('http://localhost:5000/api/profile/me', {
                    headers: { 'x-auth-token': token }
                });
                setPsychologistName(res.data.fullname || 'นักจิตวิทยา');
            }
        } catch(err) { console.error(err); }
    };

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/appointments/psychologist-history', {
                headers: { 'x-auth-token': token }
            });
            setAppointments(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Fetch Error:", err);
            setLoading(false);
        }
    };

    const resetFilters = () => {
        setSearchTerm(''); setFilterDate(''); setFilterYear(''); setFilterTime('');
    };

    const openDetails = (appt) => { 
        setSelectedApptDetails(appt); 
        setShowDetails(true); 
    };

    // --- 🎨 ฟังก์ชันจัดการ UI ---
    const formatTimeSlot = (start, end, apptTime, timeSlotStr) => {
        if (timeSlotStr) return timeSlotStr;
        let startTime = start ? start.substring(0, 5) : (apptTime ? String(apptTime).substring(0, 5) : '00:00');
        let endTime = end ? end.substring(0, 5) : '00:00';
        return `${startTime.replace(':', '.')}-${endTime.replace(':', '.')}`;
    };

    const getStatusText = (status) => {
        const s = status ? String(status).toLowerCase() : '';
        if (s === 'confirmed' || s === 'ยืนยัน') return 'ยืนยันแล้ว';
        if (s === 'cancelled' || s === 'ยกเลิก') return 'ยกเลิกแล้ว';
        if (s === 'pending' || s === 'รอดำเนินการ') return 'รอดำเนินการ';
        if (s === 'completed' || s === 'เสร็จสิ้น') return 'เสร็จสิ้น';
        if (s === 'no-show' || s === 'ขาดนัด') return 'ขาดนัด';
        return status || 'ไม่ระบุ';
    };

    const getStatusBadge = (status) => {
        const s = status ? String(status).toLowerCase() : '';
        if (s === 'confirmed' || s === 'ยืนยัน') return <span className="status-chip chip-conf"><FaCheck className="me-1"/> ยืนยันแล้ว</span>;
        if (s === 'cancelled' || s === 'ยกเลิก') return <span className="status-chip chip-can"><FaTimes className="me-1"/> ยกเลิกแล้ว</span>;
        if (s === 'pending' || s === 'รอดำเนินการ') return <span className="status-chip chip-pen"><FaClock className="me-1"/> รอดำเนินการ</span>;
        if (s === 'completed' || s === 'เสร็จสิ้น') return <span className="status-chip chip-comp"><FaHistory className="me-1"/> เสร็จสิ้น</span>;
        if (s === 'no-show' || s === 'ขาดนัด') return <span className="status-chip chip-dark"><FaUserTimes className="me-1"/> ขาดนัด</span>;
        return <span className="status-chip chip-dark"><FaCircle className="me-1"/> {status || 'ไม่ระบุ'}</span>;
    };

    const getMeetingTypeBadge = (type) => {
        const t = type ? String(type).toLowerCase() : '';
        if(t === 'online' || t === 'ออนไลน์') return <span className="info-pill mt-1"><FaVideo className="me-1 text-primary"/> แชทออนไลน์</span>;
        return <span className="info-pill mt-1"><FaBuilding className="me-1 text-info"/> พบที่ห้องให้คำปรึกษา</span>;
    };

    // --- ⚙️ ประมวลผลข้อมูล (กรอง และ เรียงลำดับ) ---
    let filteredAppointments = appointments.filter(app => {
        const appDate = new Date(app.date || app.appointment_date);
        const appYear = appDate.getFullYear().toString();
        const appDateString = (app.date || app.appointment_date).split('T')[0];
        
        const matchesSearch = !searchTerm || (app.student_name?.toLowerCase().includes(searchTerm.toLowerCase())) || (app.topic?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesDate = !filterDate || appDateString === filterDate;
        const matchesYear = !filterYear || appYear === filterYear;
        const matchesTime = !filterTime || (app.time_slot === filterTime || formatTimeSlot(app.start_time, app.end_time, app.appointment_time) === filterTime);
        
        return matchesSearch && matchesDate && matchesYear && matchesTime;
    });

    const sortedAppointments = [...filteredAppointments].sort((a, b) => {
        const dateA = new Date(`${a.date || a.appointment_date}T${a.start_time || a.appointment_time || "00:00:00"}`);
        const dateB = new Date(`${b.date || b.appointment_date}T${b.start_time || b.appointment_time || "00:00:00"}`);
        return dateB - dateA; 
    });

    const stats = {
        total: filteredAppointments.length,
        completed: filteredAppointments.filter(a => a.status?.toLowerCase() === 'completed').length,
        pending: filteredAppointments.filter(a => ['pending', 'confirmed'].includes(a.status?.toLowerCase())).length,
        cancelled: filteredAppointments.filter(a => ['cancelled', 'no-show'].includes(a.status?.toLowerCase())).length
    };

    const availableYears = [...new Set(appointments.map(app => new Date(app.date || app.appointment_date).getFullYear().toString()))].sort((a,b)=>b-a);
    const timeSlots = ["09:00-10:00", "10:00-11:00", "11:00-12:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00"];

    // ✅ ฟังก์ชันออกรายงาน PDF สำหรับข้อมูลประวัติในตาราง
    const handleExportPDF = () => {
        if (sortedAppointments.length === 0) return alert("ไม่มีข้อมูลสำหรับการสร้างรายงาน");

        const reportWindow = window.open('', '_blank');
        if (!reportWindow) {
            alert('กรุณาอนุญาต pop-up เพื่อเปิดรายงาน');
            return;
        }

        const currentDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
        const logoUrl = window.location.origin + pcshsLogo;

        // ดึงข้อมูลค้นหาเพื่อแสดงบนหัวกระดาษ (ถ้ามีการค้นหา)
        let filterTitleText = 'ประวัติการนัดหมายทั้งหมด';
        if (searchTerm) filterTitleText += ` (คำค้นหา: "${searchTerm}")`;
        if (filterYear) filterTitleText += ` ประจำปีการศึกษา ${parseInt(filterYear) + 543}`;
        if (filterDate) filterTitleText += ` วันที่ ${new Date(filterDate).toLocaleDateString('th-TH')}`;

        const tableRowsHTML = sortedAppointments.map((app, index) => {
            const dateStr = new Date(app.date || app.appointment_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
            const timeStr = formatTimeSlot(app.start_time, app.end_time, app.appointment_time, app.time_slot);
            const statusStr = getStatusText(app.status);
            
            return `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td class="text-center">${dateStr} <br/> <small>${timeStr} น.</small></td>
                    <td><b>${app.student_name || app.fullname}</b></td>
                    <td>${app.topic || '-'}</td>
                    <td class="text-center">${statusStr}</td>
                </tr>
            `;
        }).join('');

        const htmlContent = `
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <title>รายงานประวัติการให้คำปรึกษานักเรียน</title>
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <style>
                @page { size: A4 portrait; margin: 15mm 15mm 15mm 20mm; } 
                body {
                    font-family: 'Sarabun', sans-serif;
                    color: #1e293b;
                    margin: 0;
                    background: #f8fafc;
                    font-size: 14pt; 
                    line-height: 1.4;
                }
                .container { 
                    padding: 15mm 15mm; 
                    max-width: 210mm; 
                    margin: 20px auto; 
                    background: white; 
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                    border-radius: 8px;
                    box-sizing: border-box;
                }
                .report-header {
                    display: flex;
                    align-items: center;
                    border-bottom: 2px solid #e2e8f0;
                    padding-bottom: 15px;
                    margin-bottom: 20px;
                }
                .header-logo { width: 75px; height: auto; margin-right: 20px; }
                .header-text { flex-grow: 1; }
                .doc-title { font-size: 18pt; font-weight: 700; color: #003566; margin: 0 0 4px 0; }
                .doc-subtitle { font-size: 14pt; font-weight: 500; color: #475569; margin: 0; }
                .meta-info {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12pt;
                    color: #475569;
                    background: #f1f5f9;
                    padding: 10px 15px;
                    border-radius: 6px;
                    margin-bottom: 20px;
                    border-left: 4px solid #0ea5e9; 
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12pt; 
                    margin-bottom: 30px;
                }
                th, td {
                    padding: 6px 10px;
                    border: 1px solid #cbd5e1;
                    vertical-align: top;
                }
                th { 
                    font-weight: 600; 
                    text-align: center;
                    background-color: #003566 !important; 
                    color: #ffffff !important;
                    -webkit-print-color-adjust: exact;
                }
                tr:nth-child(even) td {
                    background-color: #f8fafc !important; 
                    -webkit-print-color-adjust: exact;
                }
                .text-center { text-align: center; }
                .signature-section {
                    margin-top: 40px;
                    display: flex;
                    justify-content: flex-end;
                    padding-right: 20px;
                    page-break-inside: avoid;
                }
                .signature-box { text-align: center; font-size: 13pt; color: #1e293b; }
                .sig-line { border-bottom: 1px dashed #94a3b8; width: 220px; margin: 30px auto 10px auto; }
                .print-btn-container { 
                    text-align: center; padding: 15px 0; background: #fff;
                    position: sticky; top: 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 1000;
                }
                .print-btn {
                    background-color: #F25C05; color: white; border: none;
                    padding: 10px 25px; font-size: 15px; border-radius: 6px; cursor: pointer;
                    font-family: 'Prompt', sans-serif; font-weight: bold; transition: 0.2s;
                }
                .print-btn:hover { background-color: #d94f04; }
                @media print {
                    body { background: white; }
                    .container { padding: 0; margin: 0; box-shadow: none; border-radius: 0; max-width: 100%; }
                    .print-btn-container { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="print-btn-container">
                <button class="print-btn" onclick="window.print()">🖨️ สั่งพิมพ์รายงาน (Print to PDF)</button>
            </div>
            <div class="container">
                <div class="report-header">
                    <img src="${logoUrl}" alt="PCSHS Logo" class="header-logo" />
                    <div class="header-text">
                        <h1 class="doc-title">รายงานทะเบียนประวัติการให้คำปรึกษานักเรียน</h1>
                        <h2 class="doc-subtitle">PCSHS HeartCare - โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย</h2>
                    </div>
                </div>

                <div class="meta-info">
                    <span><strong>ข้อมูลที่ค้นหา:</strong> ${filterTitleText}</span>
                    <span><strong>พิมพ์เมื่อ:</strong> ${currentDate}</span>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 5%;">ลำดับ</th>
                            <th style="width: 20%;">วัน-เวลา</th>
                            <th style="width: 25%;">ชื่อนักเรียน</th>
                            <th style="width: 35%;">เรื่อง/หัวข้อที่ปรึกษา</th>
                            <th style="width: 15%;">สถานะ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHTML}
                    </tbody>
                </table>

                <div class="signature-section">
                    <div class="signature-box">
                        <div class="sig-line"></div>
                        <div>( ${psychologistName} )</div>
                        <div style="font-size: 12pt; color: #64748b; margin-top: 4px;">นักจิตวิทยา / ผู้ให้คำปรึกษา</div>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        reportWindow.document.open();
        reportWindow.document.write(htmlContent);
        reportWindow.document.close();
    };

    if (loading) return (
        <div className="loading-science-container text-center py-5" style={{minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
            <Spinner animation="grow" variant="primary" style={{width: '3rem', height: '3rem'}} />
            <div className="loading-text mt-4 fw-bold pcshs-navy fs-5">กำลังประมวลผลฐานข้อมูล...</div>
        </div>
    );

    return (
        <div className="pcshs-archive-container fade-in-up px-3 px-lg-5 py-4">
            {/* Header */}
            <div className="archive-header mb-5 d-flex justify-content-between align-items-end">
                <div className="d-flex align-items-center">
                    <div className="brand-icon-box me-4"><FaMicroscope /></div>
                    <div>
                        <h1 className="fw-800 pcshs-navy m-0 display-6 fw-bold" style={{letterSpacing: '-1px'}}>คลังข้อมูลประวัติการนัดหมาย</h1>
                        <p className="text-muted m-0 mt-2 lead">ศูนย์กลางข้อมูลเพื่อการวิเคราะห์และติดตามการดูแลนักเรียน</p>
                    </div>
                </div>
            </div>

            {/* --- 🎛️ Modern Filter Bar --- */}
            <Card className="glass-panel mb-5 border-0">
                <Card.Header className="filter-header-modern">
                    <FaFilter className="me-2" /> <span>ตัวกรองข้อมูลขั้นสูง</span>
                </Card.Header>
                <Card.Body className="p-4">
                    <Row className="g-4">
                        <Col lg={4} md={6}>
                            <Form.Label className="modern-label">ค้นหา (Search)</Form.Label>
                            <InputGroup className="modern-input-group">
                                <InputGroup.Text><FaSearch/></InputGroup.Text>
                                <Form.Control placeholder="พิมพ์ชื่อนักเรียน หรือ หัวข้อ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                            </InputGroup>
                        </Col>
                        <Col lg={2} md={6}>
                            <Form.Label className="modern-label">วันที่นัดหมาย</Form.Label>
                            <Form.Control type="date" className="modern-date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}/>
                        </Col>
                        <Col lg={2} md={6}>
                            <Form.Label className="modern-label">ปีการศึกษา</Form.Label>
                            <Form.Select className="modern-select" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                                <option value="">ทุกปีทั้งหมด</option>
                                {availableYears.map(year => <option key={year} value={year}>{parseInt(year) + 543}</option>)}
                            </Form.Select>
                        </Col>
                        <Col lg={2} md={6}>
                            <Form.Label className="modern-label">ช่วงเวลา</Form.Label>
                            <Form.Select className="modern-select" value={filterTime} onChange={(e) => setFilterTime(e.target.value)}>
                                <option value="">ทุกช่วงเวลา</option>
                                {timeSlots.map(slot => <option key={slot} value={slot}>{slot} น.</option>)}
                            </Form.Select>
                        </Col>
                        <Col lg={2} md={12} className="d-flex align-items-end">
                            <Button className="btn-reset-modern w-100" onClick={resetFilters}>
                                <FaUndo className="me-2" /> ล้างค่า
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* --- 📊 Premium Stat Cards --- */}
            <Row className="g-4 mb-5">
                {[
                    { label: 'บันทึกทั้งหมด', value: stats.total, icon: <FaDatabase/>, type: 'navy' },
                    { label: 'ดำเนินการสำเร็จ', value: stats.completed, icon: <FaCheckCircle/>, type: 'success' },
                    { label: 'รอพบ / ยืนยันแล้ว', value: stats.pending, icon: <FaHourglassHalf/>, type: 'warning' },
                    { label: 'ยกเลิก / ไม่มา', value: stats.cancelled, icon: <FaTimesCircle/>, type: 'danger' }
                ].map((item, idx) => (
                    <Col key={idx} xl={3} md={6}>
                        <Card className={`premium-stat-card stat-${item.type}`}>
                            <FaDatabase className="stat-bg-icon"/>
                            <div className="stat-content text-center">
                                <div className="stat-top-label text-uppercase">{item.label}</div>
                                <div className="stat-value-huge">{item.value}</div>
                                <span className="stat-unit-pill">รายการ</span>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* --- 📑 Modern Table --- */}
            <div className="glass-panel modern-table-container p-3">
                <div className="table-top-bar-modern d-flex justify-content-between align-items-center mb-3 px-3">
                    <div className="fw-bold pcshs-blue-deep d-flex align-items-center fs-5">
                        <FaHistory className="me-3 text-primary"/> รายการประวัติที่ค้นพบ ({sortedAppointments.length})
                    </div>
                    {/* ✅ ปุ่มกด Export PDF อยู่ตรงนี้ */}
                    <Button 
                        variant="warning" 
                        className="fw-bold text-dark rounded-pill px-4 shadow-sm" 
                        onClick={handleExportPDF}
                        disabled={sortedAppointments.length === 0}
                    >
                        <FaPrint className="me-2"/> ออกรายงานประวัติ (PDF)
                    </Button>
                </div>
                <div className="table-responsive px-2 pb-2 overflow-visible">
                    <table className="pcshs-archive-table w-100">
                        <thead>
                            <tr>
                                <th className="ps-4">วัน-เวลา</th>
                                <th>นักเรียน</th>
                                <th>หัวข้อ / ผลประเมิน</th>
                                <th>สถานะ & ประเภท</th>
                                <th className="text-end pe-4">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAppointments.length > 0 ? (
                                sortedAppointments.map((app) => {
                                    const appDate = new Date(app.date || app.appointment_date);
                                    return (
                                        <tr key={app.appointment_id} className="archive-row-card">
                                            <td className="ps-4">
                                                <div className="date-badge">
                                                    <span className="date-day d-block">{appDate.getDate()}</span>
                                                    <span className="date-month">{appDate.toLocaleDateString('th-TH', { month: 'short' })}</span>
                                                </div>
                                                <div className="time-sub-modern">
                                                    <FaClock className="me-1"/>
                                                    {formatTimeSlot(app.start_time, app.end_time, app.appointment_time, app.time_slot)} น.
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="student-avatar-glow"><FaUserGraduate/></div>
                                                    <div>
                                                        <span className="fw-bold text-dark d-block fs-6">{app.student_name || app.fullname}</span>
                                                        <span className="info-pill mt-1 text-muted">ID: #{String(app.appointment_id).padStart(6, '0')}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-dark fw-semibold text-truncate mb-2" style={{maxWidth: '220px'}}>{app.topic || '-'}</div>
                                                <div className="topic-badge">
                                                    <FaFileMedical className="me-1"/>
                                                    {app.stress_level || app.latest_assessment || 'ไม่มีข้อมูล'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column gap-2 align-items-start">
                                                    {getStatusBadge(app.status)}
                                                    {getMeetingTypeBadge(app.type || app.meeting_type)}
                                                </div>
                                            </td>
                                            <td className="text-end pe-4">
                                                <Button variant="light" className="btn-sm fw-bold border text-muted px-4 py-2 rounded-pill shadow-sm" onClick={() => openDetails(app)} style={{ transition: 'all 0.3s' }}>
                                                    <FaInfoCircle className="me-1"/> ข้อมูล
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-5">
                                        <div className="p-5 d-inline-block">
                                            <FaSearch className="display-4 text-muted mb-3 opacity-50"/>
                                            <h4 className="pcshs-blue-deep">ไม่พบข้อมูลที่ตรงกัน</h4>
                                            <p className="text-muted">ลองปรับเปลี่ยนตัวกรอง หรือกดปุ่มล้างค่าเพื่อเริ่มใหม่</p>
                                            <Button variant="outline-primary" className="rounded-pill px-4 mt-2" onClick={resetFilters}>ล้างตัวกรองทั้งหมด</Button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal ดูรายละเอียด */}
            <Modal show={showDetails} onHide={() => setShowDetails(false)} size="md" centered className="details-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold text-navy"><FaClipboardList className="me-2 text-primary"/>รายละเอียดประวัติ</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3">
                    {selectedApptDetails && (
                        <div className="details-content">
                            <div className="text-center mb-4">
                                <div className="student-avatar-glow mx-auto mb-2" style={{width: '70px', height: '70px', fontSize: '1.8rem'}}><FaUserGraduate/></div>
                                <h5 className="fw-bold m-0">{selectedApptDetails.student_name || selectedApptDetails.fullname}</h5>
                                <div className="mt-3 d-flex justify-content-center gap-2">
                                    {getStatusBadge(selectedApptDetails.status)}
                                </div>
                            </div>
                            
                            <div className="info-box bg-light p-3 rounded-3 mb-3 border">
                                <Row className="g-3">
                                    <Col xs={6}>
                                        <div className="text-muted small">วันที่นัดหมาย</div>
                                        <div className="fw-bold"><FaCalendarAlt className="me-2 text-primary"/>{new Date(selectedApptDetails.date || selectedApptDetails.appointment_date).toLocaleDateString('th-TH')}</div>
                                    </Col>
                                    <Col xs={6}>
                                        <div className="text-muted small">เวลา</div>
                                        <div className="fw-bold"><FaClock className="me-2 text-primary"/>{formatTimeSlot(selectedApptDetails.start_time, selectedApptDetails.end_time, selectedApptDetails.appointment_time, selectedApptDetails.time_slot)} น.</div>
                                    </Col>
                                </Row>
                            </div>
                            
                            <div className="info-group mb-3">
                                <div className="text-muted small mb-1">หัวข้อการปรึกษา</div>
                                <div className="fw-semibold text-dark p-2 border rounded-3 bg-white shadow-sm">{selectedApptDetails.topic || 'ไม่ระบุ'}</div>
                            </div>
                            
                            <div className="info-group border-start border-danger border-4 ps-3 py-2 bg-white shadow-sm rounded-end mb-3">
                                <div className="text-danger small fw-bold mb-1"><FaFileMedical className="me-1"/> ผลประเมินเบื้องต้น</div>
                                <div className="fw-semibold text-dark">{selectedApptDetails.stress_level || selectedApptDetails.latest_assessment || 'ไม่มีข้อมูล'}</div>
                            </div>

                            {selectedApptDetails.status?.toLowerCase() === 'completed' && selectedApptDetails.result_summary && (
                                <div className="info-group border-start border-success border-4 ps-3 py-3 bg-white shadow-sm rounded-end mt-3">
                                    <div className="text-success small fw-bold mb-2"><FaCheckCircle className="me-1"/> สรุปผลการให้คำปรึกษาจากนักจิตวิทยา</div>
                                    <div className="fw-semibold text-dark" style={{whiteSpace: 'pre-line'}}>{selectedApptDetails.result_summary}</div>
                                </div>
                            )}

                            {selectedApptDetails.note && selectedApptDetails.status?.toLowerCase() === 'no-show' && (
                                <div className="info-group border-start border-dark border-4 ps-3 py-2 bg-light shadow-sm rounded-end mt-3">
                                    <div className="text-dark small fw-bold mb-1"><FaUserTimes className="me-1"/> หมายเหตุ (ขาดนัด)</div>
                                    <div className="fw-semibold text-dark">{selectedApptDetails.note}</div>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default AllAppointmentList;