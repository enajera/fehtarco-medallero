import axios from 'axios';

// ============================================
// API CLIENT
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ============================================
// API TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Club {
  id: number;
  name: string;
  abbreviation?: string;
  city?: string | null;
  active: boolean;
  logoUrl: string | null;
  hasLogo?: boolean;  // true when logoData is stored in DB — use GET /api/clubs/:id/logo
  createdAt: string;
  _count?: { athletes: number };
}

export interface Athlete {
  id: number;
  firstName: string;
  lastName: string;
  birthDate?: string | null;
  gender?: 'MALE' | 'FEMALE' | string;
  clubId?: number | null;
  photoUrl?: string | null;
  active?: boolean;
  email?: string | null;
  phone?: string | null;
  userId?: number | null;
  club?: { id: number; name: string } | null;
  bowType?: string | null;
  bloodType?: string | null;
  drawWeightLbs?: number | null;
  drawLengthIn?: number | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  clubHistory?: Array<{ clubId: number | null; clubName?: string; from?: string | null; to?: string | null }>;
  hasPhoto?: boolean;   // true when photoData is stored in DB (no bytes sent, use GET /athletes/:id/photo)
}

export interface Category {
  id: number;
  bowType: 'RECURVE' | 'COMPOUND' | 'BAREBOW';
  gender: 'M' | 'F';
  division: string;
}

export interface Event {
  id: number;
  name: string;
  organizer: string;
  location: string;
  country: string;
  startDate: string;
  endDate: string;
  eventScope: 'NATIONAL_FEDERATION' | 'NATIONAL_INTERNATIONALIZED' | 'INTERNATIONAL_NATIONAL_TEAM';
  technicalLevel: 'WA_STANDARD' | 'INDOOR_STANDARD' | 'REDUCED' | 'DEVELOPMENT';
  official: boolean;
  clubMedalsEnabled: boolean;
  _count?: { eventCategories: number };
  // optional eventCategories (some responses include nested categories)
  eventCategories?: any[];
}

export interface ClubMedalCount {
  clubId: number;
  clubName: string;
  logoUrl: string | null;
  hasLogo?: boolean;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
  points: number;
  contributions?: Array<{
    eventId?: number;
    eventName?: string;
    eventDate?: string;
    athleteId: number;
    athleteName?: string;
    medal: 'GOLD' | 'SILVER' | 'BRONZE';
    phaseName?: string;
  }>;
}

export interface AthleteRankEntry {
  athleteId: number;
  firstName: string;
  lastName: string;
  bowType: string | null;
  gender: string | null;
  clubName: string | null;
  hasPhoto: boolean;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
  points: number;
}

export interface AthleteProfile {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  gender: string | null;
  bowType: string;
  photoUrl: string | null;
  club: { id: number; name: string; logoUrl: string | null } | null;
  stats: {
    totalEvents: number;
    totalGold: number;
    totalSilver: number;
    totalBronze: number;
  };
  history: Array<{
    eventId: number;
    eventName: string;
    eventDate: string;
    categoryName: string;
    phase: string;
    position: number;
    score: number;
    medal: 'GOLD' | 'SILVER' | 'BRONZE' | null;
  }>;
}

export interface ClubProfile {
  id: number;
  name: string;
  city: string | null;
  logoUrl: string | null;
  hasLogo?: boolean;
  stats: {
    totalAthletes: number;
    totalGold: number;
    totalSilver: number;
    totalBronze: number;
  };
  athletes: Array<{
    id: number;
    firstName: string;
    lastName: string;
    bowType: string;
    photoUrl: string | null;
    hasPhoto?: boolean;
    medals: { gold: number; silver: number; bronze: number };
  }>;
  yearlyMedals: Array<{
    year: number;
    gold: number;
    silver: number;
    bronze: number;
  }>;
  contributions?: Array<{
    athleteId: number;
    athleteName: string;
    eventId: number;
    eventName: string;
    eventDate: string;
    medal: 'GOLD' | 'SILVER' | 'BRONZE';
    phase: string;
  }>;
}

export interface User {
  id: number;
  email: string;
  role: 'PUBLIC' | 'ADMIN' | 'SUPER_ADMIN';
}

// ============================================
// API FUNCTIONS
// ============================================

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', { email, password }),
  registerAthlete: (athleteId: number, password: string) =>
    api.post<ApiResponse<{ token: string; user: User }>>('/auth/register-athlete', { athleteId, password }),
  me: () => api.get<ApiResponse<User>>('/auth/me'),
};

