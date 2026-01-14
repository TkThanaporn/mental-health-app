// client/src/App.js
import React from 'react';
// 1. เพิ่ม Navigate เข้ามาเพื่อใช้สำหรับการ Redirect
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import { AuthProvider } from './context/AuthContext';

// Public pages
// import WelcomePage from './components/common/WelcomePage'; // 2. ปิดการใช้งานหน้า Welcome
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Private Route
import PrivateRoute from './components/routing/PrivateRoute';

// Dashboards & pages
import AdminDashboard from './components/admin/AdminDashboard';
import PsychologistDashboard from './components/psychologist/PsychologistDashboard';
import StudentDashboard from './components/student/StudentDashboard';
import AssessmentForm from './components/student/AssessmentForm';
import AppointmentBooking from './components/student/AppointmentBooking';
import AppointmentManager from './components/psychologist/AppointmentManager';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>

          {/* ===== Public Routes ===== */}
          
          {/* 3. แก้ไขตรงนี้: เมื่อเข้าหน้าแรก (/) ให้กระโดดไปหน้า /login ทันที */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ===== Student Routes ===== */}
          <Route
            path="/student/dashboard"
            element={
              <PrivateRoute allowedRoles={['Student']}>
                <StudentDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/student/assessment"
            element={
              <PrivateRoute allowedRoles={['Student']}>
                <AssessmentForm />
              </PrivateRoute>
            }
          />

          <Route
            path="/student/book"
            element={
              <PrivateRoute allowedRoles={['Student']}>
                <AppointmentBooking />
              </PrivateRoute>
            }
          />

          {/* ===== Psychologist Routes ===== */}
          <Route
            path="/psychologist/dashboard"
            element={
              <PrivateRoute allowedRoles={['Psychologist']}>
                <PsychologistDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/psychologist/appointments"
            element={
              <PrivateRoute allowedRoles={['Psychologist']}>
                <AppointmentManager />
              </PrivateRoute>
            }
          />

          {/* ===== Admin Routes ===== */}
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute allowedRoles={['Admin']}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />

        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;