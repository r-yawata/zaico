/*
  Warnings:

  - You are about to drop the column `vessel_id` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `material_id` on the `Vessel` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Stock" DROP CONSTRAINT "Stock_vessel_id_fkey";

-- DropForeignKey
ALTER TABLE "Vessel" DROP CONSTRAINT "Vessel_material_id_fkey";

-- AlterTable
ALTER TABLE "Stock" DROP COLUMN "vessel_id";

-- AlterTable
ALTER TABLE "Vessel" DROP COLUMN "material_id",
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "_MaterialToVessel" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_MaterialToVessel_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_MaterialToVessel_B_index" ON "_MaterialToVessel"("B");

-- AddForeignKey
ALTER TABLE "_MaterialToVessel" ADD CONSTRAINT "_MaterialToVessel_A_fkey" FOREIGN KEY ("A") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MaterialToVessel" ADD CONSTRAINT "_MaterialToVessel_B_fkey" FOREIGN KEY ("B") REFERENCES "Vessel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
