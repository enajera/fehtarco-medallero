import { EventScope, TechnicalLevel } from '@prisma/client';
import prisma from './prisma';
import { CreateEventInput, UpdateEventInput, CreateEventCategoryInput } from '../validation/schemas';
import { NotFoundError } from '../utils/errors';

// ============================================
// EVENT SERVICE
// ============================================

interface EventFilters {
  year?: number;
  scope?: EventScope;
  technicalLevel?: TechnicalLevel;
  page?: number;
  limit?: number;
}

export class EventService {
  /**
   * Get all events with filters and pagination
   */
  async findAll(filters: EventFilters) {
    const { year, scope, technicalLevel, q, page = 1, limit = 20 } = filters as any;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (year) {
      where.startDate = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      };
    }
    if (scope) where.eventScope = scope;
    if (technicalLevel) where.technicalLevel = technicalLevel;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
        include: {
          _count: {
            select: { eventCategories: true },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return { events, total, page, limit };
  }

  /**
   * Get event by ID with event categories
   */
  async findById(id: number) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        eventCategories: {
          include: {
            category: true,
            modality: true,
            _count: {
              select: { results: true },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundError('Event');
    }

    // Las fases ahora están guardadas en el campo 'phases' de EventCategory
    // No necesitamos deducirlas de los resultados
    const enrichedCategories = (event.eventCategories || []).map((ec: any) => ({
      ...ec,
      phases: ec.phases || [], // Usar fases guardadas en la BD
    }));

    return { ...event, eventCategories: enrichedCategories };
  }

  /**
   * Create a new event
   */
  async create(input: CreateEventInput) {
    const data = {
      ...input,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
    };

    return prisma.event.create({
      data,
    });
  }

  /**
   * Update an event
   */
  async update(id: number, input: UpdateEventInput) {
    const event = await prisma.event.findUnique({ where: { id } });
    
    if (!event) {
      throw new NotFoundError('Event');
    }

    const data = {
      ...input,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    };

    return prisma.event.update({
      where: { id },
      data,
    });
  }

  /**
   * Add a category to an event (create EventCategory)
   */
  async addEventCategory(eventId: number, input: CreateEventCategoryInput) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    
    if (!event) {
      throw new NotFoundError('Event');
    }

    console.log('[addEventCategory] Guardando con phases:', (input as any).phases);
    return prisma.eventCategory.create({
      data: {
        eventId,
        categoryId: input.categoryId,
        modalityId: input.modalityId,
        distance: (input as any).distance || undefined,
        phases: (input as any).phases || [],
      },
      include: {
        category: true,
        modality: true,
      },
    });
  }

  /**
   * Remove a category from an event
   */
  async removeEventCategory(eventCategoryId: number) {
    const ec = await prisma.eventCategory.findUnique({ 
      where: { id: eventCategoryId } 
    });
    
    if (!ec) {
      throw new NotFoundError('EventCategory');
    }

    return prisma.eventCategory.delete({
      where: { id: eventCategoryId },
    });
  }

  /**
   * Get event categories for an event
   */
  async getEventCategories(eventId: number) {
    const eventCategories = await prisma.eventCategory.findMany({
      where: { eventId },
      select: {
        id: true,
        eventId: true,
        categoryId: true,
        modalityId: true,
        distance: true,
        phases: true,  // Incluir el campo phases guardado en la BD
        category: true,
        modality: true,
        _count: { select: { results: true } },
        createdAt: true,
        updatedAt: true,
      },
    });

    // Retornar con las fases guardadas en EventCategory
    return eventCategories;
  }

  /**
   * Update an event category (change category/modality/distance/phases)
   */
  async updateEventCategory(eventCategoryId: number, input: Partial<CreateEventCategoryInput>) {
    const ec = await prisma.eventCategory.findUnique({ where: { id: eventCategoryId } });
    if (!ec) throw new NotFoundError('EventCategory');

    console.log('[updateEventCategory] Actualizando con phases:', (input as any).phases);
    const data: any = {};
    if ((input as any).categoryId !== undefined) data.categoryId = (input as any).categoryId;
    if ((input as any).modalityId !== undefined) data.modalityId = (input as any).modalityId;
    if ((input as any).distance !== undefined) data.distance = (input as any).distance || null;
    if ((input as any).phases !== undefined) data.phases = (input as any).phases || [];

    console.log('[updateEventCategory] Data a actualizar:', data);
    return prisma.eventCategory.update({
      where: { id: eventCategoryId },
      data,
      include: { category: true, modality: true, _count: { select: { results: true } } },
    });
  }
}

export const eventService = new EventService();
