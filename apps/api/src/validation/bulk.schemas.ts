import { z } from 'zod';
import {
  bowTypeEnum,
  genderEnum,
  eventScopeEnum,
  technicalLevelEnum,
  phaseNameEnum,
} from './schemas';

// ============================================
// BULK CLUBS SCHEMAS
// ============================================

export const bulkClubItemSchema = z.object({
  name: z.string().min(2, 'Club name must be at least 2 characters').max(100),
  abbreviation: z.string().max(10).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  active: z.boolean().optional().default(true),
});

export const bulkClubsSchema = z.object({
  items: z.array(bulkClubItemSchema).min(1, 'At least 1 club is required'),
});

export type BulkClubItem = z.infer<typeof bulkClubItemSchema>;
export type BulkClubsInput = z.infer<typeof bulkClubsSchema>;

// ============================================
// BULK ATHLETES SCHEMAS
// ============================================

export const bulkAthleteItemSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  gender: genderEnum.optional().nullable(),
  bowType: bowTypeEnum,
  clubName: z.string().max(100).optional().nullable(),
  birthDate: z.string().datetime().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  emergencyContactName: z.string().max(100).optional().nullable(),
  emergencyContactPhone: z.string().max(20).optional().nullable(),
  bloodType: z.string().max(10).optional().nullable(),
  drawWeightLbs: z.number().positive().max(100).optional().nullable(),
  drawLengthIn: z.number().positive().max(40).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  active: z.boolean().optional().default(true),
});

export const bulkAthletesSchema = z.object({
  items: z.array(bulkAthleteItemSchema).min(1, 'At least 1 athlete is required'),
});

export type BulkAthleteItem = z.infer<typeof bulkAthleteItemSchema>;
export type BulkAthletesInput = z.infer<typeof bulkAthletesSchema>;

// ============================================
// BULK EVENTS SCHEMAS
// ============================================

export const bulkEventItemSchema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters').max(200),
  organizer: z.string().min(2, 'Organizer must be at least 2 characters').max(100),
  location: z.string().min(2, 'Location must be at least 2 characters').max(200),
  country: z.string().min(2, 'Country must be at least 2 characters').max(100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  eventScope: eventScopeEnum,
  technicalLevel: technicalLevelEnum,
  official: z.boolean().optional().default(true),
  clubMedalsEnabled: z.boolean(),
});

export const bulkEventsSchema = z.object({
  items: z.array(bulkEventItemSchema).min(1, 'At least 1 event is required'),
});

export type BulkEventItem = z.infer<typeof bulkEventItemSchema>;
export type BulkEventsInput = z.infer<typeof bulkEventsSchema>;

// ============================================
// BULK EVENT CATEGORIES SCHEMAS
// ============================================

export const bulkEventCategoryItemSchema = z.object({
  eventName: z.string().min(3, 'Event name is required'),
  bowType: bowTypeEnum,
  gender: genderEnum,
  division: z.string().min(2, 'Division is required').max(50),
  modalityName: z.enum(['INDIVIDUAL', 'TEAM', 'MIXED']),
});

export const bulkEventCategoriesSchema = z.object({
  items: z.array(bulkEventCategoryItemSchema).min(1, 'At least 1 event-category is required'),
});

export type BulkEventCategoryItem = z.infer<typeof bulkEventCategoryItemSchema>;
export type BulkEventCategoriesInput = z.infer<typeof bulkEventCategoriesSchema>;

// ============================================
// BULK RESULTS SCHEMAS
// ============================================

export const bulkResultItemSchema = z.object({
  eventName: z.string().min(3, 'Event name is required'),
  bowType: bowTypeEnum,
  gender: genderEnum,
  division: z.string().min(2, 'Division is required').max(50),
  modalityName: z.enum(['INDIVIDUAL', 'TEAM', 'MIXED']),
  phaseName: phaseNameEnum,
  athleteFirstName: z.string().min(2, 'Athlete first name is required').max(50),
  athleteLastName: z.string().min(2, 'Athlete last name is required').max(50),
  score: z.number().int().min(0, 'Score must be non-negative'),
  position: z.number().int().positive('Position must be positive'),
  notes: z.string().max(500).optional().nullable(),
});

export const bulkResultsSchema = z.object({
  items: z.array(bulkResultItemSchema).min(1, 'At least 1 result is required'),
});

export type BulkResultItem = z.infer<typeof bulkResultItemSchema>;
export type BulkResultsInput = z.infer<typeof bulkResultsSchema>;

// ============================================
// BULK RESPONSE SCHEMAS
// ============================================

export const bulkResponseSchema = z.object({
  inserted: z.number().int().min(0),
  skipped: z.number().int().min(0),
  errors: z
    .array(
      z.object({
        index: z.number().int(),
        reason: z.string(),
      })
    )
    .optional(),
});

export type BulkResponse = z.infer<typeof bulkResponseSchema>;
