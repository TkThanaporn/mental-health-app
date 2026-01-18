import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Badge, Modal, Button, Form, InputGroup, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaBullhorn, FaCalendarAlt, FaSearch, FaTag, FaChevronLeft, FaUserCircle, FaImage } from 'react-icons/fa';
import PCSHSNavbar from '../common/Navbar/PCSHSNavbar';

import './StudentNews.css';

const StudentNews = () => {
    const navigate = useNavigate();
    
    // --- States ---
    const [newsList, setNewsList] = useState([]);
    const [filteredNews, setFilteredNews] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedNews, setSelectedNews] = useState(null);

    // --- Fetch Data ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                // ดึงข้อมูลข่าวและหมวดหมู่พร้อมกัน
                const [newsRes, catRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/news'),
                    axios.get('http://localhost:5000/api/news/categories')
                ]);

                setNewsList(newsRes.data);
                setFilteredNews(newsRes.data);
                setCategories(catRes.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching news:", err);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // --- Filter Logic ---
    useEffect(() => {
        let result = newsList;

        // 1. Filter by Category
        if (selectedCategory) {
            result = result.filter(news => news.category_id.toString() === selectedCategory);
        }

        // 2. Filter by Search Term (Title or Content)
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(news => 
                news.title.toLowerCase().includes(lowerTerm) || 
                news.content.toLowerCase().includes(lowerTerm)
            );
        }

        setFilteredNews(result);
    }, [searchTerm, selectedCategory, newsList]);

    // --- Helpers ---
    const getBadgeColor = (catName) => {
        // กำหนดสีตามชื่อหมวดหมู่ (ตัวอย่าง)
        const name = catName || '';
        if (name.includes('กิจกรรม')) return 'success';
        if (name.includes('วิชาการ')) return 'primary';
        if (name.includes('ด่วน')) return 'danger';
        return 'secondary';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="pcshs-dashboard" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            <PCSHSNavbar />

            <Container className="py-5" style={{ marginTop: '70px' }}>
                {/* Header Section */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 fade-in-up">
                    <div className="mb-3 mb-md-0">
                        <Button variant="link" onClick={() => navigate('/student/dashboard')} className="text-decoration-none p-0 mb-2 text-muted">
                            <FaChevronLeft /> กลับหน้าหลัก
                        </Button>
                        <h2 className="fw-bold pcshs-blue-deep m-0"><FaBullhorn className="me-2" />ข่าวสารและประกาศ</h2>
                        <p className="text-muted m-0">ติดตามข่าวสารกิจกรรมและข้อมูลสุขภาพใจล่าสุด</p>
                    </div>
                    
                    {/* Search & Filter */}
                    <div className="d-flex gap-2 flex-column flex-sm-row" style={{ maxWidth: '500px', width: '100%' }}>
                        <Form.Select 
                            className="border-0 shadow-sm" 
                            style={{width: 'auto', minWidth: '150px'}}
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="">ทั้งหมด</option>
                            {categories.map(cat => (
                                <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                            ))}
                        </Form.Select>

                        <InputGroup className="shadow-sm rounded-3 overflow-hidden">
                            <InputGroup.Text className="bg-white border-0">
                                <FaSearch className="text-muted" />
                            </InputGroup.Text>
                            <Form.Control 
                                placeholder="ค้นหาหัวข้อ..." 
                                className="border-0 ps-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </div>
                </div>

                {/* Content Section */}
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-3 text-muted">กำลังโหลดข่าวสาร...</p>
                    </div>
                ) : filteredNews.length === 0 ? (
                    <div className="text-center py-5 bg-white rounded-4 shadow-sm">
                        <FaBullhorn size={50} className="text-muted opacity-25 mb-3"/>
                        <p className="text-muted">ไม่พบข่าวสารที่ค้นหา</p>
                        {(searchTerm || selectedCategory) && (
                            <Button variant="outline-secondary" size="sm" onClick={() => {setSearchTerm(''); setSelectedCategory('');}}>
                                ล้างตัวกรอง
                            </Button>
                        )}
                    </div>
                ) : (
                    <Row className="g-4">
                        {filteredNews.map((news) => (
                            <Col lg={4} md={6} key={news.news_id} className="fade-in-up">
                                <Card 
                                    className="h-100 shadow-sm border-0 rounded-4 overflow-hidden hover-card" 
                                    onClick={() => setSelectedNews(news)} 
                                    style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                                >
                                    {/* Image Section */}
                                    <div style={{ height: '200px', overflow: 'hidden', backgroundColor: '#e9ecef', position: 'relative' }}>
                                        {news.image_url ? (
                                            <img 
                                                src={news.image_url} 
                                                alt={news.title} 
                                                className="w-100 h-100 object-fit-cover" 
                                            />
                                        ) : (
                                            <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                                                <FaImage size={40} opacity={0.3} />
                                            </div>
                                        )}
                                        <div className="position-absolute top-0 end-0 m-3">
                                            <Badge bg={getBadgeColor(news.category_name)} className="shadow-sm">
                                                {news.category_name || 'ทั่วไป'}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Body Section */}
                                    <Card.Body className="p-4 d-flex flex-column">
                                        <div className="mb-2 d-flex align-items-center text-muted small">
                                            <FaCalendarAlt className="me-2 text-warning"/>
                                            {formatDate(news.created_at)}
                                        </div>
                                        
                                        <h5 className="fw-bold mb-2 text-dark line-clamp-2" style={{minHeight: '3rem'}}>
                                            {news.title}
                                        </h5>
                                        
                                        <p className="text-secondary small mb-3 line-clamp-3 flex-grow-1">
                                            {news.content}
                                        </p>
                                        
                                        <div className="pt-3 border-top d-flex justify-content-between align-items-center mt-auto">
                                            <div className="d-flex align-items-center text-muted small">
                                                <FaUserCircle className="me-1"/> {news.author_name || 'Admin'}
                                            </div>
                                            <span className="text-primary fw-bold small">อ่านต่อ &rarr;</span>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </Container>

            {/* View Modal */}
            <Modal show={!!selectedNews} onHide={() => setSelectedNews(null)} size="lg" centered contentClassName="border-0 rounded-4 overflow-hidden">
                {selectedNews && (
                    <>
                        <div className="position-relative bg-dark" style={{height:'300px'}}>
                            {selectedNews.image_url && (
                                <img 
                                    src={selectedNews.image_url} 
                                    alt={selectedNews.title} 
                                    className="w-100 h-100 object-fit-cover opacity-75" 
                                />
                            )}
                            <div className="position-absolute bottom-0 start-0 p-4 w-100" style={{background: 'linear-gradient(transparent, rgba(0,0,0,0.8))'}}>
                                <Badge bg={getBadgeColor(selectedNews.category_name)} className="mb-2">
                                    {selectedNews.category_name}
                                </Badge>
                                <h3 className="text-white fw-bold text-shadow">{selectedNews.title}</h3>
                                <div className="text-white-50 small">
                                    <FaCalendarAlt className="me-2"/>{formatDate(selectedNews.created_at)}
                                    <span className="mx-2">|</span>
                                    <FaUserCircle className="me-2"/>โดย {selectedNews.author_name || 'Admin'}
                                </div>
                            </div>
                            <Button 
                                variant="light" 
                                className="position-absolute top-0 end-0 m-3 rounded-circle shadow-sm" 
                                onClick={() => setSelectedNews(null)}
                                style={{width:'35px', height:'35px', padding:0}}
                            >
                                &#10005;
                            </Button>
                        </div>
                        
                        <Modal.Body className="p-4 p-lg-5 bg-white">
                            <div style={{ whiteSpace: 'pre-line', lineHeight: '1.8', color: '#4a5568', fontSize: '1.05rem' }}>
                                {selectedNews.content}
                            </div>
                        </Modal.Body>
                        
                        <Modal.Footer className="bg-light border-0">
                            <Button variant="secondary" onClick={() => setSelectedNews(null)} className="rounded-pill px-4">
                                ปิดหน้าต่าง
                            </Button>
                        </Modal.Footer>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default StudentNews;