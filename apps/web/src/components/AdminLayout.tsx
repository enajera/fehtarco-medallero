import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { Container, Navbar, Nav, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import fenixLogo from '../assets/logos/fenix.png';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="page-container">
      <Navbar bg="primary" variant="dark" expand="lg" sticky="top">
        <Container>
          <Navbar.Brand as={Link} to="/admin">
            🛠️ Panel Admin
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="admin-navbar" />
          <Navbar.Collapse id="admin-navbar">
            <Nav className="me-auto">
              <Nav.Link as={NavLink} to="/admin/clubes">
                Clubes
              </Nav.Link>
              <Nav.Link as={NavLink} to="/admin/categorias">
                Categorías
              </Nav.Link>
              <Nav.Link as={NavLink} to="/admin/atletas">
                Atletas
              </Nav.Link>
              <Nav.Link as={NavLink} to="/admin/eventos">
                Eventos
              </Nav.Link>
              <Nav.Link as={NavLink} to="/admin/resultados">
                Resultados
              </Nav.Link>
            </Nav>
            <Nav className="align-items-center">
              <Nav.Link as={Link} to="/" className="me-3">
                Ver Sitio
              </Nav.Link>
              <span className="text-light me-3">{user?.email}</span>
              <Button variant="outline-light" size="sm" onClick={handleLogout}>
                Cerrar Sesión
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="main-content bg-light">
        <Container>
          <Outlet />
        </Container>
      </main>

      <footer className="footer">
        <Container className="text-center">
          <small>© {new Date().getFullYear()} - Federación Hondureña de Tiro con Arco</small>
          <div className="d-flex justify-content-center align-items-center gap-2">
            <span className="align-middle">Powered by Club de Arqueria Fénix</span>
            <img 
              src={fenixLogo}
              alt="Club de Arqueria Fénix" 
              style={{ height: '30px' }}
            />
          </div>
        </Container>
      </footer>
    </div>
  );
}
