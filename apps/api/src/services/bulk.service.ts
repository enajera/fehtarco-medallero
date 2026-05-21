import prisma from './prisma';
import {
  BulkClubsInput,
  BulkAthletesInput,
  BulkEventsInput,
  BulkEventCategoriesInput,
  BulkResultsInput,
  BulkResponse,
} from '../validation/bulk.schemas';
import { AppError } from '../utils/errors';

// ============================================
// BULK CLUBS
// ============================================

export async function bulkCreateClubs(input: BulkClubsInput): Promise<BulkResponse> {
  const errors: Array<{ index: number; reason: string }> = [];
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < input.items.length; i++) {
    const item = input.items[i];
    try {
      const existingClub = await prisma.club.findUnique({
        where: { name: item.name },
      });

      if (existingClub) {
        skipped++;
        continue;
      }

      await prisma.club.create({
        data: {
          name: item.name,
          abbreviation: item.abbreviation || null,
          city: item.city || null,
          logoUrl: item.logoUrl || null,
          active: item.active,
        },
      });

      inserted++;
    } catch (error) {
      errors.push({
        index: i,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { inserted, skipped, errors: errors.length > 0 ? errors : undefined };
}

// ============================================
// BULK ATHLETES
// ============================================

export async function bulkCreateAthletes(input: BulkAthletesInput): Promise<BulkResponse> {
  const errors: Array<{ index: number; reason: string }> = [];
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < input.items.length; i++) {
    const item = input.items[i];
    try {
      // Resolve clubName to clubId
      let clubId: number | null = null;
      if (item.clubName) {
        const club = await prisma.club.findUnique({
          where: { name: item.clubName },
        });
        if (!club) {
          throw new Error(`Club "${item.clubName}" not found`);
        }
        clubId = club.id;
      }

      // Check if athlete already exists
      const existingAthlete = await prisma.athlete.findFirst({
        where: {
          firstName: item.firstName,
          lastName: item.lastName,
        },
      });

      if (existingAthlete) {
        skipped++;
        continue;
      }

      await prisma.athlete.create({
        data: {
          firstName: item.firstName,
          lastName: item.lastName,
          gender: item.gender || null,
          bowType: item.bowType,
          clubId: clubId,
          birthDate: item.birthDate ? new Date(item.birthDate) : null,
          phone: item.phone || null,
          email: item.email || null,
          emergencyContactName: item.emergencyContactName || null,
          emergencyContactPhone: item.emergencyContactPhone || null,
          bloodType: item.bloodType || null,
          drawWeightLbs: item.drawWeightLbs || null,
          drawLengthIn: item.drawLengthIn || null,
          photoUrl: item.photoUrl || null,
          active: item.active,
        },
      });

      inserted++;
    } catch (error) {
      errors.push({
        index: i,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { inserted, skipped, errors: errors.length > 0 ? errors : undefined };
}

// ============================================
// BULK EVENTS
// ============================================

export async function bulkCreateEvents(input: BulkEventsInput): Promise<BulkResponse> {
  const errors: Array<{ index: number; reason: string }> = [];
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < input.items.length; i++) {
    const item = input.items[i];
    try {
      // Check if event already exists
      const existingEvent = await prisma.event.findFirst({
        where: {
          name: item.name,
          startDate: new Date(item.startDate),
        },
      });

      if (existingEvent) {
        skipped++;
        continue;
      }

      await prisma.event.create({
        data: {
          name: item.name,
          organizer: item.organizer,
          location: item.location,
          country: item.country,
          startDate: new Date(item.startDate),
          endDate: new Date(item.endDate),
          eventScope: item.eventScope,
          technicalLevel: item.technicalLevel,
          official: item.official,
          clubMedalsEnabled: item.clubMedalsEnabled,
        },
      });

      inserted++;
    } catch (error) {
      errors.push({
        index: i,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { inserted, skipped, errors: errors.length > 0 ? errors : undefined };
}

// ============================================
// BULK EVENT CATEGORIES
// ============================================

export async function bulkCreateEventCategories(
  input: BulkEventCategoriesInput
): Promise<BulkResponse> {
  const errors: Array<{ index: number; reason: string }> = [];
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < input.items.length; i++) {
    const item = input.items[i];
    try {
      // Resolve event by name (trim and case-insensitive match)
      const event = await prisma.event.findFirst({
        where: { name: { equals: (item.eventName || '').trim(), mode: 'insensitive' } },
      });
      if (!event) {
        throw new Error(`Event "${item.eventName}" not found`);
      }

      // Resolve category by bowType, gender, division
      const category = await prisma.category.findFirst({
        where: {
          bowType: item.bowType,
          gender: item.gender,
          division: (item.division || '').trim(),
        },
      });

      if (!category) {
        throw new Error(
          `Category (${item.bowType}, ${item.gender}, ${item.division}) not found`
        );
      }

      // Resolve modality by name
      const modalityName = (item.modalityName || '').trim();
      const modality = await prisma.modality.findUnique({
        where: { name: modalityName as any },
      });

      if (!modality) {
        throw new Error(`Modality "${item.modalityName}" not found`);
      }

      // Check if event-category already exists
      const existingEC = await prisma.eventCategory.findUnique({
        where: {
          eventId_categoryId_modalityId: {
            eventId: event.id,
            categoryId: category.id,
            modalityId: modality.id,
          },
        },
      });

      if (existingEC) {
        skipped++;
        continue;
      }

      await prisma.eventCategory.create({
        data: {
          eventId: event.id,
          categoryId: category.id,
          modalityId: modality.id,
        },
      });

      inserted++;
    } catch (error) {
      errors.push({
        index: i,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { inserted, skipped, errors: errors.length > 0 ? errors : undefined };
}

// ============================================
// BULK RESULTS
// ============================================

export async function bulkCreateResults(input: BulkResultsInput): Promise<BulkResponse> {
  const errors: Array<{ index: number; reason: string }> = [];
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < input.items.length; i++) {
    const item = input.items[i];
    try {
      // Resolve event
      const event = await prisma.event.findFirst({
        where: { name: { equals: (item.eventName || '').trim(), mode: 'insensitive' } },
      });
      if (!event) {
        throw new Error(`Event "${item.eventName}" not found`);
      }

      // Resolve category
      const category = await prisma.category.findFirst({
        where: {
          bowType: item.bowType,
          gender: item.gender,
          division: (item.division || '').trim(),
        },
      });
      if (!category) {
        throw new Error(
          `Category (${item.bowType}, ${item.gender}, ${item.division}) not found`
        );
      }

      // Resolve modality
      const modalityName = (item.modalityName || '').trim();
      const modality = await prisma.modality.findUnique({
        where: { name: modalityName as any },
      });
      if (!modality) {
        throw new Error(`Modality "${item.modalityName}" not found`);
      }

      // Resolve event-category
      const eventCategory = await prisma.eventCategory.findUnique({
        where: {
          eventId_categoryId_modalityId: {
            eventId: event.id,
            categoryId: category.id,
            modalityId: modality.id,
          },
        },
      });
      if (!eventCategory) {
        throw new Error(
          `EventCategory combination not found for event "${item.eventName}", category (${item.bowType}, ${item.gender}, ${item.division}), modality "${item.modalityName}"`
        );
      }

      // Resolve phase
      const phase = await prisma.phase.findUnique({
        where: { name: item.phaseName },
      });
      if (!phase) {
        throw new Error(`Phase "${item.phaseName}" not found`);
      }

      // Resolve athlete
      const athlete = await prisma.athlete.findFirst({
        where: {
          firstName: { equals: (item.athleteFirstName || '').trim(), mode: 'insensitive' },
          lastName: { equals: (item.athleteLastName || '').trim(), mode: 'insensitive' },
        },
      });
      if (!athlete) {
        throw new Error(
          `Athlete "${item.athleteFirstName} ${item.athleteLastName}" not found`
        );
      }

      // Check if result already exists (unique constraint)
      const existingResult = await prisma.result.findUnique({
        where: {
          eventCategoryId_phaseId_athleteId: {
            eventCategoryId: eventCategory.id,
            phaseId: phase.id,
            athleteId: athlete.id,
          },
        },
      });

      if (existingResult) {
        skipped++;
        continue;
      }

      await prisma.result.create({
        data: {
          eventCategoryId: eventCategory.id,
          phaseId: phase.id,
          athleteId: athlete.id,
          score: item.score,
          position: item.position,
          notes: item.notes || null,
        },
      });

      inserted++;
    } catch (error) {
      errors.push({
        index: i,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { inserted, skipped, errors: errors.length > 0 ? errors : undefined };
}
