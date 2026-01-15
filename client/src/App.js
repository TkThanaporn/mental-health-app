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
import AdminDashboard from './components/admin/AdminDashboard';
import PsychologistDashboard from './components/psychologist/PsychologistDashboard';
import StudentDashboard from './components/student/StudentDashboard';
import AssessmentForm from './components/student/AssessmentForm'; // แก้ชื่อ component ให้ตรงกับไฟล์จริง (AssessmentPHQ9 หรือ AssessmentForm)
import AppointmentBooking from './components/student/AppointmentBooking';
import AppointmentManager from './components/psychologist/AppointmentManager';

// ✅ 1. เพิ่ม Import Profile เข้ามา
import Profile from './components/common/Profile';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>

          {/* ===== Public Routes ===== */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ===== ✅ Shared Routes (ใช้ร่วมกันได้ทุก Role) ===== */}
          <Route
            path="/profile"
            element={
              // อนุญาตให้เข้าได้ทั้ง Student, Psychologist และ Admin
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
                {/* ตรวจสอบชื่อ Component ให้ตรงกับไฟล์ที่คุณสร้าง (AssessmentPHQ9) */}
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
              // ใช้ Dashboard ตัวเดียวกับ AppointmentManager หรือแยกกันตามดีไซน์
              <PrivateRoute allowedRoles={['Psychologist']}>
                <AppointmentManager /> 
              </PrivateRoute>
            }
          />
          
          {/* ถ้ามี path นี้ซ้ำกับ dashboard ข้างบน ให้เลือกใช้อันใดอันหนึ่งครับ */}
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