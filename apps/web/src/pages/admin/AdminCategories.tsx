import { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Modal, Row, Col, Alert } from 'react-bootstrap';
import { categoriesApi } from '../../api/client';
import Loading from '../../components/Loading';
import { formatError } from '../../utils/errors';

interface Category {
  id: number;
  bowType: 'RECURVE' | 'COMPOUND' | 'BAREBOW';
  gender: 'M' | 'F';
  division: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    bowType: 'RECURVE' as 'RECURVE' | 'COMPOUND' | 'BAREBOW',
    gender: 'M' as 'M' | 'F',
    division: '',
  });
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState('');

  // Fetch all categories (client-side pagination for small sets)
  useEffect(() => {
    fetchAllFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllFromServer = async () => {
    try {
      setLoading(true);
      const response = await categoriesApi.getAll();
      const list = response.data.data || [];
      setAllCategories(list.slice(0, 500));
      // Apply pagination after loading
      setTimeout(() => {
        applyFilterAndPaginate(1, limit, list.slice(0, 500));
        setLoading(false);
      }, 0);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(formatError(err) || 'Error al cargar las categorías');
      setLoading(false);
    }
  };

  const applyFilterAndPaginate = (p: number = page, l: number = limit, source?: Category[]) => {
    // Use provided source or current allCategories
    const src = source !== undefined ? source : allCategories;
    let filtered = src.slice();
    
    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      filtered = filtered.filter(c => (c.division || '').toLowerCase().includes(q));
    }
    
    const total = filtered.length;
    const totalPagesCalc = Math.max(1, Math.ceil(total / l));
    const currentPage = Math.min(Math.max(1, p), totalPagesCalc);
    const start = (currentPage - 1) * l;
    const pageSlice = filtered.slice(start, start + l);
    
    setCategories(pageSlice);
    setTotalPages(totalPagesCalc);
    setPage(currentPage);
  };


  const handleShowModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        bowType: category.bowType,
        gender: category.gender,
        division: category.division,
      });
    } else {
      setEditingCategory(null);
      setFormData({ bowType: 'RECURVE', gender: 'M', division: '' });
    }
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setError('');
  };

  const handleInputChange = (
    e: React.ChangeEvent<any>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validación
    if (!formData.division.trim()) {
      setError('La división es obligatoria');
      return;
    }

    // If editing, call update, otherwise create
    try {
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, formData);
        setSuccess('Categoría actualizada correctamente');
      } else {
        await categoriesApi.create(formData);
        setSuccess('Categoría creada correctamente');
      }
  handleCloseModal();
  await fetchAllFromServer();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error:', err);
      setError(formatError(err) || 'Error al guardar la categoría');
    }
  };

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`Eliminar categoría "${category.division}"? Esta acción no se puede deshacer.`)) return;
    try {
      await categoriesApi.delete(category.id);
      setSuccess('Categoría eliminada');
      await fetchAllFromServer();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Delete error', err);
      setError(formatError(err) || 'Error al eliminar la categoría');
    }
  };

  // Debounced search - apply filter when query changes
  useEffect(() => {
    if (!allCategories || allCategories.length === 0) return;
    
    const t = setTimeout(() => {
      let filtered = allCategories.slice();
      if (query && query.trim()) {
        const q = query.trim().toLowerCase();
        filtered = filtered.filter(c => (c.division || '').toLowerCase().includes(q));
      }
      
      const total = filtered.length;
      const totalPagesCalc = Math.max(1, Math.ceil(total / limit));
      const currentPage = Math.min(Math.max(1, 1), totalPagesCalc);
      const start = (currentPage - 1) * limit;
      const pageSlice = filtered.slice(start, start + limit);
      
      setCategories(pageSlice);
      setTotalPages(totalPagesCalc);
      setPage(currentPage);
    }, 200);
    
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, allCategories, limit]);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  // Re-apply pagination when page or limit changes
  useEffect(() => {
    if (allCategories.length === 0) return;
    
    let filtered = allCategories.slice();
    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      filtered = filtered.filter(c => (c.division || '').toLowerCase().includes(q));
    }
    
    const total = filtered.length;
    const totalPagesCalc = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(Math.max(1, page), totalPagesCalc);
    const start = (currentPage - 1) * limit;
    const pageSlice = filtered.slice(start, start + limit);
    
    setCategories(pageSlice);
    setTotalPages(totalPagesCalc);
    setPage(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  if (loading) return <Loading />;

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Categorías</h1>
          <p className="admin-page-sub">Categorías de competencia disponibles</p>
        </div>
        <Button variant="primary" onClick={() => handleShowModal()}>
          + Nueva Categoría
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Filter */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Label>Buscar</Form.Label>
              <Form onSubmit={(e) => { e.preventDefault(); setPage(1); applyFilterAndPaginate(1, limit); }} className="d-flex">
                <Form.Control placeholder="División..." value={query} onChange={(e) => setQuery(e.target.value)} />
                <Button className="ms-2" onClick={() => { setPage(1); applyFilterAndPaginate(1, limit); }}>Buscar</Button>
              </Form>
            </Col>
            <Col md={2} className="d-flex flex-column">
              <Form.Label>Por página</Form.Label>
              <Form.Select value={String(limit)} onChange={(e) => handleLimitChange(Number(e.target.value))}>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <div>Página {page} de {totalPages}</div>
        <div>
          <Button 
            disabled={page <= 1} 
            className="me-2" 
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Button 
            disabled={page >= totalPages} 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Siguiente
          </Button>
        </div>
      </div>

      <Card>
        <Card.Body>
          {categories.length === 0 ? (
            <p className="text-muted">No hay categorías registradas</p>
          ) : (
            <Table striped bordered hover responsive>
              <thead className="table-dark">
                <tr>
                  <th>Tipo de Arco</th>
                  <th>Género</th>
                  <th>División</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <span className="badge bg-info">
                        {category.bowType === 'RECURVE'
                          ? '🏹 Recurvo'
                          : category.bowType === 'COMPOUND'
                            ? '🎯 Compuesto'
                            : '🎪 Barebow'}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-secondary">
                        {category.gender === 'M' ? '♂️ Masculino' : '♀️ Femenino'}
                      </span>
                    </td>
                    <td>{category.division}</td>
                    <td className="text-center">
                      <div className="d-flex gap-2 justify-content-center">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => handleShowModal(category)}
                          title="Editar categoría"
                        >
                          ✏️ Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(category)}
                          title="Eliminar categoría"
                        >
                          🗑️ Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCategory ? '✏️ Editar Categoría' : '➕ Nueva Categoría'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingCategory && (
            <Alert variant="warning" className="mb-3">
              ⚠️ Al editar esta categoría, los cambios se reflejarán en las configuraciones y eventos que la utilicen.
            </Alert>
          )}
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Tipo de Arco *</Form.Label>
              <Form.Select
                name="bowType"
                value={formData.bowType}
                onChange={handleInputChange}
              >
                <option value="RECURVE">🏹 Recurvo</option>
                <option value="COMPOUND">🎯 Compuesto</option>
                <option value="BAREBOW">🎪 Barebow</option>
              </Form.Select>
              <Form.Text className="text-muted">
                Tipo de arco para esta categoría
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Género *</Form.Label>
              <Form.Select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
              >
                <option value="M">♂️ Masculino</option>
                <option value="F">♀️ Femenino</option>
              </Form.Select>
              <Form.Text className="text-muted">
                Género de la categoría
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>División *</Form.Label>
              <Form.Control
                type="text"
                name="division"
                value={formData.division}
                onChange={handleInputChange}
                placeholder="ej: Senior, Junior, Infantil"
              />
              <Form.Text className="text-muted">
                Nombre de la división (Senior, Junior, etc.)
              </Form.Text>
            </Form.Group>

            <Row className="mt-4">
              <Col>
                <Button
                  variant="secondary"
                  onClick={handleCloseModal}
                  className="w-100"
                >
                  Cerrar
                </Button>
              </Col>
              <Col>
                <Button
                  variant="primary"
                  type="submit"
                  className="w-100"
                >
                  {editingCategory ? 'Guardar Cambios' : 'Guardar Categoría'}
                </Button>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}
