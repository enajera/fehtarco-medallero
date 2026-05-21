/*
  Warnings:

  - You are about to drop the column `distance` on the `events` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Distance" ADD VALUE 'FIVE_METERS';
ALTER TYPE "Distance" ADD VALUE 'TEN_METERS';

-- DropIndex
DROP INDEX "events_distance_idx";

-- AlterTable
ALTER TABLE "athletes" ADD COLUMN     "clubHistory" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "event_categories" ADD COLUMN     "distance" "Distance";

-- AlterTable
ALTER TABLE "events" DROP COLUMN "distance";

-- CreateIndex
CREATE INDEX "event_categories_distance_idx" ON "event_categories"("distance");
