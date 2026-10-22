-- AlterTable
ALTER TABLE "user" ADD COLUMN     "notificarPorEmail" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "notificacao" (
    "id" TEXT NOT NULL,
    "propriedadeId" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "gravidade" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "detalhe" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "lidaEm" TIMESTAMP(3),
    "emailPendente" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notificacao_propriedadeId_createdAt_idx" ON "notificacao"("propriedadeId", "createdAt");

-- CreateIndex
CREATE INDEX "notificacao_emailPendente_idx" ON "notificacao"("emailPendente");

-- CreateIndex
CREATE UNIQUE INDEX "notificacao_propriedadeId_chave_key" ON "notificacao"("propriedadeId", "chave");

-- AddForeignKey
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_propriedadeId_fkey" FOREIGN KEY ("propriedadeId") REFERENCES "propriedade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

