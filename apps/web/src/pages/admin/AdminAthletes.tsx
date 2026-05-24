import { useState, useEffect, useRef } from 'react';
import { Card, Table, Button, Form, Modal, Row, Col, Alert, Badge, Spinner } from 'react-bootstrap';
import { athletesApi, clubsApi, Athlete, Club } from '../../api/client';
import Loading from '../../components/Loading';

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Small avatar component — only loads from API when hasPhoto is true
function AthleteAvatar({ athlete, size = 28 }: { athlete: Athlete; size?: number }) {  const [imgError, setImgError] = useState(false);
  const hasPhoto = athlete.hasPhoto && !imgError;
  const src = `${import.meta.env.VITE_API_URL || '/api'}/athletes/${athlete.id}/photo`;

  if (!hasPhoto) {
    return (
      <div
        className="bg-secondary rounded-circle d-flex align-items-center justify-content-center text-white"
        style={{ width: size, height: size, fontSize: size * 0.45 }}
      >
        👤
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={athlete.firstName}
      className="rounded-circle"
      style={{ width: size, height: size, objectFit: 'cover' }}
      onError={() => setImgError(true)}
    />
  );
}

export default function AdminAthletes() {
  const [allAthletes, setAllAthletes] = useState<Athlete[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterClub, setFilterClub] = useState('');
  const [savingHistory, setSavingHistory] = useState(false);

  // Photo upload state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // ── Initial load ──────────────────────────────────────────────────────────
  // Use a ref so StrictMode double-invoke doesn't fire two fetches
  const didFetchRef = useRef(false);

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    fetchAllFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived pagination ────────────────────────────────────────────────────
  // Runs whenever the source list, filters, page or limit change.
  // Uses a debounce only for the query to avoid re-running on every keystroke.
  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    applyFilter(allAthletes, page, limit, filterClub, debouncedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAthletes, page, limit, filterClub, debouncedQuery]);

  // Helper to safely extract a string message from various error shapes
  const formatError = (err: any) => {
    if (!err) return 'Unknown error';
    // Axios HTTP error with response
    if (err.response?.data) {
      const data = err.response.data;
      // common shape: { error: 'msg' } or { error: { message, code } }
      if (typeof data.error === 'string') return data.error;
      if (data.error && typeof data.error === 'object') return data.error.message || JSON.stringify(data.error);
      // sometimes validation errors in data may be in 'message' or 'errors'
      if (typeof data.message === 'string') return data.message;
      return JSON.stringify(data);
    }

    // Plain Error object
    if (err.message) return err.message;

    // Fallback
    try {
      return JSON.stringify(err);
    } catch (_e) {
      return String(err);
    }
  };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: 'M',
    bowType: '',
    photoUrl: '',
    clubId: '',
    active: true,
    email: '',
    phone: '',
    bloodType: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    clubHistory: [] as Array<{ clubId: number | null; clubName?: string; from?: string | null; to?: string | null }>,
  });

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchAllFromServer = async () => {
    try {
      setLoading(true);
      const [athletesRes, clubsRes] = await Promise.all([
        athletesApi.getAll({ page: 1, limit: 500 }),
        clubsApi.getAll(),
      ]);
      const list: Athlete[] = (athletesRes.data.data || []).slice(0, 500);
      setAllAthletes(list);
      setClubs(clubsRes.data.data || []);
      // Don't call applyFilter here — the useEffect watching allAthletes will do it
    } catch (err) {
      console.error('Error fetching all athletes:', err);
      const status = (err as any)?.response?.status;
      if (status === 429) {
        setError('Demasiadas peticiones al servidor. Espera unos segundos e intenta de nuevo.');
      } else {
        setError('Error al cargar atletas. Revisa la consola para más detalles.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Pure filter + paginate (no side-effects, called from useEffect) ───────

  const applyFilter = (
    source: Athlete[],
    p: number,
    l: number,
    club: string,
    q: string,
  ) => {
    let filtered = source.slice();
    if (club) {
      if (club === 'independent') {
        filtered = filtered.filter(a => !a.clubId);
      } else {
        const id = Number(club);
        filtered = filtered.filter(a => a.clubId === id);
      }
    }
    if (q.trim()) {
      const lq = q.trim().toLowerCase();
      filtered = filtered.filter(a =>
        `${a.firstName} ${a.lastName}`.toLowerCase().includes(lq)
      );
    }
    const total = filtered.length;
    const totalPagesCalc = Math.max(1, Math.ceil(total / l));
    const currentPage = Math.min(Math.max(1, p), totalPagesCalc);
    const start = (currentPage - 1) * l;
    setAthletes(filtered.slice(start, start + l));
    setTotalPages(totalPagesCalc);
    // Only update page if it was clamped to avoid infinite loop
    if (currentPage !== p) setPage(currentPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleShowModal = (athlete?: Athlete) => {
    // Reset photo state
    setPhotoFile(null);
    setUploadingPhoto(false);
    if (athlete) {
      setEditingAthlete(athlete);
      // Show existing photo via API endpoint only if the athlete has stored photo data
      setPhotoPreview(athlete.hasPhoto ? `${import.meta.env.VITE_API_URL || '/api'}/athletes/${athlete.id}/photo` : null);
      setFormData({
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        birthDate: athlete.birthDate?.split('T')[0] || '',
        // Normalize possible stored values ('M'|'F' or 'MALE'|'FEMALE') into 'M'|'F' for the select
        gender: athlete.gender === 'MALE' ? 'M' : athlete.gender === 'FEMALE' ? 'F' : (athlete.gender || 'M'),
        bowType: (athlete as any).bowType || '',
        photoUrl: athlete.photoUrl || '',
        clubId: athlete.clubId?.toString() || '',
        active: athlete.active ?? true,
        email: (athlete as any).email || '',
        phone: (athlete as any).phone || '',
        bloodType: (athlete as any).bloodType || '',
        emergencyContactName: (athlete as any).emergencyContactName || '',
        emergencyContactPhone: (athlete as any).emergencyContactPhone || '',
        // Normalize clubHistory so clubId is a string ('' when null) to match form selects
        clubHistory: ((athlete as any).clubHistory || []).map((h: any) => ({
          clubId: h?.clubId ? String(h.clubId) : '',
          clubName: h?.clubName || '',
          from: h?.from || null,
          to: h?.to || null,
        })),
      });
    } else {
      setEditingAthlete(null);
      setPhotoPreview(null);
      setFormData({
        firstName: '',
        lastName: '',
        birthDate: '',
        gender: 'M',
        bowType: '',
        photoUrl: '',
        clubId: '',
        active: true,
        email: '',
        phone: '',
        bloodType: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        clubHistory: [],
      });
    }
    setShowModal(true);
    setError('');
  };

  // search handled via query state + debounced effect

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Solo se permiten imágenes JPEG, PNG o WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5MB');
      return;
    }
    setError('');
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleUploadPhoto = async () => {
    if (!photoFile || !editingAthlete) return;
    setUploadingPhoto(true);
    setError('');
    try {
      await athletesApi.uploadPhoto(editingAthlete.id, photoFile);
      setSuccess('Foto subida correctamente');
      setPhotoFile(null);
      // Refresh preview from server
      setPhotoPreview(`${import.meta.env.VITE_API_URL || '/api'}/athletes/${editingAthlete.id}/photo?t=${Date.now()}`);
      await fetchAllFromServer();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(formatError(err) || 'Error al subir la foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!editingAthlete) return;
    if (!window.confirm('¿Eliminar la foto de este atleta?')) return;
    setDeletingPhoto(true);
    setError('');
    try {
      await athletesApi.deletePhoto(editingAthlete.id);
      setSuccess('Foto eliminada');
      setPhotoPreview(null);
      setPhotoFile(null);
      // Update local athlete so hasPhoto becomes false
      setEditingAthlete({ ...editingAthlete, hasPhoto: false });
      await fetchAllFromServer();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(formatError(err) || 'Error al eliminar la foto');
    } finally {
      setDeletingPhoto(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAthlete(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Normalize payload: convert empty strings to null where API expects nullable, and coerce types
    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      birthDate: formData.birthDate || null,
      gender: formData.gender,
      bowType: (formData as any).bowType || undefined,
      clubId: formData.clubId ? Number(formData.clubId) : null,
      active: !!formData.active,
      email: (formData as any).email || null,
      phone: (formData as any).phone || null,
      bloodType: (formData as any).bloodType || null,
      emergencyContactName: (formData as any).emergencyContactName || null,
      emergencyContactPhone: (formData as any).emergencyContactPhone || null,
      clubHistory: ((formData as any).clubHistory || []).map((entry: any) => ({
        clubId: entry.clubId !== '' && entry.clubId != null ? Number(entry.clubId) : null,
        clubName: entry.clubName || null,
        from: entry.from || null,
        to: entry.to || null,
      })),
    };

    try {
      if (editingAthlete) {
        await athletesApi.update(editingAthlete.id, payload);
        // If a new photo was selected but not yet uploaded via the "Subir foto" button, upload now
        if (photoFile) {
          await athletesApi.uploadPhoto(editingAthlete.id, photoFile);
        }
        setSuccess('Atleta actualizado correctamente');
      } else {
        const res = await athletesApi.create(payload);
        const newId: number = (res.data as any).data?.id;
        // Upload pending photo for the newly created athlete
        if (photoFile && newId) {
          await athletesApi.uploadPhoto(newId, photoFile);
        }
        setSuccess('Atleta creado correctamente');
      }
      handleCloseModal();
      // refresh full data from server after changes
      await fetchAllFromServer();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(formatError(err) || 'Error al guardar el atleta');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este atleta?')) return;

    try {
      await athletesApi.delete(id);
      setSuccess('Atleta eliminado correctamente');
      await fetchAllFromServer();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(formatError(err) || 'Error al eliminar el atleta');
    }
  };

  // Club history helpers
  const addClubHistoryEntry = () => {
    setFormData({
      ...formData,
      // store clubId as string to keep form inputs consistent
      clubHistory: [...(formData as any).clubHistory, { clubId: '', clubName: '', from: null, to: null }],
    });
  };

  const saveClubHistory = async () => {
    // Save only the clubHistory array for the currently editing athlete
    if (!editingAthlete) {
      setError('Guarda el atleta primero antes de guardar el historial.');
      return;
    }
    // Do not save if no entries
    if (!((formData as any).clubHistory || []).length) {
      setError('No hay entradas en el historial para guardar.');
      return;
    }
    setSavingHistory(true);
    setError('');
    try {
      const normalized = ((formData as any).clubHistory || []).map((entry: any) => ({
        clubId: entry.clubId !== '' && entry.clubId != null ? Number(entry.clubId) : null,
        clubName: entry.clubName || null,
        from: entry.from || null,
        to: entry.to || null,
      }));

      await athletesApi.update(editingAthlete.id, { clubHistory: normalized });
      setSuccess('Historial guardado correctamente');
      // refresh list so UI reflects saved data
      await fetchAllFromServer();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(formatError(err) || 'Error al guardar historial');
    } finally {
      setSavingHistory(false);
    }
  };

  // Update a single field of a clubHistory entry using functional state update
  const updateClubHistoryEntry = (
    index: number,
    field: 'clubId' | 'clubName' | 'from' | 'to',
    value: any
  ) => {
    setFormData((prev) => {
      const history = ([...(prev as any).clubHistory] as Array<any>);
      if (!history[index]) return prev;
      if (field === 'clubId') {
        history[index] = { ...history[index], clubId: value ? String(value) : '' };
      } else {
        history[index] = { ...history[index], [field]: value };
      }
      return { ...prev, clubHistory: history };
    });
  };

  // Update multiple fields at once for a clubHistory entry (atomic update)
  const updateClubHistoryFields = (index: number, fields: Record<string, any>) => {
    setFormData((prev) => {
      const history = ([...(prev as any).clubHistory] as Array<any>);
      if (!history[index]) return prev;
      history[index] = { ...history[index], ...fields };
      return { ...prev, clubHistory: history };
    });
  };

  const removeClubHistoryEntry = (index: number) => {
    const history = ([...(formData as any).clubHistory] as Array<any>).filter((_, i) => i !== index);
    setFormData({ ...formData, clubHistory: history });
  };

  if (loading) return <Loading />;

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Atletas</h1>
          <p className="admin-page-sub">Gestión de atletas registrados en la federación</p>
        </div>
        <Button variant="primary" onClick={() => handleShowModal()}>
          + Nuevo Atleta
        </Button>
      </div>

      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filter */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Label>Filtrar por Club</Form.Label>
              <Form.Select value={filterClub} onChange={(e) => setFilterClub(e.target.value)}>
                <option value="">Todos los clubes</option>
                <option value="independent">Independientes</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>{club.name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Label>Buscar</Form.Label>
              <div className="d-flex">
                <Form.Control
                  placeholder="Nombre..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </Col>
            <Col md={2} className="d-flex flex-column">
              <Form.Label>Por página</Form.Label>
              <Form.Select
                value={String(limit)}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
              >
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
          <Table responsive hover className="mb-0 table-sm compact-table">
            <thead>
              <tr>
                <th>Foto</th>
                <th>Nombre</th>
                <th>Género</th>
                <th>Club</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {athletes.map((athlete) => (
                <tr key={athlete.id}>
                  <td>
                    <AthleteAvatar athlete={athlete} size={28} />
                  </td>
                  <td>
                    <div className="fw-bold">{athlete.firstName} {athlete.lastName}</div>
                    {(athlete as any).email && (
                      <small className="text-muted">{(athlete as any).email}</small>
                    )}
                  </td>
                  <td>
                    {(() => {
                      const isMale = athlete.gender === 'MALE' || athlete.gender === 'M';
                      return (
                        <Badge bg={isMale ? 'primary' : 'danger'}>
                          {isMale ? 'M' : 'F'}
                        </Badge>
                      );
                    })()}
                  </td>
                  <td>{athlete.club?.name || <Badge bg="secondary">Independiente</Badge>}</td>
                  <td>
                    <span className={`badge ${athlete.active ? 'bg-success' : 'bg-secondary'}`}>
                      {athlete.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <Button size="sm" variant="outline-primary" className="me-2" onClick={() => handleShowModal(athlete)}>
                      ✏️ Editar
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleDelete(athlete.id)}>
                      🗑️ Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Pagination */}
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div>Pagina {page} / {totalPages}</div>
        <div>
          <Button disabled={page <= 1} className="me-2" onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</Button>
          <Button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Siguiente</Button>
        </div>
      </div>

  {/* Modal */}
  <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingAthlete ? 'Editar Atleta' : 'Nuevo Atleta'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Apellido *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de Nacimiento</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Género *</Form.Label>
                  <Form.Select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    required
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Arco</Form.Label>
                  <Form.Select
                    value={(formData as any).bowType}
                    onChange={(e) => setFormData({ ...formData, bowType: e.target.value })}
                  >
                    <option value="">-- No especificado --</option>
                    <option value="RECURVE">Recurvo</option>
                    <option value="COMPOUND">Compound</option>
                    <option value="BAREBOW">Barebow</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Club</Form.Label>
                  <Form.Select
                    value={formData.clubId}
                    onChange={(e) => setFormData({ ...formData, clubId: e.target.value })}
                  >
                    <option value="">Independiente</option>
                    {clubs.filter(c => c.active).map((club) => (
                      <option key={club.id} value={club.id}>{club.name}</option>
                    ))}
                  </Form.Select>
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

            {/* Contacto */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Correo electrónico</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="atleta@correo.com"
                    value={(formData as any).email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="+504 9999-9999"
                    value={(formData as any).phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Datos de emergencia */}
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de sangre</Form.Label>
                  <Form.Select
                    value={(formData as any).bloodType}
                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                  >
                    <option value="">-- No especificado --</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Contacto de emergencia</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nombre"
                    value={(formData as any).emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Tel. emergencia</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="+504 9999-9999"
                    value={(formData as any).emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Foto del Atleta</Form.Label>
              <div className="d-flex align-items-center gap-3 flex-wrap">
                {/* Avatar preview */}
                <div
                  className="rounded-circle overflow-hidden border d-flex align-items-center justify-content-center bg-light flex-shrink-0"
                  style={{ width: 80, height: 80 }}
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Foto"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={() => setPhotoPreview(null)}
                    />
                  ) : (
                    <span style={{ fontSize: 36 }}>👤</span>
                  )}
                </div>

                <div className="flex-grow-1">
                  <div className="d-flex gap-2 align-items-center flex-wrap">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      📁 Elegir imagen
                    </Button>
                    {photoFile && editingAthlete && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={handleUploadPhoto}
                        disabled={uploadingPhoto}
                      >
                        {uploadingPhoto ? (
                          <><Spinner size="sm" className="me-1" />Subiendo...</>
                        ) : (
                          '⬆️ Subir foto'
                        )}
                      </Button>
                    )}
                    {(photoPreview || editingAthlete?.hasPhoto) && !photoFile && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={handleDeletePhoto}
                        disabled={deletingPhoto}
                      >
                        {deletingPhoto ? (
                          <><Spinner size="sm" className="me-1" />Eliminando...</>
                        ) : (
                          '🗑️ Eliminar foto'
                        )}
                      </Button>
                    )}
                    {photoFile && !editingAthlete && (
                      <small className="text-muted">La foto se subirá después de crear el atleta</small>
                    )}
                  </div>
                  {photoFile && (
                    <small className="text-muted d-block mt-1">
                      {photoFile.name} ({(photoFile.size / 1024).toFixed(0)} KB)
                    </small>
                  )}
                  <small className="text-muted d-block mt-1">
                    Formatos: JPEG, PNG, WebP · Máximo 5MB
                  </small>
                </div>
              </div>
              {/* Hidden file input */}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handlePhotoSelect}
              />
            </Form.Group>

            {/* Club history editor */}
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">Historial de Clubes</h6>
                <div>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={saveClubHistory}
                    disabled={!editingAthlete || savingHistory || !((formData as any).clubHistory || []).length}
                    className="me-2"
                  >
                    {savingHistory ? 'Guardando...' : 'Guardar Historial'}
                  </Button>
                  <Button size="sm" variant="outline-success" onClick={addClubHistoryEntry}>➕ Añadir</Button>
                </div>
              </div>

              {((formData as any).clubHistory || []).length === 0 && (
                <div className="text-muted">No hay entradas de club histórico.</div>
              )}

              {((formData as any).clubHistory || []).map((entry: any, idx: number) => (
                <Row key={idx} className="align-items-end g-2 mb-2">
                  <Col md={5}>
                    <Form.Group>
                      <Form.Label>Club</Form.Label>
                      <Form.Select
                        value={entry.clubId ?? ''}
                        onChange={(e) => {
                          const selected = e.target.value; // keep as string
                          const club = clubs.find(c => String(c.id) === selected);
                          // update both fields in a single atomic update to avoid race conditions
                          updateClubHistoryFields(idx, {
                            clubId: selected,
                            clubName: club ? club.name : '',
                          });
                        }}
                      >
                        <option value="">-- Independiente / Sin club --</option>
                        {clubs.map((c) => (
                          <option key={c.id} value={String(c.id)}>{c.name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Desde</Form.Label>
                      <Form.Control
                        type="date"
                        value={entry.from ? entry.from.split('T')[0] : ''}
                        onChange={(e) => updateClubHistoryEntry(idx, 'from', e.target.value || null)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Hasta</Form.Label>
                      <Form.Control
                        type="date"
                        value={entry.to ? entry.to.split('T')[0] : ''}
                        onChange={(e) => updateClubHistoryEntry(idx, 'to', e.target.value || null)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={1} className="text-end">
                    <Button variant="outline-danger" size="sm" onClick={() => removeClubHistoryEntry(idx)}>✖</Button>
                  </Col>
                </Row>
              ))}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
            <Button type="submit" variant="primary">
              {editingAthlete ? 'Guardar Cambios' : 'Crear Atleta'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
