-- CreateEnum
CREATE TYPE "UnidadeColheita" AS ENUM ('SC', 'T', 'KG');

-- CreateTable
CREATE TABLE "plantio" (
    "id" TEXT NOT NULL,
    "talhaoId" TEXT NOT NULL,
    "cultura" TEXT NOT NULL,
    "variedade" TEXT,
    "dataPlantio" DATE NOT NULL,
    "previsaoColheita" DATE,
    "dataColheita" DATE,
    "quantidadeColhida" DECIMAL(12,2),
    "unidade" "UnidadeColheita",
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plantio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plantio_talhaoId_dataPlantio_idx" ON "plantio"("talhaoId", "dataPlantio");

-- AddForeignKey
ALTER TABLE "plantio" ADD CONSTRAINT "plantio_talhaoId_fkey" FOREIGN KEY ("talhaoId") REFERENCES "talhao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
