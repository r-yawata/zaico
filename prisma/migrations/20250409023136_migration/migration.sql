/*
  Warnings:

  - You are about to drop the `_MaterialToVessel` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `enable_lot_control` to the `Material` table without a default value. This is not possible if the table is not empty.
  - Added the required column `enable_weight_control` to the `Material` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vessel_id` to the `Material` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_MaterialToVessel" DROP CONSTRAINT "_MaterialToVessel_A_fkey";

-- DropForeignKey
ALTER TABLE "_MaterialToVessel" DROP CONSTRAINT "_MaterialToVessel_B_fkey";

-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "enable_lot_control" BOOLEAN NOT NULL,
ADD COLUMN     "enable_weight_control" BOOLEAN NOT NULL,
ADD COLUMN     "vessel_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "_MaterialToVessel";

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_vessel_id_fkey" FOREIGN KEY ("vessel_id") REFERENCES "Vessel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