// Clubs
export const clubsApi = {
  getAll: (params?: Record<string, string | number | boolean>) =>
    api.get<ApiResponse<Club[]>>('/clubs', { params }),
  getById: (id: number) => api.get<ApiResponse<Club>>(`/clubs/${id}`),
  create: (data: Partial<Club>) => api.post<ApiResponse<Club>>('/clubs', data),
  update: (id: number, data: Partial<Club>) => api.put<ApiResponse<Club>>(`/clubs/${id}`, data),
  delete: (id: number) => api.delete(`/clubs/${id}`),
  uploadLogo: (clubId: number, file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post<ApiResponse<{ logoUrl: string; club: Club }>>(`/clubs/${clubId}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteLogo: (clubId: number) =>
    api.delete<ApiResponse<{ club: Club }>>(`/clubs/${clubId}/logo`),
};

// Athletes
export const athletesApi = {
  getAll: (params?: Record<string, string | number | boolean>) =>
    api.get<ApiResponse<Athlete[]>>('/athletes', { params }),
  getById: (id: number) => api.get<ApiResponse<Athlete>>(`/athletes/${id}`),
  create: (data: Partial<Athlete>) => api.post<ApiResponse<Athlete>>('/athletes', data),
  update: (id: number, data: Partial<Athlete>) => api.put<ApiResponse<Athlete>>(`/athletes/${id}`, data),
  delete: (id: number) => api.delete(`/athletes/${id}`),
  uploadPhoto: (athleteId: number, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.post<ApiResponse<{ photoUrl: string; athlete: Athlete }>>(`/athletes/${athleteId}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deletePhoto: (athleteId: number) =>
    api.delete<ApiResponse<{ athlete: Athlete }>>(`/athletes/${athleteId}/photo`),
};

// Categories
export const categoriesApi = {
  getAll: (params?: Record<string, string | number | boolean>) =>
    api.get<ApiResponse<Category[]>>('/categories', { params }),
  create: (data: Partial<Category>) => api.post<ApiResponse<Category>>('/categories', data),
  update: (id: number, data: Partial<Category>) => api.put<ApiResponse<Category>>(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

// Modalities
export const modalitiesApi = {
  getAll: () => api.get<ApiResponse<Array<{ id: number; name: string }>>>('/modalities'),
};

// Phases
export const phasesApi = {
  getAll: () => {
    const key = 'phases:all';
    const cached = fromCache(key);
    if (cached) return Promise.resolve({ data: cached });
    return api.get<ApiResponse<Array<{ id: number; name: string; order: number }>>>('/phases').then((res) => {
      setCache(key, res.data);
      return res;
    });
  },
};

// Events
export const eventsApi = {
  getAll: (params?: Record<string, string | number>) => {
    const key = `events:${JSON.stringify(params || {})}`;
    const cached = fromCache(key);
    if (cached) return Promise.resolve({ data: cached });
    return api.get<ApiResponse<Event[]>>('/events', { params }).then((res) => {
      setCache(key, res.data);
      return res;
    });
  },
  getById: (id: number) => api.get<ApiResponse<Event>>(`/events/${id}`),
  create: (data: Partial<Event>) => api.post<ApiResponse<Event>>('/events', data),
  update: (id: number, data: Partial<Event>) => api.put<ApiResponse<Event>>(`/events/${id}`, data),
  delete: (id: number) => api.delete(`/events/${id}`),
  getEventCategories: (eventId: number) => api.get(`/events/${eventId}/event-categories`),
  addCategory: (eventId: number, data: { categoryId: number; modalityId: number; phases: string[]; distance?: string }) =>
    api.post(`/events/${eventId}/event-categories`, data),
  removeCategory: (eventId: number, eventCategoryId: number) =>
    api.delete(`/events/${eventId}/event-categories/${eventCategoryId}`),
  // convenience: fetch most recent event
  getMostRecent: () => {
    // limit=1, server orders by startDate desc
    return eventsApi.getAll({ page: 1, limit: 1 }).then(res => res.data.data[0]);
  }
};

// Results
const inFlightControllers: Record<string, AbortController | null> = {};
// Keep a map of in-flight promises so callers can share the same request
const inFlightPromises: Record<string, Promise<any> | null> = {};

export const resultsApi = {
  getByEvent: (eventId: number, params?: Record<string, string | number>) =>
    api.get(`/events/${eventId}/results`, { params }),
  getSummaryByEvent: (eventId: number) => {
    const key = `results:summary:${eventId}`;
    const cached = fromCache(key);
    // Debug helper: set VITE_DEBUG_SUMMARY=true in your .env to enable concise caller traces
    const debugSummary = (import.meta.env && import.meta.env.VITE_DEBUG_SUMMARY) === 'true';
    if (debugSummary) {
      const stack = (new Error().stack || '')
        .split('\n')
        .slice(2, 7)
        .map((s) => s.trim())
        .join(' <- ');
      console.info(`[resultsApi] getSummaryByEvent start`, { time: new Date().toISOString(), eventId, stack });
    }
    if (cached) {
      if (debugSummary) console.info(`[resultsApi] returning cached summary`, { eventId, time: new Date().toISOString() });
      return Promise.resolve({ data: cached });
    }

    // If there's already an in-flight promise for this key, reuse it
    const existingPromise = inFlightPromises[key];
    if (existingPromise) {
      if (debugSummary) console.info(`[resultsApi] reuse in-flight promise`, { eventId, time: new Date().toISOString() });
      return existingPromise;
    }

  const controller = new AbortController();
    inFlightControllers[key] = controller;

  if (debugSummary) console.info(`[resultsApi] issuing network request`, { eventId, time: new Date().toISOString() });

    const promise = api
      .get<ApiResponse<any>>(`/events/${eventId}/results/summary`, { signal: controller.signal })
      .then((res) => {
        setCache(key, res.data);
        inFlightControllers[key] = null;
        inFlightPromises[key] = null;
        return res;
      })
      .catch((err) => {
        inFlightControllers[key] = null;
        inFlightPromises[key] = null;
        return Promise.reject(err);
      });

    inFlightPromises[key] = promise;
    return promise;
  },
  // Delete a result by id
  delete: (id: number) => api.delete(`/results/${id}`),
  // Convenience to invalidate the simple client-side summary cache for an event
  invalidateSummary: (eventId: number) => {
    try {
      const key = `results:summary:${eventId}`;
      // Always emit a trace so callers show up in logs; this helps trace ordering
      try { console.info(`[resultsApi] invalidateSummary called`, { eventId, time: new Date().toISOString() }); } catch (e) {}
      if (simpleCache[key]) {
        delete simpleCache[key];
        try { console.info(`[resultsApi] invalidateSummary removed cached key`, { eventId, key }); } catch (e) {}
      }
    } catch (e) {
      // ignore
    }
  },
  create: (data: {
    eventCategoryId: number;
    phaseName: string;
    athleteId: number;
    score: number;
    position: number;
  }) => api.post('/results', { items: [data] }),
  update: (id: number, data: { score?: number; position?: number; notes?: string }) =>
    api.put(`/results/${id}`, data),
};

// Medals
export const medalsApi = {
  getClubMedallero: (params?: { year?: number; scope?: string }) =>
    api.get<ApiResponse<ClubMedalCount[]>>('/medals/clubs', { params }),
  getAvailableYears: () =>
    api.get<ApiResponse<number[]>>('/medals/years'),
  getAthleteRanking: (params?: { year?: number; scope?: string }) =>
    api.get<ApiResponse<AthleteRankEntry[]>>('/medals/athletes', { params }),
};

// Profiles
export const profileApi = {
  getAthlete: (id: number) => api.get<ApiResponse<AthleteProfile>>(`/profile/athlete/${id}`),
  getClub: (id: number) => api.get<ApiResponse<ClubProfile>>(`/profile/club/${id}`),
};

// Event Categories
export const eventCategoriesApi = {
  update: (eventCategoryId: number, data: { categoryId?: number; modalityId?: number; distance?: string; phases?: string[] }) =>
    api.put(`/event-categories/${eventCategoryId}`, data),
};

const simpleCache: Record<string, { ts: number; data: any }> = {};
const CACHE_TTL = 10 * 1000; // 10 seconds

function fromCache(key: string) {
  const entry = simpleCache[key];
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    delete simpleCache[key];
    return null;
  }
  return entry.data;
}
function setCache(key: string, data: any) {
  simpleCache[key] = { ts: Date.now(), data };
}

// (no controller key helper needed)

