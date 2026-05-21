-- AlterTable
ALTER TABLE "athletes" ADD COLUMN "userId" INTEGER;

-- CreateIndex (ensure userId is unique for one-to-one relationship)
CREATE UNIQUE INDEX "athletes_userId_key" ON "athletes"("userId");

-- AddForeignKey
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
