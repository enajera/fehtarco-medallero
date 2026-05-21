-- CreateEnum
CREATE TYPE "EventScope" AS ENUM ('NATIONAL_FEDERATION', 'NATIONAL_INTERNATIONALIZED', 'INTERNATIONAL_NATIONAL_TEAM');

-- CreateEnum
CREATE TYPE "TechnicalLevel" AS ENUM ('WA_STANDARD', 'INDOOR_STANDARD', 'REDUCED', 'DEVELOPMENT');

-- CreateEnum
CREATE TYPE "Distance" AS ENUM ('THIRTY_METERS', 'FIFTY_METERS', 'SEVENTY_METERS', 'INDOOR');

-- CreateEnum
CREATE TYPE "BowType" AS ENUM ('RECURVE', 'COMPOUND', 'BAREBOW');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('M', 'F');

-- CreateEnum
CREATE TYPE "ModalityName" AS ENUM ('INDIVIDUAL', 'TEAM', 'MIXED');

-- CreateEnum
CREATE TYPE "PhaseName" AS ENUM ('QUALIFICATION', 'FINAL', 'BRONZE_MATCH');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PUBLIC', 'ADMIN', 'SUPER_ADMIN');

-- CreateTable
CREATE TABLE "clubs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athletes" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "gender" "Gender",
    "clubId" INTEGER,
    "phone" TEXT,
    "email" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "bloodType" TEXT,
    "bowType" "BowType" NOT NULL,
    "drawWeightLbs" DOUBLE PRECISION,
    "drawLengthIn" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athletes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "organizer" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "eventScope" "EventScope" NOT NULL,
    "technicalLevel" "TechnicalLevel" NOT NULL,
    "distance" "Distance",
    "official" BOOLEAN NOT NULL DEFAULT true,
    "clubMedalsEnabled" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "bowType" "BowType" NOT NULL,
    "gender" "Gender" NOT NULL,
    "division" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modalities" (
    "id" SERIAL NOT NULL,
    "name" "ModalityName" NOT NULL,

    CONSTRAINT "modalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phases" (
    "id" SERIAL NOT NULL,
    "name" "PhaseName" NOT NULL,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_categories" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "modalityId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "results" (
    "id" SERIAL NOT NULL,
    "eventCategoryId" INTEGER NOT NULL,
    "phaseId" INTEGER NOT NULL,
    "athleteId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clubs_name_key" ON "clubs"("name");

-- CreateIndex
CREATE INDEX "athletes_clubId_idx" ON "athletes"("clubId");

-- CreateIndex
CREATE INDEX "athletes_lastName_firstName_idx" ON "athletes"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "events_startDate_idx" ON "events"("startDate");

-- CreateIndex
CREATE INDEX "events_eventScope_idx" ON "events"("eventScope");

-- CreateIndex
CREATE INDEX "events_technicalLevel_idx" ON "events"("technicalLevel");

-- CreateIndex
CREATE INDEX "events_distance_idx" ON "events"("distance");

-- CreateIndex
CREATE INDEX "categories_bowType_gender_idx" ON "categories"("bowType", "gender");

-- CreateIndex
CREATE UNIQUE INDEX "categories_bowType_gender_division_key" ON "categories"("bowType", "gender", "division");

-- CreateIndex
CREATE UNIQUE INDEX "modalities_name_key" ON "modalities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "phases_name_key" ON "phases"("name");

-- CreateIndex
CREATE INDEX "event_categories_eventId_idx" ON "event_categories"("eventId");

-- CreateIndex
CREATE INDEX "event_categories_categoryId_idx" ON "event_categories"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "event_categories_eventId_categoryId_modalityId_key" ON "event_categories"("eventId", "categoryId", "modalityId");

-- CreateIndex
CREATE INDEX "results_athleteId_idx" ON "results"("athleteId");

-- CreateIndex
CREATE INDEX "results_eventCategoryId_phaseId_idx" ON "results"("eventCategoryId", "phaseId");

-- CreateIndex
CREATE UNIQUE INDEX "results_eventCategoryId_phaseId_athleteId_key" ON "results"("eventCategoryId", "phaseId", "athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_categories" ADD CONSTRAINT "event_categories_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_categories" ADD CONSTRAINT "event_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_categories" ADD CONSTRAINT "event_categories_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES "modalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_eventCategoryId_fkey" FOREIGN KEY ("eventCategoryId") REFERENCES "event_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "phases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
