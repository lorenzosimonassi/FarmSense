-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MACHO', 'FEMEA');

-- CreateEnum
CREATE TYPE "SituacaoAnimal" AS ENUM ('ATIVO', 'VENDIDO', 'MORTO');

-- CreateTable
CREATE TABLE "animal" (
    "id" TEXT NOT NULL,
    "propriedadeId" TEXT NOT NULL,
    "identificacao" TEXT NOT NULL,
    "nome" TEXT,
    "sexo" "Sexo" NOT NULL,
    "raca" TEXT,
    "dataNascimento" DATE,
    "lote" TEXT,
    "situacao" "SituacaoAnimal" NOT NULL DEFAULT 'ATIVO',
    "dataSaida" DATE,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "animal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "animal_propriedadeId_situacao_idx" ON "animal"("propriedadeId", "situacao");

-- CreateIndex
CREATE UNIQUE INDEX "animal_propriedadeId_identificacao_key" ON "animal"("propriedadeId", "identificacao");

-- AddForeignKey
ALTER TABLE "animal" ADD CONSTRAINT "animal_propriedadeId_fkey" FOREIGN KEY ("propriedadeId") REFERENCES "propriedade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
