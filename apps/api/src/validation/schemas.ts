import { z } from 'zod';

// ============================================
// COMMON VALIDATORS
// ============================================

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
});

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerAthleteSchema = z.object({
  athleteId: z.number().int().positive('Invalid athlete ID'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  email: z.string().email('Invalid email format').optional(), // requerido solo si el atleta no tiene email en BD
});

export type RegisterAthleteInput = z.infer<typeof registerAthleteSchema>;

export const selfUpdateAthleteSchema = z.object({
  bowType: z.enum(['RECURVE', 'COMPOUND', 'BAREBOW']).optional(),
  drawWeightLbs: z.number().positive().optional().nullable(),
  drawLengthIn: z.number().positive().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
});

export type SelfUpdateAthleteInput = z.infer<typeof selfUpdateAthleteSchema>;

// ============================================
// CLUB SCHEMAS
// ============================================

export const createClubSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  abbreviation: z.string().max(10).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  active: z.boolean().optional().default(true),
});

export const updateClubSchema = createClubSchema.partial();

export type CreateClubInput = z.infer<typeof createClubSchema>;
export type UpdateClubInput = z.infer<typeof updateClubSchema>;

// ============================================
// ATHLETE SCHEMAS
// ============================================

export const bowTypeEnum = z.enum(['RECURVE', 'COMPOUND', 'BAREBOW']);
export const genderEnum = z.enum(['M', 'F']);

// Input-friendly gender schema: accept 'M'|'F' or 'MALE'|'FEMALE' and normalize to 'M'|'F'
const genderInput = z
  .union([z.literal('M'), z.literal('F'), z.literal('MALE'), z.literal('FEMALE')])
  .transform((val) => (val === 'MALE' ? 'M' : val === 'FEMALE' ? 'F' : val));

export const createAthleteSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  birthDate: z.preprocess((val) => {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'string') {
      // Accept date-only strings (YYYY-MM-DD) and convert to ISO datetime
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return new Date(val).toISOString();
      return val;
    }
    if (val instanceof Date) return val.toISOString();
    return val;
  }, z.string().datetime().optional().nullable()),
  gender: genderInput.optional().nullable(),
  clubId: z.number().int().positive().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  emergencyContactName: z.string().max(100).optional().nullable(),
  emergencyContactPhone: z.string().max(20).optional().nullable(),
  bloodType: z.string().max(10).optional().nullable(),
  // bowType is optional in the API input (frontend may omit it); service will handle defaults/requirements
  bowType: bowTypeEnum.optional(),
  drawWeightLbs: z.number().positive().max(100).optional().nullable(),
  drawLengthIn: z.number().positive().max(40).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  active: z.boolean().optional().default(true),
  // Optional club history array: entries with clubId, clubName, from, to
  clubHistory: z
    .array(
      z.object({
        clubId: z.number().int().positive().nullable(),
        clubName: z.string().max(200).optional().nullable(),
        from: z.string().optional().nullable(),
        to: z.string().optional().nullable(),
      })
    )
    .optional(),
});

export const updateAthleteSchema = createAthleteSchema.partial().extend({
  bowType: bowTypeEnum.optional(),
});

export const athleteQuerySchema = z.object({
  clubId: z.string().regex(/^\d+$/).transform(Number).optional(),
  q: z.string().optional(),
  active: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  bowType: bowTypeEnum.optional(),
  gender: genderEnum.optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
});

export type CreateAthleteInput = z.infer<typeof createAthleteSchema>;
export type UpdateAthleteInput = z.infer<typeof updateAthleteSchema>;

// ============================================
// CATEGORY SCHEMAS
// ============================================

