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
import PsychologistDashboard from './components/psychologist/PsychologistDashboard';
import AppointmentManager from './components/psychologist/AppointmentManager';
import NewsManagement from './components/psychologist/NewsManagement'; 
import ScheduleManager from './components/psychologist/ScheduleManager';

import StudentDashboard from './components/student/StudentDashboard';
import AssessmentForm from './components/student/AssessmentForm'; 
import AppointmentBooking from './components/student/AppointmentBooking';
import StudentNews from './components/student/StudentNews'; 
import StudentAppointments from './components/student/StudentAppointments'; 

// ✅ 1. Import AdminDashboard
import AdminDashboard from './components/admin/AdminDashboard'; 

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
          
          <Route path="/psychologist/schedule" element={<ScheduleManager />} />   

          {/* ===== Shared Routes ===== */}
          <Route
            path="/profile"
            element={
              <PrivateRoute allowedRoles={['Student', 'Psychologist', 'Admin']}>
                <Profile />
              </PrivateRoute>
            }
          />

          {/* ✅ 2. เพิ่ม ADMIN ROUTES ตรงนี้ */}
          <Route
            path="/admin/*"
            element={
              <PrivateRoute allowedRoles={['Admin']}>
                <AdminDashboard />
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
          <Route
            path="/news"
            element={
              <PrivateRoute allowedRoles={['Student']}>
                <StudentNews />
              </PrivateRoute>
            }
          />
          <Route
            path="/student/appointments"
            element={
              <PrivateRoute allowedRoles={['Student']}>
                <StudentAppointments />
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

        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;