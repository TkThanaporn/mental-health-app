// client/src/components/routing/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ปรับให้รับเป็น 'component' (ไม่มี s) และ Alias เป็น 'Component' (ตัวใหญ่)
const PrivateRoute = ({ component: Component, allowedRoles }) => {
    const { isAuthenticated, role, loading } = useAuth(); // เพิ่ม loading ถ้ามีใน Context

    // ป้องกันการเด้งไปหน้า Login ขณะที่กำลังเช็คสถานะ Auth
    if (loading) return <div>Loading...</div>;

    if (!isAuthenticated) {
        // ไม่ได้ Login
        return <Navigate to="/login" />;
    }

    // ตรวจสอบว่า allowedRoles มีค่า และ role ของผู้ใช้มีสิทธิ์หรือไม่
    if (allowedRoles && !allowedRoles.includes(role)) {
        // ไม่มีสิทธิ์
        return (
            <div className="container mt-5 text-center">
                <h1 className="text-danger">403 Forbidden</h1>
                <p>คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (Role: {role})</p>
            </div>
        );
    }

    // มีสิทธิ์: แสดงผลคอมโพเนนต์ที่ส่งมา
    return <Component />;
};

export default PrivateRoute;