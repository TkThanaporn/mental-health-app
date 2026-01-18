import React, { useState, useEffect } from 'react';
import { Container, Navbar, Nav, Dropdown } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import { 
    FaHome, FaNewspaper, FaHeartbeat, FaCalendarAlt, FaHistory, 
    FaUserCircle, FaSignOutAlt 
} from 'react-icons/fa';

// --- จุดที่แก้ Path ให้ตรงกับโครงสร้างใหม่ ---
// ถอยหลัง 3 ขั้น (../../../) เพื่อกลับไปหา context และ assets
import { useAuth } from '../../../context/AuthContext'; 
import pcshsLogo from '../../../assets/pcshs_logo.png'; 
import './PCSHSNavbar.css'; // เรียก CSS ที่อยู่ในโฟลเดอร์เดียวกัน

const PCSHSNavbar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [currentUserName, setCurrentUserName] = useState("นักเรียน");

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const userObj = decoded.user || decoded;
                if(userObj.name) setCurrentUserName(userObj.name);
            } catch (e) {
                console.error("Token Error in Navbar", e);
            }
        }
    }, []);

    // ฟังก์ชันเช็คว่าเมนูไหน Active
    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <Navbar expand="lg" className="pcshs-navbar fixed-top">
            <Container>
                <Navbar.Brand onClick={() => navigate('/')} style={{cursor:'pointer'}} className="fw-bold d-flex align-items-center">
                    <img src={pcshsLogo} alt="Logo" height="40" className="me-2"/>
                    <div>
                        <span style={{ color: '#0035ad', fontSize: '1.2rem' }}>PCSHS</span> 
                        <span style={{ color: '#f26522', fontSize: '1.2rem' }}>Care</span>
                    </div>
                </Navbar.Brand>
                
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="ms-auto align-items-center gap-2">
                        <Nav.Link onClick={() => navigate('/student/dashboard')} className={`nav-link-custom ${isActive('/student/dashboard')}`}>
                            <FaHome className="me-1 mb-1"/> หน้าหลัก
                        </Nav.Link>
                        <Nav.Link onClick={() => navigate('/news')} className={`nav-link-custom ${isActive('/news')}`}>
                            <FaNewspaper className="me-1 mb-1"/> ข่าวสาร
                        </Nav.Link>
                        <Nav.Link onClick={() => navigate('/student/assessment')} className={`nav-link-custom ${isActive('/student/assessment')}`}>
                            <FaHeartbeat className="me-1 mb-1"/> ประเมินสุขภาพใจ
                        </Nav.Link>
                        <Nav.Link onClick={() => navigate('/student/book')} className={`nav-link-custom ${isActive('/student/book')}`}>
                            <FaCalendarAlt className="me-1 mb-1"/> จองคิว
                        </Nav.Link>
                        <Nav.Link onClick={() => navigate('/student/appointments')} className={`nav-link-custom ${isActive('/student/appointments')}`}>
                            <FaHistory className="me-1 mb-1"/> ข้อมูลการนัดหมาย
                        </Nav.Link>
                        
                        <div className="vr mx-2 d-none d-lg-block text-secondary"></div>

                        <Dropdown align="end">
                            <Dropdown.Toggle variant="light" className="rounded-pill btn-sm d-flex align-items-center gap-2 border bg-white text-dark py-1 px-3 ms-2">
                                <FaUserCircle className="text-primary" size={20}/>
                                <span className="d-none d-lg-inline fw-medium">{currentUserName}</span>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="border-0 shadow-lg mt-2 rounded-4">
                                <Dropdown.Header>จัดการบัญชี</Dropdown.Header>
                                <Dropdown.Item onClick={() => navigate('/profile')}>โปรไฟล์ส่วนตัว</Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={logout} className="text-danger">
                                    <FaSignOutAlt className="me-2"/> ออกจากระบบ
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default PCSHSNavbar;