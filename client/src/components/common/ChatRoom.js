import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios'; // ✅ ต้อง import axios
import { Card, Form, Button, ListGroup } from 'react-bootstrap';

// เชื่อมต่อ Socket
const socket = io.connect("http://localhost:5000");

const ChatRoom = ({ appointmentId, currentUserId, userName }) => {
    const [currentMessage, setCurrentMessage] = useState("");
    const [messageList, setMessageList] = useState([]);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (appointmentId) {
            // 1. เข้าห้องแชท
            socket.emit("join_room", appointmentId);
            
            // 2. ✅ ดึงประวัติแชทเก่ามาโชว์ทันที
            fetchOldMessages();
        }

        socket.on("receive_message", (data) => {
            setMessageList((list) => [...list, data]);
            scrollToBottom();
        });

        return () => {
            socket.off("receive_message");
        }
    }, [appointmentId]);

    // ✅ ฟังก์ชันดึงประวัติแชท (เขียนเพิ่มตรงนี้)
    const fetchOldMessages = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/chat/${appointmentId}`);
            
            // แปลงข้อมูลจาก Database ให้เข้ากับ format ของหน้าจอ
            const formattedMessages = res.data.map(msg => ({
                appointmentId: appointmentId,
                senderId: msg.sender_id,
                content: msg.message_text, // ใน DB ชื่อ message_text
                senderName: msg.sender_name || "User",
                time: new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
            }));

            setMessageList(formattedMessages);
            scrollToBottom();
        } catch (err) {
            console.error("Error fetching chat history:", err);
        }
    };

    const sendMessage = async () => {
        if (currentMessage !== "") {
            const messageData = {
                appointmentId: appointmentId,
                senderId: currentUserId,
                content: currentMessage,
                senderName: userName,
                time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            };

            await socket.emit("send_message", messageData);
            setCurrentMessage("");
            scrollToBottom();
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    return (
        <Card className="h-100 shadow-sm border-0">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                <span>💬 ห้องสนทนา</span>
                <small>ID: {appointmentId}</small>
            </Card.Header>
            
            <Card.Body style={{ height: '400px', overflowY: 'auto', background: '#f8f9fa' }}>
                <ListGroup variant="flush">
                    {messageList.map((msg, index) => {
                        const isMe = msg.senderId === currentUserId;
                        return (
                            <div key={index} className={`d-flex mb-2 ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
                                <div 
                                    className={`p-2 px-3 rounded shadow-sm ${isMe ? 'bg-primary text-white' : 'bg-white text-dark'}`}
                                    style={{ maxWidth: '75%', wordWrap: 'break-word', borderRadius: '15px' }}
                                >
                                    {!isMe && <small className="fw-bold d-block text-secondary" style={{fontSize: '0.7rem'}}>{msg.senderName}</small>}
                                    <span>{msg.content}</span>
                                    <small className={`d-block mt-1 ${isMe ? 'text-light' : 'text-muted'}`} style={{fontSize: '0.65rem', textAlign: 'right', opacity: 0.8}}>
                                        {msg.time}
                                    </small>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={scrollRef} />
                </ListGroup>
            </Card.Body>

            <Card.Footer className="bg-white">
                <div className="d-flex">
                    <Form.Control
                        type="text"
                        placeholder="พิมพ์ข้อความ..."
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        autoFocus
                    />
                    <Button variant="primary" className="ms-2" onClick={sendMessage}>
                        ส่ง 🚀
                    </Button>
                </div>
            </Card.Footer>
        </Card>
    );
};

export default ChatRoom;