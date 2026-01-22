import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Form, Modal, InputGroup, Card, Row, Col, Badge, Image, Spinner } from 'react-bootstrap';
import { FaSearch, FaUserPlus, FaTrash, FaUserCircle, FaEllipsisV } from 'react-icons/fa';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [newUser, setNewUser] = useState({ 
        fullname: '', 
        email: '', 
        password: '', 
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

    const handleDeleteUser = async (id) => {
        if (!window.confirm('ยืนยันการลบผู้ใช้งานนี้?')) return;
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

    // Filter Users Logic (ป้องกัน Error toLowerCase)
    const filteredUsers = users.filter(u => 
        (u.fullname || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
        (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary"/></div>;

    return (
        <div className="fade-in">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold mb-1" style={{color: '#003566'}}>จัดการข้อมูลผู้ใช้งาน</h4>
                    <p className="text-muted m-0 small">รายชื่อนักเรียน บุคลากร และผู้ดูแลระบบทั้งหมด</p>
                </div>
                <Button 
                    className="btn-pcshs shadow-sm mt-3 mt-md-0" 
                    onClick={() => setShowModal(true)}
                    style={{background: '#003566', border: 'none'}}
                >
                    <FaUserPlus className="me-2"/> เพิ่มผู้ใช้ใหม่
                </Button>
            </div>

            <Card className="border-0 shadow-sm" style={{borderRadius: '16px'}}>
                <Card.Body className="p-0">
                    <div className="p-3 border-bottom bg-light d-flex align-items-center" style={{borderTopLeftRadius: '16px', borderTopRightRadius: '16px'}}>
                        <InputGroup style={{maxWidth: '300px'}}>
                            <InputGroup.Text className="bg-white border-end-0 text-muted"><FaSearch /></InputGroup.Text>
                            <Form.Control 
                                placeholder="ค้นหาชื่อ หรือ อีเมล..." 
                                className="border-start-0 shadow-none" 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                        <div className="ms-auto text-muted small">
                            ทั้งหมด {filteredUsers.length} คน
                        </div>
                    </div>

                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle">
                            <thead className="bg-light text-muted text-uppercase small">
                                <tr>
                                    <th className="ps-4 py-3">ชื่อ-นามสกุล</th>
                                    <th>ข้อมูลติดต่อ</th>
                                    <th>บทบาท</th>
                                    <th>วันที่เข้าร่วม</th>
                                    <th className="text-end pe-4">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(u => (
                                    <tr key={u.user_id}>
                                        <td className="ps-4">
                                            <div className="d-flex align-items-center">
                                                {u.profile_image ? (
                                                    <Image src={u.profile_image} roundedCircle width={40} height={40} className="me-3 border" style={{objectFit:'cover'}} />
                                                ) : (
                                                    <div className="bg-light rounded-circle d-flex align-items-center justify-content-center me-3" style={{width:40, height:40}}>
                                                        <FaUserCircle size={24} className="text-secondary"/>
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="fw-bold text-dark">{u.fullname}</div>
                                                    <div className="small text-muted">ID: {u.user_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-dark">{u.email}</div>
                                            <small className="text-muted">{u.phone || '-'}</small>
                                        </td>
                                        <td>
                                            <Badge 
                                                bg={u.role === 'Admin' ? 'danger' : u.role === 'Psychologist' ? 'info' : 'success'} 
                                                className="fw-normal px-3 py-2 rounded-pill"
                                            >
                                                {u.role}
                                            </Badge>
                                        </td>
                                        <td className="text-muted small">
                                            {new Date(u.created_at).toLocaleDateString('th-TH')}
                                        </td>
                                        <td className="text-end pe-4">
                                            <Button variant="light" size="sm" className="text-danger rounded-circle hover-danger" onClick={() => handleDeleteUser(u.user_id)}>
                                                <FaTrash />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Modal Add User */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold" style={{color: '#003566'}}>เพิ่มผู้ใช้งานใหม่</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddUser}>
                    <Modal.Body className="pt-4">
                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted">ชื่อ-นามสกุล</Form.Label>
                                    <Form.Control type="text" required value={newUser.fullname} onChange={e => setNewUser({...newUser, fullname: e.target.value})} placeholder="ระบุชื่อจริง นามสกุลจริง"/>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted">อีเมล (สำหรับเข้าระบบ)</Form.Label>
                                    <Form.Control type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="example@pcshs.ac.th"/>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted">รหัสผ่าน</Form.Label>
                                    <Form.Control type="password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted">เบอร์โทรศัพท์</Form.Label>
                                    <Form.Control type="text" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted">บทบาท (Role)</Form.Label>
                                    <Form.Select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                                        <option value="Student">Student (นักเรียน)</option>
                                        <option value="Psychologist">Psychologist (นักจิตฯ)</option>
                                        <option value="Admin">Admin (ผู้ดูแลระบบ)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted">เพศสภาพ</Form.Label>
                                    <Form.Select value={newUser.gender} onChange={e => setNewUser({...newUser, gender: e.target.value})}>
                                        <option value="Male">ชาย</option>
                                        <option value="Female">หญิง</option>
                                        <option value="LGBTQ+">LGBTQ+</option>
                                        <option value="Other">ไม่ระบุ</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer className="border-0 pt-0">
                        <Button variant="light" onClick={() => setShowModal(false)}>ยกเลิก</Button>
                        <Button type="submit" style={{backgroundColor: '#003566', border: 'none'}} className="px-4">บันทึกข้อมูล</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default UserManagement;