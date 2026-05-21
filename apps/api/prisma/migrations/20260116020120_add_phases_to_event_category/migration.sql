-- AlterTable
ALTER TABLE "event_categories" ADD COLUMN     "phases" TEXT[] DEFAULT ARRAY[]::TEXT[];
