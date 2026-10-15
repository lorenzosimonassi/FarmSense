-- CreateTable
CREATE TABLE "pesagem" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "pesoKg" DECIMAL(7,2) NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pesagem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pesagem_data_idx" ON "pesagem"("data");

-- CreateIndex
CREATE UNIQUE INDEX "pesagem_animalId_data_key" ON "pesagem"("animalId", "data");

-- AddForeignKey
ALTER TABLE "pesagem" ADD CONSTRAINT "pesagem_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
