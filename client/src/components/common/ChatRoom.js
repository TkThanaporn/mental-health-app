import React, { useState } from 'react';
import { Container, Card, Form, Button, ListGroup } from 'react-bootstrap';

const ChatRoom = () => {
    const [messages, setMessages] = useState([
        { id: 1, sender: 'System', text: 'ยินดีต้อนรับสู่ห้องปรึกษา (Demo Mode)', time: '10:00' }
    ]);
    const [newMessage, setNewMessage] = useState('');

    const handleSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        // จำลองการส่งข้อความ (ยังไม่ได้ต่อ Socket.io จริง)
        const msg = {
            id: messages.length + 1,
            sender: 'Me',
            text: newMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages([...messages, msg]);
        setNewMessage('');
    };

    return (
        <Container className="mt-4">
            <Card className="shadow-sm" style={{ height: '80vh' }}>
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">💬 ห้องปรึกษาออนไลน์</h5>
                    <small>สถานะ: พร้อมใช้งาน</small>
                </Card.Header>
                
                {/* ส่วนแสดงข้อความ */}
                <Card.Body className="overflow-auto bg-light" style={{ flex: 1 }}>
                    <ListGroup variant="flush">
                        {messages.map((msg) => (
                            <ListGroup.Item 
                                key={msg.id} 
                                className={`d-flex ${msg.sender === 'Me' ? 'justify-content-end' : 'justify-content-start'} bg-transparent border-0`}
                            >
                                <div 
                                    className={`p-3 rounded-3 shadow-sm ${msg.sender === 'Me' ? 'bg-primary text-white' : 'bg-white text-dark'}`}
                                    style={{ maxWidth: '70%' }}
                                >
                                    <div className="fw-bold small mb-1">{msg.sender}</div>
                                    <div>{msg.text}</div>
                                    <div className={`text-end small mt-1 ${msg.sender === 'Me' ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.75rem' }}>
                                        {msg.time}
                                    </div>
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </Card.Body>

                {/* ช่องพิมพ์ข้อความ */}
                <Card.Footer className="bg-white">
                    <Form onSubmit={handleSend} className="d-flex gap-2">
                        <Form.Control
                            type="text"
                            placeholder="พิมพ์ข้อความปรึกษา..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <Button variant="primary" type="submit">
                            ส่ง
                        </Button>
                    </Form>
                </Card.Footer>
            </Card>
        </Container>
    );
};

export default ChatRoom; // ✅ สำคัญมาก ต้องมีบรรทัดนี้