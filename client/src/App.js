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
import AssessmentForm from './components/student/AssessmentForm'; 
import AppointmentBooking from './components/student/AppointmentBooking';
import AppointmentManager from './components/psychologist/AppointmentManager';
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

          {/* ===== Shared Routes (ใช้ร่วมกัน) ===== */}
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
                <AppointmentManager />
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

          {/* ✅ 2. เพิ่ม Route สำหรับหน้าจัดการตารางเวลา */}
          <Route
            path="/psychologist/schedule"
            element={
              <PrivateRoute allowedRoles={['Psychologist']}>
                <ScheduleManager />
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