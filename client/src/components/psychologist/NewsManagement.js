import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Form, Button, Row, Col, Alert, Spinner, Badge, Image, Modal } from 'react-bootstrap';
import { FaBullhorn, FaPaperPlane, FaTrash, FaImage, FaEdit, FaEye, FaTimes, FaSave, FaClock, FaUserCircle, FaCloudUploadAlt, FaList, FaTag } from 'react-icons/fa';

import './NewsManagement.css'; 
import './AllAppointmentList.css'; 

const NewsManagement = () => {
    // --- States ---
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [category, setCategory] = useState(''); 
    
    const [categories, setCategories] = useState([]);
    const [newsList, setNewsList] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);

    // เพิ่ม State สำหรับจัดการ Modal ยืนยันการลบ
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [newsIdToDelete, setNewsIdToDelete] = useState(null);

    useEffect(() => {
        fetchCategories();
        fetchNewsHistory();
    }, []);

    // --- API Calls ---
    const fetchCategories = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/news/categories');
            setCategories(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchNewsHistory = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/news');
            setNewsList(res.data);
        } catch (err) { console.error(err); }
    };

    // --- Handlers ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleEditClick = (news) => {
        setIsEditing(true);
        setEditId(news.news_id);
        setTitle(news.title);
        setContent(news.content);
        setCategory(news.category || news.category_name || ''); 
        setPreviewUrl(news.image_url);
        setImageFile(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditId(null);
        setTitle(''); setContent(''); setCategory('');
        setImageFile(null); setPreviewUrl(null);
    };

    const handleViewClick = (news) => {
        setSelectedNews(news);
        setShowViewModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('category', category); 
            if (imageFile) formData.append('image', imageFile);

            const config = { headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' } };

            if (isEditing) {
                await axios.put(`http://localhost:5000/api/news/${editId}`, formData, config);
                setMessage({ type: 'success', text: '✅ บันทึกการแก้ไขเรียบร้อยแล้ว' });
                handleCancelEdit();
            } else {
                await axios.post('http://localhost:5000/api/news', formData, config);
                setMessage({ type: 'success', text: '✅ สร้างประกาศข่าวใหม่สำเร็จ' });
                setTitle(''); setContent(''); setCategory(''); setImageFile(null); setPreviewUrl(null);
            }
            fetchNewsHistory();
        } catch (err) { 
            console.error(err);
            setMessage({ type: 'danger', text: '❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
        } finally {
            setLoading(false);
        }
    };

    // เปิด Modal ยืนยันก่อนทำการลบ
    const handleOpenDeleteModal = (id) => {
        setNewsIdToDelete(id);
        setShowDeleteModal(true);
    };

    // กดยืนยันลบจริงจากใน Modal
    const handleConfirmDelete = async () => {
        if (!newsIdToDelete) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/news/${newsIdToDelete}`, { headers: { 'x-auth-token': token } });
            setMessage({ type: 'success', text: '🗑️ ลบข่าวสารเรียบร้อยแล้ว' });
            fetchNewsHistory();
        } catch (err) { 
            console.error(err);
            setMessage({ type: 'danger', text: '❌ ลบไม่สำเร็จ เกิดข้อผิดพลาดในระบบ' }); 
        } finally {
            setShowDeleteModal(false);
            setNewsIdToDelete(null);
        }
    };

    return (
        <div className="pcshs-archive-container fade-in-up px-3 px-lg-5 py-4">
            
            {/* 1. Header สไตล์ใหม่ */}
            <div className="archive-header mb-5 d-flex align-items-center">
                <div className="brand-icon-box me-3"><FaBullhorn /></div>
                <div>
                    <h2 className="fw-bold m-0 text-navy display-6 fw-bold" style={{letterSpacing: '-1px'}}>ระบบจัดการข่าวสาร</h2>
                    <p className="text-muted m-0 mt-1 lead fs-6">เผยแพร่ข้อมูลข่าวสารและกิจกรรมสำหรับนักเรียน</p>
                </div>
            </div>

            {/* 2. Form Section */}
            <Card className="glass-panel mb-5 border-0 shadow-sm overflow-hidden">
                <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
                    <div className="fw-bold text-primary d-flex align-items-center fs-5 px-2">
                        {isEditing ? <FaEdit className="me-2"/> : <FaPaperPlane className="me-2"/>}
                        <span>{isEditing ? 'แก้ไขประกาศข่าวสาร' : 'สร้างประกาศข่าวใหม่'}</span>
                    </div>
                    {isEditing && (
                        <Button variant="outline-secondary" size="sm" className="rounded-pill px-3 shadow-sm fw-bold" onClick={handleCancelEdit}>
                            <FaTimes className="me-1"/> ยกเลิก
                        </Button>
                    )}
                </div>
                <Card.Body className="p-4 p-lg-5">
                    {message && <Alert variant={message.type} className="rounded-3 shadow-sm mb-4 border-0 d-flex align-items-center"><strong className="me-2">{message.text}</strong></Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Row className="g-5">
                            {/* Left: Inputs */}
                            <Col lg={8}>
                                <div className="mb-4">
                                    <label className="fw-bold text-navy mb-2">หัวข้อข่าวประชาสัมพันธ์ <span className="text-danger">*</span></label>
                                    <input 
                                        type="text" 
                                        className="form-control form-control-lg bg-light border-0 shadow-none rounded-3 px-4" 
                                        placeholder="ระบุหัวข้อข่าวที่น่าสนใจ..." 
                                        value={title} 
                                        onChange={(e) => setTitle(e.target.value)} 
                                        required 
                                        style={{ fontSize: '1rem' }}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="fw-bold text-navy mb-2">รายละเอียดเนื้อหา <span className="text-danger">*</span></label>
                                    <textarea 
                                        className="form-control bg-light border-0 shadow-none rounded-3 px-4 py-3" 
                                        rows="8" 
                                        placeholder="พิมพ์รายละเอียดข่าวสารที่นี่..." 
                                        value={content} 
                                        onChange={(e) => setContent(e.target.value)} 
                                        required 
                                        style={{ resize: 'none' }}
                                    />
                                </div>
                            </Col>

                            {/* Right: Upload & Settings */}
                            <Col lg={4}>
                                <div className="bg-light p-4 rounded-4 h-100 border-0 shadow-sm d-flex flex-column">
                                    <div className="mb-4">
                                        <label className="fw-bold text-navy mb-2">หมวดหมู่ <span className="text-danger">*</span></label>
                                        <Form.Select 
                                            className="form-select form-select-lg border-0 shadow-none rounded-3" 
                                            value={category} 
                                            onChange={(e) => setCategory(e.target.value)} 
                                            required
                                            style={{ fontSize: '1rem' }}
                                        >
                                            <option value="">-- เลือกหมวดหมู่ --</option>
                                            {categories.map(c => (
                                                <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                                            ))}
                                        </Form.Select>
                                    </div>

                                    <div className="mb-4 flex-grow-1">
                                        <label className="fw-bold text-navy mb-2">รูปภาพหน้าปก</label>
                                        <div className="position-relative d-flex align-items-center justify-content-center bg-white rounded-4 border overflow-hidden shadow-sm" style={{ minHeight: '180px', transition: 'all 0.3s' }}>
                                            <input type="file" accept="image/*" style={{position:'absolute', width:'100%', height:'100%', opacity:0, cursor:'pointer', zIndex:2}} onChange={handleFileChange} />
                                            {previewUrl ? (
                                                <Image src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute' }} />
                                            ) : (
                                                <div className="text-center text-muted opacity-50 z-1 p-3">
                                                    <FaCloudUploadAlt size={40} className="mb-2 text-primary" />
                                                    <p className="small mb-0 fw-bold">คลิกเพื่ออัปโหลดรูปภาพ</p>
                                                    <small style={{fontSize:'0.75rem'}}>รองรับไฟล์ JPG, PNG</small>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Button 
                                        type="submit" 
                                        variant={isEditing ? "warning" : "primary"}
                                        className="w-100 py-3 rounded-pill fw-bold shadow-sm d-flex justify-content-center align-items-center"
                                        disabled={loading}
                                        style={{ fontSize: '1.05rem', transition: 'all 0.3s' }}
                                    >
                                        {loading ? <Spinner animation="border" size="sm" /> : (isEditing ? <><FaSave className="me-2"/> บันทึกการแก้ไข</> : <><FaPaperPlane className="me-2"/> เผยแพร่ประกาศ</>)}
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* 3. Table Section */}
            <div className="glass-panel modern-table-container p-3">
                <div className="table-top-bar-modern d-flex justify-content-between align-items-center mb-3 px-3">
                    <div className="fw-bold pcshs-blue-deep d-flex align-items-center fs-5">
                        <FaList className="me-3 text-primary"/> ประวัติการประกาศข่าวสาร ({newsList.length})
                    </div>
                </div>
                <div className="table-responsive px-2 pb-2 overflow-visible">
                    <table className="pcshs-archive-table w-100">
                        <thead>
                            <tr>
                                <th className="ps-4" style={{width:'15%'}}>วันที่ลงประกาศ</th>
                                <th style={{width:'15%'}}>รูปปก</th>
                                <th style={{width:'35%'}}>หัวข้อข่าว</th>
                                <th style={{width:'15%'}}>หมวดหมู่</th>
                                <th className="text-end pe-4" style={{width:'20%'}}>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {newsList.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-5">
                                        <div className="p-4 d-inline-block opacity-50">
                                            <FaBullhorn className="display-4 text-muted mb-3"/>
                                            <h5 className="text-muted">ยังไม่มีข้อมูลประกาศข่าวสาร</h5>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                newsList.map((news) => {
                                    const date = new Date(news.created_at || Date.now());
                                    return (
                                        <tr key={news.news_id} className="archive-row-card">
                                            <td className="ps-4">
                                                <div className="date-badge">
                                                    <span className="date-day d-block">{date.getDate()}</span>
                                                    <span className="date-month">{date.toLocaleDateString('th-TH', { month: 'short' })}</span>
                                                </div>
                                                <div className="time-sub-modern mt-1">
                                                    ปี {date.getFullYear() + 543}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="rounded-3 overflow-hidden shadow-sm border bg-light d-flex align-items-center justify-content-center" style={{ width: '80px', height: '60px' }}>
                                                    {news.image_url ? (
                                                        <Image src={news.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <FaImage className="text-muted opacity-50" size={24}/>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="fw-bold text-dark text-truncate mb-1 fs-6" style={{maxWidth:'300px'}}>{news.title}</div>
                                                <div className="d-flex align-items-center text-muted" style={{fontSize:'0.85rem'}}>
                                                    <div className="student-avatar-glow me-1" style={{width:'20px', height:'20px', fontSize:'0.7rem', background:'#eef2fc', color:'#3b82f6'}}><FaUserCircle/></div> 
                                                    {news.author_name || 'Admin'}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="info-pill"><FaTag className="me-1 text-primary"/> {news.category_name || news.category || 'ทั่วไป'}</span>
                                            </td>
                                            <td className="text-end pe-4">
                                                <div className="d-flex justify-content-end gap-2">
                                                    <Button variant="light" className="btn-sm rounded-circle shadow-sm border d-flex align-items-center justify-content-center text-primary" style={{width:'35px', height:'35px'}} onClick={() => handleViewClick(news)}>
                                                        <FaEye />
                                                    </Button>
                                                    <Button variant="light" className="btn-sm rounded-circle shadow-sm border d-flex align-items-center justify-content-center text-warning" style={{width:'35px', height:'35px'}} onClick={() => handleEditClick(news)}>
                                                        <FaEdit />
                                                    </Button>
                                                    {/* เปลี่ยนปุ่มลบเดิมให้มาเปิดกล่อง Modal แจ้งเตือนสวยๆ */}
                                                    <Button variant="light" className="btn-sm rounded-circle shadow-sm border d-flex align-items-center justify-content-center text-danger" style={{width:'35px', height:'35px'}} onClick={() => handleOpenDeleteModal(news.news_id)}>
                                                        <FaTrash />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 4. Modal View */}
            <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered className="details-modal">
                {selectedNews && (
                    <Modal.Body className="p-0 border-0 rounded-4 overflow-hidden shadow-lg">
                        <div className="position-relative" style={{height:'350px', background:'#2d3748'}}>
                            {selectedNews.image_url ? (
                                <Image src={selectedNews.image_url} style={{width:'100%', height:'100%', objectFit:'cover', opacity:0.7}} />
                            ) : (
                                <div className="w-100 h-100 d-flex align-items-center justify-content-center opacity-25">
                                    <FaImage size={80} color="white" />
                                </div>
                            )}
                            <div className="position-absolute bottom-0 start-0 p-4 p-lg-5 w-100 text-white" style={{background:'linear-gradient(to top, rgba(0,0,0,0.9), transparent)'}}>
                                <Badge bg="primary" className="mb-3 px-3 py-2 rounded-pill shadow-sm"><FaTag className="me-1"/> {selectedNews.category_name || selectedNews.category}</Badge>
                                <h3 className="fw-bold mb-2">{selectedNews.title}</h3>
                                <div className="small opacity-75 d-flex align-items-center">
                                    <FaClock className="me-2"/> 
                                    {new Date(selectedNews.created_at).toLocaleDateString('th-TH', { dateStyle: 'long' })}
                                    <span className="mx-3">|</span>
                                    <FaUserCircle className="me-2"/>
                                    {selectedNews.author_name || 'Admin'}
                                </div>
                            </div>
                            <button className="position-absolute top-0 end-0 m-3 btn btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center" onClick={() => setShowViewModal(false)} style={{width:40, height:40}}><FaTimes/></button>
                        </div>
                        <div className="p-4 p-lg-5 bg-white">
                            <div className="text-secondary fs-6" style={{whiteSpace: 'pre-wrap', lineHeight: '1.8'}}>{selectedNews.content}</div>
                        </div>
                    </Modal.Body>
                )}
            </Modal>

            {/* 5. Modal ยืนยันการลบแบบโมเดิร์น (เรืองแสงสไตล์มินิมอล) */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered className="delete-confirmation-modal">
                <Modal.Body className="p-4 text-center">
                    <div className="delete-icon-box mx-auto mb-4">
                        <FaTrash size={28} />
                    </div>
                    
                    <h4 className="fw-bold text-navy mb-2" style={{ fontFamily: 'Prompt' }}>ยืนยันการลบข่าวสาร?</h4>
                    <p className="text-muted px-3 mb-4" style={{ fontSize: '0.95rem' }}>
                        คุณแน่ใจหรือไม่ที่จะลบประกาศข่าวสารนี้? เมื่อลบแล้วข้อมูลนี้จะไม่สามารถกู้คืนกลับมาได้อีก
                    </p>

                    <div className="d-flex justify-content-center gap-3">
                        <Button 
                            variant="light" 
                            className="rounded-pill px-4 py-2 border fw-bold text-secondary"
                            onClick={() => setShowDeleteModal(false)}
                            style={{ minWidth: '120px' }}
                        >
                            ยกเลิก
                        </Button>
                        <Button 
                            variant="danger" 
                            className="rounded-pill px-4 py-2 fw-bold shadow-sm btn-delete-confirm"
                            onClick={handleConfirmDelete}
                            style={{ minWidth: '120px', background: 'linear-gradient(135deg, #dc3545 0%, #bd2130 100%)', border: 'none' }}
                        >
                            ยืนยันการลบ
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>

        </div>
    );
};

export default NewsManagement;