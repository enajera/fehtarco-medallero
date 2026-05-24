import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Form, Modal, Row, Col, Alert, Badge } from 'react-bootstrap';
import { eventsApi, categoriesApi, modalitiesApi, eventCategoriesApi } from '../../api/client';
import Loading from '../../components/Loading';
import { formatError } from '../../utils/errors';
import { formatDistance } from '../../utils/format';

interface EventCategory {
  id: number;
  categoryId: number;
  modalityId: number;
  category: { id: number; bowType: string; gender: string; division: string };
  modality: { id: number; name: string };
  phases?: string[] | Array<{ id: number; name: string; order: number }>;  // Puede ser array de strings o array de objetos
  distance?: string;
  _count?: { results: number };
}

interface EventDetail {
  id: number;
  name: string;
  organizer: string;
  location: string;
  country: string;
  startDate: string;
  endDate: string;
  eventScope: string;
  technicalLevel: string;
  distance?: string;
  official: boolean;
  clubMedalsEnabled: boolean;
  eventCategories: EventCategory[];
}

interface Category {
  id: number;
  bowType: string;
  gender: string;
  division: string;
}

interface Modality {
  id: number;
  name: string;
}

export default function AdminEventConfig() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingEventCategoryId, setEditingEventCategoryId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    categoryId: '',
    modalityId: '',
    phases: ['QUALIFICATION', 'FINAL'],
    distance: '',
  });

  // formatError imported from utils

  const phaseOptions = [
    { value: 'QUALIFICATION', label: 'Clasificación' },
    { value: 'ELIMINATION', label: 'Eliminatorias' },
    { value: 'SEMI_FINAL', label: 'Semifinal' },
    { value: 'BRONZE_MATCH', label: 'Match Bronce' },
    { value: 'FINAL', label: 'Final' },
  ];

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [eventRes, categoriesRes, modalitiesRes] = await Promise.all([
        eventsApi.getById(Number(id)),
        categoriesApi.getAll(),
        modalitiesApi.getAll(),
      ]);
      
      setEvent(eventRes.data.data as EventDetail);
      setCategories(categoriesRes.data.data);
      setModalities(modalitiesRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = () => {
    setEditingEventCategoryId(null);
    setFormData({
      categoryId: categories[0]?.id?.toString() || '',
      modalityId: modalities[0]?.id?.toString() || '',
      phases: ['QUALIFICATION', 'FINAL'],
      distance: '',
    });
    setShowModal(true);
    setError('');
  };

  const handleEditCategory = (ec: EventCategory) => {
    setEditingEventCategoryId(ec.id);
    
    // Convertir phases a array de strings si es necesario
    let phases: string[] = ['QUALIFICATION', 'FINAL'];
    if (ec.phases?.length) {
      if (typeof ec.phases[0] === 'string') {
        phases = ec.phases as string[];
      } else {
        phases = (ec.phases as any[]).map((p: any) => p.name);
      }
    }
    
    setFormData({
      categoryId: ec.category?.id?.toString() || '',
      modalityId: ec.modality?.id?.toString() || '',
      phases,
      distance: ec.distance || '',
    });
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
  };

  const handlePhaseToggle = (phase: string) => {
    setFormData(prev => ({
      ...prev,
      phases: prev.phases.includes(phase)
        ? prev.phases.filter(p => p !== phase)
        : [...prev.phases, phase],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.phases.length === 0) {
      setError('Debe seleccionar al menos una fase');
      return;
    }

    try {
      // Close modal immediately to make UI feel snappier
      setShowModal(false);

      // Optimistically update local event state so the table updates quickly
      const updatedCategoryPreview = {
        id: editingEventCategoryId || Date.now(),
        category: categories.find((c) => c.id === Number(formData.categoryId)) || { id: Number(formData.categoryId), bowType: '', gender: '', division: '' },
        modality: modalities.find((m) => m.id === Number(formData.modalityId)) || { id: Number(formData.modalityId), name: '' },
        distance: formData.distance || undefined,
        _count: { results: 0 },
        phases: formData.phases,  // Usar las fases seleccionadas
      } as any;

      setEvent((prev) => {
        if (!prev) return prev;
        const existing = prev.eventCategories || [];
        if (editingEventCategoryId) {
          return { ...prev, eventCategories: existing.map((ec) => (ec.id === editingEventCategoryId ? updatedCategoryPreview : ec)) };
        }
        return { ...prev, eventCategories: [...existing, updatedCategoryPreview] };
      });

      // Send request
      if (editingEventCategoryId) {
        const updatePayload = {
          categoryId: Number(formData.categoryId),
          modalityId: Number(formData.modalityId),
          phases: formData.phases,
          distance: formData.distance || undefined,
        };
        console.log('[AdminEventConfig] Enviando UPDATE:', updatePayload);
        await eventCategoriesApi.update(editingEventCategoryId, updatePayload);
        setSuccess('Categoría actualizada correctamente');
      } else {
        const createPayload = {
          categoryId: Number(formData.categoryId),
          modalityId: Number(formData.modalityId),
          phases: formData.phases,
          distance: formData.distance || undefined,
        };
        console.log('[AdminEventConfig] Enviando CREATE:', createPayload);
        await eventsApi.addCategory(Number(id), createPayload);
        setSuccess('Categoría agregada correctamente');
      }

      // Refresh from server to get real IDs and phases counts
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      // If the API failed, surface an error and refetch to restore state
      setError(formatError(err) || 'Error al guardar la categoría');
      fetchData();
    }
   };

  const handleRemoveCategory = async (eventCategoryId: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta categoría del evento?')) return;

    try {
      await eventsApi.removeCategory(Number(id), eventCategoryId);
      setSuccess('Categoría eliminada correctamente');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(formatError(err) || 'Error al eliminar la categoría');
    }
  };

  if (loading) return <Loading />;
  if (!event) return <div className="text-center py-5">Evento no encontrado</div>;

  return (
    <>
      {/* Event Header */}
      <button onClick={() => navigate(-1)} className="admin-back mb-3" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b7280', padding: 0 }}>
        ← Volver a Eventos
      </button>

      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h1 className="admin-page-title mb-1">{event.name}</h1>
              <p className="text-muted mb-1" style={{ fontSize: 13 }}>
                {event.location}, {event.country} · {event.organizer}
              </p>
              <p className="mb-0" style={{ fontSize: 13, color: '#6b7280' }}>
                {new Date(event.startDate).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })} — {new Date(event.endDate).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div>
              <Link to={`/admin/resultados?event=${event.id}`} className="btn btn-primary" style={{ fontSize: 13 }}>
                Cargar Resultados
              </Link>
            </div>
          </div>
        </Card.Body>
      </Card>

      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Event Categories */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Categorías del Evento</h4>
        <Button variant="primary" onClick={handleShowModal}>
          ➕ Agregar Categoría
        </Button>
      </div>

      <Card>
            <Card.Body className="p-0">
              {(event.eventCategories || []).length > 0 ? (
                <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Modalidad</th>
                  <th>Distancia</th>
                  <th>Fases</th>
                  <th>Resultados</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(event.eventCategories || []).map((ec) => (
                  <tr key={ec.id}>
                    <td>
                      <strong>{ec.category.bowType}</strong> - {ec.category.gender} - {ec.category.division}
                    </td>
                    <td>{ec.modality.name.replace('_', ' ')}</td>
                    <td>{formatDistance(ec.distance)}</td>
                    <td>
                      {(ec.phases || []).map((phase, idx) => {
                        const phaseName = typeof phase === 'string' ? phase : phase.name;
                        return (
                          <Badge key={idx} bg="secondary" className="me-1">
                            {phaseName.replace('_', ' ')}
                          </Badge>
                        );
                      })}
                    </td>
                    <td>
                      <Badge bg={ec._count?.results ? 'success' : 'warning'}>
                        {ec._count?.results || 0} resultados
                      </Badge>
                    </td>
                    <td>
                      <Button size="sm" variant="outline-secondary" className="me-2" onClick={() => handleEditCategory(ec)}>
                        ✏️ Editar
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => handleRemoveCategory(ec.id)}>
                        🗑️ Quitar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">No hay categorías configuradas para este evento</p>
              <Button variant="primary" onClick={handleShowModal}>
                Agregar Primera Categoría
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal Add Category */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editingEventCategoryId ? 'Editar Categoría' : 'Agregar Categoría al Evento'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form.Group className="mb-3">
              <Form.Label>Categoría *</Form.Label>
              <Form.Select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.bowType} - {cat.gender} - {cat.division}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Modalidad *</Form.Label>
              <Form.Select
                value={formData.modalityId}
                onChange={(e) => setFormData({ ...formData, modalityId: e.target.value })}
                required
              >
                {modalities.map((mod) => (
                  <option key={mod.id} value={mod.id}>
                    {mod.name.replace(/_/g, ' ')}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Distancia</Form.Label>
              <Form.Select value={formData.distance} onChange={(e) => setFormData({ ...formData, distance: e.target.value })}>
                <option value="">-- No especificada --</option>
                <option value="SEVENTY_METERS">70 m</option>
                <option value="FIFTY_METERS">50 m</option>
                <option value="THIRTY_METERS">30 m</option>
                <option value="INDOOR">Indoor (18 m)</option>
                <option value="FIVE_METERS">5 m</option>
                <option value="TEN_METERS">10 m</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Fases *</Form.Label>
              <Row>
                {phaseOptions.map((phase) => (
                  <Col xs={6} key={phase.value}>
                    <Form.Check
                      type="checkbox"
                      label={phase.label}
                      checked={formData.phases.includes(phase.value)}
                      onChange={() => handlePhaseToggle(phase.value)}
                    />
                  </Col>
                ))}
              </Row>
              <Form.Text className="text-muted">
                Selecciona las fases que tendrá esta categoría en el evento
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
            <Button type="submit" variant="primary">{editingEventCategoryId ? 'Guardar Cambios' : 'Agregar Categoría'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
