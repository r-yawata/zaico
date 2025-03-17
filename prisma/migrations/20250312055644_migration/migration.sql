/*
  Warnings:

  - Made the column `supplierId` on table `Material` required. This step will fail if there are existing NULL values in that column.
  - Made the column `manufacturerId` on table `Material` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Material" DROP CONSTRAINT "Material_manufacturerId_fkey";

-- DropForeignKey
ALTER TABLE "Material" DROP CONSTRAINT "Material_supplierId_fkey";

-- AlterTable
ALTER TABLE "Material" ALTER COLUMN "supplierId" SET NOT NULL,
ALTER COLUMN "manufacturerId" SET NOT NULL,
ALTER COLUMN "note" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
