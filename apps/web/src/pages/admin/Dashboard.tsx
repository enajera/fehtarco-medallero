import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Row, Col, Table, Badge } from 'react-bootstrap';
import { clubsApi, athletesApi, eventsApi, categoriesApi } from '../../api/client';
import Loading from '../../components/Loading';

interface DashboardStats {
  clubs: number;
  athletes: number;
  events: number;
  categories: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({ clubs: 0, athletes: 0, events: 0, categories: 0 });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clubsRes, athletesRes, eventsRes, categoriesRes] = await Promise.all([
          clubsApi.getAll(),
          athletesApi.getAll(),
          eventsApi.getAll({ limit: 5 }),
          categoriesApi.getAll(),
        ]);

        setStats({
          clubs: clubsRes.data.data?.length || 0,
          athletes: athletesRes.data.data?.length || 0,
          events: eventsRes.data.data?.length || 0,
          categories: categoriesRes.data.data?.length || 0,
        });
        setRecentEvents(eventsRes.data.data || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <Loading />;

  return (
    <>
      <h1 className="mb-4">📊 Panel de Administración</h1>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-primary">
            <Card.Body>
              <h2 className="display-4 text-primary">{stats.clubs}</h2>
              <p className="mb-0">Clubes Registrados</p>
              <Link to="/admin/clubes" className="stretched-link" />
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-success">
            <Card.Body>
              <h2 className="display-4 text-success">{stats.athletes}</h2>
              <p className="mb-0">Atletas Registrados</p>
              <Link to="/admin/atletas" className="stretched-link" />
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-warning">
            <Card.Body>
              <h2 className="display-4 text-warning">{stats.events}</h2>
              <p className="mb-0">Eventos Totales</p>
              <Link to="/admin/eventos" className="stretched-link" />
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-info">
            <Card.Body>
              <h2 className="display-4 text-info">{stats.categories}</h2>
              <p className="mb-0">Categorías</p>
              <Link to="/admin/categorias" className="stretched-link" />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <h5>➕ Nuevo Evento</h5>
              <p className="text-muted small">Crear un nuevo evento de competencia</p>
              <Link to="/admin/eventos?new=true" className="btn btn-outline-primary">
                Crear Evento
              </Link>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <h5>📝 Cargar Resultados</h5>
              <p className="text-muted small">Ingresar resultados de competencias</p>
              <Link to="/admin/resultados" className="btn btn-outline-success">
                Ir a Resultados
              </Link>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <h5>👤 Nuevo Atleta</h5>
              <p className="text-muted small">Registrar un nuevo atleta</p>
              <Link to="/admin/atletas?new=true" className="btn btn-outline-info">
                Crear Atleta
              </Link>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <h5>📋 Categorías</h5>
              <p className="text-muted small">Gestionar categorías de competencia</p>
              <Link to="/admin/categorias" className="btn btn-outline-secondary">
                Categorías
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Events */}
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">📅 Eventos Recientes</h5>
            <Link to="/admin/eventos" className="btn btn-sm btn-outline-primary">
              Ver Todos
            </Link>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {recentEvents.length > 0 ? (
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event: any) => (
                  <tr key={event.id}>
                    <td>
                      <strong>{event.name}</strong>
                      <br />
                      <small className="text-muted">{event.location}</small>
                    </td>
                    <td>{new Date(event.startDate).toLocaleDateString()}</td>
                    <td>
                      {new Date(event.endDate) < new Date() ? (
                        <Badge bg="secondary">Finalizado</Badge>
                      ) : new Date(event.startDate) <= new Date() ? (
                        <Badge bg="success">En Curso</Badge>
                      ) : (
                        <Badge bg="primary">Próximo</Badge>
                      )}
                    </td>
                    <td>
                      <Link to={`/admin/eventos/${event.id}`} className="btn btn-sm btn-outline-primary me-2">
                        Configurar
                      </Link>
                      <Link to={`/admin/resultados?event=${event.id}`} className="btn btn-sm btn-outline-success">
                        Resultados
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">No hay eventos registrados</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </>
  );
}
