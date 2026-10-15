-- CreateEnum
CREATE TYPE "TipoAplicacao" AS ENUM ('VACINA', 'VERMIFUGO', 'MEDICAMENTO', 'OUTRO');

-- CreateTable
CREATE TABLE "aplicacao_sanitaria" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "tipo" "TipoAplicacao" NOT NULL,
    "produto" TEXT NOT NULL,
    "dose" TEXT,
    "dataAplicacao" DATE NOT NULL,
    "proximaDose" DATE,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aplicacao_sanitaria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "aplicacao_sanitaria_animalId_produto_idx" ON "aplicacao_sanitaria"("animalId", "produto");

-- CreateIndex
CREATE INDEX "aplicacao_sanitaria_proximaDose_idx" ON "aplicacao_sanitaria"("proximaDose");

-- AddForeignKey
ALTER TABLE "aplicacao_sanitaria" ADD CONSTRAINT "aplicacao_sanitaria_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
