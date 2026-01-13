// AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. สร้าง Context
const AuthContext = createContext();

// 2. Provider Component (ใช้หุ้ม App component)
export const AuthProvider = ({ children }) => {
    // ดึงสถานะเริ่มต้นจาก Local Storage
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
    const [role, setRole] = useState(localStorage.getItem('role') || null);
    const [userId, setUserId] = useState(null); // เก็บ User ID สำหรับ Chat

    useEffect(() => {
        // สามารถเพิ่ม Logic ตรวจสอบ Token เมื่อ Component โหลดครั้งแรกได้ที่นี่
        if (localStorage.getItem('token')) {
            // **TODO: ควร Decode JWT เพื่อดึง User ID ที่นี่ **
            // สำหรับตอนนี้เราจะกำหนดแบบง่าย ๆ
            setUserId(localStorage.getItem('userId')); 
        }
    }, []);

    const login = (token, userRole, id) => {
        localStorage.setItem('token', token);
        localStorage.setItem('role', userRole);
        localStorage.setItem('userId', id); 
        setIsAuthenticated(true);
        setRole(userRole);
        setUserId(id);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        setIsAuthenticated(false);
        setRole(null);
        setUserId(null);
        window.location.href = '/login'; // Redirect ไปหน้า Login
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, role, userId, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// 3. Custom Hook สำหรับเรียกใช้ Context
export const useAuth = () => useContext(AuthContext);