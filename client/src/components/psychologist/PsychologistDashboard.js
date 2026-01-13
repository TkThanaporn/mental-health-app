import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

const PsychologistDashboard = () => {
  const { logout } = useAuth();

  return (
    <Container className="mt-5">
      <h1>ยินดีต้อนรับ นักจิตวิทยา</h1>
      <p>แดชบอร์ดนักจิตวิทยา</p>

      <Button variant="danger" onClick={logout}>
        ออกจากระบบ
      </Button>
    </Container>
  );
};

export default PsychologistDashboard;
