import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Spinner } from 'react-bootstrap';
import api from '../../api/client';

interface Club {
  id: number;
  name: string;
}

interface Athlete {
  id: number;
  firstName: string;
  lastName: string;
  club?: { name: string | null } | null;
  gender?: string;
  bowType?: string;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  bloodType?: string | null;
  drawWeightLbs?: number | null;
  drawLengthIn?: number | null;
}

interface ImportUnmatchedItem {
  item: any;
  created?: Athlete;
}

interface CreateAthleteModalProps {
  show: boolean;
  onHide: () => void;
  importUnmatched: ImportUnmatchedItem[];
  createAthleteIndex: number;
  creatingAthlete: boolean;
  onCreate: (athleteData: any) => Promise<void>;
  onSkip: () => void;
  parseAthleteFullName: (name: string) => { firstName: string; lastName: string };
  activeCategory?: any;
}

export default function CreateAthleteModal({
  show,
  onHide,
  importUnmatched,
  createAthleteIndex,
  creatingAthlete,
  onCreate,
  onSkip,
  parseAthleteFullName,
  activeCategory,
}: CreateAthleteModalProps) {
  const currentItem = importUnmatched[createAthleteIndex];
  
  // En IANSEO viene: "APELLIDOS Nombre(s)", entonces invertimos al cargar
  const getInitialNames = () => {
    if (!currentItem) return { firstName: '', lastName: '' };
    const fullName = currentItem.item.name.trim();
    const parts = fullName.split(/\s+/);
    
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    
    // Detectar donde termina el apellido y comienza el nombre
    // Heurística: los apellidos suelen estar en MAYÚSCULAS
    // Los nombres suelen tener la primera letra mayúscula pero el resto minúsculas
    let lastNameEndIndex = 0;
    for (let i = 0; i < parts.length; i++) {
      const word = parts[i];
      // Si la palabra está en MAYÚSCULAS (o es una sola letra mayúscula), probablemente es apellido
      if (word === word.toUpperCase() && word.length > 1) {
        lastNameEndIndex = i + 1;
      } else if (word.length === 1 && word === word.toUpperCase()) {
        // Iniciales en mayúsculas también son apellidos
        lastNameEndIndex = i + 1;
      } else {
        // Si encontramos una palabra que NO está en mayúsculas, el resto es nombre
        break;
      }
    }
    
    // Si no detectamos apellidos, asumir que la primera palabra es apellido
    if (lastNameEndIndex === 0) {
      lastNameEndIndex = 1;
    }
    
    const lastName = parts.slice(0, lastNameEndIndex).join(' ');
    const firstName = parts.slice(lastNameEndIndex).join(' ');
    
    return { 
      firstName: firstName || parts[lastNameEndIndex] || '',
      lastName
    };
  };

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [bowType, setBowType] = useState('');
  const [clubId, setClubId] = useState('INDEPENDENT');
  const [status, setStatus] = useState('active');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubsLoading, setClubsLoading] = useState(false);

  // Cargar clubes cuando el modal se abre
  useEffect(() => {
    if (!show) return;
    
    const loadClubs = async () => {
      setClubsLoading(true);
      try {
        const res = await api.get('/clubs', { params: { limit: 500 } });
        setClubs(res.data?.data || []);
      } catch (err) {
        console.error('Error al cargar clubes:', err);
      } finally {
        setClubsLoading(false);
      }
    };
    
    loadClubs();
  }, [show]);

  // Reinicializar cuando cambia el índice o el modal se abre
  useEffect(() => {
    if (!show) return;
    
    const newInitial = getInitialNames();
    setFirstName(newInitial.firstName);
    setLastName(newInitial.lastName);
    setBirthDate('');
    setGender(activeCategory?.category?.gender || '');
    setBowType(activeCategory?.category?.bowType || '');
    setClubId('INDEPENDENT');
    setStatus('active');
  }, [createAthleteIndex, activeCategory, show]);

  const handleCreate = async () => {
    if (!firstName || !lastName || !gender || !bowType) {
      alert('Nombre, Apellido, Género y Tipo de Arco son requeridos');
      return;
    }

    await onCreate({
      firstName,
      lastName,
      gender,
      bowType,
      clubId: clubId && clubId !== 'INDEPENDENT' ? Number(clubId) : null,
      birthDate: birthDate || null,
      active: status === 'active',
    });
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          Crear Atleta ({createAthleteIndex + 1} de {importUnmatched.length})
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {currentItem && (
          <div>
            <div className="alert alert-info mb-4">
              <strong>📥 IANSEO:</strong> {currentItem.item.name}
            </div>

            <Form>
              {/* Row 1: Nombre y Apellido (obligatorios) */}
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Nombre *</Form.Label>
                    <Form.Control
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      disabled={creatingAthlete}
                      placeholder="Ej: Juan"
                      autoFocus
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Apellido *</Form.Label>
                    <Form.Control
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      disabled={creatingAthlete}
                      placeholder="Ej: Pérez"
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Row 2: Fecha de Nacimiento */}
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Fecha de Nacimiento</Form.Label>
                    <Form.Control
                      type="date"
                      value={birthDate}
                      onChange={e => setBirthDate(e.target.value)}
                      disabled={creatingAthlete}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Row 3: Género y Tipo de Arco (obligatorios) */}
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Género *</Form.Label>
                    <Form.Select
                      value={gender}
                      onChange={e => setGender(e.target.value)}
                      disabled={creatingAthlete}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Tipo de Arco *</Form.Label>
                    <Form.Select
                      value={bowType}
                      onChange={e => setBowType(e.target.value)}
                      disabled={creatingAthlete}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="RECURVE">Recurve</option>
                      <option value="COMPOUND">Compound</option>
                      <option value="BAREBOW">Barebow</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {/* Row 4: Club y Estado */}
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Club *</Form.Label>
                    <Form.Select
                      value={clubId}
                      onChange={e => setClubId(e.target.value)}
                      disabled={creatingAthlete || clubsLoading}
                    >
                      <option value="INDEPENDENT">Independiente (sin club)</option>
                      {clubsLoading
                        ? <option disabled>Cargando clubes...</option>
                        : clubs.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))
                      }
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Estado</Form.Label>
                    <Form.Select
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      disabled={creatingAthlete}
                    >
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="outline-secondary"
          onClick={onSkip}
          disabled={creatingAthlete}
          size="sm"
        >
          ⏭️ Saltar
        </Button>
        <Button
          variant="primary"
          onClick={handleCreate}
          disabled={creatingAthlete || !firstName || !lastName || !gender || !bowType}
        >
          {creatingAthlete ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Creando...
            </>
          ) : (
            "✅ Crear"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
