-- CreateTable
CREATE TABLE "talhao" (
    "id" TEXT NOT NULL,
    "propriedadeId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "areaHa" DECIMAL(10,2) NOT NULL,
    "contorno" JSONB,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "talhao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "talhao_propriedadeId_nome_key" ON "talhao"("propriedadeId", "nome");

-- AddForeignKey
ALTER TABLE "talhao" ADD CONSTRAINT "talhao_propriedadeId_fkey" FOREIGN KEY ("propriedadeId") REFERENCES "propriedade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
