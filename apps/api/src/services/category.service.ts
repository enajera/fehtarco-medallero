import prisma from './prisma';
import { CreateCategoryInput } from '../validation/schemas';

// ============================================
// CATEGORY SERVICE
// ============================================

export class CategoryService {
  /**
   * Get all categories
   */
  async findAll() {
    return prisma.category.findMany({
      orderBy: [
        { bowType: 'asc' },
        { gender: 'asc' },
        { division: 'asc' },
      ],
    });
  }

  /**
   * Get category by ID
   */
  async findById(id: number) {
    return prisma.category.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new category
   */
  async create(input: CreateCategoryInput) {
    return prisma.category.create({
      data: input,
    });
  }

  /**
   * Update a category
   */
  async update(id: number, input: Partial<CreateCategoryInput>) {
    return prisma.category.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Delete a category
   */
  async remove(id: number) {
    return prisma.category.delete({
      where: { id },
    });
  }
}

export const categoryService = new CategoryService();
