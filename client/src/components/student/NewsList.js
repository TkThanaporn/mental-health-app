import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Row, Col, Badge } from 'react-bootstrap';

const NewsList = () => {
    const [news, setNews] = useState([]);

    useEffect(() => {
        const fetchNews = async () => {
            const res = await axios.get('http://localhost:5000/api/news');
            setNews(res.data);
        };
        fetchNews();
    }, []);

    return (
        <Row>
            {news.map(n => (
                <Col md={6} lg={4} key={n.news_id} className="mb-3">
                    <Card className="h-100 shadow-sm">
                        <Card.Body>
                            <Badge bg="info" className="mb-2">{n.category_name}</Badge>
                            <Card.Title>{n.title}</Card.Title>
                            <Card.Text>{n.content.substring(0, 100)}...</Card.Text>
                        </Card.Body>
                        <Card.Footer className="text-muted small">
                            {new Date(n.created_at).toLocaleDateString('th-TH')}
                        </Card.Footer>
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export default NewsList;