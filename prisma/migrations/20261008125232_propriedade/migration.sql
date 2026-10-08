-- CreateEnum
CREATE TYPE "Atividade" AS ENUM ('PECUARIA', 'AGRICULTURA');

-- CreateEnum
CREATE TYPE "TipoRebanho" AS ENUM ('CORTE', 'LEITE', 'MISTO');

-- CreateTable
CREATE TABLE "propriedade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "uf" CHAR(2) NOT NULL,
    "areaTotalHa" DECIMAL(10,2),
    "atividades" "Atividade"[],
    "tipoRebanho" "TipoRebanho",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "propriedade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "propriedade_userId_key" ON "propriedade"("userId");

-- AddForeignKey
ALTER TABLE "propriedade" ADD CONSTRAINT "propriedade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
