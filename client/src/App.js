// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import { AuthProvider } from './context/AuthContext';

// Public pages
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Private Route
import PrivateRoute from './components/routing/PrivateRoute';

// Dashboards & pages
// หมายเหตุ: ปิด AdminDashboard ไว้ก่อนเพราะยังไม่ได้สร้างไฟล์
// import AdminDashboard from './components/admin/AdminDashboard'; 

import PsychologistDashboard from './components/psychologist/PsychologistDashboard';
import AppointmentManager from './components/psychologist/AppointmentManager';
import NewsManagement from './components/psychologist/NewsManagement'; // ✅ เพิ่ม Import หน้าจัดการข่าวสาร

import StudentDashboard from './components/student/StudentDashboard';
import AssessmentForm from './components/student/AssessmentForm'; 
import AppointmentBooking from './components/student/AppointmentBooking';

// ✅ เพิ่ม Import Profile เข้ามา
import Profile from './components/common/Profile';

// ✅ 1. Import หน้าจัดการตารางเวลาเข้ามา
import ScheduleManager from './components/psychologist/ScheduleManager';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>

          {/* ===== Public Routes ===== */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ===== Shared Routes (ใช้ร่วมกันได้ทุก Role) ===== */}
          <Route
            path="/profile"
            element={
              <PrivateRoute allowedRoles={['Student', 'Psychologist', 'Admin']}>
                <Profile />
              </PrivateRoute>
            }
          />

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

          <Route
            path="/psychologist/news"
            element={
              <PrivateRoute allowedRoles={['Psychologist']}>
                <NewsManagement />
              </PrivateRoute>
            }
          />

          {/* ===== Admin Routes - ปิดไว้เพื่อป้องกัน Error 'AdminDashboard is not defined' ===== */}
          {/* <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute allowedRoles={['Admin']}>
                <AdminDashboard />
              </PrivateRoute>
            }
          /> 
          */}

        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;