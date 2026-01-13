// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import { AuthProvider } from './context/AuthContext';

// Public pages
import WelcomePage from './components/common/WelcomePage';
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
          <Route path="/" element={<WelcomePage />} />
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
