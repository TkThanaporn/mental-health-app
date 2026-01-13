// client/src/components/routing/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();

  // ระหว่างเช็คสถานะ login
  if (loading) {
    return (
      <div className="text-center mt-5">
        <h5>Loading...</h5>
      </div>
    );
  }

  // ยังไม่ login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // login แล้ว แต่ role ไม่ตรง
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="container mt-5 text-center">
        <h1 className="text-danger">403 Forbidden</h1>
        <p>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        <p className="text-muted">Role ของคุณ: {role}</p>
      </div>
    );
  }

  // ผ่านทุกเงื่อนไข
  return children;
};

export default PrivateRoute;
