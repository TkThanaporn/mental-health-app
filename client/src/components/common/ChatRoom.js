import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { Form, Button, Spinner } from 'react-bootstrap';
import { FaPaperPlane } from 'react-icons/fa';
import './ChatRoom.css';

// ⚠️ ตรวจสอบ URL Backend ให้ถูกต้อง
const socket = io.connect("http://localhost:5000");

// ✅ เพิ่ม receiverId เข้ามาใน props เพื่อใช้บันทึกลงฐานข้อมูล
const ChatRoom = ({ roomID, userId, username, otherName, receiverId, onClose }) => {
    const [currentMessage, setCurrentMessage] = useState("");
    const [messageList, setMessageList] = useState([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    useEffect(() => {
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
            let appointmentId = roomID;
            if (roomID.includes('-')) {
                appointmentId = roomID.split('-')[1];
            }

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
            setLoading(false);
            scrollToBottom();
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        
        if (currentMessage.trim() !== "") {
            // สกัดเอาเฉพาะตัวเลข ID ของการนัดหมายออกมา
            let appointmentId = roomID;
            if (roomID.includes('-')) {
                appointmentId = roomID.split('-')[1];
            }

            // 1. ข้อมูลสำหรับส่งให้ Socket (แสดงผลหน้าจอทันที)
            const socketPayload = {
                room: roomID,
                author: username || "Me",
                authorId: parseInt(userId),
                message: currentMessage,
                time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            };

            // 2. ข้อมูลสำหรับบันทึกลง Database ผ่าน API (ให้ตรงกับ req.body ของ backend)
            const dbPayload = {
                appointment_id: appointmentId,
                sender_id: userId,
                receiver_id: receiverId || 1, // ⚠️ fallback ไว้ที่ 1 กันพัง แต่ของจริงต้องรับจาก props
                message_text: currentMessage
            };

            try {
                // ส่งผ่าน Socket ให้เพื่อนเห็นทันที
                await socket.emit("send_message", socketPayload);
                
                // เรียกใช้ API POST เพื่อบันทึกลงฐานข้อมูล
                await axios.post('http://localhost:5000/api/chat', dbPayload);

                // อัปเดตหน้าจอของตัวเอง
                setMessageList((list) => [...list, socketPayload]);
                setCurrentMessage("");
                scrollToBottom();

            } catch (err) {
                console.error("❌ Error sending message:", err);
                alert("เกิดข้อผิดพลาดในการส่งข้อความ (บันทึกลงฐานข้อมูลไม่สำเร็จ)");
            }
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