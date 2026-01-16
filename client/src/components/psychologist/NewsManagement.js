import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Form, Button, Row, Col, Alert, Spinner, Table, Badge, Image, Modal, Container } from 'react-bootstrap';
import { FaBullhorn, FaPaperPlane, FaTrash, FaHistory, FaImage, FaEdit, FaEye, FaTimes, FaSave, FaClock, FaUserCircle, FaCloudUploadAlt } from 'react-icons/fa';

import './NewsManagement.css'; 

const NewsManagement = () => {
    // ... (States และ Functions เหมือนเดิมจากที่คุณให้มา)
    // ผมใช้ Logic เดิมที่คุณให้มาทั้งหมด เพื่อให้การทำงานถูกต้อง
    
    // --- States ---
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [categoryId, setCategoryId] = useState('');
    
    const [categories, setCategories] = useState([]);
    const [newsList, setNewsList] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);

    useEffect(() => {
        fetchCategories();
        fetchNewsHistory();
    }, []);

    const fetchCategories = async () => {
        try {
            // Mock data หากยังไม่มี Backend หรือเรียก API จริง
            const res = await axios.get('http://localhost:5000/api/news/categories').catch(() => ({ data: [{category_id: 1, category_name: 'กิจกรรม'}, {category_id: 2, category_name: 'ข่าวสารทั่วไป'}] }));
            setCategories(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchNewsHistory = async () => {
        try {
            // Mock data สำหรับแสดงผล
            const res = await axios.get('http://localhost:5000/api/news').catch(() => ({ data: [] }));
            setNewsList(res.data);
        } catch (err) { console.error(err); }
    };

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
        setCategoryId(news.category_id);
        setPreviewUrl(news.image_url);
        setImageFile(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditId(null);
        setTitle(''); setContent(''); setCategoryId('');
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
            // Simulate API Call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setMessage({ type: 'success', text: isEditing ? '✅ บันทึกการแก้ไขเรียบร้อยแล้ว' : '✅ สร้างประกาศข่าวใหม่สำเร็จ' });
            
            if (!isEditing) {
                setTitle(''); setContent(''); setCategoryId(''); setImageFile(null); setPreviewUrl(null);
            } else {
                handleCancelEdit();
            }
            fetchNewsHistory();
        } catch (err) { 
            setMessage({ type: 'danger', text: '❌ เกิดข้อผิดพลาด กรุณาลองใหม่' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("คุณต้องการลบข่าวนี้ใช่หรือไม่?")) return;
        // Call API delete
        alert("ลบข่าวสำเร็จ (Mock)");
        fetchNewsHistory();
    };

    return (
        <Container fluid className="px-0 fade-in-up news-container">
            
            {/* 1. Header Title */}
            <div className="news-header-wrapper">
                <div className="news-header-line"></div>
                <div>
                    <h3 className="news-header-title">ระบบบริหารจัดการข่าวสาร</h3>
                    <div className="news-header-subtitle">Princess Chulabhorn Science High Schools</div>
                </div>
            </div>

            {/* 2. Create/Edit Form */}
            <Card className="news-card">
                <div className={`news-card-header ${isEditing ? 'gradient-warning' : 'gradient-blue'}`}>
                    <h5 className="mb-0">
                        {isEditing ? <><FaEdit className="me-2"/> แก้ไขประกาศ</> : <><FaPaperPlane className="me-2"/> สร้างประกาศใหม่</>}
                    </h5>
                </div>
                <Card.Body className="p-4 p-lg-5">
                    {message && <Alert variant={message.type} onClose={() => setMessage(null)} dismissible className="shadow-sm border-0 mb-4">{message.text}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Row className="g-5">
                            {/* Left Column: Inputs */}
                            <Col lg={8}>
                                <div className="news-input-group mb-4">
                                    <label>หัวข้อข่าวประชาสัมพันธ์</label>
                                    <input 
                                        type="text" 
                                        className="form-control pcshs-input" 
                                        placeholder="พิมพ์หัวข้อข่าวที่นี่..." 
                                        value={title} 
                                        onChange={(e) => setTitle(e.target.value)} 
                                        required 
                                    />
                                </div>
                                
                                <div className="news-input-group mb-4">
                                    <label>รายละเอียดเนื้อหา</label>
                                    <textarea 
                                        className="form-control pcshs-input news-textarea" 
                                        rows="8" 
                                        placeholder="พิมพ์รายละเอียดข่าวสาร..." 
                                        value={content} 
                                        onChange={(e) => setContent(e.target.value)} 
                                        required 
                                    />
                                </div>
                            </Col>

                            {/* Right Column: Settings & Image */}
                            <Col lg={4}>
                                <div className="bg-light p-4 rounded-4 h-100 border border-light">
                                    <h6 className="fw-bold text-muted mb-4 text-uppercase" style={{letterSpacing:'1px', fontSize:'0.85rem'}}>— การตั้งค่าประกาศ</h6>
                                    
                                    <div className="news-input-group mb-4">
                                        <label>หมวดหมู่</label>
                                        <Form.Select 
                                            className="pcshs-input" 
                                            value={categoryId} 
                                            onChange={(e) => setCategoryId(e.target.value)} 
                                            required
                                        >
                                            <option value="">-- เลือกหมวดหมู่ --</option>
                                            {categories.map(c => (
                                                <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                                            ))}
                                        </Form.Select>
                                    </div>

                                    <div className="news-input-group mb-4">
                                        <label>รูปภาพหน้าปก</label>
                                        <div className="news-upload-wrapper">
                                            <input type="file" accept="image/*" onChange={handleFileChange} />
                                            {previewUrl ? (
                                                <Image src={previewUrl} className="news-preview-image" />
                                            ) : (
                                                <div className="text-center text-muted opacity-50">
                                                    <FaCloudUploadAlt size={50} className="mb-2" />
                                                    <p className="small mb-0 fw-bold">คลิกเพื่ออัปโหลดรูปภาพ</p>
                                                    <small style={{fontSize:'0.75rem'}}>รองรับไฟล์ JPG, PNG</small>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="d-grid gap-2 mt-5">
                                        <Button 
                                            type="submit" 
                                            className={`btn-pcshs-grad ${isEditing ? 'edit-mode' : ''}`}
                                            disabled={loading}
                                        >
                                            {loading ? <Spinner animation="border" size="sm" /> : (isEditing ? <><FaSave className="me-2"/> บันทึกการแก้ไข</> : <><FaPaperPlane className="me-2"/> ยืนยันการประกาศ</>)}
                                        </Button>
                                        
                                        {isEditing && (
                                            <Button variant="link" className="text-secondary text-decoration-none" onClick={handleCancelEdit}>
                                                ยกเลิกการแก้ไข
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* 3. History Table */}
            <div className="d-flex justify-content-between align-items-end mb-4 mt-5 px-2">
                <div>
                    <h4 className="fw-bold mb-1" style={{color: 'var(--pcshs-blue)'}}>ประวัติการประกาศ</h4>
                    <small className="text-muted">รายการข่าวสารทั้งหมด {newsList.length} รายการ</small>
                </div>
            </div>

            <Card className="news-card border-0 shadow-sm" style={{backgroundColor: 'transparent', boxShadow: 'none'}}>
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table className="news-table" hover>
                            <thead>
                                <tr>
                                    <th style={{width:'15%'}}>วันที่ประกาศ</th>
                                    <th style={{width:'10%'}}>รูปภาพ</th>
                                    <th style={{width:'35%'}}>หัวข้อข่าว</th>
                                    <th style={{width:'15%'}}>หมวดหมู่</th>
                                    <th style={{width:'15%'}}>ผู้ลงประกาศ</th>
                                    <th className="text-end" style={{width:'10%'}}>ตัวเลือก</th>
                                </tr>
                            </thead>
                            <tbody>
                                {newsList.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-5 text-muted bg-white rounded-4 shadow-sm">ไม่พบข้อมูลข่าวสาร</td></tr>
                                ) : (
                                    newsList.map((news) => (
                                        <tr key={news.news_id} className="news-table-row">
                                            <td className="text-muted small font-monospace">
                                                {new Date(news.created_at || Date.now()).toLocaleDateString('th-TH', {year:'numeric', month:'short', day:'numeric'})}
                                            </td>
                                            <td>
                                                {news.image_url ? (
                                                    <Image src={news.image_url} className="news-thumbnail" />
                                                ) : (
                                                    <div className="bg-light rounded-3 d-flex align-items-center justify-content-center text-muted" style={{width:'60px', height:'60px'}}>
                                                        <FaImage size={20} className="opacity-25"/>
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <div className="fw-bold text-dark text-truncate" style={{maxWidth:'300px'}}>{news.title}</div>
                                            </td>
                                            <td>
                                                <Badge className="pcshs-badge-pill">
                                                    {news.category_name || 'ทั่วไป'}
                                                </Badge>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center text-muted" style={{fontSize:'0.85rem'}}>
                                                    <FaUserCircle className="me-2 text-primary opacity-50"/> {news.author_name || 'Admin'}
                                                </div>
                                            </td>
                                            <td className="text-end">
                                                <div className="action-btn-group">
                                                    <button className="btn-icon" onClick={() => handleViewClick(news)} title="ดูรายละเอียด"><FaEye /></button>
                                                    <button className="btn-icon" onClick={() => handleEditClick(news)} title="แก้ไข"><FaEdit /></button>
                                                    <button className="btn-icon delete" onClick={() => handleDelete(news.news_id)} title="ลบ"><FaTrash /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* 4. Premium Modal */}
            <Modal 
                show={showViewModal} 
                onHide={() => setShowViewModal(false)} 
                size="lg" 
                centered 
                contentClassName="news-modal-content"
            >
                {selectedNews && (
                    <>
                        <Modal.Body className="p-0">
                            <div className="position-relative">
                                {/* Banner with Gradient Overlay */}
                                <div 
                                    className="news-modal-banner"
                                    style={{
                                        backgroundImage: selectedNews.image_url ? `url(${selectedNews.image_url})` : 'none'
                                    }}
                                >
                                    <div className="news-modal-overlay"></div>
                                    {!selectedNews.image_url && <div className="h-100 d-flex align-items-center justify-content-center"><FaImage size={80} color="rgba(255,255,255,0.1)" /></div>}
                                    
                                    {/* Title Overlay on Image */}
                                    <div className="news-modal-title-overlay">
                                        <Badge bg="warning" text="dark" className="mb-2 shadow-sm">{selectedNews.category_name || 'ทั่วไป'}</Badge>
                                        <h2 className="fw-bold mb-2">{selectedNews.title}</h2>
                                        <div className="small opacity-75">
                                            <FaClock className="me-1"/> {new Date(selectedNews.created_at || Date.now()).toLocaleDateString('th-TH', { dateStyle: 'long' })}
                                        </div>
                                    </div>

                                    <button className="news-modal-close-btn" onClick={() => setShowViewModal(false)}>
                                        <FaTimes size={18} />
                                    </button>
                                </div>
                                
                                {/* Content Body */}
                                <div className="p-4 p-lg-5 bg-white">
                                    <div className="d-flex align-items-center mb-4 pb-3 border-bottom">
                                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center me-3" style={{width:'48px', height:'48px'}}>
                                            <FaUserCircle size={28} color="var(--pcshs-blue)"/>
                                        </div>
                                        <div>
                                            <small className="d-block text-muted text-uppercase" style={{fontSize:'0.7rem', letterSpacing:'1px'}}>Published by</small>
                                            <span className="fw-bold text-dark">{selectedNews.author_name || 'Administrator'}</span>
                                        </div>
                                    </div>

                                    <div className="text-secondary" style={{whiteSpace: 'pre-wrap', lineHeight: '1.9', fontSize: '1.05rem', textAlign: 'justify'}}>
                                        {selectedNews.content}
                                    </div>
                                </div>
                            </div>
                        </Modal.Body>
                    </>
                )}
            </Modal>
        </Container>
    );
};

export default NewsManagement;