// =============================
// Import Libraries และ Components ที่จำเป็น
// =============================

// React และ Hooks สำหรับจัดการ state และ lifecycle
import React, { useState, useEffect } from 'react';

// Components จาก react-bootstrap สำหรับสร้าง UI
import { Container, Card, Row, Col, Badge, Modal, Button, Form, InputGroup, Spinner } from 'react-bootstrap';

// Hook สำหรับเปลี่ยนเส้นทางหน้า (Navigation)
import { useNavigate } from 'react-router-dom';

// ใช้สำหรับเรียก API ไปยัง Backend
import axios from 'axios';

// Icons จาก react-icons
import { FaBullhorn, FaCalendarAlt, FaSearch, FaChevronLeft, FaUserCircle, FaImage } from 'react-icons/fa';

// Navbar Component ของระบบ
import PCSHSNavbar from '../common/Navbar/PCSHSNavbar';

// ไฟล์ CSS เฉพาะหน้านี้
import './StudentNews.css';


// =============================
// Main Component
// =============================
const StudentNews = () => {

    // ใช้สำหรับสั่งเปลี่ยนหน้า
    const navigate = useNavigate();
    
    // =============================
    // States (ตัวแปรควบคุมข้อมูล)
    // =============================

    const [newsList, setNewsList] = useState([]);
    const [filteredNews, setFilteredNews] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedNews, setSelectedNews] = useState(null);


    // =============================
    // Fetch Data จาก Backend
    // =============================
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


    // =============================
    // Filter Logic
    // =============================
    useEffect(() => {
        let result = newsList;

        // 1. Filter ตามหมวดหมู่ (✅ ใช้ news.category ตาม Database)
        if (selectedCategory) {
            result = result.filter(news => {
                if (!news) return false;
                return String(news.category) === String(selectedCategory);
            });
        }

        // 2. Filter ตามคำค้นหา (ค้นใน title และ content)
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();

            result = result.filter(news => {
                if (!news) return false;
                
                // ใช้ String() ป้องกัน error กรณีเป็นค่าว่าง
                const title = String(news.title || "");
                const content = String(news.content || "");
                
                return title.toLowerCase().includes(lowerTerm) || 
                       content.toLowerCase().includes(lowerTerm);
            });
        }

        setFilteredNews(result);

    }, [searchTerm, selectedCategory, newsList]);


    // =============================
    // Helper Functions
    // =============================

    // กำหนดสี Badge ตามชื่อหมวดหมู่
    const getBadgeColor = (catName) => {
        const name = String(catName || '');

        if (name.includes('กิจกรรม')) return 'success';
        if (name.includes('วิชาการ')) return 'primary';
        if (name.includes('ด่วน')) return 'danger';

        return 'secondary';
    };

    // แปลงวันที่ให้อยู่ในรูปแบบภาษาไทย
    const formatDate = (dateString) => {
        if (!dateString) return '';

        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };


    // =============================
    // UI Section
    // =============================
    return (
        <div className="pcshs-dashboard" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            <PCSHSNavbar />

            <Container className="py-5" style={{ marginTop: '70px' }}>

                {/* Header & Filter Section */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 fade-in-up">

                    <div className="mb-3 mb-md-0">
                        <Button 
                            variant="link" 
                            onClick={() => navigate('/student/dashboard')} 
                            className="text-decoration-none p-0 mb-2 text-muted"
                        >
                            <FaChevronLeft /> กลับหน้าหลัก
                        </Button>
                        <h2 className="fw-bold pcshs-blue-deep m-0">
                            <FaBullhorn className="me-2" />
                            ข่าวสารและประกาศ
                        </h2>
                        <p className="text-muted m-0">
                            ติดตามข่าวสารกิจกรรมและข้อมูลสุขภาพใจล่าสุด
                        </p>
                    </div>
                    
                    <div className="d-flex gap-2 flex-column flex-sm-row" style={{ maxWidth: '500px', width: '100%' }}>
                        
                        {/* Dropdown เลือกหมวดหมู่ (✅ เปลี่ยน value ให้ส่งค่าเป็นชื่อ) */}
                        <Form.Select 
                            className="border-0 shadow-sm" 
                            style={{width: 'auto', minWidth: '150px'}}
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="">ทั้งหมด</option>
                            {categories.map((cat, index) => (
                                <option 
                                    key={index} 
                                    value={cat.category_name || cat.category}
                                >
                                    {cat.category_name || cat.category}
                                </option>
                            ))}
                        </Form.Select>

                        {/* ช่องค้นหา */}
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
                            <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('');
                                }}
                            >
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

                                        {/* ✅ เปลี่ยนเป็น news.category */}
                                        <div className="position-absolute top-0 end-0 m-3">
                                            <Badge bg={getBadgeColor(news.category)} className="shadow-sm">
                                                {news.category || 'ทั่วไป'}
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
                                                <FaUserCircle className="me-1"/> 
                                                {news.author_name || 'Admin'}
                                            </div>
                                            <span className="text-primary fw-bold small">
                                                อ่านต่อ &rarr;
                                            </span>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </Container>


            {/* =============================
                Modal แสดงรายละเอียดข่าว
            ============================= */}
            <Modal 
                show={!!selectedNews} 
                onHide={() => setSelectedNews(null)} 
                size="lg" 
                centered 
                contentClassName="border-0 rounded-4 overflow-hidden"
            >
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

                            <div className="position-absolute bottom-0 start-0 p-4 w-100" 
                                style={{background: 'linear-gradient(transparent, rgba(0,0,0,0.8))'}}>

                                {/* ✅ เปลี่ยนเป็น selectedNews.category */}
                                <Badge bg={getBadgeColor(selectedNews.category)} className="mb-2">
                                    {selectedNews.category || 'ทั่วไป'}
                                </Badge>

                                <h3 className="text-white fw-bold text-shadow">
                                    {selectedNews.title}
                                </h3>

                                <div className="text-white-50 small">
                                    <FaCalendarAlt className="me-2"/>
                                    {formatDate(selectedNews.created_at)}
                                    <span className="mx-2">|</span>
                                    <FaUserCircle className="me-2"/>
                                    โดย {selectedNews.author_name || 'Admin'}
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
                            <Button 
                                variant="secondary" 
                                onClick={() => setSelectedNews(null)} 
                                className="rounded-pill px-4"
                            >
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