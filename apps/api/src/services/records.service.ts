import prisma from './prisma';

// ============================================
// RECORDS SERVICE
// Calcula el puntaje más alto registrado por
// categoría (bowType × gender × division × modality × distance)
// en eventos oficiales.
// ============================================

export interface RecordEntry {
  bowType: string;
  gender: string;
  division: string;
  modality: string;
  distance: string | null;
  phase: string;
  score: number;
  athlete: {
    id: number;
    firstName: string;
    lastName: string;
    hasPhoto: boolean;
    club: { id: number; name: string } | null;
  };
  event: {
    id: number;
    name: string;
    date: string;
  };
}

export interface RecordsFilters {
  bowType?: string;
  gender?: string;
  phase?: string; // QUALIFICATION | FINAL | BRONZE_MATCH
}

export class RecordsService {
  async getRecords(filters: RecordsFilters = {}): Promise<RecordEntry[]> {
    // Traer todos los resultados de eventos oficiales con sus relaciones
    const results = await prisma.result.findMany({
      where: {
        eventCategory: {
          event: { official: true },
        },
        // Filtrar por fase si se especifica
        ...(filters.phase
          ? { phase: { name: filters.phase as any } }
          : {}),
        // Filtrar por tipo de arco si se especifica
        ...(filters.bowType
          ? { eventCategory: { category: { bowType: filters.bowType as any }, event: { official: true } } }
          : {}),
      },
      include: {
        phase: { select: { name: true } },
        athlete: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoMimeType: true,
            club: { select: { id: true, name: true } },
          },
        },
        eventCategory: {
          include: {
            category: { select: { bowType: true, gender: true, division: true } },
            modality: { select: { name: true } },
            event: { select: { id: true, name: true, startDate: true, official: true } },
          },
        },
      },
      orderBy: { score: 'desc' },
    });

    // Filtros adicionales en memoria (más simple que anidados en Prisma)
    const filtered = results.filter(r => {
      const cat = r.eventCategory.category;
      if (!r.eventCategory.event.official) return false;
      if (filters.bowType && cat.bowType !== filters.bowType) return false;
      if (filters.gender && cat.gender !== filters.gender) return false;
      if (r.score <= 0) return false;
      return true;
    });

    // Agrupar por clave única: bowType|gender|division|modality|distance|phase
    const map = new Map<string, typeof filtered[0]>();

    for (const r of filtered) {
      const cat = r.eventCategory.category;
      const key = [
        cat.bowType,
        cat.gender,
        cat.division,
        r.eventCategory.modality.name,
        r.eventCategory.distance ?? 'null',
        r.phase.name,
      ].join('|');

      // Guardar solo si es el score más alto para esa clave (los resultados ya vienen ordenados desc)
      if (!map.has(key)) {
        map.set(key, r);
      }
    }

    // Convertir a RecordEntry[]
    const records: RecordEntry[] = Array.from(map.values()).map(r => ({
      bowType: r.eventCategory.category.bowType,
      gender: r.eventCategory.category.gender,
      division: r.eventCategory.category.division,
      modality: r.eventCategory.modality.name,
      distance: r.eventCategory.distance,
      phase: r.phase.name,
      score: r.score,
      athlete: {
        id: r.athlete.id,
        firstName: r.athlete.firstName,
        lastName: r.athlete.lastName,
        hasPhoto: !!r.athlete.photoMimeType,
        club: r.athlete.club,
      },
      event: {
        id: r.eventCategory.event.id,
        name: r.eventCategory.event.name,
        date: r.eventCategory.event.startDate.toISOString(),
      },
    }));

    // Ordenar: bowType > gender > division > modality > distance
    const BOW_ORDER = ['RECURVE', 'COMPOUND', 'BAREBOW'];
    const DIVISION_ORDER = ['Senior', 'Junior', 'Cadete', 'Master', 'Sub-21', 'Sub-18'];

    records.sort((a, b) => {
      const bowDiff = BOW_ORDER.indexOf(a.bowType) - BOW_ORDER.indexOf(b.bowType);
      if (bowDiff !== 0) return bowDiff;
      if (a.gender !== b.gender) return a.gender < b.gender ? -1 : 1;
      const divA = DIVISION_ORDER.indexOf(a.division);
      const divB = DIVISION_ORDER.indexOf(b.division);
      if (divA !== divB) return (divA === -1 ? 99 : divA) - (divB === -1 ? 99 : divB);
      if (a.modality !== b.modality) return a.modality.localeCompare(b.modality);
      return (a.distance ?? '').localeCompare(b.distance ?? '');
    });

    return records;
  }
}

export const recordsService = new RecordsService();
