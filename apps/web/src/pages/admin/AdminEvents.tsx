import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Table, Button, Form, Modal, Row, Col, Alert, Badge } from 'react-bootstrap';
import { eventsApi, Event } from '../../api/client';
import Loading from '../../components/Loading';
import { formatError } from '../../utils/errors';

export default function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterYear, setFilterYear] = useState<number | ''>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState('');

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch when any filter/page/limit changes
  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterYear, page, limit, query]);

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  const [formData, setFormData] = useState<Partial<Event>>({
    name: '',
    organizer: '',
    location: 'Tegucigalpa, Estadio Chochi Sosa',
    country: 'Honduras',
    startDate: '',
    endDate: '',
    eventScope: 'NATIONAL_FEDERATION',
    technicalLevel: 'WA_STANDARD',
    official: true,
    clubMedalsEnabled: true,
  });

  const fetchEvents = async (bustCache = false) => {
    try {
      if (bustCache) eventsApi.clearCache();
      const params: Record<string, any> = { page, limit };
      if (filterYear) params.year = filterYear;
      if (query) params.q = query;
      const response = await eventsApi.getAll(params);
      setEvents(response.data.data);
      const meta = response.data.meta;
      if (meta) {
        setTotalPages(meta.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = () => {
    setEditingEvent(null);
    setFormData({
      name: '',
      organizer: '',
      location: 'Tegucigalpa, Estadio Chochi Sosa',
      country: 'Honduras',
      startDate: '',
      endDate: '',
      eventScope: 'NATIONAL_FEDERATION',
      technicalLevel: 'WA_STANDARD',
      official: true,
      clubMedalsEnabled: true,
    });
    setShowModal(true);
    setError('');
  };

  const handleEditModal = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      organizer: event.organizer,
      location: event.location,
      country: event.country,
      startDate: event.startDate.split('T')[0],
      endDate: event.endDate.split('T')[0],
      eventScope: event.eventScope,
      technicalLevel: event.technicalLevel,
      official: event.official,
      clubMedalsEnabled: event.clubMedalsEnabled,
    });
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingEvent) {
        await eventsApi.update(editingEvent.id, formData);
        setSuccess('Evento actualizado correctamente');
      } else {
        await eventsApi.create(formData);
        setSuccess('Evento creado correctamente');
      }
      handleCloseModal();
      fetchEvents(true);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(formatError(err) || 'Error al guardar el evento');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este evento? Esto eliminará todos los resultados asociados.')) return;

    try {
      await eventsApi.delete(id);
      setSuccess('Evento eliminado correctamente');
      fetchEvents(true);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(formatError(err) || 'Error al eliminar el evento');
    }
  };

  if (loading) return <Loading />;

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Eventos</h1>
          <p className="admin-page-sub">Competencias oficiales registradas en el sistema</p>
        </div>
        <Button variant="primary" onClick={handleShowModal}>
          + Nuevo Evento
        </Button>
      </div>

      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filter */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Label>Año</Form.Label>
              <Form.Select value={filterYear} onChange={(e) => { setFilterYear(e.target.value === '' ? '' : Number(e.target.value)); setPage(1); }}>
                <option value="">Todos los años</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Label>Buscar</Form.Label>
              <Form onSubmit={(e) => { e.preventDefault(); setPage(1); }} className="d-flex">
                <Form.Control placeholder="Nombre u organización" value={query} onChange={(e) => setQuery(e.target.value)} />
                <Button className="ms-2" onClick={() => setPage(1)}>Buscar</Button>
              </Form>
            </Col>
            <Col md={2} className="d-flex flex-column">
              <Form.Label>Por página</Form.Label>
              <Form.Select value={String(limit)} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Evento</th>
                <th>Ubicación</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>
                    <small>
                      {new Date(event.startDate).toLocaleDateString()} -<br />
                      {new Date(event.endDate).toLocaleDateString()}
                    </small>
                  </td>
                  <td>
                    <strong>{event.name}</strong>
                    <br />
                    <small className="text-muted">{event.organizer}</small>
                  </td>
                  <td>
                    {event.location}, {event.country}
                  </td>
                  <td>
                    <Badge bg="primary" className="me-1">{event.eventScope.replace(/_/g, ' ')}</Badge>
                    {event.official && <Badge bg="success" className="me-1">Oficial</Badge>}
                    {event.clubMedalsEnabled && <Badge bg="warning" text="dark">🏆</Badge>}
                  </td>
                  <td>
                    <Badge bg="secondary">
                      {event._count?.eventCategories || 0} categorías
                    </Badge>
                  </td>
                  <td>
                    <Button size="sm" variant="outline-primary" className="me-2" onClick={() => handleEditModal(event)}>
                      ✏️ Editar
                    </Button>
                    <Link to={`/admin/eventos/${event.id}`} className="btn btn-sm btn-outline-info me-1">
                      ⚙️ Config
                    </Link>
                    <Link to={`/admin/resultados?event=${event.id}`} className="btn btn-sm btn-outline-success me-1">
                      📝
                    </Link>
                    <Button size="sm" variant="outline-danger" onClick={() => handleDelete(event.id)}>
                      🗑️
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <div>Pagina {page} / {totalPages}</div>
        <div>
          <Button disabled={page <= 1} className="me-2" onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</Button>
          <Button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Siguiente</Button>
        </div>
      </div>

      {/* Modal Create/Edit Event */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingEvent ? 'Editar Evento' : 'Nuevo Evento'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form.Group className="mb-3">
              <Form.Label>Nombre del Evento *</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Organizador *</Form.Label>
              <Form.Control
                type="text"
                value={formData.organizer}
                onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ubicación *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>País *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de Inicio *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de Fin *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ámbito del Evento *</Form.Label>
                  <Form.Select
                    value={formData.eventScope}
                    onChange={(e) => setFormData({ ...formData, eventScope: e.target.value as Event['eventScope'] })}
                    required
                  >
                    <option value="NATIONAL_FEDERATION">Nacional Federativo</option>
                    <option value="NATIONAL_INTERNATIONALIZED">Nacional Internacionalizado</option>
                    <option value="INTERNATIONAL_NATIONAL_TEAM">Internacional (Selección)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nivel Técnico *</Form.Label>
                  <Form.Select
                    value={formData.technicalLevel}
                    onChange={(e) => setFormData({ ...formData, technicalLevel: e.target.value as Event['technicalLevel'] })}
                    required
                  >
                    <option value="WA_STANDARD">WA Standard</option>
                    <option value="INDOOR_STANDARD">Indoor Standard</option>
                    <option value="OTHER">Otro</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    label="Evento Oficial"
                    checked={formData.official}
                    onChange={(e) => setFormData({ ...formData, official: e.target.checked })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    label="Cuenta para Medallero de Clubes"
                    checked={formData.clubMedalsEnabled}
                    onChange={(e) => setFormData({ ...formData, clubMedalsEnabled: e.target.checked })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
            <Button type="submit" variant="primary">
              {editingEvent ? 'Guardar Cambios' : 'Crear Evento'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
