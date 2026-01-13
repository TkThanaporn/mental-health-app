// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; 
import { AuthProvider } from './context/AuthContext'; 

import WelcomePage from './components/common/WelcomePage';
import Login from './components/auth/Login'; 
import Register from './components/auth/Register'; 
import PrivateRoute from './components/routing/PrivateRoute'; 

// ตรวจสอบว่าไฟล์เหล่านี้มีอยู่จริงและ export default แล้ว
import AdminDashboard from './components/admin/AdminDashboard'
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
                    <Route path="/" element={<WelcomePage />} /> 
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    {/* Student Routes - แก้เป็น component={...} */}
                    <Route path="/student/dashboard" element={<PrivateRoute component={StudentDashboard} allowedRoles={['Student']} />} />
                    <Route path="/student/assessment" element={<PrivateRoute component={AssessmentForm} allowedRoles={['Student']} />} />
                    <Route path="/student/book" element={<PrivateRoute component={AppointmentBooking} allowedRoles={['Student']} />} />
                    
                    {/* Psychologist Routes */}
                    <Route path="/psychologist/dashboard" element={<PrivateRoute component={PsychologistDashboard} allowedRoles={['Psychologist']} />} />
                    <Route path="/psychologist/appointments" element={<PrivateRoute component={AppointmentManager} allowedRoles={['Psychologist']} />} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin/dashboard" element={<PrivateRoute component={AdminDashboard} allowedRoles={['Admin']} />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
};
export default App;