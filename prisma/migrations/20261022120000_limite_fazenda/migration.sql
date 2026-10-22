-- CreateTable
CREATE TABLE "limite_fazenda" (
    "id" TEXT NOT NULL,
    "propriedadeId" TEXT NOT NULL,
    "contornos" JSONB NOT NULL,
    "areaHa" DECIMAL(10,2) NOT NULL,
    "codigoCar" TEXT,
    "arquivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "limite_fazenda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "limite_fazenda_propriedadeId_key" ON "limite_fazenda"("propriedadeId");

-- AddForeignKey
ALTER TABLE "limite_fazenda" ADD CONSTRAINT "limite_fazenda_propriedadeId_fkey" FOREIGN KEY ("propriedadeId") REFERENCES "propriedade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
