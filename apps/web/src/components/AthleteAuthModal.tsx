import { useState } from 'react';
import { Button, Form, Alert, Modal, Spinner } from 'react-bootstrap';
import { authApi, athletesApi, Athlete } from '../api/client';
import { formatError } from '../utils/errors';

interface AthleteAuthProps {
  athlete: Athlete;
  onSuccess: (token: string) => void;
}

export default function AthleteAuthModal({ athlete, onSuccess }: AthleteAuthProps) {
  const [showRegister, setShowRegister] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      const response = await authApi.registerAthlete(athlete.id, password);
      const token = response.data.data.token;
      localStorage.setItem('token', token);
      setSuccess('¡Registro exitoso!');
      setTimeout(() => {
        setShowRegister(false);
        onSuccess(token);
      }, 1500);
    } catch (err: any) {
      setError(formatError(err) || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-4 p-3 bg-info bg-opacity-10 border border-info rounded">
        <h5>📸 Actualiza tu foto</h5>
        <p className="mb-2 text-muted">Crea una cuenta para subir tu foto de perfil</p>
        <Button variant="primary" size="sm" onClick={() => setShowRegister(true)}>
          Crear cuenta
        </Button>
      </div>

      <Modal show={showRegister} onHide={() => setShowRegister(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Crear Cuenta de Atleta</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRegister}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={athlete.email || ''} disabled />
              <Form.Text className="text-muted">
                Este es el email registrado en el sistema
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Contraseña *</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirmar Contraseña *</Form.Label>
              <Form.Control
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowRegister(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? <Spinner size="sm" className="me-2" /> : ''}
              Crear Cuenta
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
