// client/src/components/psychologist/AppointmentManager.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Button, Row, Col, Alert } from 'react-bootstrap';

const AppointmentManager = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/psychologists/appointments', {
                headers: { 'x-auth-token': token }
            });
            setAppointments(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch appointments.");
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/appointments/${id}/status`, { status }, {
                headers: { 'x-auth-token': token }
            });
            alert(`Appointment ${id} ${status} successfully.`);
            fetchAppointments(); // Refresh list 
        } catch (err) {
            setError(`Failed to update status: ${status}`);
        }
    };

    if (loading) return <Container className="my-4"><p>Loading appointments...</p></Container>;
    if (error) return <Container className="my-4"><Alert variant="danger">{error}</Alert></Container>;

    return (
        <Container className="my-4">
            <h2>จัดการนัดหมาย (1.3.3.5)</h2>
            {appointments.length === 0 && <p>No pending appointments.</p>}
            {/* ... (Render appointment cards) ... */}
            <Row>
                {appointments.map(app => (
                    <Col md={6} lg={4} key={app.appointment_id} className="mb-4">
                        <Card>
                            <Card.Body>
                                <h5>{app.topic}</h5>
                                <p><strong>Student:</strong> {app.student_name} ({app.education_level})</p>
                                <p><strong>Status:</strong> {app.status}</p>
                                {app.status === 'Pending' && (
                                    <>
                                        <Button variant="success" size="sm" onClick={() => handleStatusChange(app.appointment_id, 'Confirmed')}>ยืนยัน</Button>
                                        <Button variant="danger" size="sm" className="ms-2" onClick={() => handleStatusChange(app.appointment_id, 'Cancelled')}>ยกเลิก</Button>
                                    </>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
};

export default AppointmentManager;