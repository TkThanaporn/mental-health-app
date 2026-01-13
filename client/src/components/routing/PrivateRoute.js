// client/src/components/routing/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ components: Components, allowedRoles }) => {
    const { isAuthenticated, role } = useAuth();

    if (!isAuthenticated) {
        // ไม่ได้ Login
        return <Navigate to="/login" />;
    }

    if (!allowedRoles.includes(role)) {
        // ไม่มีสิทธิ์
        return <h1>403 Forbidden: Access Denied for role {role}</h1>;
    }

    // มีสิทธิ์
    return <Components />;
};

export default PrivateRoute;