import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Card, Row, Col, Badge, Container, 
  Form, InputGroup, Button, Spinner,
  Pagination, Dropdown, Alert
} from 'react-bootstrap';
import { Search, Filter, Calendar, Eye } from 'react-bootstrap-icons';

const NewsList = () => {
  const [news, setNews] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [viewCounts, setViewCounts] = useState({});

  // สีสำหรับหมวดหมู่ข่าว
  const categoryColors = {
    'การเมือง': 'primary',
    'เศรษฐกิจ': 'success',
    'กีฬา': 'warning',
    'บันเทิง': 'info',
    'เทคโนโลยี': 'secondary',
    'สุขภาพ': 'danger',
    'การศึกษา': 'dark',
    'ทั่วไป': 'light'
  };

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        // ถ้าไม่มี API จริง เราจะใช้ข้อมูลตัวอย่าง
        if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_API_URL) {
          // ข้อมูลตัวอย่างสำหรับ development
          const sampleNews = generateSampleNews();
          setNews(sampleNews);
          setFilteredNews(sampleNews);
          
          // สร้างรายการหมวดหมู่จากข้อมูลตัวอย่าง
          const uniqueCategories = ['ทั้งหมด', ...new Set(sampleNews.map(item => item.category_name))];
          setCategories(uniqueCategories);
        } else {
          // ถ้าใช้ API จริง
          const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/news';
          const res = await axios.get(apiUrl);
          setNews(res.data);
          setFilteredNews(res.data);
          
          // ดึงข้อมูลหมวดหมู่ (อาจมาจาก API อื่น หรือแยกจากข้อมูลข่าว)
          const categoryRes = await axios.get(`${apiUrl}/categories`);
          setCategories(['ทั้งหมด', ...categoryRes.data]);
        }
        
        // โหลดจำนวนการดูจาก localStorage (จำลอง)
        const savedViews = localStorage.getItem('newsViews');
        if (savedViews) {
          setViewCounts(JSON.parse(savedViews));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('ไม่สามารถโหลดข่าวได้ กรุณาลองใหม่อีกครั้ง');
        setLoading(false);
      }
    };
    
    fetchNews();
  }, []);

  // ฟังก์ชันสร้างข้อมูลตัวอย่าง
  const generateSampleNews = () => {
    const sampleCategories = ['การเมือง', 'เศรษฐกิจ', 'กีฬา', 'บันเทิง', 'เทคโนโลยี', 'สุขภาพ'];
    const sampleTitles = [
      'รัฐบาลเตรียมมาตรการเยียวยาประชาชนหลังอุทกภัย',
      'ตลาดหุ้นไทยปิดตลาดเช้าในแดนบวก',
      'ทีมฟุตบอลไทยเตรียมลุยศึกเอเชี่ยนเกมส์',
      'ดาราดังเปิดตัวภาพยนตร์เรื่องใหม่',
      'บริษัทเทคโนโลยีเปิดตัวสมาร์ทโฟนรุ่นล่าสุด',
      'แพทย์เตือนภาวะสุขภาพหลังทำงานบ้านระยะยาว',
      'มหาวิทยาลัยชั้นนำเปิดหลักสูตรออนไลน์ฟรี',
      'เทศกาลอาหารแห่งปีเปิดฉากแล้วที่กรุงเทพ'
    ];
    
    const sampleContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
    
    return Array.from({ length: 18 }, (_, i) => ({
      news_id: i + 1,
      title: sampleTitles[i % sampleTitles.length],
      content: sampleContent,
      category_name: sampleCategories[i % sampleCategories.length],
      created_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      views: Math.floor(Math.random() * 1000),
      author: ['กองบรรณาธิการ', 'ผู้สื่อข่าวพิเศษ', 'สมาชิก'][i % 3]
    }));
  };

  // ฟังก์ชันกรองข่าวตามคำค้นหาและหมวดหมู่
  useEffect(() => {
    let result = news;
    
    // กรองตามหมวดหมู่
    if (selectedCategory !== 'ทั้งหมด') {
      result = result.filter(item => item.category_name === selectedCategory);
    }
    
    // กรองตามคำค้นหา
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(term) || 
        item.content.toLowerCase().includes(term)
      );
    }
    
    setFilteredNews(result);
    setCurrentPage(1); // รีเซ็ตไปหน้าที่ 1 เมื่อมีการกรอง
  }, [news, selectedCategory, searchTerm]);

  // ฟังก์ชันจำลองการเพิ่มจำนวนการดู
  const handleViewNews = (newsId) => {
    const newViewCounts = { ...viewCounts, [newsId]: (viewCounts[newsId] || 0) + 1 };
    setViewCounts(newViewCounts);
    localStorage.setItem('newsViews', JSON.stringify(newViewCounts));
    
    // ในแอปจริงอาจเรียก API เพื่อบันทึกสถิติการดู
    // axios.post(`/api/news/${newsId}/view`);
  };

  // คำนวณข่าวสำหรับหน้าแสดงผลปัจจุบัน
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNews = filteredNews.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);

  // สร้างหมายเลขหน้า
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // ฟอร์แมตวันที่
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('th-TH', options);
  };

  // ฟังก์ชันจัดการการค้นหา
  const handleSearch = (e) => {
    e.preventDefault();
    // ถูกจัดการใน useEffect แล้ว
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4 text-center text-primary">ข่าวสารล่าสุด</h1>
      
      {/* ส่วนค้นหาและกรอง */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={6} className="mb-3 mb-md-0">
              <Form onSubmit={handleSearch}>
                <InputGroup>
                  <InputGroup.Text>
                    <Search />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="ค้นหาข่าว..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button variant="primary" type="submit">
                    ค้นหา
                  </Button>
                </InputGroup>
              </Form>
            </Col>
            
            <Col md={6}>
              <div className="d-flex align-items-center">
                <Filter className="me-2" />
                <span className="me-2">หมวดหมู่:</span>
                <div className="d-flex flex-wrap">
                  {categories.slice(0, 6).map(category => (
                    <Badge 
                      key={category}
                      bg={selectedCategory === category ? categoryColors[category] || 'primary' : 'light'}
                      text={selectedCategory === category ? 'white' : 'dark'}
                      className="me-2 mb-1 cursor-pointer"
                      onClick={() => setSelectedCategory(category)}
                      style={{ cursor: 'pointer' }}
                    >
                      {category}
                    </Badge>
                  ))}
                  
                  {categories.length > 6 && (
                    <Dropdown className="d-inline">
                      <Dropdown.Toggle variant="light" size="sm" id="dropdown-categories">
                        อื่นๆ
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        {categories.slice(6).map(category => (
                          <Dropdown.Item 
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                          >
                            {category}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  )}
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* แสดงสถานะการโหลด */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">กำลังโหลดข่าว...</p>
        </div>
      )}
      
      {/* แสดงข้อผิดพลาด */}
      {error && !loading && (
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      )}
      
      {/* สถิติ */}
      {!loading && !error && (
        <div className="mb-3 text-muted">
          พบข่าวทั้งหมด {filteredNews.length} รายการ 
          {selectedCategory !== 'ทั้งหมด' && ` ในหมวดหมู่ ${selectedCategory}`}
          {searchTerm && ` สำหรับคำค้นหา "${searchTerm}"`}
        </div>
      )}
      
      {/* แสดงรายการข่าว */}
      {!loading && !error && (
        <>
          <Row>
            {currentNews.length > 0 ? (
              currentNews.map(n => (
                <Col md={6} lg={4} key={n.news_id} className="mb-4">
                  <Card 
                    className="h-100 shadow-sm hover-shadow transition-all"
                    onClick={() => handleViewNews(n.news_id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="position-relative">
                      <div className="category-badge">
                        <Badge bg={categoryColors[n.category_name] || 'primary'}>
                          {n.category_name}
                        </Badge>
                      </div>
                      {/* รูปภาพข่าว (ตัวอย่าง) */}
                      <div 
                        className="news-image" 
                        style={{
                          height: '180px',
                          backgroundColor: `#${((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0')}`,
                          backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)',
                          borderTopLeftRadius: '0.375rem',
                          borderTopRightRadius: '0.375rem'
                        }}
                      >
                        <div className="h-100 d-flex align-items-center justify-content-center text-white">
                          <h4 className="p-3 text-center">{n.title.substring(0, 30)}...</h4>
                        </div>
                      </div>
                    </div>
                    
                    <Card.Body className="d-flex flex-column">
                      <Card.Title className="flex-grow-1">{n.title}</Card.Title>
                      <Card.Text className="text-muted flex-grow-1">
                        {n.content.substring(0, 120)}...
                      </Card.Text>
                      
                      <div className="mt-auto">
                        <div className="d-flex justify-content-between align-items-center text-muted small">
                          <div>
                            <Calendar className="me-1" />
                            {formatDate(n.created_at)}
                          </div>
                          <div>
                            <Eye className="me-1" />
                            {viewCounts[n.news_id] || n.views || 0}
                          </div>
                        </div>
                        
                        {n.author && (
                          <div className="mt-2 small">
                            โดย: <span className="fst-italic">{n.author}</span>
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <Col className="text-center py-5">
                <Alert variant="info">
                  ไม่พบข่าวที่ตรงกับการค้นหา
                </Alert>
              </Col>
            )}
          </Row>
          
          {/* การแบ่งหน้า */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.Prev 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                />
                
                {pageNumbers.map(number => (
                  <Pagination.Item
                    key={number}
                    active={number === currentPage}
                    onClick={() => setCurrentPage(number)}
                  >
                    {number}
                  </Pagination.Item>
                ))}
                
                <Pagination.Next
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}
        </>
      )}
      
      {/* CSS เพิ่มเติม */}
      <style>{`
        .hover-shadow:hover {
          box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
          transform: translateY(-5px);
          transition: all 0.3s ease;
        }
        
        .category-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 1;
        }
        
        .news-image {
          overflow: hidden;
        }
        
        .cursor-pointer {
          cursor: pointer;
        }
        
        .transition-all {
          transition: all 0.3s ease;
        }
      `}</style>
    </Container>
  );
};

export default NewsList;