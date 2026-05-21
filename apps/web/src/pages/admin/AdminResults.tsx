import { useState, useEffect, useRef, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Table, Button, Form, Modal, Row, Col, Alert, Badge, Spinner } from 'react-bootstrap';
import api, { eventsApi, athletesApi, resultsApi } from '../../api/client';
import { formatDistance } from '../../utils/format';
import CreateAthleteModal from './CreateAthleteModal';

interface Result {
  id: number;
  eventCategoryId: number;
  athleteId: number;
  athlete?: { id: number; firstName: string; lastName: string; club?: { name: string | null } | null };
  score: number;
  position: number;
  phaseName?: string;
  __pending?: boolean;
  sourceName?: string;
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

interface EventCategory {
  id: number;
  eventId?: number;
  categoryId?: number;
  modalityId?: number;
  distance?: string;
  category?: { bowType: string; gender: string; division: string };
  modality?: { name: string };
  phases?: string[] | { id: number; name: string; order: number }[];
  _count?: { results: number };
}

interface Event {
  id: number;
  name: string;
  startDate?: string;
  eventCategories?: EventCategory[];
}

const genderLabel = (g?: string) => {
  if (!g) return '';
  const mapping: Record<string, string> = {
    'M': 'Masculino', 'F': 'Femenino', 'MALE': 'Masculino', 'FEMALE': 'Femenino',
  };
  return mapping[g] || g;
};

const phaseLabel = (p?: string) => {
  if (!p) return '';
  const mapping: Record<string, string> = {
    'QUALIFICATION': 'Clasificatorio',
    'FINAL': 'Final',
    'BRONZE_MATCH': 'Bronce',
  };
  return mapping[p] || p;
};

const getPhaseValue = (ec: EventCategory): string | null => {
  // Las categorías tienen un array 'phases', no un solo 'phase'
  // Necesitamos saber qué fase mostrar. Por ahora, mostraremos TODAS las fases disponibles
  // pero los filtros buscarán si la categoría tiene esa fase
  return null; // Usaremos funciones específicas para los filtros
};

const hasPhase = (ec: EventCategory, phaseName: string): boolean => {
  if (!ec.phases || !Array.isArray(ec.phases)) return false;
  return ec.phases.some(p => {
    const name = typeof p === 'string' ? p : p.name;
    return name === phaseName;
  });
};

const isQualification = (ec: EventCategory): boolean => {
  return hasPhase(ec, 'QUALIFICATION');
};

const isEliminatory = (ec: EventCategory): boolean => {
  return hasPhase(ec, 'FINAL') || hasPhase(ec, 'BRONZE_MATCH');
};

const getPhasesLabel = (ec: EventCategory): string => {
  if (!ec.phases || !Array.isArray(ec.phases)) return '';
  const names = ec.phases.map(p => {
    const name = typeof p === 'string' ? p : p.name;
    return phaseLabel(name);
  }).join(', ');
  return names;
};

function normalizeForMatch(name: string): string {
  if (!name) return '';
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

function isNameMatch(athlete: Athlete, ianseoName: string): boolean {
  if (!ianseoName) return false;
  const dbName = `${athlete.firstName || ''} ${athlete.lastName || ''}`;
  const norm1 = normalizeForMatch(dbName);
  const norm2 = normalizeForMatch(ianseoName);

  if (norm1 === norm2) return true;

  const tokens2 = norm2.split(' ');
  if (tokens2.length >= 3) {
    const possibleName = tokens2.slice(-2).join(' ');
    const possibleLastname = tokens2.slice(0, -2).join(' ');
    const reconstructed = normalizeForMatch(`${possibleName} ${possibleLastname}`);
    if (norm1 === reconstructed) return true;
  }

  const tokens1 = norm1.split(' ');
  const overlap = tokens1.filter(t => tokens2.includes(t)).length;
  if (overlap >= Math.min(tokens1.length, tokens2.length) - 1) return true;

  return false;
}

const CategoryCard = memo(({ ec, onOpen }: { ec: EventCategory; onOpen: (ec: EventCategory) => void }) => (
  <Col md={6} lg={4} className="mb-3">
    <Card className="cursor-pointer" onClick={() => onOpen(ec)} style={{ cursor: 'pointer' }}>
      <Card.Body>
        <strong>{ec.category?.bowType} - {genderLabel(ec.category?.gender)}</strong>
        <div className="text-muted small">{formatDistance(ec.distance)}</div>
        <Button size="sm" variant="outline-primary" className="w-100 mt-2">Ver</Button>
      </Card.Body>
    </Card>
  </Col>
));

export default function AdminResults() {
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get('event');

  const [events, setEvents] = useState<Event[]>([]);
  const [filterYear, setFilterYear] = useState<number | ''>('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [categoryAthletes, setCategoryAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<EventCategory | null>(null);
  const [activePhaseType, setActivePhaseType] = useState<'QUALIFICATION' | 'ELIMINATORY'>('QUALIFICATION');
  const [categoryResults, setCategoryResults] = useState<Result[]>([]);
  const [athletesLoading, setAthletesLoading] = useState(false);
  const [savingResults, setSavingResults] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [quickAddAthleteId, setQuickAddAthleteId] = useState('');
  const [quickAddScore, setQuickAddScore] = useState('');
  const [quickAddPosition, setQuickAddPosition] = useState('');

  const [editingResultId, setEditingResultId] = useState<number | null>(null);
  const [editScore, setEditScore] = useState('');
  const [editPosition, setEditPosition] = useState('');

  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importPreview, setImportPreview] = useState<{ matched: Array<{ item: any; athlete: Athlete }>; unmatched: Array<{ item: any }> } | null>(null);
  
  const [showCreateAthleteModal, setShowCreateAthleteModal] = useState(false);
  const [createAthleteIndex, setCreateAthleteIndex] = useState(0);
  const [creatingAthlete, setCreatingAthlete] = useState(false);
  const [importUnmatched, setImportUnmatched] = useState<Array<{ item: any; created?: Athlete }>>([]);
  const [importMatched, setImportMatched] = useState<Array<{ item: any; athlete: Athlete }>>([]);

  const serverCacheRef = useRef<Record<number, Result[]>>({});
  const pendingRef = useRef<Record<number, Result[]>>({});
  const deletedIdsRef = useRef<Set<number>>(new Set());
  const newResultIdsRef = useRef<Set<number>>(new Set()); // Rastrea IDs que son realmente nuevos


  useEffect(() => {
    const init = async () => {
      try {
        const evList = await eventsApi.getAll({ page: 1, limit: 500 });
        const list: Event[] = evList.data?.data || [];
        setEvents(list);
        // Auto-select event from URL param ?event=<id>
        if (eventIdParam) {
          const found = list.find(e => e.id === Number(eventIdParam));
          if (found) {
            const year = new Date(found.startDate || '2000-01-01').getFullYear();
            setFilterYear(year);
            setSelectedEvent(found);
          }
        }
        setLoading(false);
      } catch (err) {
        alert('Error al cargar eventos');
        setLoading(false);
      }
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedEvent) return;

    const load = async () => {
      setLoadingCategories(true);
      try {
        // Carga categorías
        const catRes = await eventsApi.getEventCategories(selectedEvent.id);
        const categories: EventCategory[] = catRes.data?.data || [];
        console.log('[AdminResults] Categorías cargadas:', categories.length, categories);
        
        // Actualiza selectedEvent con las categorías
        setSelectedEvent(prev => prev ? { ...prev, eventCategories: categories } : null);

        // Carga resultados
        const summary = await resultsApi.getSummaryByEvent(selectedEvent.id);
        const grouped = summary.data?.data?.grouped || summary.data?.data || [];
        console.log('[AdminResults] Resultados cargados:', grouped.length, grouped);

        serverCacheRef.current = {};
        for (const g of grouped) {
          const ecId = g.eventCategoryId;
          const results: Result[] = (g.results || []).map((r: any) => ({
            id: r.id,
            eventCategoryId: ecId,
            athleteId: r.athlete.id,
            athlete: r.athlete,
            score: r.score,
            position: r.position,
            phaseName: r.phaseName || r.phase?.name || 'QUALIFICATION',
          }));
          serverCacheRef.current[ecId] = results;
        }
        console.log('[AdminResults] Cache actualizado:', serverCacheRef.current);
      } catch (err) {
        console.error('Error al cargar categorías:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    load();
  }, [selectedEvent?.id]);

  const openCategoryModal = async (ec: EventCategory, phase: 'QUALIFICATION' | 'ELIMINATORY' = 'QUALIFICATION') => {
    setActiveCategory(ec);
    setActivePhaseType(phase);
    setShowCategoryModal(true);
    setAthletesLoading(true);
    
    // Limpia los refs de tracking para esta nueva categoría
    deletedIdsRef.current.clear();
    newResultIdsRef.current.clear();

    try {
      const atRes = await athletesApi.getAll({ limit: 500 });
      let atlList: Athlete[] = (atRes.data?.data || []).map((a: any) => ({
        id: a.id,
        firstName: a.firstName,
        lastName: a.lastName,
        club: a.club,
        gender: a.gender,
        bowType: a.bowType,
      }));

      // Filtrar atletas por sexo y tipo de arco de la categoría
      if (ec.category) {
        atlList = atlList.filter(a => {
          const athleteGender = a.gender?.toUpperCase() || '';
          const athleteBowType = a.bowType?.toUpperCase() || '';
          const categoryGender = ec.category!.gender?.toUpperCase() || '';
          const categoryBowType = ec.category!.bowType?.toUpperCase() || '';
          
          return athleteGender === categoryGender && athleteBowType === categoryBowType;
        });
      }

      setCategoryAthletes(atlList);

      // Filtrar resultados según la fase
      let serverResults: Result[];
      let pendingResults: Result[];
      
      if (phase === 'QUALIFICATION') {
        serverResults = (serverCacheRef.current[ec.id] || []).filter(r => {
          return r.phaseName === 'QUALIFICATION';
        });
        
        pendingResults = (pendingRef.current[ec.id] || []).filter(r => {
          return !(r as any).__delete && r.phaseName === 'QUALIFICATION';
        });
      } else {
        // ELIMINATORY: mostrar FINAL y BRONZE_MATCH
        serverResults = (serverCacheRef.current[ec.id] || []).filter(r => {
          return r.phaseName === 'FINAL' || r.phaseName === 'BRONZE_MATCH';
        });
        
        pendingResults = (pendingRef.current[ec.id] || []).filter(r => {
          return !(r as any).__delete && (r.phaseName === 'FINAL' || r.phaseName === 'BRONZE_MATCH');
        });
      }
      
      const merged = Array.from(
        new Map([...pendingResults, ...serverResults].map(r => [r.id, r])).values()
      ).sort((a, b) => (a.position || 0) - (b.position || 0));

      setCategoryResults(merged);
      setEditingResultId(null);
    } catch (err) {
      alert('Error al cargar categoría');
    } finally {
      setAthletesLoading(false);
    }
  };

  const handleQuickAdd = () => {
    if (!activeCategory || !quickAddAthleteId) {
      alert('Selecciona un atleta');
      return;
    }

    // Validar límite de resultados en matches (máximo 3)
    const isMatch = isEliminatory(activeCategory);
    if (isMatch && categoryResults.length >= 3) {
      alert('Los matches solo pueden tener máximo 3 atletas (Oro, Plata, Bronce)');
      return;
    }

    const athlete = categoryAthletes.find(a => a.id === Number(quickAddAthleteId));
    if (!athlete) {
      alert('Atleta no encontrado o no compatible con esta categoría');
      return;
    }

    // Verifica que el atleta no esté ya en esta categoría
    const alreadyExists = categoryResults.some(r => r.athleteId === athlete.id);
    if (alreadyExists) {
      alert('Este atleta ya existe en esta categoría');
      return;
    }

    const tempId = -(Date.now() + Math.random());

    // Assign correct phaseName based on active phase type
    let phaseName = 'QUALIFICATION';
    if (activePhaseType === 'ELIMINATORY') {
      const pos = Number(quickAddPosition) || (categoryResults.length + 1);
      // pos 1 & 2 → FINAL, pos 3 (bronze) → BRONZE_MATCH
      phaseName = pos <= 2 ? 'FINAL' : 'BRONZE_MATCH';
    }

    const result: Result = {
      id: tempId,
      eventCategoryId: activeCategory.id,
      athleteId: athlete.id,
      athlete,
      score: Number(quickAddScore) || 0,
      position: Number(quickAddPosition) || 0,
      phaseName,
      __pending: true,
    };

    // Marca este ID como "nuevo"
    newResultIdsRef.current.add(tempId);

    if (!pendingRef.current[activeCategory.id]) {
      pendingRef.current[activeCategory.id] = [];
    }
    pendingRef.current[activeCategory.id].push(result);

    setCategoryResults(prev => [...prev, result].sort((a, b) => (a.position || 0) - (b.position || 0)));
    
    // Limpia el formulario
    setQuickAddAthleteId('');
    setQuickAddScore('');
    setQuickAddPosition('');
  };

  const parseAthleteFullName = (fullName: string): { firstName: string; lastName: string } => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    return { 
      firstName: parts[0], 
      lastName: parts.slice(1).join(' ')
    };
  };

  const handleImportFromIANSEO = async (url: string) => {
    if (!url.trim()) {
      alert('Ingresa una URL');
      return;
    }

    try {
      // Determine which endpoint to use based on the current phase
      // If viewing QUALIFICATION, use /import/ianseo
      // If viewing ELIMINATORY (FINAL/BRONZE_MATCH), use /import/ianseo-matches
      const isEliminatory = activeCategory && (
        hasPhase(activeCategory, 'FINAL') || 
        hasPhase(activeCategory, 'BRONZE_MATCH')
      );
      
      const endpoint = isEliminatory ? '/import/ianseo-matches' : '/import/ianseo';
      const resp = await api.get(endpoint, { params: { url } });
      const imported = resp.data?.data || [];

      console.log('[AdminResults] Imported items:', imported.map((i: any) => ({ name: i.name, position: i.position, total: i.total })));
      console.log('[AdminResults] Category athletes:', categoryAthletes.map(a => ({ firstName: a.firstName, lastName: a.lastName })));

      const matched: Array<{ item: any; athlete: Athlete }> = [];
      const unmatched: Array<{ item: any }> = [];
      const alreadyInCategory: Array<{ item: any; athlete: Athlete }> = [];
      let updatedCategoryAthletes = [...categoryAthletes];

      for (const item of imported) {
        console.log(`[AdminResults] Trying to match: "${item.name}"`);
        const athlete = updatedCategoryAthletes.find(a => {
          const matches = isNameMatch(a, item.name);
          console.log(`  - Against "${a.firstName} ${a.lastName}": ${matches}`);
          return matches;
        });
        if (athlete) {
          // Verifica que no esté ya en esta categoría (y con la misma posición si es matches)
          const alreadyExists = categoryResults.some(r => r.athleteId === athlete.id);
          if (alreadyExists) {
            alreadyInCategory.push({ item, athlete });
          } else {
            matched.push({ item, athlete });
          }
        } else {
          unmatched.push({ item });
        }
      }

      if (alreadyInCategory.length > 0) {
        alert(`⚠️ ${alreadyInCategory.length} atleta(s) ya existen en esta categoría y serán ignorados`);
      }

      // Store matched and unmatched for later processing
      setImportMatched(matched);
      setImportUnmatched(unmatched.map(u => ({ item: u.item })));
      
      if (unmatched.length > 0) {
        // Show modal to create missing athletes
        setShowCreateAthleteModal(true);
        setCreateAthleteIndex(0);
      } else {
        // All matched, show preview directly
        setImportPreview({ matched, unmatched: [] });
        setShowImportPreview(true);
      }
    } catch (err) {
      console.error('Error al importar desde IANSEO:', err);
      alert('Error al importar desde IANSEO');
    }
  };

  const handleCreateAthleteFromImport = async (athleteData: any) => {
    if (createAthleteIndex >= importUnmatched.length || !activeCategory?.category) return;

    const unmatchedItem = importUnmatched[createAthleteIndex];
    setCreatingAthlete(true);

    try {
      const gender = activeCategory.category.gender;
      const bowType = activeCategory.category.bowType;

      const created = await athletesApi.create({
        firstName: athleteData.firstName,
        lastName: athleteData.lastName,
        gender,
        bowType,
        clubId: athleteData.clubId || null,
        birthDate: athleteData.birthDate || null,
        email: athleteData.email || null,
        phone: athleteData.phone || null,
        bloodType: athleteData.bloodType || null,
        drawWeightLbs: athleteData.drawWeightLbs || null,
        drawLengthIn: athleteData.drawLengthIn || null,
      });

      const newAthlete: Athlete = {
        id: created.data?.data?.id || 0,
        firstName: created.data?.data?.firstName || athleteData.firstName,
        lastName: created.data?.data?.lastName || athleteData.lastName,
        club: created.data?.data?.club || null,
        gender,
        bowType,
      };

      // Mark as created
      const updated = [...importUnmatched];
      updated[createAthleteIndex] = { ...unmatchedItem, created: newAthlete };
      setImportUnmatched(updated);

      // Move to next unmatched
      if (createAthleteIndex + 1 < importUnmatched.length) {
        setCreateAthleteIndex(createAthleteIndex + 1);
      } else {
        // All created, move to preview
        const allMatched = [
          ...importMatched,
          ...updated.filter(u => u.created).map(u => ({ item: u.item, athlete: u.created! }))
        ];
        setImportPreview({ matched: allMatched, unmatched: [] });
        setShowImportPreview(true);
        setShowCreateAthleteModal(false);
      }
    } catch (err) {
      console.error('Error creating athlete:', err);
      alert('Error al crear atleta');
    } finally {
      setCreatingAthlete(false);
    }
  };

  const handleSkipCreateAthlete = () => {
    // Move to next unmatched
    if (createAthleteIndex + 1 < importUnmatched.length) {
      setCreateAthleteIndex(createAthleteIndex + 1);
    } else {
      // Show preview with only the created athletes
      const allMatched = [
        ...importMatched,
        ...importUnmatched.filter(u => u.created).map(u => ({ item: u.item, athlete: u.created! }))
      ];
      setImportPreview({ matched: allMatched, unmatched: [] });
      setShowImportPreview(true);
      setShowCreateAthleteModal(false);
    }
  };

  const handleConfirmImport = () => {
    if (!activeCategory || !importPreview) return;

    const isEliminatoryCategory = hasPhase(activeCategory, 'FINAL') || hasPhase(activeCategory, 'BRONZE_MATCH');

    const newResults: Result[] = [];
    let tempId = -(Date.now() * 1000);

    for (const { item, athlete } of importPreview.matched) {
      // Position 3 in eliminatory = bronze match, 1 & 2 = final
      const itemPhaseName = isEliminatoryCategory
        ? ((item.position || 0) >= 3 ? 'BRONZE_MATCH' : 'FINAL')
        : 'QUALIFICATION';

      const result: Result = {
        id: tempId,
        eventCategoryId: activeCategory.id,
        athleteId: athlete.id,
        athlete,
        score: item.score || item.total || 0,
        position: item.position || 0,
        phaseName: itemPhaseName,
        __pending: true,
        sourceName: item.name,
      };
      newResults.push(result);
      newResultIdsRef.current.add(tempId); // Marca como nuevo
      tempId--;
    }

    // Los sin coincidencia no se agregan (no sabemos quién es)
    // Si el usuario quiere agregar a alguien sin ID, usa "Añadir atleta"

    if (!pendingRef.current[activeCategory.id]) {
      pendingRef.current[activeCategory.id] = [];
    }
    pendingRef.current[activeCategory.id].push(...newResults);

    console.log('[AdminResults] handleConfirmImport - newResults:', newResults.length);
    console.log('[AdminResults] handleConfirmImport - newResultIdsRef after add:', Array.from(newResultIdsRef.current));
    console.log('[AdminResults] handleConfirmImport - pendingRef[categoryId]:', pendingRef.current[activeCategory.id].length);

    setCategoryResults(prev => [...prev, ...newResults].sort((a, b) => (a.position || 0) - (b.position || 0)));

    setShowImportPreview(false);
    setImportPreview(null);
  };

  const handleSaveCategoryChanges = async () => {
    if (!activeCategory || savingResults) return;

    setSavingResults(true);

    try {
      const idsToDelete = Array.from(deletedIdsRef.current).filter(id => id > 0);
      const pendingToAdd = categoryResults.filter(r => newResultIdsRef.current.has(r.id) && r.id < 0); // Nuevos (ID < 0)
      const pendingToUpdate = categoryResults.filter(r => newResultIdsRef.current.has(r.id) && r.id > 0); // Editados (ID > 0)

      // Ejecuta todas las peticiones en paralelo
      const deletePromises = idsToDelete.map(id => resultsApi.delete(id).catch((err) => {
        console.error('[AdminResults] Error al eliminar resultado:', err?.response?.data || err?.message);
        return null;
      }));
      const createPromises = pendingToAdd.map(p =>
        resultsApi.create({
          eventCategoryId: p.eventCategoryId,
          phaseName: p.phaseName || 'QUALIFICATION',
          athleteId: p.athleteId,
          score: p.score,
          position: p.position,
        }).catch((err) => {
          const msg = err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || 'Error desconocido';
          console.error('[AdminResults] Error al crear resultado:', msg, { item: p, respuesta: err?.response?.data });
          return null;
        })
      );
      const updatePromises = pendingToUpdate.map(p =>
        resultsApi.update(p.id, {
          score: p.score,
          position: p.position,
        }).catch((err) => {
          console.error('[AdminResults] Error al actualizar resultado:', err?.response?.data || err?.message);
          return null;
        })
      );

      const allResults = await Promise.all([...deletePromises, ...createPromises, ...updatePromises]);

      // Detecta fallos reales en los creates
      const createResults = allResults.slice(deletePromises.length, deletePromises.length + createPromises.length);
      const failedCreates = createResults.filter(r => r === null).length;
      const savedCreates = pendingToAdd.length - failedCreates;

      if (failedCreates > 0) {
        alert(`⚠️ ${failedCreates} resultado(s) no se guardaron. Revisa la consola del navegador para ver el error exacto.`);
      }

      // Actualiza cache con IDs reales del servidor
      // Axios response: { data: { success: true, data: [{ id, ... }] } }
      const baseResults = (serverCacheRef.current[activeCategory.id] || []).filter(r => !idsToDelete.includes(r.id));
      const newServerResults = pendingToAdd.map((p, idx) => {
        const res = createResults[idx] as any;
        const saved = Array.isArray(res?.data?.data) ? res.data.data[0] : res?.data?.data;
        const savedId = saved?.id;
        if (!savedId) return null;
        return { ...p, id: savedId, __pending: false };
      }).filter(r => r !== null) as Result[];

      const finalResults = baseResults.map(r => {
        const updated = pendingToUpdate.find(p => p.id === r.id);
        return updated ? { ...r, score: updated.score, position: updated.position, __pending: false } : r;
      });

      serverCacheRef.current[activeCategory.id] = [...finalResults, ...newServerResults];

      deletedIdsRef.current.clear();
      newResultIdsRef.current.clear();
      delete pendingRef.current[activeCategory.id];

      if (selectedEvent) {
        try {
          const catRes = await eventsApi.getEventCategories(selectedEvent.id);
          const updatedCategories: EventCategory[] = catRes.data?.data || [];
          setSelectedEvent(prev => prev ? { ...prev, eventCategories: updatedCategories } : null);
        } catch (err) {
          console.error('Error al recargar categorías:', err);
        }
      }

      const message = failedCreates > 0
        ? `⚠️ ${savedCreates} guardado(s), ${failedCreates} fallaron`
        : `✅ Datos actualizados: ${savedCreates} agregado(s), ${pendingToUpdate.length} actualizado(s), ${idsToDelete.length} eliminado(s)`;

      setSuccessMessage(message);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 4000);
      closeCategoryModal();
    } catch (err) {
      console.error('Error inesperado al guardar:', err);
      alert('Error inesperado al guardar. Revisa la consola del navegador.');
    } finally {
      setSavingResults(false);
    }
  };

  const closeCategoryModal = () => {
    // Cuenta cambios REALES sin guardar
    const newItems = categoryResults.filter(r => newResultIdsRef.current.has(r.id)).length;
    const deletedItems = deletedIdsRef.current.size;
    const totalChanges = newItems + deletedItems;
    
    if (totalChanges > 0) {
      const conf = window.confirm(`${totalChanges} cambios sin guardar. ¿Descartar?`);
      if (!conf) return;
    }

    setShowCategoryModal(false);
    setActiveCategory(null);
    setCategoryResults([]);
    setCategoryAthletes([]);
    deletedIdsRef.current.clear();
    newResultIdsRef.current.clear();
    if (activeCategory) delete pendingRef.current[activeCategory.id];
  };

  const handleDeleteResult = (resultId: number) => {
    // Si es un resultado del servidor (ID > 0), marca para eliminar
    if (resultId > 0) {
      deletedIdsRef.current.add(resultId);
    } else {
      // Si es un nuevo resultado (ID < 0), simplemente quítalo del tracking
      newResultIdsRef.current.delete(resultId);
    }
    
    // Remueve del estado visual
    setCategoryResults(prev => prev.filter(r => r.id !== resultId));
    
    // Si es un pending local (ID negativo), también lo remueve del pending ref
    if (activeCategory && resultId < 0 && pendingRef.current[activeCategory.id]) {
      pendingRef.current[activeCategory.id] = pendingRef.current[activeCategory.id].filter(r => r.id !== resultId);
    }
  };

  const handleEditResult = (result: Result) => {
    setEditingResultId(result.id);
    setEditScore(String(result.score));
    setEditPosition(String(result.position));
  };

  const handleSaveEdit = () => {
    if (editingResultId === null) return;

    const originalResult = categoryResults.find(r => r.id === editingResultId);
    if (!originalResult) return;

    const newScore = Number(editScore) || 0;
    const newPosition = Number(editPosition) || 0;

    // Solo actualiza si hay cambios reales
    if (originalResult.score === newScore && originalResult.position === newPosition) {
      // Sin cambios, solo cierra el editor
      setEditingResultId(null);
      setEditScore('');
      setEditPosition('');
      return;
    }

    // Marca como modificado si es un resultado del servidor
    if (editingResultId > 0 && !newResultIdsRef.current.has(editingResultId)) {
      // Era del servidor, ahora es pendiente de actualizar
      deletedIdsRef.current.delete(editingResultId); // Asegura que no esté en delete
      // Agregamos al newResultIdsRef para que se guarde
      newResultIdsRef.current.add(editingResultId);
    }

    setCategoryResults(prev => prev.map(r => 
      r.id === editingResultId 
        ? { ...r, score: newScore, position: newPosition }
        : r
    ).sort((a, b) => (a.position || 0) - (b.position || 0)));

    setEditingResultId(null);
    setEditScore('');
    setEditPosition('');
  };

  const getResultCount = (categoryId: number): number => {
    const serverResults = serverCacheRef.current[categoryId] || [];
    const pendingResults = (pendingRef.current[categoryId] || []).filter(r => !(r as any).__delete);
    
    // Crea un mapa para evitar duplicados (por ID)
    const uniqueMap = new Map<number, Result>();
    serverResults.forEach(r => uniqueMap.set(r.id, r));
    pendingResults.forEach(r => uniqueMap.set(r.id, r));
    
    return uniqueMap.size;
  };

  const getQualificationCount = (categoryId: number): number => {
    const serverResults = (serverCacheRef.current[categoryId] || []).filter(r => r.phaseName === 'QUALIFICATION');
    const pendingResults = (pendingRef.current[categoryId] || []).filter(r => !(r as any).__delete && r.phaseName === 'QUALIFICATION');
    
    // Crea un mapa para evitar duplicados (por ID)
    const uniqueMap = new Map<number, Result>();
    serverResults.forEach(r => uniqueMap.set(r.id, r));
    pendingResults.forEach(r => uniqueMap.set(r.id, r));
    
    return uniqueMap.size;
  };

  const getEliminatoryCount = (categoryId: number): number => {
    const serverResults = (serverCacheRef.current[categoryId] || []).filter(r => r.phaseName === 'FINAL' || r.phaseName === 'BRONZE_MATCH');
    const pendingResults = (pendingRef.current[categoryId] || []).filter(r => !(r as any).__delete && (r.phaseName === 'FINAL' || r.phaseName === 'BRONZE_MATCH'));
    
    // Crea un mapa para evitar duplicados (por ID)
    const uniqueMap = new Map<number, Result>();
    serverResults.forEach(r => uniqueMap.set(r.id, r));
    pendingResults.forEach(r => uniqueMap.set(r.id, r));
    
    return uniqueMap.size;
  };

  const handleCancelEdit = () => {
    setEditingResultId(null);
    setEditScore('');
    setEditPosition('');
  };

  return (
    <>
      <div className="p-6">
        <h1 className="mb-4">📝 Gestión de Resultados</h1>

        <Card className="mb-4">
          <Card.Body>
            <Row className="g-2 align-items-end">
              <Col md={3}>
                <Form.Label>Año</Form.Label>
                <Form.Select
                  value={filterYear}
                  onChange={e => {
                    setFilterYear(e.target.value === '' ? '' : Number(e.target.value));
                    setSelectedEvent(null);
                  }}
                >
                  <option value="">Todos los años</option>
                  {Array.from(new Set(events.map(ev => new Date(ev.startDate || '2000-01-01').getFullYear())))
                    .sort((a, b) => b - a)
                    .map(y => <option key={y} value={y}>{y}</option>)
                  }
                </Form.Select>
              </Col>
              <Col md={9}>
                <Form.Label>Evento {loading && <Spinner animation="border" size="sm" variant="primary" className="ms-2" />}</Form.Label>
                <Form.Select
                  value={selectedEvent?.id || ''}
                  onChange={e => {
                    const ev = events.find(x => x.id === Number(e.target.value));
                    setSelectedEvent(ev || null);
                  }}
                  disabled={loading}
                >
                  <option value="">{loading ? 'Cargando eventos...' : 'Seleccionar evento...'}</option>
                  {events
                    .filter(ev => !filterYear || new Date(ev.startDate || '2000-01-01').getFullYear() === filterYear)
                    .map(ev => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name} ({new Date(ev.startDate || '2000-01-01').getFullYear()})
                      </option>
                    ))
                  }
                </Form.Select>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {showSuccessMessage && (
          <Alert variant="success" className="mb-4">
            {successMessage}
          </Alert>
        )}

        {selectedEvent && (
          <>
            {loadingCategories ? (
              <div className="text-center my-5"><Spinner animation="border" variant="primary" /></div>
            ) : (
              <>
                {(!selectedEvent.eventCategories || selectedEvent.eventCategories.length === 0) ? (
                  <Alert variant="info">
                    No hay categorías para este evento. Asegúrate de que el evento tenga categorías asignadas.
                  </Alert>
                ) : (
                  <>
                    {/* Qualification */}
                    {(selectedEvent.eventCategories || []).filter(isQualification).length > 0 && (
                      <div className="mb-5">
                        <h4 className="mb-3">📋 Clasificatorio</h4>
                        <Table striped hover>
                          <thead>
                            <tr>
                              <th>Categoría</th>
                              <th>Distancia</th>
                              <th>Atletas</th>
                              <th>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(selectedEvent.eventCategories || []).filter(isQualification).map(ec => {
                              const count = getQualificationCount(ec.id);
                              return (
                                <tr key={ec.id}>
                                  <td><strong>{ec.category?.bowType} - {genderLabel(ec.category?.gender)}</strong></td>
                                  <td>{formatDistance(ec.distance)}</td>
                                  <td><Badge bg={count === 0 ? 'warning' : 'secondary'}>{count === 0 ? 'Sin datos' : count}</Badge></td>
                                  <td>
                                    <Button size="sm" onClick={() => openCategoryModal(ec, 'QUALIFICATION')}>
                                      Ver
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      </div>
                    )}

                    {/* Matches */}
                    {(selectedEvent.eventCategories || []).filter(isEliminatory).length > 0 && (
                      <div className="mb-5">
                        <h4 className="mb-3">🥊 Eliminatorias</h4>
                        <Table striped hover>
                          <thead>
                            <tr>
                              <th>Categoría</th>
                              <th>Distancia</th>
                              <th>Atletas</th>
                              <th>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(selectedEvent.eventCategories || []).filter(isEliminatory).map(ec => {
                              const count = getEliminatoryCount(ec.id);
                              return (
                                <tr key={ec.id}>
                                  <td><strong>{ec.category?.bowType} - {genderLabel(ec.category?.gender)}</strong></td>
                                  <td>{formatDistance(ec.distance)}</td>
                                  <td><Badge bg={count === 0 ? 'warning' : 'secondary'}>{count === 0 ? 'Sin datos' : count}</Badge></td>
                                  <td>
                                    <Button size="sm" onClick={() => openCategoryModal(ec, 'ELIMINATORY')}>
                                      Ver
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      <Modal show={showCategoryModal} onHide={closeCategoryModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Resultados: {activeCategory?.category?.bowType} - {genderLabel(activeCategory?.category?.gender)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <>
            <Button
              variant="success"
              className="mb-3 w-100"
              onClick={() => {
                const url = prompt('URL de IANSEO:');
                if (url) handleImportFromIANSEO(url);
              }}
              disabled={athletesLoading}
            >
              📥 Importar IANSEO
            </Button>

            <Form className="mb-3 p-3 bg-light rounded">
              <h6>Añadir atleta {athletesLoading && <Spinner animation="border" size="sm" className="ms-2" />}</h6>
              <Row>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Atleta</Form.Label>
                    <Form.Select
                      value={quickAddAthleteId}
                      onChange={e => setQuickAddAthleteId(e.target.value)}
                      disabled={athletesLoading}
                      className="admin-edit-input"
                    >
                      <option value="">{athletesLoading ? 'Cargando atletas...' : 'Seleccionar...'}</option>
                      {categoryAthletes.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.firstName} {a.lastName}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Score</Form.Label>
                    <Form.Control
                      type="number"
                      value={quickAddScore}
                      onChange={e => setQuickAddScore(e.target.value)}
                      disabled={athletesLoading}
                      className="admin-edit-input"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Pos</Form.Label>
                    <Form.Control
                      type="number"
                      value={quickAddPosition}
                      onChange={e => setQuickAddPosition(e.target.value)}
                      disabled={athletesLoading}
                      className="admin-edit-input"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleQuickAdd} 
                className="mt-2"
                disabled={athletesLoading || !!(activeCategory && isEliminatory(activeCategory) && categoryResults.length >= 3)}
              >
                ➕ Añadir
              </Button>
            </Form>

            {categoryResults.length === 0 ? (
              <Alert variant="info">
                No hay resultados aún. Usa "Importar IANSEO" o "Añadir atleta" para comenzar.
              </Alert>
            ) : (
              <>
                <Table striped hover size="sm">
                  <thead>
                    <tr>
                      <th>Pos</th>
                      <th>Atleta</th>
                      <th>Score</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryResults.map(r => {
                      // Medal logic — siempre por posición (1=🥇, 2=🥈, 3=🥉)
                      let medal = '';
                      const pos = Number(r.position);
                      if (pos === 1) medal = '🥇';
                      else if (pos === 2) medal = '🥈';
                      else if (pos === 3) medal = '🥉';
                      return editingResultId === r.id ? (
                        <tr key={r.id} className="table-active">
                          <td>
                            <Form.Control
                              type="number"
                              value={editPosition}
                              onChange={e => setEditPosition(e.target.value)}
                              size="sm"
                              className="admin-edit-input"
                              style={{ cursor: 'text' }}
                              autoFocus
                            />
                          </td>
                          <td>
                            {r.athlete?.firstName} {r.athlete?.lastName}
                            {r.sourceName && <div className="text-muted small">📥 {r.sourceName}</div>}
                          </td>
                          <td>
                            <Form.Control
                              type="number"
                              value={editScore}
                              onChange={e => setEditScore(e.target.value)}
                              size="sm"
                              className="admin-edit-input"
                              style={{ cursor: 'text' }}
                            />
                          </td>
                          <td>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={handleSaveEdit}
                              className="me-2"
                            >
                              ✅
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={handleCancelEdit}
                            >
                              ❌
                            </Button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={r.id}>
                          <td>
                            {medal && <span style={{ fontSize: '1.1em', marginRight: 4 }}>{medal}</span>}
                            {r.position}
                          </td>
                          <td>
                            {r.athlete?.firstName} {r.athlete?.lastName}
                            {r.sourceName && <div className="text-muted small">📥 {r.sourceName}</div>}
                          </td>
                          <td>{r.score}</td>
                          <td>
                            <Button
                              variant="warning"
                              size="sm"
                              onClick={() => handleEditResult(r)}
                              className="me-2"
                            >
                              ✏️
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteResult(r.id)}
                            >
                              🗑️
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </>
            )}
          </>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeCategoryModal} disabled={savingResults}>
            Cerrar
          </Button>
          <Button variant="primary" onClick={handleSaveCategoryChanges} disabled={savingResults}>
            {savingResults ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" /> Guardando...
              </>
            ) : (
              <>💾 Actualizar</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showImportPreview} onHide={() => setShowImportPreview(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Vista previa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {importPreview && (
            <>
              <h5>Coincidencias ({importPreview.matched.length})</h5>
              {importPreview.matched.map((m, i) => (
                <Alert key={i} variant="success" className="mb-1">
                  {m.item.name} → {m.athlete.firstName} {m.athlete.lastName}
                </Alert>
              ))}

              <h5 className="mt-3">Sin coincidencia ({importPreview.unmatched.length})</h5>
              {importPreview.unmatched.map((um, i) => (
                <Alert key={i} variant="warning" className="mb-1">
                  {um.item.name}
                </Alert>
              ))}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImportPreview(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleConfirmImport}>
            ✅ Confirmar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para crear atletas faltantes */}
      <CreateAthleteModal
        show={showCreateAthleteModal}
        onHide={() => setShowCreateAthleteModal(false)}
        importUnmatched={importUnmatched}
        createAthleteIndex={createAthleteIndex}
        creatingAthlete={creatingAthlete}
        onCreate={handleCreateAthleteFromImport}
        onSkip={handleSkipCreateAthlete}
        parseAthleteFullName={parseAthleteFullName}
        activeCategory={activeCategory}
      />
    </>
  );
}
