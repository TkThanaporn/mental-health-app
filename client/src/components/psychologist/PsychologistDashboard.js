import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Button, Card, Row, Col, Nav, Navbar, Offcanvas, Badge, Image, Spinner, Form, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
    FaHome, FaCalendarAlt, FaList, FaSignOutAlt, 
    FaUserEdit, FaClock, FaBars, FaUserCircle,
    FaBullhorn, FaDatabase, FaCheckCircle, FaHourglassHalf, 
    FaTimesCircle, FaClipboardCheck, FaBuilding, FaGraduationCap, 
    FaFilter, FaFileExcel, FaPrint, FaKey
} from 'react-icons/fa';

// Import Recharts
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

import html2canvas from 'html2canvas';

import './Psychologist.css';

// Components
import AppointmentManager from './AppointmentManager'; 
import ScheduleManager from './ScheduleManager'; 
import AllAppointmentList from './AllAppointmentList'; 
import ProfileEditor from './ProfileEditor';
import NewsManagement from './NewsManagement'; 
import pcshsLogo from '../../assets/pcshs_logo.png'; 

const GRADE_LABELS = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];

const ALL_DORMS = [
    "หอสกลนคร (A)", "หอบึงกาฬ (B)", "หออุดรธานี (C)", 
    "หอขอนแก่น (D)", "หอหนองคาย (E)", "หอหนองบัวลำภู (F)"
];

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

const getRiskType = (assessment) => {
    if (!assessment) return 'unknown';

    const score = Number(assessment.score);
    if (!Number.isNaN(score)) {
        if (score >= 15) return 'severe';
        if (score >= 5) return 'risk';
        return 'normal';
    }

    const level = String(assessment.stress_level || '');
    if (level.includes('รุนแรง') || level.includes('มาก')) return 'severe';
    if (level.includes('เล็กน้อย') || level.includes('ปานกลาง')) return 'risk';
    if (level.includes('ไม่มี')) return 'normal';
    return 'unknown';
};

const normalizeGrade = (value) => {
    const match = String(value || '').match(/[1-6]/);
    return match ? `ม.${match[0]}` : 'ไม่ระบุ';
};

const normalizeGroupLabel = (value) => {
    const label = String(value || '').trim();
    return label || 'ไม่ระบุ';
};

const getValidDate = (...values) => {
    for (const value of values) {
        if (!value) continue;
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) return date;
    }
    return null;
};

const getStudentKey = (app) => (
    app.student_user_id ||
    app.student_id ||
    app.user_id ||
    app.student_email ||
    app.student_name ||
    `appointment-${app.appointment_id}`
);

const isInYear = (date, year) => date && date.getFullYear() === Number(year);

const PsychologistDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard'); 
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [selectedDashboardYear, setSelectedDashboardYear] = useState(new Date().getFullYear());
    const [availableDashboardYears, setAvailableDashboardYears] = useState([new Date().getFullYear()]);
    const [exporting, setExporting] = useState(false);
    
    const [psychologist, setPsychologist] = useState({ fullname: 'กำลังโหลด...', profile_image: '' });
    
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

    const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, cancelled: 0 });
    const [chartData, setChartData] = useState({
        monthlyTrends: [],
        issueCategories: [],
        dormitoryUsage: [],
        gradeUsage: []
    });
    
    const [assessmentData, setAssessmentData] = useState({ riskLevels: [], monthlyRisks: [] });
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            handleLogout();
            return;
        }
        fetchProfile(token);
        fetchPendingCount(token); 
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) fetchDashboardData(token);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, selectedDashboardYear]);

    const fetchProfile = async (token) => {
        try {
            const res = await axios.get('http://localhost:5000/api/profile/me', {
                headers: { 'x-auth-token': token }
            });
            setPsychologist(res.data);
        } catch (err) { 
            if (err.response && (err.response.status === 401 || err.response.status === 403)) handleLogout();
        }
    };

    const fetchPendingCount = async (token) => {
        try {
            const res = await axios.get('http://localhost:5000/api/appointments/psychologist-appointments', {
                headers: { 'x-auth-token': token }
            });
            const count = res.data.filter(a => String(a.status).toLowerCase() === 'pending').length;
            setPendingRequestsCount(count);
        } catch (err) {
            console.error("Error fetching pending count", err);
        }
    };

    const fetchDashboardData = async (token) => {
        setLoadingStats(true);
        try {
            const config = { headers: { 'x-auth-token': token } };
            
            const [apptRes, assessRes] = await Promise.all([
                axios.get('http://localhost:5000/api/appointments/psychologist-history', config).catch(() => ({data: []})),
                axios.get('http://localhost:5000/api/assessments/all', config).catch(() => ({data: []})) 
            ]);

            const apptData = apptRes.data; 
            const assessData = assessRes.data;
            const yearOptions = Array.from(new Set([
                new Date().getFullYear(),
                ...apptData
                    .map(app => getValidDate(app.date, app.appointment_date, app.booking_date)?.getFullYear())
                    .filter(Boolean),
                ...assessData
                    .map(assess => getValidDate(assess.created_at)?.getFullYear())
                    .filter(Boolean)
            ])).sort((a, b) => b - a);

            setAvailableDashboardYears(yearOptions);

            const filteredApptData = apptData.filter(app => {
                const appDate = getValidDate(app.date, app.appointment_date, app.booking_date);
                return isInYear(appDate, selectedDashboardYear);
            });
            const filteredAssessData = assessData.filter(assess => {
                const assessDate = getValidDate(assess.created_at);
                return isInYear(assessDate, selectedDashboardYear);
            });

            setStats({
                total: filteredApptData.length,
                completed: filteredApptData.filter(a => a.status?.toLowerCase() === 'completed').length,
                pending: filteredApptData.filter(a => a.status?.toLowerCase() === 'pending' || a.status?.toLowerCase() === 'confirmed').length,
                cancelled: filteredApptData.filter(a => ['cancelled', 'no-show'].includes(a.status?.toLowerCase())).length
            });

            const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
            const dashboardYear = Number(selectedDashboardYear);
            
            let trendsMap = {};
            for(let i=0; i<12; i++) {
                let d = new Date(dashboardYear, i, 1);
                let key = `${d.getFullYear()}-${d.getMonth()}`;
                trendsMap[key] = { month: monthNames[d.getMonth()], count: 0, sortKey: d.getTime() };
            }

            const topicCounts = {};
            filteredApptData.forEach(app => {
                const appDate = getValidDate(app.date, app.appointment_date, app.booking_date);
                if (!appDate) return;
                const monthKey = `${appDate.getFullYear()}-${appDate.getMonth()}`;
                if(trendsMap[monthKey]) trendsMap[monthKey].count += 1;

                const topic = (app.topic && app.topic.trim() !== '') ? app.topic : 'ปรึกษาทั่วไป';
                topicCounts[topic] = (topicCounts[topic] || 0) + 1;
            });

            const realMonthlyTrends = Object.values(trendsMap).sort((a,b) => a.sortKey - b.sortKey).map(item => ({ month: item.month, count: item.count }));
            const realIssueCategories = Object.keys(topicCounts).map(key => ({
                name: key, value: topicCounts[key]
            })).sort((a, b) => b.value - a.value).slice(0, 5); 

            const latestAssessmentByStudent = {};
            filteredAssessData.forEach(assess => {
                const studentId = assess.student_user_id || assess.student_id || assess.user_id;
                if (!studentId) return;

                const currentDate = new Date(assess.created_at || 0).getTime();
                const savedDate = new Date(latestAssessmentByStudent[studentId]?.created_at || 0).getTime();
                if (!latestAssessmentByStudent[studentId] || currentDate >= savedDate) {
                    latestAssessmentByStudent[studentId] = assess;
                }
            });

            const uniqueStudentMap = new Map();
            const dormitoryMap = new Map();
            const gradeMap = new Map(GRADE_LABELS.map(grade => [
                grade,
                { grade, count: 0, appointments: 0, risk: 0, severe: 0 }
            ]));

            const ensureDormitory = (label) => {
                if (!dormitoryMap.has(label)) {
                    dormitoryMap.set(label, { dormitory: label, count: 0, appointments: 0, risk: 0, severe: 0 });
                }
                return dormitoryMap.get(label);
            };

            filteredApptData.forEach(app => {
                const studentKey = getStudentKey(app);
                const dormitory = normalizeGroupLabel(app.dormitory);
                const grade = normalizeGrade(app.education_level || app.grade);

                ensureDormitory(dormitory).appointments += 1;
                if (!gradeMap.has(grade)) {
                    gradeMap.set(grade, { grade, count: 0, appointments: 0, risk: 0, severe: 0 });
                }
                gradeMap.get(grade).appointments += 1;

                if (!uniqueStudentMap.has(studentKey)) {
                    uniqueStudentMap.set(studentKey, {
                        dormitory,
                        grade,
                        riskType: getRiskType(latestAssessmentByStudent[app.student_user_id])
                    });
                }
            });

            uniqueStudentMap.forEach(student => {
                const dormitoryItem = ensureDormitory(student.dormitory);
                const gradeItem = gradeMap.get(student.grade) || gradeMap.get('ไม่ระบุ');

                dormitoryItem.count += 1;
                if (student.riskType === 'risk') dormitoryItem.risk += 1;
                if (student.riskType === 'severe') dormitoryItem.severe += 1;

                if (gradeItem) {
                    gradeItem.count += 1;
                    if (student.riskType === 'risk') gradeItem.risk += 1;
                    if (student.riskType === 'severe') gradeItem.severe += 1;
                }
            });

            const realDormitoryUsage = Array.from(dormitoryMap.values())
                .sort((a, b) => b.count - a.count || b.appointments - a.appointments)
                .slice(0, 10)
                .map(item => ({ ...item, normal: Math.max(item.count - item.risk - item.severe, 0) }));
            const realGradeUsage = Array.from(gradeMap.values())
                .filter(item => item.grade !== 'ไม่ระบุ')
                .sort((a, b) => GRADE_LABELS.indexOf(a.grade) - GRADE_LABELS.indexOf(b.grade))
                .map(item => ({ ...item, normal: Math.max(item.count - item.risk - item.severe, 0) }));

            setChartData({
                monthlyTrends: realMonthlyTrends,
                issueCategories: realIssueCategories,
                dormitoryUsage: realDormitoryUsage.length ? realDormitoryUsage : [{ dormitory: 'ไม่มีข้อมูล', count: 0, appointments: 0, normal: 0, risk: 0, severe: 0 }],
                gradeUsage: realGradeUsage
            });

            let normalCount = 0;
            let riskCount = 0;
            let severeCount = 0;

            let assessTrendsMap = {};
            for(let i=0; i<12; i++) {
                let d = new Date(dashboardYear, i, 1);
                let key = `${d.getFullYear()}-${d.getMonth()}`;
                assessTrendsMap[key] = { month: monthNames[d.getMonth()], normal: 0, risk: 0, severe: 0, sortKey: d.getTime() };
            }

            filteredAssessData.forEach(assess => {
                const aDate = getValidDate(assess.created_at); 
                if (!aDate) return;
                const aKey = `${aDate.getFullYear()}-${aDate.getMonth()}`;
                const levelType = getRiskType(assess);

                if (levelType !== 'unknown') {
                    if (levelType === 'normal') normalCount++;
                    if (levelType === 'risk') riskCount++;
                    if (levelType === 'severe') severeCount++;
                    if (assessTrendsMap[aKey]) assessTrendsMap[aKey][levelType] += 1;
                }
            });

            const realRiskLevels = [
                { name: 'กลุ่มปกติ', value: normalCount, color: '#10B981' }, 
                { name: 'กลุ่มเสี่ยง', value: riskCount, color: '#F59E0B' }, 
                { name: 'กลุ่มมีปัญหา', value: severeCount, color: '#EF4444' } 
            ];

            const realMonthlyRisks = Object.values(assessTrendsMap).sort((a,b) => a.sortKey - b.sortKey);

            setAssessmentData({ riskLevels: realRiskLevels, monthlyRisks: realMonthlyRisks });
            setLoadingStats(false);

        } catch (err) {
            console.error("Dashboard Data Fetch Error", err);
            setLoadingStats(false);
        }
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

    const handleExportExcel = async () => {
        const token = localStorage.getItem('token');
        if (!token) return handleLogout();

        try {
            setExporting(true);
            const res = await axios.get(`http://localhost:5000/api/appointments/psychologist-export/excel?year=${selectedDashboardYear}`, {
                headers: { 'x-auth-token': token },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.ms-excel' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `pcshs-psychologist-report-${selectedDashboardYear}.xls`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export Excel Error", err);
            alert('ไม่สามารถสร้างไฟล์ Excel ได้');
        } finally {
            setExporting(false);
        }
    };

    // ✅ ฟังก์ชันออกรายงานแบบทางการ (Executive Report) + แก้ปัญหาโดนบล็อก Pop-up
    const handleOpenPrintableReport = async () => {
        if (!stats) return alert('กำลังโหลดข้อมูล กรุณารอสักครู่');
        
        // 🌟 1. เปิดหน้าต่างใหม่ "ทันที" ที่กดปุ่ม เพื่อไม่ให้เบราว์เซอร์บล็อก Pop-up
        const reportWindow = window.open('', '_blank');
        if (!reportWindow) {
            alert('เบราว์เซอร์ของคุณบล็อกการเปิดหน้าต่างใหม่ กรุณากดอนุญาต Pop-up ที่รูปสัญลักษณ์มุมขวาบนของช่อง URL ครับ');
            return;
        }

        // 🌟 2. แสดงหน้าต่างโหลดข้อมูลให้ผู้ใช้เห็นว่ากำลังทำงาน
        reportWindow.document.write(`
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; font-family:'Sarabun', sans-serif; background-color:#f8fafc; color:#003566;">
                <h2 style="margin-bottom: 10px;">กำลังสร้างรายงาน PDF และประมวลผลกราฟ 📊</h2>
                <p style="color:#64748b; font-size: 14pt;">กรุณารอสักครู่...</p>
            </div>
        `);
        
        setExporting(true); 
        
        try {
            // 3. เริ่มถ่ายภาพกราฟ
            const statsEl = document.getElementById('export-stats');
            const charts1El = document.getElementById('export-charts-1');
            const charts2El = document.getElementById('export-charts-2');
            const charts3El = document.getElementById('export-charts-3');

            const canvasStats = await html2canvas(statsEl, { scale: 2, backgroundColor: '#f0f4f8' });
            const canvasCharts1 = await html2canvas(charts1El, { scale: 2, backgroundColor: '#f0f4f8' });
            const canvasCharts2 = await html2canvas(charts2El, { scale: 2, backgroundColor: '#f0f4f8' });
            const canvasCharts3 = await html2canvas(charts3El, { scale: 2, backgroundColor: '#f0f4f8' });

            const imgStats = canvasStats.toDataURL('image/png');
            const imgCharts1 = canvasCharts1.toDataURL('image/png');
            const imgCharts2 = canvasCharts2.toDataURL('image/png');
            const imgCharts3 = canvasCharts3.toDataURL('image/png');

            // 4. เตรียมข้อมูลรายงาน
            const displayYear = toBuddhistYear(selectedDashboardYear);
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

            const fullDormitoryData = ALL_DORMS.map(dormName => {
                const found = chartData.dormitoryUsage?.find(d => d.dormitory === dormName);
                return { dormitory: dormName, count: found ? found.count : 0 };
            });

            const FULL_GRADES = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
            const fullGradeData = FULL_GRADES.map(gradeName => {
                const found = chartData.gradeUsage?.find(g => g.grade === gradeName);
                return { grade: gradeName, count: found ? found.count : 0 };
            });

            // 5. โค้ด HTML หน้าตารายงาน
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
                        margin: 15mm 20mm 15mm 25mm; 
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

                    .dashboard-img {
                        width: 100%;
                        height: auto;
                        margin-bottom: 20px;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
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
                    <!-- หน้า 1: ข้อมูลทางการ (นักจิตวิทยา) -->
                    <div class="report-header">
                        <img src="${logoUrl}" alt="PCSHS Logo" class="header-logo" />
                        <div class="header-text">
                            <h1 class="doc-title">รายงานสรุปสถิติการให้คำปรึกษาและสุขภาพจิตนักเรียน</h1>
                            <h2 class="doc-subtitle">PCSHS HeartCare - โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย</h2>
                        </div>
                    </div>

                    <div class="meta-info">
                        <span><strong>ประจำปีการศึกษา:</strong> ${displayYear}</span>
                        <span><strong>วันที่ออกรายงาน:</strong> ${currentDate}</span>
                    </div>

                    <div class="content-section">
                        <!-- ส่วนที่ 1 -->
                        <div class="section-block">
                            <div class="section-title">ภาพรวมสถานะการให้บริการคำปรึกษา</div>
                            <table>
                                <thead>
                                    <tr>
                                        <th style="width: 70%;" class="text-left">รายการ</th>
                                        <th style="width: 30%;" class="text-center">จำนวน (รายการ)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td class="text-left">จำนวนคำขอรับคำปรึกษาทั้งหมดตลอดปีการศึกษา</td><td class="text-center"><strong>${stats.total}</strong></td></tr>
                                    <tr><td class="text-left">จำนวนเคสที่ให้คำปรึกษาสำเร็จ</td><td class="text-center"><strong>${stats.completed}</strong></td></tr>
                                    <tr><td class="text-left">จำนวนเคสที่กำลังรอดำเนินการ / รอยืนยันเวลา</td><td class="text-center"><strong>${stats.pending}</strong></td></tr>
                                    <tr><td class="text-left">จำนวนเคสที่ถูกยกเลิก / นักเรียนไม่มาตามนัด</td><td class="text-center"><strong>${stats.cancelled}</strong></td></tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- ส่วนที่ 2 -->
                        <div class="section-block">
                            <div class="section-title">สรุปผลการคัดกรองสุขภาพจิตนักเรียน (PHQ-A) ภาพรวม</div>
                            <table>
                                <thead>
                                    <tr>
                                        <th style="width: 70%;" class="text-left">ระดับความเสี่ยง</th>
                                        <th style="width: 30%;" class="text-center">จำนวนนักเรียน (คน)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${assessmentData.riskLevels.map(r => `<tr><td class="text-left">${r.name}</td><td class="text-center">${r.value}</td></tr>`).join('')}
                                </tbody>
                            </table>
                        </div>

                        <!-- ส่วนที่ 3 -->
                        <div class="section-block">
                            <div class="section-title">สถิตินักเรียนที่รับบริการจำแนกตามระดับชั้นและหอพัก</div>
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

                        <!-- ส่วนที่ 4 -->
                        <div class="section-block">
                            <div class="section-title">แนวโน้มคำขอรับคำปรึกษาจำแนกตามรายเดือน</div>
                            <div class="grid-2">
                                <div class="col-6">
                                    <table>
                                        <thead><tr><th class="text-center">เดือน</th><th class="text-center">จำนวนคำขอ (ครั้ง)</th></tr></thead>
                                        <tbody>
                                            ${chartData.monthlyTrends.slice(0, 6).map(m => `<tr><td class="text-left">${getFullMonthName(m.month)}</td><td class="text-center">${m.count}</td></tr>`).join('')}
                                        </tbody>
                                    </table>
                                </div>
                                <div class="col-6">
                                    <table>
                                        <thead><tr><th class="text-center">เดือน</th><th class="text-center">จำนวนคำขอ (ครั้ง)</th></tr></thead>
                                        <tbody>
                                            ${chartData.monthlyTrends.slice(6, 12).map(m => `<tr><td class="text-left">${getFullMonthName(m.month)}</td><td class="text-center">${m.count}</td></tr>`).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div class="signature-section">
                            <div class="signature-box">
                                <div class="sig-line"></div>
                                <div>( ${psychologist.fullname} )</div>
                                <div style="font-size: 12pt; color: #64748b; margin-top: 4px;">นักจิตวิทยาโรงเรียน / ผู้ให้คำปรึกษา</div>
                            </div>
                        </div>
                    </div>

                    <!-- หน้า 2: ภาคผนวกแนบรูปภาพกราฟจาก Dashboard แยกหน้า -->
                    <div style="page-break-before: always; padding-top: 20px;">
                        <div class="report-header">
                            <div class="header-text">
                                <h1 class="doc-title">ภาคผนวก: แผนภูมิและสถิติภาพรวมจากระบบ</h1>
                            </div>
                        </div>
                        <img src="${imgStats}" class="dashboard-img" alt="สถิติภาพรวม" />
                        <img src="${imgCharts1}" class="dashboard-img" alt="แผนภูมิการนัดหมาย" />
                        <img src="${imgCharts2}" class="dashboard-img" alt="แผนภูมิสุขภาพจิต" />
                        <img src="${imgCharts3}" class="dashboard-img" alt="แผนภูมิหอพัก" />
                    </div>
                </div>
            </body>
            </html>
            `;

            // 🌟 6. เอาเนื้อหาไปเขียนใส่หน้าต่างที่เตรียมไว้
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

    const demographicTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        const item = payload[0].payload;
        return (
            <div className="psych-chart-tooltip" style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
                <div className="fw-bold mb-1">{label || item.dormitory || item.grade}</div>
                <div>นักเรียนไม่ซ้ำ: {item.count || 0} คน</div>
                <div>จำนวนนัดหมาย: {item.appointments || 0} ครั้ง</div>
                <div className="text-warning">กลุ่มเสี่ยง: {item.risk || 0} คน</div>
                <div className="text-danger">กลุ่มมีปัญหา: {item.severe || 0} คน</div>
            </div>
        );
    };

    const SidebarContent = () => (
        <div className="d-flex flex-column h-100">
            <div className="logo-section">
                <img src={pcshsLogo} alt="PCSHS Logo" className="pcshs-logo-glow" />
                <h6 className="school-name mb-0">PCSHS HeartCare</h6>
                <div style={{ width: '40px', height: '2px', background: 'var(--pcshs-orange)', margin: '8px auto', borderRadius: '2px' }}></div>
            </div>
            <Nav className="flex-column w-100 mt-3 px-2">
                {[
                    { id: 'dashboard', icon: FaHome, label: 'หน้าหลัก' },
                    { id: 'appointments', icon: FaCalendarAlt, label: 'จัดการนัดหมาย', badge: pendingRequestsCount }, 
                    { id: 'news', icon: FaBullhorn, label: 'ประกาศข่าวสาร' },
                    { id: 'all-list', icon: FaList, label: 'ประวัติทั้งหมด' },
                    { id: 'schedule', icon: FaClock, label: 'ตั้งค่าตารางเวลา' },
                    { id: 'profile', icon: FaUserEdit, label: 'ข้อมูลส่วนตัว' },
                    { id: 'change-password', icon: FaKey, label: 'เปลี่ยนรหัสผ่าน' } 
                ].map((item) => (
                    <div key={item.id} onClick={() => handleMenuClick(item.id)} className={`nav-item-custom ${activeTab === item.id ? 'active' : ''}`}>
                        <div className="d-flex justify-content-between align-items-center w-100">
                            <div><item.icon className="me-3" /> {item.label}</div>
                            {item.badge > 0 && (
                                <Badge bg="danger" pill style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                                    {item.badge}
                                </Badge>
                            )}
                        </div>
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

    const handleAppointmentUpdate = () => {
        const token = localStorage.getItem('token');
        if (token) fetchPendingCount(token);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                const statusData = [
                    { name: 'สำเร็จ', value: stats.completed, color: '#10B981' },
                    { name: 'รอพบ', value: stats.pending, color: '#F59E0B' },
                    { name: 'ยกเลิก', value: stats.cancelled, color: '#EF4444' }
                ];

                return (
                    <div className="fade-in">
                        <div className="hero-welcome p-4 p-lg-5 mb-5 d-flex align-items-center justify-content-between shadow-lg" style={{borderRadius: '24px'}}>
                            <div className="hero-bg-pattern"></div>
                            <div className="position-relative z-1">
                                <Badge bg="warning" text="dark" className="mb-2 px-3 rounded-pill fw-bold">Psychologist Panel</Badge>
                                <h1 className="fw-title display-5 fw-bold mb-2 text-white">สวัสดีคุณ {psychologist.fullname}</h1>
                                <p className="text-white-50 mb-4 fw-light lead" style={{maxWidth: '600px'}}>
                                    ศูนย์รวมข้อมูลสุขภาพจิตนักเรียนและการนัดหมาย <br/>โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย
                                </p>
                            </div>
                            <div className="d-none d-md-block hero-logo-container">
                                <img src={pcshsLogo} alt="Logo" className="hero-logo-img" />
                            </div>
                        </div>

                        <div className="px-2 mb-5">
                            <div className="dashboard-section-heading mb-4">
                                <div>
                                    <h4 className="fw-bold mb-1" style={{color: 'var(--pcshs-blue-deep)'}}>ภาพรวมการนัดหมาย</h4>
                                    <p className="text-muted mb-0">เลือกปีเพื่อดูข้อมูลและ Export รายงานตามช่วงปีเดียวกัน</p>
                                </div>
                                <div className="year-filter">
                                    <FaFilter className="text-orange" />
                                    <Form.Select
                                        value={selectedDashboardYear}
                                        onChange={(e) => setSelectedDashboardYear(Number(e.target.value))}
                                        className="year-select shadow-none"
                                        aria-label="เลือกปีข้อมูล"
                                    >
                                        {availableDashboardYears.map(year => (
                                            <option key={year} value={year}>ปี {Number(year) + 543}</option>
                                        ))}
                                    </Form.Select>
                                </div>
                                <Dropdown align="end" className="export-dropdown">
                                    <Dropdown.Toggle className="export-toggle" disabled={exporting}>
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

                            <Row id="export-stats" className="g-4" style={{ backgroundColor: '#f0f4f8', padding: '10px', borderRadius: '10px' }}>
                                {[
                                    { title: "บันทึกทั้งหมด", count: stats.total, unit: "รายการ", icon: <FaDatabase/>, type: "stat-navy" },
                                    { title: "ดำเนินการสำเร็จ", count: stats.completed, unit: "รายการ", icon: <FaCheckCircle/>, type: "stat-success" },
                                    { title: "รอพบ / ยืนยันแล้ว", count: stats.pending, unit: "รายการ", icon: <FaHourglassHalf/>, type: "stat-warning" },
                                    { title: "ยกเลิก / ไม่มา", count: stats.cancelled, unit: "รายการ", icon: <FaTimesCircle/>, type: "stat-danger" }
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
                        </div>

                        {loadingStats ? (
                            <div className="text-center py-5"><Spinner animation="border" variant="primary"/></div>
                        ) : (
                            <div className="px-2 pb-4">
                                <h4 className="fw-bold mb-4" style={{color: 'var(--pcshs-blue-deep)'}}>การวิเคราะห์ข้อมูลนักเรียน ปี {Number(selectedDashboardYear) + 543}</h4>
                                
                                <Row id="export-charts-1" className="g-4 mb-4" style={{ backgroundColor: '#f0f4f8', padding: '10px', borderRadius: '10px' }}>
                                    <Col xs={12} lg={4}>
                                        <Card className="shadow-sm border-0 h-100" style={{borderRadius: '20px'}}>
                                            <Card.Body>
                                                <h6 className="fw-bold mb-4 text-secondary text-center">สัดส่วนสถานะการนัดหมาย</h6>
                                                <div style={{ width: '100%', height: 250 }}>
                                                    <ResponsiveContainer>
                                                        <PieChart>
                                                            <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                                {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                                            </Pie>
                                                            <RechartsTooltip />
                                                            <Legend verticalAlign="bottom" height={36}/>
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col xs={12} lg={8}>
                                        <Card className="shadow-sm border-0 h-100" style={{borderRadius: '20px'}}>
                                            <Card.Body>
                                                <h6 className="fw-bold mb-4 text-secondary">แนวโน้มการขอรับคำปรึกษารายเดือน</h6>
                                                <div style={{ width: '100%', height: 250 }}>
                                                    <ResponsiveContainer>
                                                        <LineChart data={chartData.monthlyTrends}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                                            <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                                            <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                                                            <RechartsTooltip cursor={{stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2}} />
                                                            <Line type="monotone" dataKey="count" name="จำนวนนัดหมาย" stroke="var(--pcshs-blue-deep)" strokeWidth={4} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                <Row id="export-charts-2" className="g-4 mb-4" style={{ backgroundColor: '#f0f4f8', padding: '10px', borderRadius: '10px' }}>
                                    <Col xs={12} lg={4}>
                                        <Card className="shadow-sm border-0 h-100" style={{borderRadius: '20px'}}>
                                            <Card.Body>
                                                <h6 className="fw-bold mb-4 text-secondary">ประเด็นปัญหาที่พบมากที่สุด (Top 5)</h6>
                                                <div style={{ width: '100%', height: 300 }}>
                                                    <ResponsiveContainer>
                                                        <BarChart data={chartData.issueCategories} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                                                            <XAxis type="number" hide />
                                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} />
                                                            <RechartsTooltip cursor={{fill: 'rgba(242, 92, 5, 0.05)'}} />
                                                            <Bar dataKey="value" name="จำนวนเคส" fill="var(--pcshs-orange)" radius={[0, 10, 10, 0]} barSize={20} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col xs={12} lg={8}>
                                        <Card className="shadow-sm border-0 h-100" style={{borderRadius: '20px'}}>
                                            <Card.Body>
                                                <div className="d-flex justify-content-between align-items-center mb-4">
                                                    <h6 className="fw-bold text-secondary mb-0"><FaClipboardCheck className="me-2"/>สรุปผลการคัดกรองสุขภาพจิตนักเรียน (PHQ-A)</h6>
                                                </div>
                                                <div style={{ width: '100%', height: 300 }}>
                                                    <ResponsiveContainer>
                                                        <BarChart data={assessmentData.riskLevels} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                                            <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                                                            <RechartsTooltip cursor={{fill: 'transparent'}} />
                                                            <Bar dataKey="value" name="จำนวนนักเรียน" radius={[10, 10, 0, 0]} barSize={60}>
                                                                {assessmentData.riskLevels.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                                ))}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                <Row id="export-charts-3" className="g-4 mb-4" style={{ backgroundColor: '#f0f4f8', padding: '10px', borderRadius: '10px' }}>
                                    <Col xs={12} lg={6}>
                                        <Card className="shadow-sm border-0 h-100 psych-insight-card">
                                            <Card.Body>
                                                <h6 className="fw-bold mb-2 text-secondary"><FaBuilding className="me-2"/>หอพักที่ใช้บริการมากที่สุด</h6>
                                                <p className="text-muted small mb-4">จำนวนนักเรียน พร้อมแยกกลุ่มเสี่ยงจากผล PHQ-A ล่าสุด</p>
                                                <div style={{ width: '100%', height: 330 }}>
                                                    <ResponsiveContainer>
                                                        <BarChart data={chartData.dormitoryUsage} layout="vertical" margin={{ top: 8, right: 24, left: 28, bottom: 8 }}>
                                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                                                            <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
                                                            <YAxis dataKey="dormitory" type="category" axisLine={false} tickLine={false} width={118} />
                                                            <RechartsTooltip content={demographicTooltip} cursor={{fill: 'rgba(0, 35, 75, 0.04)'}} />
                                                            <Legend verticalAlign="top" height={32}/>
                                                            <Bar dataKey="normal" name="กลุ่มปกติ" stackId="dorm" fill="#10B981" radius={[0, 0, 0, 0]} barSize={22} />
                                                            <Bar dataKey="risk" name="กลุ่มเสี่ยง" stackId="dorm" fill="#F59E0B" barSize={22} />
                                                            <Bar dataKey="severe" name="กลุ่มมีปัญหา" stackId="dorm" fill="#EF4444" radius={[0, 8, 8, 0]} barSize={22} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col xs={12} lg={6}>
                                        <Card className="shadow-sm border-0 h-100 psych-insight-card">
                                            <Card.Body>
                                                <h6 className="fw-bold mb-2 text-secondary"><FaGraduationCap className="me-2"/>ระดับชั้นที่ใช้บริการมากที่สุด</h6>
                                                <p className="text-muted small mb-4">ม.1 ถึง ม.6 นับนักเรียนไม่ซ้ำ และแสดงน้ำหนักกลุ่มเสี่ยง</p>
                                                <div style={{ width: '100%', height: 330 }}>
                                                    <ResponsiveContainer>
                                                        <BarChart data={chartData.gradeUsage} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                                            <XAxis dataKey="grade" axisLine={false} tickLine={false} />
                                                            <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                                                            <RechartsTooltip content={demographicTooltip} cursor={{fill: 'rgba(0, 35, 75, 0.04)'}} />
                                                            <Legend verticalAlign="top" height={32}/>
                                                            <Bar dataKey="normal" name="กลุ่มปกติ" stackId="grade" fill="#10B981" barSize={42} />
                                                            <Bar dataKey="risk" name="กลุ่มเสี่ยง" stackId="grade" fill="#F59E0B" barSize={42} />
                                                            <Bar dataKey="severe" name="กลุ่มมีปัญหา" stackId="grade" fill="#EF4444" radius={[8, 8, 0, 0]} barSize={42} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                            </div>
                        )}
                    </div>
                );
            case 'appointments': return <AppointmentManager onAppointmentUpdate={handleAppointmentUpdate} />; 
            case 'news': return <NewsManagement />;
            case 'schedule': return <ScheduleManager />;
            case 'all-list': return <AllAppointmentList />;
            case 'profile': return <ProfileEditor />;
            default: return null;
        }
    };

    return (
        <div className="dashboard-wrapper">
            <div className="pcshs-sidebar d-none d-lg-block shadow"><SidebarContent /></div>
            <Offcanvas show={showMobileMenu} onHide={() => setShowMobileMenu(false)} className="offcanvas-custom text-white" style={{ width: '280px' }}>
                <Offcanvas.Header closeButton closeVariant="white" />
                <Offcanvas.Body className="p-0"><SidebarContent /></Offcanvas.Body>
            </Offcanvas>
            
            <div className="main-content d-flex flex-column">
                <Navbar className="navbar-modern justify-content-between shadow-sm px-4 py-3">
                    <div className="d-flex align-items-center">
                        <Button variant="link" className="d-lg-none text-dark p-0 me-3" onClick={() => setShowMobileMenu(true)}><FaBars size={24}/></Button>
                        <h5 className="fw-title mb-0 text-dark d-none d-sm-block">
                            <span style={{color: 'var(--pcshs-blue-deep)'}}>Psychologist</span> Workspace
                        </h5>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <div className="text-end d-none d-md-block line-height-sm">
                            <div className="fw-bold text-dark" style={{fontSize: '0.9rem'}}>
                                {psychologist.fullname === 'กำลังโหลด...' ? <Spinner animation="border" size="sm" /> : psychologist.fullname}
                            </div>
                            <small className="text-success fw-bold" style={{fontSize: '0.75rem'}}>● Online</small>
                        </div>
                        <div className="position-relative cursor-pointer" onClick={() => handleMenuClick('profile')}>
                            {psychologist.profile_image ? (
                                <Image src={psychologist.profile_image} roundedCircle style={{width: '40px', height: '40px', objectFit: 'cover', border: '2px solid var(--pcshs-blue-deep)'}} />
                            ) : (
                                <FaUserCircle size={40} color="var(--pcshs-blue-deep)" />
                            )}
                            <span className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle p-1"></span>
                        </div>
                    </div>
                </Navbar>
                
                <Container fluid className="p-4 flex-grow-1" style={{background: '#f0f4f8'}}>
                    {renderContent()}
                </Container>
            </div>
        </div>
    );
};

export default PsychologistDashboard;