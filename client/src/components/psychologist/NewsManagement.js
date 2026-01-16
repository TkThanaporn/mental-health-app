import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Form, Button, Row, Col, Alert, Spinner, Badge, Image, Modal, Container } from 'react-bootstrap';
import { FaBullhorn, FaPaperPlane, FaTrash, FaImage, FaEdit, FaEye, FaTimes, FaSave, FaClock, FaUserCircle, FaCloudUploadAlt, FaList } from 'react-icons/fa';

import './NewsManagement.css'; // ✅ ใช้ CSS ใหม่

const NewsManagement = () => {
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
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('category_id', categoryId);
            if (imageFile) formData.append('image', imageFile);

            const config = { headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' } };

            if (isEditing) {
                await axios.put(`http://localhost:5000/api/news/${editId}`, formData, config);
                setMessage({ type: 'success', text: '✅ บันทึกการแก้ไขเรียบร้อยแล้ว' });
                handleCancelEdit();
            } else {
                await axios.post('http://localhost:5000/api/news', formData, config);
                setMessage({ type: 'success', text: '✅ สร้างประกาศข่าวใหม่สำเร็จ' });
                setTitle(''); setContent(''); setCategoryId(''); setImageFile(null); setPreviewUrl(null);
            }
            fetchNewsHistory();
        } catch (err) { 
            console.error(err);
            setMessage({ type: 'danger', text: '❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("ยืนยันการลบข่าวนี้?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/news/${id}`, { headers: { 'x-auth-token': token } });
            fetchNewsHistory();
        } catch (err) { alert("ลบไม่สำเร็จ"); }
    };

    return (
        <div className="pcshs-news-container fade-in-up px-3 px-lg-5 py-4">
            
            {/* 1. Header (เหมือนหน้า Archive) */}
            <div className="news-header mb-5 d-flex align-items-center">
                <div className="brand-icon-box me-4"><FaBullhorn /></div>
                <div>
                    {/* ✅ แก้ไขตรงนี้: เปลี่ยน fw-bold เป็น fw-normal (ไม่หนา) */}
                    <h1 className="fw-bold pcshs-blue-deep m-0 display-6" style={{letterSpacing: '-1px'}}>ระบบจัดการข่าวสาร</h1>
                    <p className="text-muted m-0 mt-2 lead">เผยแพร่ข้อมูลข่าวสารและกิจกรรมสำหรับนักเรียน</p>
                </div>
            </div>

            {/* 2. Form Section (Glass Panel) */}
            <Card className="glass-panel mb-5 border-0">
                <div className="panel-header-modern">
                    <div className="d-flex align-items-center">
                        {isEditing ? <FaEdit className="me-2"/> : <FaPaperPlane className="me-2"/>}
                        <span>{isEditing ? 'แก้ไขประกาศข่าวสาร' : 'สร้างประกาศข่าวใหม่'}</span>
                    </div>
                    {isEditing && (
                        <Button variant="link" className="text-white text-decoration-none p-0" onClick={handleCancelEdit}>
                            <FaTimes className="me-1"/> ยกเลิก
                        </Button>
                    )}
                </div>
                <Card.Body className="p-4 p-lg-5">
                    {message && <Alert variant={message.type} className="rounded-3 shadow-sm mb-4 border-0">{message.text}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Row className="g-5">
                            {/* Left: Inputs */}
                            <Col lg={8}>
                                <div className="mb-4">
                                    <label className="modern-label">หัวข้อข่าวประชาสัมพันธ์</label>
                                    <input 
                                        type="text" 
                                        className="modern-input w-100" 
                                        placeholder="ระบุหัวข้อข่าวที่น่าสนใจ..." 
                                        value={title} 
                                        onChange={(e) => setTitle(e.target.value)} 
                                        required 
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="modern-label">รายละเอียดเนื้อหา</label>
                                    <textarea 
                                        className="modern-textarea w-100" 
                                        rows="8" 
                                        placeholder="พิมพ์รายละเอียดข่าวสารที่นี่..." 
                                        value={content} 
                                        onChange={(e) => setContent(e.target.value)} 
                                        required 
                                    />
                                </div>
                            </Col>

                            {/* Right: Upload & Settings */}
                            <Col lg={4}>
                                <div className="bg-white p-4 rounded-4 h-100 border border-light shadow-sm">
                                    <div className="mb-4">
                                        <label className="modern-label">หมวดหมู่</label>
                                        <Form.Select 
                                            className="modern-select w-100" 
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

                                    <div className="mb-4">
                                        <label className="modern-label">รูปภาพหน้าปก</label>
                                        <div className="modern-upload-box">
                                            <input type="file" accept="image/*" style={{position:'absolute', width:'100%', height:'100%', opacity:0, cursor:'pointer', zIndex:2}} onChange={handleFileChange} />
                                            {previewUrl ? (
                                                <Image src={previewUrl} className="preview-img" />
                                            ) : (
                                                <div className="text-center text-muted opacity-50 position-relative z-1">
                                                    <FaCloudUploadAlt size={40} className="mb-2" />
                                                    <p className="small mb-0 fw-bold">คลิกอัปโหลดรูปภาพ</p>
                                                    <small style={{fontSize:'0.75rem'}}>JPG, PNG</small>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Button 
                                        type="submit" 
                                        className={`btn-modern-action w-100 ${isEditing ? 'edit-mode' : ''}`}
                                        disabled={loading}
                                    >
                                        {loading ? <Spinner animation="border" size="sm" /> : (isEditing ? <><FaSave className="me-2"/> บันทึกการแก้ไข</> : <><FaPaperPlane className="me-2"/> เผยแพร่ประกาศ</>)}
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* 3. Table Section (Glass Panel & Row Cards) */}
            <Card className="glass-panel border-0 p-3">
                <div className="d-flex justify-content-between align-items-center mb-3 px-3 pt-2">
                    <div className="fw-bold pcshs-blue-deep fs-5"><FaList className="me-2"/> ประวัติการประกาศ ({newsList.length})</div>
                </div>
                <div className="table-responsive px-2">
                    <table className="news-table">
                        <thead>
                            <tr>
                                <th style={{width:'15%'}}>วันที่ประกาศ</th>
                                <th style={{width:'10%'}}>รูปปก</th>
                                <th style={{width:'35%'}}>หัวข้อข่าว</th>
                                <th style={{width:'15%'}}>หมวดหมู่</th>
                                <th style={{width:'15%'}}>ผู้ลงประกาศ</th>
                                <th className="text-end" style={{width:'10%'}}>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {newsList.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-5 text-muted">ไม่พบข้อมูลข่าวสาร</td></tr>
                            ) : (
                                newsList.map((news) => {
                                    const date = new Date(news.created_at || Date.now());
                                    return (
                                        <tr key={news.news_id} className="news-row-card">
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="date-box me-2">
                                                        <div className="date-d">{date.getDate()}</div>
                                                        <div className="date-m">{date.toLocaleDateString('th-TH', { month: 'short' })}</div>
                                                    </div>
                                                    <small className="text-muted">{date.getFullYear() + 543}</small>
                                                </div>
                                            </td>
                                            <td>
                                                {news.image_url ? (
                                                    <Image src={news.image_url} className="news-thumb-modern" />
                                                ) : (
                                                    <div className="bg-light rounded text-center py-2 text-muted news-thumb-modern"><FaImage/></div>
                                                )}
                                            </td>
                                            <td>
                                                <div className="fw-bold text-dark text-truncate" style={{maxWidth:'300px'}}>{news.title}</div>
                                            </td>
                                            <td>
                                                <span className="cat-badge">{news.category_name || 'ทั่วไป'}</span>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center text-muted" style={{fontSize:'0.85rem'}}>
                                                    <FaUserCircle className="me-2 text-primary opacity-50"/> {news.author_name || 'Admin'}
                                                </div>
                                            </td>
                                            <td className="text-end">
                                                <div className="d-flex justify-content-end">
                                                    <button className="action-btn-circle" onClick={() => handleViewClick(news)}><FaEye /></button>
                                                    <button className="action-btn-circle" onClick={() => handleEditClick(news)}><FaEdit /></button>
                                                    <button className="action-btn-circle delete" onClick={() => handleDelete(news.news_id)}><FaTrash /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* 4. Modal (เหมือนเดิมแต่เปลี่ยน Class) */}
            <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered contentClassName="modern-modal-content">
                {selectedNews && (
                    <Modal.Body className="p-0">
                        <div className="position-relative" style={{height:'350px', background:'#2d3748'}}>
                            {selectedNews.image_url && <Image src={selectedNews.image_url} style={{width:'100%', height:'100%', objectFit:'cover', opacity:0.6}} />}
                            <div className="position-absolute bottom-0 start-0 p-4 w-100 text-white" style={{background:'linear-gradient(to top, rgba(0,0,0,0.8), transparent)'}}>
                                <Badge bg="warning" text="dark" className="mb-2">{selectedNews.category_name}</Badge>
                                <h3 className="fw-bold">{selectedNews.title}</h3>
                                <div className="small opacity-75"><FaClock className="me-1"/> {new Date(selectedNews.created_at).toLocaleDateString('th-TH', { dateStyle: 'long' })}</div>
                            </div>
                            <button className="position-absolute top-0 end-0 m-3 btn btn-light rounded-circle shadow-sm" onClick={() => setShowViewModal(false)} style={{width:40, height:40}}><FaTimes/></button>
                        </div>
                        <div className="p-4 bg-white">
                            <div className="text-secondary" style={{whiteSpace: 'pre-wrap', lineHeight: '1.8'}}>{selectedNews.content}</div>
                        </div>
                    </Modal.Body>
                )}
            </Modal>
        </div>
    );
};

export default NewsManagement;