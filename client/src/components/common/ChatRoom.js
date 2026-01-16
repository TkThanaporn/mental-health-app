import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { Form, Button, Spinner } from 'react-bootstrap';
import { FaPaperPlane } from 'react-icons/fa';
import './ChatRoom.css';

// ⚠️ ตรวจสอบ URL Backend ให้ถูกต้อง (ถ้ารันคนละ Port ต้องเปลี่ยนตรงนี้)
const socket = io.connect("http://localhost:5000");

const ChatRoom = ({ roomID, userId, username, otherName, onClose }) => {
    const [currentMessage, setCurrentMessage] = useState("");
    const [messageList, setMessageList] = useState([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    useEffect(() => {
        // ถ้าไม่มี roomID ให้หยุดโหลดทันที
        if (!roomID) {
            setLoading(false);
            return;
        }

        console.log(`🔵 Joining Room: ${roomID} as User: ${userId}`);
        socket.emit("join_room", roomID);
        
        // ดึงข้อความเก่า
        fetchHistory();

        const handleReceiveMsg = (data) => {
            setMessageList((list) => [...list, data]);
            scrollToBottom();
        };

        socket.on("receive_message", handleReceiveMsg);

        return () => {
            socket.off("receive_message", handleReceiveMsg);
        };
    }, [roomID]);

    const fetchHistory = async () => {
        try {
            // ป้องกัน Error กรณี roomID ไม่ใช่รูปแบบ "text-id"
            let appointmentId = roomID;
            if (roomID.includes('-')) {
                appointmentId = roomID.split('-')[1];
            }

            // ถ้าไม่มี ID ให้หยุด
            if (!appointmentId) {
                setLoading(false);
                return;
            }

            const res = await axios.get(`http://localhost:5000/api/chat/${appointmentId}`);
            
            const history = res.data.map(msg => ({
                room: roomID,
                author: msg.sender_name || "User",
                authorId: msg.sender_id,
                message: msg.message_text,
                time: new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
            }));

            setMessageList(history);
        } catch (err) {
            console.error("❌ Error fetching chat history:", err);
        } finally {
            // ✅ สำคัญ: ไม่ว่าจะ error หรือสำเร็จ ต้องสั่งปิด Loading เสมอ
            setLoading(false);
            scrollToBottom();
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        
        if (currentMessage.trim() !== "") {
            const messageData = {
                room: roomID,
                author: username || "Me",
                authorId: parseInt(userId),
                message: currentMessage,
                time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            };

            await socket.emit("send_message", messageData);
            setMessageList((list) => [...list, messageData]);
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
        <div className="chat-interface-container">
            <div className="chat-body">
                {loading ? (
                    <div className="chat-loading">
                        <Spinner animation="grow" variant="primary" size="sm"/>
                        <span>กำลังเชื่อมต่อสัญญาณปลอดภัย...</span>
                    </div>
                ) : (
                    <div className="message-container">
                        <div className="system-message">
                            <small>เริ่มการสนทนากับ <b>{otherName}</b> แล้ว</small>
                        </div>

                        {messageList.map((msg, index) => {
                            const isMe = parseInt(msg.authorId) === parseInt(userId);
                            return (
                                <div key={index} className={`message-row ${isMe ? "me" : "other"}`}>
                                    <div className="message-content">
                                        <div className="msg-bubble shadow-sm">
                                            {msg.message}
                                        </div>
                                        <div className="msg-meta">
                                            <span className="msg-time">{msg.time}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={scrollRef} />
                    </div>
                )}
            </div>

            <div className="chat-footer">
                <Form onSubmit={sendMessage} className="d-flex align-items-center gap-2 w-100">
                    <Form.Control
                        type="text"
                        placeholder="พิมพ์ข้อความที่นี่..."
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        className="chat-input-modern"
                    />
                    <Button type="submit" className="btn-send-modern" disabled={!currentMessage.trim()}>
                        <FaPaperPlane />
                    </Button>
                </Form>
            </div>
        </div>
    );
};

export default ChatRoom;