export const createCategorySchema = z.object({
  bowType: bowTypeEnum,
  gender: genderEnum,
  division: z.string().min(2).max(50),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial();
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// ============================================
// EVENT SCHEMAS
// ============================================

export const eventScopeEnum = z.enum([
  'NATIONAL_FEDERATION',
  'NATIONAL_INTERNATIONALIZED',
  'INTERNATIONAL_NATIONAL_TEAM',
]);

export const technicalLevelEnum = z.enum([
  'WA_STANDARD',
  'INDOOR_STANDARD',
  'REDUCED',
  'DEVELOPMENT',
]);

export const distanceEnum = z.enum([
  'THIRTY_METERS',
  'FIFTY_METERS',
  'SEVENTY_METERS',
  'INDOOR',
]);

export const createEventSchema = z.object({
  name: z.string().min(3).max(200),
  organizer: z.string().min(2).max(100),
  location: z.string().min(2).max(200),
  country: z.string().min(2).max(100),
  // Accept date-only strings (YYYY-MM-DD) or full ISO datetimes and normalize to ISO datetime
  startDate: z.preprocess((val) => {
    if (val === null || val === undefined || val === '') return val;
    if (typeof val === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return new Date(val).toISOString();
      return val;
    }
    if (val instanceof Date) return val.toISOString();
    return val;
  }, z.string().datetime()),
  endDate: z.preprocess((val) => {
    if (val === null || val === undefined || val === '') return val;
    if (typeof val === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return new Date(val).toISOString();
      return val;
    }
    if (val instanceof Date) return val.toISOString();
    return val;
  }, z.string().datetime()),
  eventScope: eventScopeEnum,
  technicalLevel: technicalLevelEnum,
  distance: distanceEnum.optional(), // New field
  official: z.boolean().optional().default(true),
  clubMedalsEnabled: z.boolean(),
});

export const updateEventSchema = createEventSchema.partial();

export const eventQuerySchema = z.object({
  year: z.string().regex(/^\d{4}$/).transform(Number).optional(),
  scope: eventScopeEnum.optional(),
  technicalLevel: technicalLevelEnum.optional(),
  q: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

// Clubs query schema (search + pagination + includeInactive)
export const clubQuerySchema = z.object({
  q: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  includeInactive: z.enum(['true', 'false']).transform((v) => v === 'true').optional().default('false'),
});

export type ClubQuery = z.infer<typeof clubQuerySchema>;

// ============================================
// EVENT CATEGORY SCHEMAS
// ============================================

export const createEventCategorySchema = z.object({
  categoryId: z.number().int().positive(),
  modalityId: z.number().int().positive(),
  distance: z.enum(['FIVE_METERS','TEN_METERS','THIRTY_METERS','FIFTY_METERS','SEVENTY_METERS','INDOOR']).optional(),
  phases: z.array(z.string()).optional(), // Array de nombres de fases
});

export type CreateEventCategoryInput = z.infer<typeof createEventCategorySchema>;

// Add update schema (partial) for editing eventCategory
export const updateEventCategorySchema = createEventCategorySchema.partial();
export type UpdateEventCategoryInput = z.infer<typeof updateEventCategorySchema>;

// ============================================
// RESULT SCHEMAS
// ============================================

export const phaseNameEnum = z.enum(['QUALIFICATION', 'FINAL', 'BRONZE_MATCH']);

export const resultItemSchema = z.object({
  eventCategoryId: z.number().int().positive(),
  phaseName: phaseNameEnum,
  athleteId: z.number().int().positive(),
  score: z.number().int().min(0),
  position: z.number().int().positive(),
  notes: z.string().max(500).optional().nullable(),
});

export const createResultsSchema = z.object({
  items: z.array(resultItemSchema).min(1),
});

export const updateResultSchema = z.object({
  score: z.number().int().min(0).optional(),
  position: z.number().int().positive().optional(),
  notes: z.string().max(500).optional().nullable(),
});

export const resultQuerySchema = z.object({
  categoryId: z.string().regex(/^\d+$/).transform(Number).optional(),
  modalityId: z.string().regex(/^\d+$/).transform(Number).optional(),
  phase: phaseNameEnum.optional(),
});

export type ResultItemInput = z.infer<typeof resultItemSchema>;
export type CreateResultsInput = z.infer<typeof createResultsSchema>;
export type UpdateResultInput = z.infer<typeof updateResultSchema>;

// ============================================
// MEDAL QUERY SCHEMAS
// ============================================

export const medalQuerySchema = z.object({
  year: z.string().regex(/^\d{4}$/).transform(Number).optional(),
  scope: z.enum(['national', 'all']).optional().default('national'),
});
