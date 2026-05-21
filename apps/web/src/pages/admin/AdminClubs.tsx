import { useState, useEffect, useRef } from 'react';
import { Card, Table, Button, Form, Modal, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { clubsApi, Club } from '../../api/client';
import Loading from '../../components/Loading';
import { formatError } from '../../utils/errors';

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Club logo component — only loads from API when hasLogo is true
function ClubLogoAvatar({ club, size = 36 }: { club: Club; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const hasLogo = club.hasLogo && !imgError;
  const src = `${import.meta.env.VITE_API_URL || '/api'}/clubs/${club.id}/logo`;

  const style: React.CSSProperties = {
    width: size,
    height: size,
    objectFit: 'cover',
    borderRadius: 6,
  };

  if (!hasLogo) {
    return (
      <div
        className="bg-secondary d-flex align-items-center justify-content-center text-white"
        style={{ ...style, fontSize: size * 0.45 }}
      >
        🏛️
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={club.name}
      style={style}
      onError={() => setImgError(true)}
    />
  );
}

export default function AdminClubs() {
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [deletingLogo, setDeletingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    city: '',
    active: true,
  });

  // ── Initial load ──────────────────────────────────────────────────────────
  const didFetchRef = useRef(false);

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    fetchAllFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Reactive filter + pagination ──────────────────────────────────────────
  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    applyFilter(allClubs, page, limit, debouncedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allClubs, page, limit, debouncedQuery]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchAllFromServer = async () => {
    try {
      setLoading(true);
      const response = await clubsApi.getAll({ page: 1, limit: 500, includeInactive: true });
      const list = (response.data.data || []).slice(0, 500);
      setAllClubs(list);
    } catch (err: any) {
      setError(formatError(err) || 'Error al cargar los clubes');
    } finally {
      setLoading(false);
    }
  };

  // ── Pure filter ───────────────────────────────────────────────────────────
  const applyFilter = (source: Club[], p: number, l: number, q: string) => {
    let filtered = source.slice();
    if (q.trim()) {
      const lq = q.trim().toLowerCase();
      filtered = filtered.filter(c =>
        (c.name || '').toLowerCase().includes(lq) ||
        (c.city || '').toLowerCase().includes(lq)
      );
    }
    const total = filtered.length;
    const totalPagesCalc = Math.max(1, Math.ceil(total / l));
    const currentPage = Math.min(Math.max(1, p), totalPagesCalc);
    const start = (currentPage - 1) * l;
    setClubs(filtered.slice(start, start + l));
    setTotalPages(totalPagesCalc);
    if (currentPage !== p) setPage(currentPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  // ── Modal ─────────────────────────────────────────────────────────────────
  const handleShowModal = (club?: Club) => {
    setLogoFile(null);
    setUploadingLogo(false);
    if (club) {
      setEditingClub(club);
      setLogoPreview(club.hasLogo
        ? `${import.meta.env.VITE_API_URL || '/api'}/clubs/${club.id}/logo`
        : null);
      setFormData({
        name: club.name,
        abbreviation: club.abbreviation || '',
        city: club.city || '',
        active: club.active,
      });
    } else {
      setEditingClub(null);
      setLogoPreview(null);
      setFormData({ name: '', abbreviation: '', city: '', active: true });
    }
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClub(null);
    setLogoFile(null);
    setLogoPreview(null);
    setError('');
  };

  // ── Logo handlers ─────────────────────────────────────────────────────────
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Solo se permiten imágenes JPEG, PNG o WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5MB');
      return;
    }
    setError('');
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleUploadLogo = async () => {
    if (!logoFile || !editingClub) return;
    setUploadingLogo(true);
    setError('');
    try {
      await clubsApi.uploadLogo(editingClub.id, logoFile);
      setSuccess('Logo subido correctamente');
      setLogoFile(null);
      setLogoPreview(`${import.meta.env.VITE_API_URL || '/api'}/clubs/${editingClub.id}/logo?t=${Date.now()}`);
      setEditingClub({ ...editingClub, hasLogo: true });
      await fetchAllFromServer();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(formatError(err) || 'Error al subir el logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!editingClub) return;
    if (!window.confirm('¿Eliminar el logo de este club?')) return;
    setDeletingLogo(true);
    setError('');
    try {
      await clubsApi.deleteLogo(editingClub.id);
      setSuccess('Logo eliminado');
      setLogoPreview(null);
      setLogoFile(null);
      setEditingClub({ ...editingClub, hasLogo: false });
      await fetchAllFromServer();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(formatError(err) || 'Error al eliminar el logo');
    } finally {
      setDeletingLogo(false);
    }
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingClub) {
        await clubsApi.update(editingClub.id, formData);
        if (logoFile) await clubsApi.uploadLogo(editingClub.id, logoFile);
        setSuccess('Club actualizado correctamente');
      } else {
        const res = await clubsApi.create(formData);
        const newId: number = (res.data as any).data?.id;
        if (logoFile && newId) await clubsApi.uploadLogo(newId, logoFile);
        setSuccess('Club creado correctamente');
      }
      handleCloseModal();
      await fetchAllFromServer();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(formatError(err) || 'Error al guardar el club');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este club?')) return;
    try {
      await clubsApi.delete(id);
      setSuccess('Club eliminado correctamente');
      await fetchAllFromServer();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(formatError(err) || 'Error al eliminar el club');
    }
  };

  if (loading) return <Loading />;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>🏛️ Gestión de Clubes</h1>
        <Button variant="primary" onClick={() => handleShowModal()}>
          ➕ Nuevo Club
        </Button>
      </div>

      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="mb-3">
        <Card.Body>
          <Row>
            <Col md={8}>
              <Form.Control
                placeholder="Buscar clubes por nombre o ciudad"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
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

      <Card>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>Logo</th>
                <th>Nombre</th>
                <th>Abreviación</th>
                <th>Ciudad</th>
                <th>Estado</th>
                <th>Atletas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clubs.map((club) => (
                <tr key={club.id}>
                  <td><ClubLogoAvatar club={club} size={36} /></td>
                  <td className="fw-bold">{club.name}</td>
                  <td>{club.abbreviation || '-'}</td>
                  <td>{club.city || '-'}</td>
                  <td>
                    <span className={`badge ${club.active ? 'bg-success' : 'bg-secondary'}`}>
                      {club.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>{club._count?.athletes || 0}</td>
                  <td>
                    <Button size="sm" variant="outline-primary" className="me-2" onClick={() => handleShowModal(club)}>
                      ✏️ Editar
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleDelete(club.id)}>
                      🗑️ Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <div>Página {page} / {totalPages}</div>
        <div>
          <Button disabled={page <= 1} className="me-2" onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</Button>
          <Button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Siguiente</Button>
        </div>
      </div>

      {/* Modal Create/Edit */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editingClub ? 'Editar Club' : 'Nuevo Club'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}

            <Form.Group className="mb-3">
              <Form.Label>Nombre *</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Ciudad</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Abreviación</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.abbreviation}
                    onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                    placeholder="EJ: FEN"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Estado</Form.Label>
                  <Form.Check
                    type="switch"
                    label={formData.active ? 'Activo' : 'Inactivo'}
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Logo uploader */}
            <Form.Group className="mb-3">
              <Form.Label>Logo del Club</Form.Label>
              <div className="d-flex align-items-center gap-3 flex-wrap">
                {/* Preview */}
                <div
                  className="border d-flex align-items-center justify-content-center bg-light flex-shrink-0"
                  style={{ width: 80, height: 80, borderRadius: 8 }}
                >
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }}
                      onError={() => setLogoPreview(null)}
                    />
                  ) : (
                    <span style={{ fontSize: 36 }}>🏛️</span>
                  )}
                </div>

                <div className="flex-grow-1">
                  <div className="d-flex gap-2 flex-wrap">
                    <Button variant="outline-secondary" size="sm" onClick={() => logoInputRef.current?.click()}>
                      📁 Elegir imagen
                    </Button>
                    {logoFile && editingClub && (
                      <Button variant="success" size="sm" onClick={handleUploadLogo} disabled={uploadingLogo}>
                        {uploadingLogo ? <><Spinner size="sm" className="me-1" />Subiendo...</> : '⬆️ Subir logo'}
                      </Button>
                    )}
                    {(logoPreview || editingClub?.hasLogo) && !logoFile && (
                      <Button variant="outline-danger" size="sm" onClick={handleDeleteLogo} disabled={deletingLogo}>
                        {deletingLogo ? <><Spinner size="sm" className="me-1" />Eliminando...</> : '🗑️ Eliminar logo'}
                      </Button>
                    )}
                    {logoFile && !editingClub && (
                      <small className="text-muted">El logo se subirá después de crear el club</small>
                    )}
                  </div>
                  {logoFile && (
                    <small className="text-muted d-block mt-1">
                      {logoFile.name} ({(logoFile.size / 1024).toFixed(0)} KB)
                    </small>
                  )}
                  <small className="text-muted d-block mt-1">Formatos: JPEG, PNG, WebP · Máximo 5MB</small>
                </div>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleLogoSelect}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
            <Button type="submit" variant="primary">
              {editingClub ? 'Guardar Cambios' : 'Crear Club'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
