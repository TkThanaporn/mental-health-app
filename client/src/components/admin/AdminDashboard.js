import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Button, Card, Row, Col, Nav, Navbar, Offcanvas, Badge, Image, Spinner, Form, Dropdown, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
    FaHome, FaSignOutAlt, FaBars, FaUserCircle,
    FaUserGraduate, FaChalkboardTeacher, FaNewspaper, FaChartPie,
    FaUserMd, FaCalendarCheck, FaUserShield, FaFileExcel, FaPrint, FaBell, FaUserPlus,
    FaKey, FaArrowUp, FaExclamationTriangle
} from 'react-icons/fa';
import { FaFilter, FaUsers } from 'react-icons/fa';
import {
    Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import html2canvas from 'html2canvas';

import './AdminDashboard.css'; 

import UserManagement from './UserManagement'; 
import NewsManagement from '../psychologist/NewsManagement'; 
import AdminProfile from './AdminProfile'; 
import pcshsLogo from '../../assets/pcshs_logo.png'; 

const ROLE_COLORS = {
    Student: '#003566',
    Psychologist: '#0ea5e9',
    Admin: '#F25C05'
};

const CHART_COLORS = {
    line: '#F25C05',
    bar: '#003566',
    grade: '#0ea5e9',
    grid: '#e2e8f0'
};

const DASHBOARD_FALLBACK_YEARS = [...new Set([new Date().getFullYear(), 2025])].sort((a, b) => b - a);
const toBuddhistYear = (year) => Number(year) + 543;

// รายชื่อหอพักมาตรฐาน เพื่อบังคับให้แสดงครบทุกหอแม้จะเป็น 0
const ALL_DORMS = [
    "หอสกลนคร (A)", "หอบึงกาฬ (B)", "หออุดรธานี (C)", 
    "หอขอนแก่น (D)", "หอหนองคาย (E)", "หอหนองบัวลำภู (F)"
];

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard'); 
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    
    const [adminProfile, setAdminProfile] = useState({
        fullname: 'Administrator', 
        profile_image: ''
    });

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const [isPromoting, setIsPromoting] = useState(false);
    const [isUndoing, setIsUndoing] = useState(false);

    const [showPromoteModal, setShowPromoteModal] = useState(false);
    const [promoteConfirmText, setPromoteConfirmText] = useState('');

    const [stats, setStats] = useState({
        selectedYear: new Date().getFullYear(),
        availableYears: DASHBOARD_FALLBACK_YEARS,
        total_users: 0,
        total_students: 0,
        total_admins: 0,
        pending_assessments: 0,
        confirmed_appointments: 0,
        yearly_appointments: 0,
        pending_psychologists: 0,
        roleSummary: [],
        monthlyConsultations: [],
        dormitoryUsage: [],
        gradeUsage: []
    });
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [loadingStats, setLoadingStats] = useState(true);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            handleLogout();
            return;
        }
        
        fetchProfile(token);
        fetchStats(token);
        fetchNotifications(token); 
    }, [activeTab, selectedYear]);

    const fetchProfile = async (token) => {
        try {
            const res = await axios.get('http://localhost:5000/api/profile/me', {
                headers: { 'x-auth-token': token }
            });
            setAdminProfile(res.data);
        } catch (err) { 
            console.error("Profile Error", err); 
            if (err.response && err.response.status === 401) handleLogout();
        }
    };

    const fetchStats = async (token) => {
        try {
            setLoadingStats(true);
            const res = await axios.get(`http://localhost:5000/api/admin/summary?year=${selectedYear}`, {
                headers: { 'x-auth-token': token }
            });
            setStats(res.data);
            setLoadingStats(false);
        } catch (err) {
            console.error("Stats Error", err);
            setLoadingStats(false);
            if (err.response && err.response.status === 401) handleLogout();
        }
    };

    const fetchNotifications = async (token) => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/notifications/new-users', {
                headers: { 'x-auth-token': token }
            });

            const localReadIds = JSON.parse(localStorage.getItem('readNotifications')) || [];

            const notificationsData = res.data.map(user => ({
                ...user,
                is_read: localReadIds.includes(user.id)
            }));

            setNotifications(notificationsData);
            setUnreadCount(notificationsData.filter(n => !n.is_read).length);
        } catch (err) { 
            console.error("Notifications Error", err); 
            if (err.response && err.response.status === 401) handleLogout();
        }
    };

    const handleNotificationClick = (notif) => {
        if (notif.is_read) {
            setActiveTab('users');
            return; 
        }

        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        const localReadIds = JSON.parse(localStorage.getItem('readNotifications')) || [];
        if (!localReadIds.includes(notif.id)) {
            localReadIds.push(notif.id);
            localStorage.setItem('readNotifications', JSON.stringify(localReadIds));
        }
        setActiveTab('users');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    const handleMenuClick = (tabName) => {
        if (tabName === 'change-password') {
            navigate('/change-password');
            return;
        }
        setActiveTab(tabName);
        setShowMobileMenu(false);
    };

    const handleOpenPromoteModal = () => {
        setPromoteConfirmText(''); 
        setShowPromoteModal(true);
    };

    const executePromoteStudents = async () => {
        if (promoteConfirmText !== 'ยืนยัน') return;

        setShowPromoteModal(false);
        setIsPromoting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put('http://localhost:5000/api/admin/promote-students', {}, {
                headers: { 'x-auth-token': token }
            });
            alert(res.data.msg); 
            window.location.reload(); 
        } catch (err) {
            alert('❌ เกิดข้อผิดพลาด ไม่สามารถเลื่อนชั้นเรียนได้');
            console.error("Promote Error:", err);
        }
        setIsPromoting(false);
    };

    const handleUndoPromote = async () => {
        if (window.confirm("ต้องการย้อนกลับการเลื่อนชั้นใช่หรือไม่?\n\nข้อมูลนักเรียนจะถูกดึงกลับมาอยู่ระดับชั้นเดิมก่อนหน้าที่จะกดเลื่อนชั้นครับ")) {
            setIsUndoing(true);
            try {
                const token = localStorage.getItem('token');
                const res = await axios.put('http://localhost:5000/api/admin/undo-promote', {}, { headers: { 'x-auth-token': token } });
                alert(res.data.msg);
                window.location.reload();
            } catch (err) {
                alert('❌ ไม่สามารถย้อนกลับได้');
            }
            setIsUndoing(false);
        }
    };

    const handleExportExcel = async () => {
        const token = localStorage.getItem('token');
        if (!token) return handleLogout();

        try {
            setExporting(true);
            const res = await axios.get(`http://localhost:5000/api/admin/export/excel?year=${selectedYear}`, {
                headers: { 'x-auth-token': token },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.ms-excel' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `pcshs-heartcare-report-${toBuddhistYear(selectedYear)}.xls`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('ไม่สามารถสร้างไฟล์ Excel ได้');
        } finally {
            setExporting(false);
        }
    };

    const handleOpenPrintableReport = async () => {
        if (!stats) return alert('กำลังโหลดข้อมูล กรุณารอสักครู่');
        
        setExporting(true); 
        
        try {
            const statsEl = document.getElementById('export-stats');
            const charts1El = document.getElementById('export-charts-1');
            const charts2El = document.getElementById('export-charts-2');

            // จับภาพด้วยความคมชัด x2
            const canvasStats = await html2canvas(statsEl, { scale: 2, backgroundColor: '#ffffff' });
            const canvasCharts1 = await html2canvas(charts1El, { scale: 2, backgroundColor: '#ffffff' });
            const canvasCharts2 = await html2canvas(charts2El, { scale: 2, backgroundColor: '#ffffff' });

            const imgStats = canvasStats.toDataURL('image/png');
            const imgCharts1 = canvasCharts1.toDataURL('image/png');
            const imgCharts2 = canvasCharts2.toDataURL('image/png');

            const displayYear = toBuddhistYear(stats.selectedYear);
            const currentDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
            const logoUrl = window.location.origin + pcshsLogo;

            const getFullMonthName = (abbr) => {
                const months = {
                    'ม.ค.': 'มกราคม', 'ก.พ.': 'กุมภาพันธ์', 'มี.ค.': 'มีนาคม', 'เม.ย.': 'เมษายน',
                    'พ.ค.': 'พฤษภาคม', 'มิ.ย.': 'มิถุนายน', 'ก.ค.': 'กรกฎาคม', 'ส.ค.': 'สิงหาคม',
                    'ก.ย.': 'กันยายน', 'ต.ค.': 'ตุลาคม', 'พ.ย.': 'พฤศจิกายน', 'ธ.ค.': 'ธันวาคม'
                };
                return months[abbr] || abbr;
            };

            const getFullGradeName = (abbr) => {
                const grades = {
                    'ม.1': 'มัธยมศึกษาปีที่ 1', 'ม.2': 'มัธยมศึกษาปีที่ 2', 'ม.3': 'มัธยมศึกษาปีที่ 3',
                    'ม.4': 'มัธยมศึกษาปีที่ 4', 'ม.5': 'มัธยมศึกษาปีที่ 5', 'ม.6': 'มัธยมศึกษาปีที่ 6'
                };
                return grades[abbr] || abbr;
            };

            // ✅ เตรียมข้อมูลหอพักให้ครบทั้ง 6 หอ (ถ้าไม่มี ใส่ 0)
            const fullDormitoryData = ALL_DORMS.map(dormName => {
                const found = stats.dormitoryUsage?.find(d => d.dormitory === dormName);
                return {
                    dormitory: dormName,
                    count: found ? found.count : 0
                };
            });

            // ✅ เตรียมข้อมูลชั้นเรียนให้ครบ ม.1-ม.6
            const FULL_GRADES = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
            const fullGradeData = FULL_GRADES.map(gradeName => {
                const found = stats.gradeUsage?.find(g => g.grade === gradeName);
                return {
                    grade: gradeName,
                    count: found ? found.count : 0
                };
            });

            const reportWindow = window.open('', '_blank');
            if (!reportWindow) {
                alert('กรุณาอนุญาต pop-up เพื่อเปิดรายงาน');
                setExporting(false);
                return;
            }

            // HTML โฉมใหม่ แบบ Executive Report ดูดี เป็นระเบียบ
            const htmlContent = `
            <!DOCTYPE html>
            <html lang="th">
            <head>
                <meta charset="UTF-8">
                <title>รายงานสถิติ PCSHS HeartCare ปี ${displayYear}</title>
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    @page { 
                        size: A4; 
                        margin: 15mm 15mm 15mm 20mm; 
                    } 
                    body {
                        font-family: 'Sarabun', sans-serif;
                        color: #1e293b;
                        margin: 0;
                        background: #f8fafc;
                        font-size: 14pt; 
                        line-height: 1.5;
                    }
                    .container { 
                        padding: 15mm 20mm; 
                        max-width: 210mm; 
                        margin: 20px auto; 
                        background: white; 
                        box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                        border-radius: 8px;
                        box-sizing: border-box;
                    }
                    
                    /* ส่วนหัวรายงาน */
                    .report-header {
                        display: flex;
                        align-items: center;
                        border-bottom: 2px solid #e2e8f0;
                        padding-bottom: 15px;
                        margin-bottom: 20px;
                    }
                    .header-logo {
                        width: 80px;
                        height: auto;
                        margin-right: 20px;
                    }
                    .header-text { flex-grow: 1; }
                    .doc-title { 
                        font-size: 20pt; 
                        font-weight: 700; 
                        color: #0f172a;
                        margin: 0 0 4px 0; 
                    }
                    .doc-subtitle {
                        font-size: 14pt; 
                        font-weight: 500;
                        color: #64748b;
                        margin: 0;
                    }
                    
                    .meta-info {
                        display: flex;
                        justify-content: space-between;
                        font-size: 12pt;
                        color: #475569;
                        background: #f1f5f9;
                        padding: 10px 15px;
                        border-radius: 6px;
                        margin-bottom: 25px;
                        border-left: 4px solid #003566;
                    }

                    .section-block {
                        page-break-inside: avoid;
                        margin-bottom: 25px;
                    }

                    .section-title {
                        font-size: 15pt;
                        font-weight: 700;
                        color: #003566;
                        margin-top: 10px;
                        margin-bottom: 12px;
                        display: flex;
                        align-items: center;
                    }
                    .section-title::before {
                        content: '';
                        display: inline-block;
                        width: 6px;
                        height: 20px;
                        background-color: #F25C05;
                        margin-right: 10px;
                        border-radius: 3px;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 13pt; 
                        border-radius: 6px;
                        overflow: hidden;
                        border: 1px solid #e2e8f0;
                    }
                    th, td {
                        padding: 8px 15px;
                        border-bottom: 1px solid #e2e8f0;
                        vertical-align: middle;
                    }
                    th { 
                        font-weight: 600; 
                        text-align: center;
                        background-color: #003566 !important; 
                        color: #ffffff !important;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                        letter-spacing: 0.5px;
                    }
                    tr:nth-child(even) td {
                        background-color: #f8fafc !important; 
                        -webkit-print-color-adjust: exact;
                    }
                    tr:last-child td { border-bottom: none; }
                    .text-center { text-align: center; }
                    .text-left { text-align: left; }
                    
                    .grid-2 { display: flex; gap: 20px; }
                    .col-6 { width: 50%; }

                    .signature-section {
                        margin-top: 40px;
                        display: flex;
                        justify-content: flex-end;
                        padding-right: 30px;
                        page-break-inside: avoid;
                    }
                    .signature-box { 
                        text-align: center; 
                        font-size: 13pt;
                        color: #1e293b;
                    }
                    .sig-line {
                        border-bottom: 1px dashed #94a3b8;
                        width: 200px;
                        margin: 40px auto 10px auto;
                    }

                    .print-btn-container { 
                        text-align: center; 
                        padding: 15px 0;
                        background: #fff;
                        position: sticky;
                        top: 0;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        z-index: 1000;
                    }
                    .print-btn {
                        background-color: #F25C05;
                        color: white;
                        border: none;
                        padding: 10px 25px;
                        font-size: 15px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-family: 'Prompt', sans-serif;
                        font-weight: bold;
                        transition: 0.2s;
                    }
                    .print-btn:hover { background-color: #d94f04; }

                    /* ส่วนการจัดรูปภาพกราฟ */
                    .dashboard-img {
                        width: 100%;
                        height: auto;
                        margin-bottom: 20px;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                    }
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
                            <h1 class="doc-title">รายงานสรุปสถิติระบบดูแลช่วยเหลือนักเรียน</h1>
                            <h2 class="doc-subtitle">PCSHS HeartCare - โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย</h2>
                        </div>
                    </div>

                    <div class="meta-info">
                        <span><strong>ประจำปีการศึกษา:</strong> ${displayYear}</span>
                        <span><strong>วันที่ออกรายงาน:</strong> ${currentDate}</span>
                    </div>

                    <div class="content-section">
                        <div class="section-block">
                            <div class="section-title">สถิติภาพรวมกลุ่มผู้ใช้งาน</div>
                            <table>
                                <thead>
                                    <tr>
                                        <th style="width: 70%;" class="text-left">รายการ</th>
                                        <th style="width: 30%;" class="text-center">จำนวน (คน/รายการ)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td class="text-left">จำนวนผู้ใช้งานทั้งหมดในระบบ</td><td class="text-center"><strong>${stats.total_users}</strong></td></tr>
                                    <tr><td class="text-left">จำนวนนักเรียนที่ลงทะเบียน</td><td class="text-center"><strong>${stats.total_students}</strong></td></tr>
                                    <tr><td class="text-left">จำนวนนักจิตวิทยา / ครูผู้ดูแล</td><td class="text-center"><strong>${stats.pending_psychologists}</strong></td></tr>
                                    <tr><td class="text-left">จำนวนคำขอรับคำปรึกษาสะสมตลอดปี</td><td class="text-center"><strong>${stats.yearly_appointments}</strong></td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="section-block">
                            <div class="section-title">สถิติผู้ขอรับคำปรึกษาจำแนกตามระดับชั้นและหอพัก</div>
                            <div class="grid-2">
                                <div class="col-6">
                                    <table>
                                        <thead><tr><th class="text-center">ระดับชั้น</th><th class="text-center">จำนวน (คน)</th></tr></thead>
                                        <tbody>${fullGradeData.map(g => `<tr><td class="text-left">${getFullGradeName(g.grade)}</td><td class="text-center">${g.count}</td></tr>`).join('')}</tbody>
                                    </table>
                                </div>
                                <div class="col-6">
                                    <table>
                                        <thead><tr><th class="text-center">หอพักนักเรียน</th><th class="text-center">จำนวน (คน)</th></tr></thead>
                                        <tbody>${fullDormitoryData.map(d => `<tr><td class="text-left">${d.dormitory}</td><td class="text-center">${d.count}</td></tr>`).join('')}</tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div class="section-block">
                            <div class="section-title">แนวโน้มคำขอรับคำปรึกษาจำแนกตามรายเดือน</div>
                            <div class="grid-2">
                                <div class="col-6">
                                    <table>
                                        <thead><tr><th class="text-center">เดือน</th><th class="text-center">จำนวนคำขอ (ครั้ง)</th></tr></thead>
                                        <tbody>
                                            ${stats.monthlyConsultations.slice(0, 6).map(m => `<tr><td class="text-left">${getFullMonthName(m.label)}</td><td class="text-center">${m.count}</td></tr>`).join('')}
                                        </tbody>
                                    </table>
                                </div>
                                <div class="col-6">
                                    <table>
                                        <thead><tr><th class="text-center">เดือน</th><th class="text-center">จำนวนคำขอ (ครั้ง)</th></tr></thead>
                                        <tbody>
                                            ${stats.monthlyConsultations.slice(6, 12).map(m => `<tr><td class="text-left">${getFullMonthName(m.label)}</td><td class="text-center">${m.count}</td></tr>`).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div class="signature-section">
                            <div class="signature-box">
                                <div class="sig-line"></div>
                                <div>( ${adminProfile.fullname} )</div>
                                <div style="font-size: 12pt; color: #64748b; margin-top: 4px;">ตำแหน่ง ผู้ดูแลระบบสารสนเทศ</div>
                            </div>
                        </div>
                    </div>

                    <!-- ภาคผนวกแนบรูปภาพกราฟจาก Dashboard แยกหน้า -->
                    <div style="page-break-before: always; padding-top: 20px;">
                        <div class="report-header">
                            <div class="header-text">
                                <h1 class="doc-title">ภาคผนวก: แผนภูมิและสถิติภาพรวมจากระบบ</h1>
                            </div>
                        </div>
                        <img src="${imgStats}" class="dashboard-img" alt="สถิติภาพรวม" />
                        <img src="${imgCharts1}" class="dashboard-img" alt="แผนภูมิสัดส่วน" />
                        <img src="${imgCharts2}" class="dashboard-img" alt="แผนภูมิแท่ง" />
                    </div>
                </div>
            </body>
            </html>
            `;

            reportWindow.document.open();
            reportWindow.document.write(htmlContent);
            reportWindow.document.close();

        } catch (error) {
            console.error("Print Error", error);
            alert("เกิดข้อผิดพลาดในการสร้างเอกสาร กรุณาลองใหม่อีกครั้ง");
        } finally {
            setExporting(false); 
        }
    };

    const availableYears = [...new Set([
        ...(stats.availableYears?.length ? stats.availableYears : DASHBOARD_FALLBACK_YEARS),
        selectedYear
    ].map(Number))].sort((a, b) => b - a);
    const roleChartData = stats.roleSummary?.length ? stats.roleSummary : [
        { role: 'Student', label: 'นักเรียน', count: 0 },
        { role: 'Psychologist', label: 'นักจิตวิทยา', count: 0 },
        { role: 'Admin', label: 'ผู้ดูแลระบบ', count: 0 }
    ];
    const monthlyChartData = stats.monthlyConsultations || [];
    const dormitoryChartData = stats.dormitoryUsage?.length ? stats.dormitoryUsage : [{ dormitory: 'ไม่มีข้อมูล', count: 0 }];
    const gradeChartData = stats.gradeUsage?.length ? stats.gradeUsage : ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'].map((grade) => ({ grade, count: 0 }));
    const roleTotal = roleChartData.reduce((sum, item) => sum + Number(item.count || 0), 0);

    const chartTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="chart-tooltip">
                <div className="fw-bold">{label || payload[0].name}</div>
                <div>{payload[0].value} คน/รายการ</div>
            </div>
        );
    };

    const SidebarContent = () => (
        <div className="d-flex flex-column h-100">
            <div className="logo-section">
                <img src={pcshsLogo} alt="PCSHS Logo" className="pcshs-logo-glow" />
                <h6 className="school-name mb-0">PCSHS Admin</h6>
                <div style={{ width: '40px', height: '2px', background: '#F25C05', margin: '8px auto', borderRadius: '2px' }}></div>
                <small className="text-white-50" style={{fontSize: '0.75rem', fontWeight: 300}}>แผงควบคุมผู้ดูแลระบบ</small>
            </div>
            <Nav className="flex-column w-100 mt-3 px-2">
                {[
                    { id: 'dashboard', icon: FaHome, label: 'ภาพรวมระบบ' },
                    { id: 'users', icon: FaUserGraduate, label: 'จัดการผู้ใช้งาน' },
                    { id: 'news', icon: FaNewspaper, label: 'จัดการข่าวสาร' },
                    { id: 'profile', icon: FaUserShield, label: 'โปรไฟล์ของฉัน' },
                    { id: 'change-password', icon: FaKey, label: 'เปลี่ยนรหัสผ่าน' } 
                ].map((item) => (
                    <div key={item.id} onClick={() => handleMenuClick(item.id)} className={`nav-item-custom ${activeTab === item.id ? 'active' : ''}`}>
                        <item.icon className="me-3" /> {item.label}
                    </div>
                ))}
            </Nav>
            <div className="mt-auto p-4 border-top border-secondary border-opacity-25">
                <Button variant="link" onClick={handleLogout} className="text-white-50 text-decoration-none p-0 d-flex align-items-center hover-danger">
                    <FaSignOutAlt className="me-2" /> ออกจากระบบ
                </Button>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="fade-in">
                        <div className="hero-welcome p-4 p-lg-5 mb-5 d-flex align-items-center justify-content-between shadow-lg" 
                             style={{borderRadius: '24px', background: 'linear-gradient(135deg, #003566 0%, #001d36 100%)'}}>
                            <div className="hero-bg-pattern"></div>
                            <div className="position-relative z-1">
                                <Badge bg="danger" text="white" className="mb-2 px-3 rounded-pill fw-bold">Super Admin</Badge>
                                <h1 className="fw-title display-5 fw-bold mb-2 text-white">สวัสดีคุณ {adminProfile.fullname}</h1>
                                <p className="text-white-50 mb-4 fw-light lead" style={{maxWidth: '600px'}}>
                                    ควบคุมและจัดการระบบดูแลช่วยเหลือนักเรียน <br/> โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย
                                </p>
                                <Button className="btn-pcshs shadow-lg px-4 py-2" onClick={() => handleMenuClick('users')} 
                                        style={{background: '#F25C05', border:'none'}}>
                                    <FaChalkboardTeacher className="me-2"/> จัดการผู้ใช้งาน
                                </Button>
                            </div>
                            <div className="d-none d-md-block hero-logo-container">
                                <img src={pcshsLogo} alt="Logo" className="hero-logo-img" />
                                <FaChartPie size={200} style={{ position: 'absolute', right: '-40px', opacity: 0.05, color: 'white', transform: 'rotate(-20deg)', zIndex: -1 }} />
                            </div>
                        </div>

                        <div className="px-2">
                            <div className="dashboard-section-heading mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
                                <div>
                                    <h4 className="fw-bold mb-1" style={{color: '#003566'}}>สถานะระบบปัจจุบัน</h4>
                                    <p className="text-muted mb-0">เลือกปีเพื่อดูแนวโน้มคำขอและกลุ่มนักเรียนที่ใช้บริการ</p>
                                </div>
                                <div className="d-flex flex-wrap align-items-center gap-3">
                                    <div className="d-flex gap-2">
                                        <Button 
                                            onClick={handleUndoPromote} 
                                            disabled={isUndoing || isPromoting}
                                            variant="outline-danger"
                                            className="rounded-pill shadow-sm d-flex align-items-center fw-bold px-3"
                                        >
                                            {isUndoing ? <Spinner size="sm" /> : "↩️ Undo"}
                                        </Button>

                                        <Button 
                                            onClick={handleOpenPromoteModal} 
                                            disabled={isPromoting || isUndoing}
                                            className="rounded-pill shadow-sm d-flex align-items-center"
                                            style={{ backgroundColor: '#10b981', border: 'none', padding: '0.45rem 1.25rem', color: 'white', fontWeight: 600 }}
                                        >
                                            {isPromoting ? <Spinner size="sm" /> : <><FaArrowUp className="me-2"/> เลื่อนปีการศึกษา</>}
                                        </Button>
                                    </div>

                                    <div className="year-filter bg-white shadow-sm px-3 py-2 rounded-pill d-flex align-items-center">
                                        <FaFilter className="text-orange me-2" />
                                        <Form.Select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                                            className="year-select shadow-none border-0"
                                            aria-label="เลือกปีข้อมูล"
                                            style={{ backgroundColor: 'transparent', width: 'auto', fontWeight: 'bold' }}
                                        >
                                            {availableYears.map((year) => (
                                                <option key={year} value={year}>ปี {toBuddhistYear(year)}</option>
                                            ))}
                                        </Form.Select>
                                    </div>

                                    <Dropdown align="end" className="export-dropdown">
                                        <Dropdown.Toggle className="export-toggle rounded-pill" disabled={exporting}>
                                            {exporting ? <Spinner animation="border" size="sm" className="me-2" /> : <FaPrint className="me-2" />}
                                            Export รายงาน
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu className="export-menu shadow-sm border-0">
                                            <Dropdown.Item onClick={handleExportExcel}>
                                                <FaFileExcel className="me-2 text-success" /> Excel (.xls)
                                            </Dropdown.Item>
                                            <Dropdown.Item onClick={handleOpenPrintableReport}>
                                                <FaPrint className="me-2 text-orange" /> พิมพ์ / Save as PDF
                                            </Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </div>
                            </div>
                            
                            <Row id="export-stats" className="g-4 mb-4" style={{ backgroundColor: '#f0f4f8', padding: '10px' }}>
                                {[
                                    { title: "ผู้ใช้ทั้งหมด", count: stats.total_users, unit: "คน", icon: <FaUsers/>, type: "stat-navy" },
                                    { title: "นักเรียนทั้งหมด", count: stats.total_students, unit: "คน", icon: <FaUserGraduate/>, type: "stat-info" },
                                    { title: `คำขอปี ${toBuddhistYear(selectedYear)}`, count: stats.yearly_appointments, unit: "รายการ", icon: <FaCalendarCheck/>, type: "stat-success" },
                                    { title: "นักจิตวิทยา", count: stats.pending_psychologists, unit: "คน", icon: <FaUserMd/>, type: "stat-warning" }
                                ].map((item, idx) => (
                                    <Col xs={12} sm={6} lg={3} key={idx}>
                                        <Card className={`premium-stat-card ${item.type}`}>
                                            <div className="stat-bg-icon">{item.icon}</div>
                                            <div className="stat-content">
                                                <div className="stat-top-label">{item.title}</div>
                                                <div className="stat-value-huge">
                                                    {loadingStats ? <Spinner animation="border" size="sm" /> : item.count}
                                                </div>
                                                <span className="stat-unit-pill">{item.unit}</span>
                                            </div>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                            <Row id="export-charts-1" className="g-4 mb-4" style={{ backgroundColor: '#f0f4f8', padding: '10px' }}>
                                <Col xs={12} xl={5}>
                                    <Card className="dashboard-chart-card">
                                        <div className="chart-card-header">
                                            <div>
                                                <h5>สัดส่วนผู้ใช้งานทั้งหมด</h5>
                                                <p>จำนวนผู้ใช้งานทั้งหมด</p>
                                            </div>
                                            <span className="chart-total-pill">{roleTotal} คน</span>
                                        </div>
                                        <div className="donut-chart-wrap">
                                            {loadingStats ? (
                                                <div className="chart-loading"><Spinner animation="border" /></div>
                                            ) : (
                                                <ResponsiveContainer width="100%" height={280}>
                                                    <PieChart>
                                                        <Pie data={roleChartData} dataKey="count" nameKey="label" innerRadius={72} outerRadius={105} paddingAngle={4}>
                                                            {roleChartData.map((entry) => (
                                                                <Cell key={entry.role} fill={ROLE_COLORS[entry.role] || '#64748b'} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip content={chartTooltip} />
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            )}
                                            <div className="donut-center-label">
                                                <strong>{roleTotal}</strong>
                                                <span>ผู้ใช้ทั้งหมด</span>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                                <Col xs={12} xl={7}>
                                    <Card className="dashboard-chart-card">
                                        <div className="chart-card-header">
                                            <div>
                                                <h5>จำนวนผู้ขอรับคำปรึกษารายเดือน</h5>
                                                <p>แสดง 12 เดือนของปี {toBuddhistYear(selectedYear)}</p>
                                            </div>
                                        </div>
                                        {loadingStats ? (
                                            <div className="chart-loading"><Spinner animation="border" /></div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={320}>
                                                <LineChart data={monthlyChartData} margin={{ top: 12, right: 18, bottom: 4, left: -12 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                                                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                                                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                                                    <Tooltip content={chartTooltip} />
                                                    <Line type="monotone" dataKey="count" name="คำขอ" stroke={CHART_COLORS.line} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        )}
                                    </Card>
                                </Col>
                            </Row>

                            <Row id="export-charts-2" className="g-4" style={{ backgroundColor: '#f0f4f8', padding: '10px' }}>
                                <Col xs={12} xl={6}>
                                    <Card className="dashboard-chart-card">
                                        <div className="chart-card-header">
                                            <div>
                                                <h5>หอพักที่ใช้บริการมากที่สุด</h5>
                                                <p>จำนวนนักเรียนที่มีคำขอในปี {toBuddhistYear(selectedYear)}</p>
                                            </div>
                                        </div>
                                        {loadingStats ? (
                                            <div className="chart-loading"><Spinner animation="border" /></div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={330}>
                                                <BarChart data={dormitoryChartData} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 52 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
                                                    <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                                                    <YAxis type="category" dataKey="dormitory" width={96} tickLine={false} axisLine={false} />
                                                    <Tooltip content={chartTooltip} />
                                                    <Bar dataKey="count" name="นักเรียน" fill={CHART_COLORS.bar} radius={[0, 8, 8, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </Card>
                                </Col>
                                <Col xs={12} xl={6}>
                                    <Card className="dashboard-chart-card">
                                        <div className="chart-card-header">
                                            <div>
                                                <h5>ระดับชั้นที่ใช้บริการมากที่สุด</h5>
                                                <p>จำนวนนักเรียน ม.1 ถึง ม.6 ในปี {toBuddhistYear(selectedYear)}</p>
                                            </div>
                                        </div>
                                        {loadingStats ? (
                                            <div className="chart-loading"><Spinner animation="border" /></div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={330}>
                                                <BarChart data={gradeChartData} margin={{ top: 8, right: 18, bottom: 4, left: -12 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                                                    <XAxis dataKey="grade" tickLine={false} axisLine={false} />
                                                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                                                    <Tooltip content={chartTooltip} />
                                                    <Bar dataKey="count" name="นักเรียน" fill={CHART_COLORS.grade} radius={[8, 8, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </Card>
                                </Col>
                            </Row>
                        </div>
                    </div>
                );
            case 'users': return <UserManagement />; 
            case 'news': return <NewsManagement />; 
            case 'profile': return <AdminProfile />; 
            default: return null;
        }
    };

    return (
        <div className="dashboard-wrapper">
            <div className="pcshs-sidebar d-none d-lg-block shadow"><SidebarContent /></div>
            
            <Offcanvas show={showMobileMenu} onHide={() => setShowMobileMenu(false)} className="offcanvas-custom text-white" style={{ width: '280px', background: '#003566' }}>
                <Offcanvas.Header closeButton closeVariant="white" />
                <Offcanvas.Body className="p-0"><SidebarContent /></Offcanvas.Body>
            </Offcanvas>

            <div className="main-content d-flex flex-column">
                <Navbar className="navbar-modern justify-content-between shadow-sm px-4 py-3">
                    <div className="d-flex align-items-center">
                        <Button variant="link" className="d-lg-none text-dark p-0 me-3" onClick={() => setShowMobileMenu(true)}><FaBars size={24}/></Button>
                        <h5 className="fw-title mb-0 text-dark d-none d-sm-block">
                            <span style={{color: '#003566'}}>Admin</span> Console
                        </h5>
                    </div>
                    
                    <div className="d-flex align-items-center gap-3">
                        <Dropdown align="end" className="notification-dropdown">
                            <Dropdown.Toggle variant="link" className="text-dark p-0 position-relative border-0" style={{boxShadow: 'none'}}>
                                <FaBell size={22} color="#003566" className={unreadCount > 0 ? "bell-ringing" : ""} />
                                {unreadCount > 0 && (
                                    <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle notification-dot-badge" style={{fontSize: '0.65rem'}}>
                                        {unreadCount}
                                    </Badge>
                                )}
                            </Dropdown.Toggle>
                            
                            <Dropdown.Menu className="border-0 notification-popup-menu shadow-lg">
                                <div className="notification-popup-header">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h6 className="mb-0 text-white fw-bold d-flex align-items-center gap-2">
                                            <FaUserPlus /> แจ้งเตือนผู้ใช้ใหม่
                                        </h6>
                                        <Badge bg="light" text="dark" className="rounded-pill px-2 shadow-sm">
                                            {unreadCount} รายการ
                                        </Badge>
                                    </div>
                                </div>
                                
                                <div className="notification-popup-body">
                                    {notifications.length === 0 ? (
                                        <div className="text-center py-5 text-muted">
                                            <FaBell size={40} className="mb-3 opacity-25" />
                                            <p className="mb-0 fw-bold">ไม่มีการแจ้งเตือนใหม่</p>
                                        </div>
                                    ) : (
                                        notifications.map(notif => (
                                            <div 
                                                key={notif.id} 
                                                onClick={() => handleNotificationClick(notif)}
                                                className={`notification-popup-item ${notif.is_read ? 'read' : 'unread'}`}
                                            >
                                                <div className="notification-avatar">
                                                    {notif.fullname ? notif.fullname.charAt(0) : 'U'}
                                                </div>
                                                <div className="notification-info">
                                                    <div className="notification-name">
                                                        {notif.fullname || 'สมาชิกใหม่'}
                                                    </div>
                                                    <div className="notification-email">{notif.email}</div>
                                                </div>
                                                {!notif.is_read && <div className="notification-unread-dot"></div>}
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="notification-popup-footer" onClick={() => handleMenuClick('users')}>
                                    ดูผู้ใช้งานทั้งหมด
                                </div>
                            </Dropdown.Menu>
                        </Dropdown>

                        <div className="text-end d-none d-md-block line-height-sm">
                            <div className="fw-bold text-dark" style={{fontSize: '0.9rem'}}>{adminProfile.fullname}</div>
                            <small className="text-danger fw-bold" style={{fontSize: '0.75rem'}}>● System Admin</small>
                        </div>
                        
                        <div className="position-relative cursor-pointer" onClick={() => handleMenuClick('profile')} style={{cursor: 'pointer'}}>
                            {adminProfile.profile_image ? (
                                <Image src={adminProfile.profile_image} roundedCircle style={{width: '40px', height: '40px', objectFit: 'cover', border: '2px solid #003566'}} />
                            ) : (
                                <FaUserCircle size={40} color="#003566" />
                            )}
                            <span className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle p-1"></span>
                        </div>
                    </div>
                </Navbar>
                
                <Container fluid className="p-4 flex-grow-1" style={{background: '#f0f4f8'}}>
                    {renderContent()}
                </Container>
            </div>

            <Modal show={showPromoteModal} onHide={() => setShowPromoteModal(false)} centered backdrop="static" className="profile-modal-premium">
                <Modal.Header closeButton className="border-0 pb-0 mt-2">
                    <Modal.Title className="fw-bold px-3 d-flex align-items-center text-danger">
                        <FaExclamationTriangle className="me-2 mb-1" />
                        ยืนยันการเลื่อนชั้นปีการศึกษา
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4 pt-2">
                    <div className="bg-danger bg-opacity-10 p-4 rounded-4 mb-4 border border-danger border-opacity-25 shadow-sm">
                        <p className="text-danger mb-0 fw-bold" style={{ fontSize: '1.05rem' }}>
                            ⚠️ คำเตือน: การกระทำนี้จะเลื่อนระดับชั้นของนักเรียนทั้งโรงเรียนขึ้น 1 ระดับ!
                        </p>
                        <ul className="text-danger mb-0 mt-3" style={{ fontSize: '0.95rem' }}>
                            <li className="mb-2">นักเรียน ม.1 ถึง ม.5 จะถูกเลื่อนชั้นขึ้นอัตโนมัติ</li>
                            <li>นักเรียน ม.6 จะถูกเปลี่ยนสถานะเป็น <strong className="text-dark">"จบการศึกษา"</strong></li>
                        </ul>
                    </div>
                    
                    <Form.Group className="px-3 text-center">
                        <Form.Label className="fw-bold text-dark mb-3" style={{ fontSize: '1rem' }}>
                            หากคุณแน่ใจว่าถึงเวลาเลื่อนปีการศึกษาแล้ว <br/>
                            กรุณาพิมพ์คำว่า <span className="text-danger fs-5 mx-1">ยืนยัน</span> เพื่อดำเนินการต่อ
                        </Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="พิมพ์ 'ยืนยัน' ลงในช่องนี้"
                            value={promoteConfirmText}
                            onChange={(e) => setPromoteConfirmText(e.target.value)}
                            className="text-center fw-bold shadow-sm"
                            style={{ 
                                fontSize: '1.25rem', 
                                letterSpacing: '2px', 
                                borderRadius: '12px',
                                border: promoteConfirmText === 'ยืนยัน' ? '2px solid #10b981' : '2px solid #dee2e6',
                                color: promoteConfirmText === 'ยืนยัน' ? '#10b981' : '#495057'
                            }}
                            autoFocus
                            autoComplete="off"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-0 d-flex justify-content-center pb-4 pt-2 gap-3">
                    <Button variant="light" onClick={() => setShowPromoteModal(false)} className="rounded-pill px-5 fw-bold text-secondary border-0 bg-light">
                        ยกเลิก
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={executePromoteStudents} 
                        disabled={promoteConfirmText !== 'ยืนยัน' || isPromoting}
                        className="rounded-pill px-5 shadow-sm border-0 d-flex align-items-center gap-2"
                        style={{ opacity: promoteConfirmText !== 'ยืนยัน' ? 0.6 : 1 }}
                    >
                        {isPromoting ? <Spinner size="sm" /> : <><FaArrowUp /> ดำเนินการเลื่อนชั้น</>}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AdminDashboard;