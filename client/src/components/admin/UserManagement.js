import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Form, Modal, InputGroup, Row, Col, Spinner } from 'react-bootstrap';
// เพิ่ม FaEdit เข้ามาใน import
import { FaSearch, FaUserPlus, FaTrash, FaFolderOpen, FaEnvelope, FaLock, FaUserAlt, FaPhone, FaUsersCog, FaIdCard, FaEdit } from 'react-icons/fa';

import './UserManagement.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // State สำหรับการเพิ่มผู้ใช้งาน
    const [showModal, setShowModal] = useState(false);
    const [newUser, setNewUser] = useState({ 
        fullname: '', 
        email: '', 
        password: '', 
        role: 'Student', 
        phone: '', 
        gender: 'Male' 
    });

    // 🌟 ส่วนที่เพิ่มใหม่: State สำหรับการแก้ไขผู้ใช้งาน
    const [showEditModal, setShowEditModal] = useState(false);
    const [editUser, setEditUser] = useState({
        user_id: '',
        fullname: '', 
        email: '', 
        role: 'Student', 
        phone: '', 
        gender: 'Male'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/admin/users', { 
                headers: { 'x-auth-token': token } 
            });
            setUsers(res.data);
            setLoading(false);
        } catch (err) { 
            console.error("Error fetching users:", err); 
            setLoading(false);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/admin/users', newUser, { 
                headers: { 'x-auth-token': token } 
            });
            alert('✅ เพิ่มผู้ใช้งานสำเร็จ');
            setShowModal(false);
            setNewUser({ fullname: '', email: '', password: '', role: 'Student', phone: '', gender: 'Male' });
            fetchUsers();
        } catch (err) { 
            alert('❌ ' + (err.response?.data?.msg || 'Error')); 
        }
    };

    // 🌟 ส่วนที่เพิ่มใหม่: ฟังก์ชันสำหรับเปิด Modal แก้ไขและดึงข้อมูลเดิมมาแสดง
    const handleOpenEditModal = (user) => {
        setEditUser({
            user_id: user.user_id,
            fullname: user.fullname || '',
            email: user.email || '',
            role: user.role || 'Student',
            phone: user.phone || '',
            gender: user.gender || 'Male'
        });
        setShowEditModal(true);
    };

    // 🌟 ส่วนที่เพิ่มใหม่: ฟังก์ชันสำหรับบันทึกการแก้ไข
    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            // ส่ง Request ไปที่ API เพื่ออัปเดตข้อมูล (สมมติว่า Backend ใช้ PUT /api/admin/users/:id)
            await axios.put(`http://localhost:5000/api/admin/users/${editUser.user_id}`, editUser, { 
                headers: { 'x-auth-token': token } 
            });
            alert('✅ อัปเดตข้อมูลผู้ใช้งานสำเร็จ');
            setShowEditModal(false);
            fetchUsers();
        } catch (err) { 
            alert('❌ แก้ไขไม่สำเร็จ: ' + (err.response?.data?.msg || 'Error')); 
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('ยืนยันการลบผู้ใช้งานนี้? ข้อมูลที่เกี่ยวข้องจะถูกลบด้วย')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/admin/users/${id}`, { 
                headers: { 'x-auth-token': token } 
            });
            fetchUsers();
        } catch (err) { 
            alert('❌ ลบไม่สำเร็จ'); 
        }
    };

    const filteredUsers = users.filter(u => 
        (u.fullname || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
        (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleChipClass = (role) => {
        if (role === 'Admin') return 'chip-can'; 
        if (role === 'Psychologist') return 'chip-conf'; 
        return 'chip-comp'; 
    };

    if (loading) return (
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
            <Spinner animation="border" style={{ color: '#003566' }} />
            <p className="mt-3 text-muted fw-semibold">กำลังเชื่อมต่อคลังข้อมูลผู้ใช้งาน...</p>
        </div>
    );

    return (
        <div className="pcshs-archive-container fade-in py-4 px-3 px-md-4">
            
            {/* --- Archive Header --- */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3 archive-header">
                <div className="d-flex align-items-center">
                    <div className="brand-icon-box me-3">
                        <FaUsersCog />
                    </div>
                    <div>
                        <h3 className="fw-bold mb-1 text-dark" style={{ letterSpacing: '-0.5px' }}>บัญชีผู้ใช้งานระบบ</h3>
                        <p className="text-muted m-0 small fw-semibold">จัดการและควบคุมสิทธิ์การเข้าถึงระบบทั้งหมด</p>
                    </div>
                </div>
                <Button className="btn-pcshs-glow rounded-pill px-4 py-2 fw-semibold d-flex align-items-center" onClick={() => setShowModal(true)}>
                    <FaUserPlus className="me-2"/> เพิ่มผู้ใช้ใหม่
                </Button>
            </div>

            {/* --- Glassmorphism Panel --- */}
            <div className="glass-panel mb-4 shadow-sm">
                
                {/* Header ของ Panel */}
                <div className="filter-header-modern justify-content-between">
                    <span><FaSearch className="me-2"/> ฐานข้อมูลผู้ใช้</span>
                    <span className="badge bg-white text-dark rounded-pill px-3 py-2 shadow-sm">
                        ทั้งหมด <span style={{color: '#F25C05'}}>{filteredUsers.length}</span> รายการ
                    </span>
                </div>

                {/* ช่องค้นหา */}
                <div className="p-3 bg-white border-bottom">
                    <Row>
                        <Col md={12} lg={6}>
                            <InputGroup className="modern-input-group shadow-sm border rounded-pill">
                                <InputGroup.Text><FaSearch /></InputGroup.Text>
                                <Form.Control 
                                    placeholder="ค้นหาจากชื่อ-นามสกุล หรือ อีเมล..." 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                    </Row>
                </div>

                {/* --- SLEEK DATA TABLE --- */}
                <div className="table-responsive bg-white">
                    <table className="modern-data-table">
                        <thead>
                            <tr>
                                <th className="ps-4">ชื่อผู้ใช้งาน (Account Name)</th>
                                <th>ข้อมูลการติดต่อ (Contact)</th>
                                <th>สิทธิ์การใช้งาน (Role)</th>
                                <th>วันที่ลงทะเบียน (Joined Date)</th>
                                <th className="text-center pe-4">จัดการ (Action)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(u => {
                                    const dateObj = new Date(u.created_at);
                                    const formattedDate = dateObj.toLocaleDateString('th-TH', { 
                                        day: '2-digit', month: 'short', year: 'numeric' 
                                    });

                                    return (
                                        <tr key={u.user_id}>
                                            <td className="ps-4">
                                                <div className="user-name-bold">{u.fullname}</div>
                                                <div className="id-badge-minimal">
                                                    <FaIdCard className="me-1 text-muted"/> ID: {u.user_id}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="contact-text d-flex align-items-center">
                                                    <FaEnvelope className="text-muted me-2"/> {u.email}
                                                </div>
                                                <div className="contact-sub-text d-flex align-items-center">
                                                    <FaPhone className="me-2"/> {u.phone || 'ไม่ได้ระบุเบอร์โทรศัพท์'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className={`status-chip ${getRoleChipClass(u.role)}`}>
                                                    {u.role === 'Admin' ? 'System Admin' : u.role === 'Psychologist' ? 'Psychologist' : 'Student Account'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="date-text-minimal">
                                                    {formattedDate}
                                                </div>
                                            </td>
                                            <td className="text-center pe-4">
                                                <div className="d-flex justify-content-center">
                                                    {/* 🌟 ปุ่มแก้ไข (เพิ่มใหม่) */}
                                                    <button 
                                                        className="btn-action-minimal me-2"
                                                        onClick={() => handleOpenEditModal(u)}
                                                        title="แก้ไขผู้ใช้งาน"
                                                    >
                                                        <FaEdit className="text-primary" />
                                                    </button>
                                                    {/* ปุ่มลบ (เดิม) */}
                                                    <button 
                                                        className="btn-action-minimal"
                                                        onClick={() => handleDeleteUser(u.user_id)}
                                                        title="ลบผู้ใช้งาน"
                                                    >
                                                        <FaTrash className="text-danger" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5">
                                        <div className="text-center py-5">
                                            <FaFolderOpen size={50} className="mb-3" style={{ opacity: 0.15, color: '#00234B' }} />
                                            <h6 className="fw-bold text-dark">ไม่พบข้อมูลผู้ใช้งาน</h6>
                                            <p className="text-muted small mb-0">ระบบค้นหาไม่พบรายชื่อที่ตรงกับคำที่คุณพิมพ์</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- Modal Add User (ของเดิม) --- */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static" size="lg">
                <Modal.Header closeButton className="border-0 pt-4 px-4 pb-0">
                    <Modal.Title className="fw-bold" style={{color: '#00234B'}}>
                        <FaUsersCog className="me-2 text-muted"/> สร้างบัญชีใหม่
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddUser}>
                    <Modal.Body className="p-4">
                        <div className="mb-4 small text-primary p-3 rounded bg-primary bg-opacity-10 border border-primary border-opacity-25">
                            กรุณากรอกข้อมูลให้ครบถ้วน ข้อมูลรหัสผ่านจะถูกเข้ารหัสผ่านระบบรักษาความปลอดภัย
                        </div>
                        <Row className="g-3">
                            {/* ... (ฟอร์ม Add เดิม) ... */}
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="modern-label">ชื่อ-นามสกุล <span className="text-danger">*</span></Form.Label>
                                    <InputGroup className="modern-input-group shadow-sm border rounded-pill">
                                        <InputGroup.Text><FaUserAlt /></InputGroup.Text>
                                        <Form.Control type="text" required value={newUser.fullname} onChange={e => setNewUser({...newUser, fullname: e.target.value})} placeholder="ระบุชื่อและนามสกุล"/>
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="modern-label">อีเมล <span className="text-danger">*</span></Form.Label>
                                    <InputGroup className="modern-input-group shadow-sm border rounded-pill">
                                        <InputGroup.Text><FaEnvelope /></InputGroup.Text>
                                        <Form.Control type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="example@pcshs.ac.th"/>
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="modern-label">รหัสผ่าน <span className="text-danger">*</span></Form.Label>
                                    <InputGroup className="modern-input-group shadow-sm border rounded-pill">
                                        <InputGroup.Text><FaLock /></InputGroup.Text>
                                        <Form.Control type="password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="ตั้งรหัสผ่านเริ่มต้น" />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="modern-label">เบอร์โทรศัพท์</Form.Label>
                                    <InputGroup className="modern-input-group shadow-sm border rounded-pill">
                                        <InputGroup.Text><FaPhone /></InputGroup.Text>
                                        <Form.Control type="text" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} placeholder="08X-XXX-XXXX"/>
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="modern-label">บทบาท (Role) <span className="text-danger">*</span></Form.Label>
                                    <Form.Select className="shadow-sm border rounded-pill px-3 py-2 text-muted" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                                        <option value="Student">Student (นักเรียน)</option>
                                        <option value="Psychologist">Psychologist (นักจิตฯ)</option>
                                        <option value="Admin">Admin (ผู้ดูแลระบบ)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="modern-label">เพศสภาพ <span className="text-danger">*</span></Form.Label>
                                    <Form.Select className="shadow-sm border rounded-pill px-3 py-2 text-muted" value={newUser.gender} onChange={e => setNewUser({...newUser, gender: e.target.value})}>
                                        <option value="Male">ชาย</option>
                                        <option value="Female">หญิง</option>
                                        <option value="LGBTQ+">LGBTQ+</option>
                                        <option value="Other">ไม่ระบุ</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer className="border-0 px-4 pb-4 pt-0">
                        <Button variant="light" className="px-4 fw-semibold rounded-pill shadow-sm" onClick={() => setShowModal(false)}>ยกเลิก</Button>
                        <Button type="submit" className="btn-pcshs-glow px-4 fw-semibold rounded-pill">
                            บันทึกข้อมูล
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* 🌟 --- Modal Edit User (ส่วนที่เพิ่มใหม่) --- */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered backdrop="static" size="lg">
                <Modal.Header closeButton className="border-0 pt-4 px-4 pb-0">
                    <Modal.Title className="fw-bold" style={{color: '#00234B'}}>
                        <FaEdit className="me-2 text-muted"/> แก้ไขข้อมูลผู้ใช้งาน
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleUpdateUser}>
                    <Modal.Body className="p-4">
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="modern-label">ชื่อ-นามสกุล <span className="text-danger">*</span></Form.Label>
                                    <InputGroup className="modern-input-group shadow-sm border rounded-pill">
                                        <InputGroup.Text><FaUserAlt /></InputGroup.Text>
                                        <Form.Control type="text" required value={editUser.fullname} onChange={e => setEditUser({...editUser, fullname: e.target.value})} placeholder="ระบุชื่อและนามสกุล"/>
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="modern-label">อีเมล <span className="text-danger">*</span></Form.Label>
                                    <InputGroup className="modern-input-group shadow-sm border rounded-pill">
                                        <InputGroup.Text><FaEnvelope /></InputGroup.Text>
                                        <Form.Control type="email" required value={editUser.email} onChange={e => setEditUser({...editUser, email: e.target.value})} placeholder="example@pcshs.ac.th"/>
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            {/* หมายเหตุ: นำฟิลด์รหัสผ่านออกในโหมดแก้ไข เพื่อป้องกันการเผลอบันทึกทับรหัสผ่านเดิมโดยไม่ตั้งใจ */}
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="modern-label">เบอร์โทรศัพท์</Form.Label>
                                    <InputGroup className="modern-input-group shadow-sm border rounded-pill">
                                        <InputGroup.Text><FaPhone /></InputGroup.Text>
                                        <Form.Control type="text" value={editUser.phone} onChange={e => setEditUser({...editUser, phone: e.target.value})} placeholder="08X-XXX-XXXX"/>
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="modern-label">บทบาท (Role) <span className="text-danger">*</span></Form.Label>
                                    <Form.Select className="shadow-sm border rounded-pill px-3 py-2 text-muted" value={editUser.role} onChange={e => setEditUser({...editUser, role: e.target.value})}>
                                        <option value="Student">Student (นักเรียน)</option>
                                        <option value="Psychologist">Psychologist (นักจิตฯ)</option>
                                        <option value="Admin">Admin (ผู้ดูแลระบบ)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="modern-label">เพศสภาพ <span className="text-danger">*</span></Form.Label>
                                    <Form.Select className="shadow-sm border rounded-pill px-3 py-2 text-muted" value={editUser.gender} onChange={e => setEditUser({...editUser, gender: e.target.value})}>
                                        <option value="Male">ชาย</option>
                                        <option value="Female">หญิง</option>
                                        <option value="LGBTQ+">LGBTQ+</option>
                                        <option value="Other">ไม่ระบุ</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer className="border-0 px-4 pb-4 pt-0">
                        <Button variant="light" className="px-4 fw-semibold rounded-pill shadow-sm" onClick={() => setShowEditModal(false)}>ยกเลิก</Button>
                        <Button type="submit" className="btn-pcshs-glow px-4 fw-semibold rounded-pill">
                            บันทึกการแก้ไข
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

        </div>
    );
};

export default UserManagement;