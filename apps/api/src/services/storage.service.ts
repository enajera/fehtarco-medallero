import prisma from './prisma';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB max

/**
 * Valid image MIME types for athlete photos
 */
const VALID_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Upload athlete photo to PostgreSQL database (BYTEA storage)
 * @param athleteId - The athlete ID
 * @param fileBuffer - File buffer from multer
 * @param mimeType - MIME type of the file (e.g., 'image/jpeg')
 * @returns Updated athlete object with photo metadata
 */
export async function uploadAthletePhoto(
  athleteId: number,
  fileBuffer: Buffer,
  mimeType: string
) {
  // Validate file size
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  // Validate MIME type
  if (!VALID_MIME_TYPES.includes(mimeType)) {
    throw new Error(`Invalid file type. Allowed types: ${VALID_MIME_TYPES.join(', ')}`);
  }

  // Update athlete with photo data and MIME type
  const updatedAthlete = await (prisma.athlete.update as any)({
    where: { id: athleteId },
    data: {
      photoData: fileBuffer,
      photoMimeType: mimeType,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photoMimeType: true,
      // Don't select photoData in response (too large)
    },
  });

  return updatedAthlete;
}

/**
 * Get athlete photo as buffer and MIME type
 * @param athleteId - The athlete ID
 * @returns Object with photoData buffer and MIME type, or null if no photo
 */
export async function getAthletePhoto(athleteId: number) {
  const athlete = await (prisma.athlete.findUnique as any)({
    where: { id: athleteId },
    select: {
      photoData: true,
      photoMimeType: true,
    },
  });

  if (!athlete || !(athlete as any).photoData) {
    return null;
  }

  return {
    photoData: (athlete as any).photoData,
    photoMimeType: (athlete as any).photoMimeType || 'image/jpeg',
  };
}

/**
 * Delete athlete photo from database
 * @param athleteId - The athlete ID
 * @returns Updated athlete object
 */
export async function deleteAthletePhoto(athleteId: number) {
  const updatedAthlete = await (prisma.athlete.update as any)({
    where: { id: athleteId },
    data: {
      photoData: null,
      photoMimeType: null,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });

  return updatedAthlete;
}

/**
 * Get photo URL for frontend use
 * Returns either a data URL (small inline images) or an API endpoint URL
 * @param athleteId - The athlete ID
 * @returns URL to fetch the photo, or null if no photo exists
 */
export function getPhotoUrl(athleteId: number): string | null {
  // Use API endpoint to serve the photo - more efficient than data URLs
  return `/api/athletes/${athleteId}/photo`;
}
