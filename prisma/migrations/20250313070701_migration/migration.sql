/*
  Warnings:

  - You are about to drop the column `childStockIds` on the `InventorySplitHistory` table. All the data in the column will be lost.
  - You are about to drop the column `parentStockId` on the `InventorySplitHistory` table. All the data in the column will be lost.
  - You are about to drop the column `performedById` on the `InventorySplitHistory` table. All the data in the column will be lost.
  - You are about to drop the column `splitDate` on the `InventorySplitHistory` table. All the data in the column will be lost.
  - You are about to drop the column `splitDetails` on the `InventorySplitHistory` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Manufacturer` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Manufacturer` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `customAttributes` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `manufacturerId` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `packageCount` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `supplierId` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `unitWeight` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `creatorId` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `currentWeight` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `expirationDate` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `extraConfig` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `inboundWeight` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `materialId` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `netWeight` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `parentStockId` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `productName` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `registrationDate` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `storageDate` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `updateDate` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `vesselId` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `vesselWeight` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `fieldName` on the `StockExtraConfig` table. All the data in the column will be lost.
  - You are about to drop the column `fieldType` on the `StockExtraConfig` table. All the data in the column will be lost.
  - You are about to drop the column `extraConfigId` on the `StockExtraConfigSelect` table. All the data in the column will be lost.
  - You are about to drop the column `performedAt` on the `StockHistory` table. All the data in the column will be lost.
  - You are about to drop the column `performedById` on the `StockHistory` table. All the data in the column will be lost.
  - You are about to drop the column `stockId` on the `StockHistory` table. All the data in the column will be lost.
  - You are about to drop the column `weightChange` on the `StockHistory` table. All the data in the column will be lost.
  - You are about to drop the column `allowedErrorPercentage` on the `StockInfoRule` table. All the data in the column will be lost.
  - You are about to drop the column `materialId` on the `StockInfoRule` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `StockReservation` table. All the data in the column will be lost.
  - You are about to drop the column `creatorId` on the `StockReservation` table. All the data in the column will be lost.
  - You are about to drop the column `materialId` on the `StockReservation` table. All the data in the column will be lost.
  - You are about to drop the column `outboundDate` on the `StockReservation` table. All the data in the column will be lost.
  - You are about to drop the column `requiredAmount` on the `StockReservation` table. All the data in the column will be lost.
  - You are about to drop the column `returnDate` on the `StockReservation` table. All the data in the column will be lost.
  - You are about to drop the column `testName` on the `StockReservation` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `StockReservation` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Vessel` table. All the data in the column will be lost.
  - You are about to drop the column `materialId` on the `Vessel` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Vessel` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[material_id]` on the table `StockInfoRule` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `child_stock_ids` to the `InventorySplitHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parent_stock_id` to the `InventorySplitHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `performed_by_id` to the `InventorySplitHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `split_details` to the `InventorySplitHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Manufacturer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category_id` to the `Material` table without a default value. This is not possible if the table is not empty.
  - Added the required column `manufacturer_id` to the `Material` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplier_id` to the `Material` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Material` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creator_id` to the `Stock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `current_weight` to the `Stock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiration_date` to the `Stock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inbound_weight` to the `Stock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `material_id` to the `Stock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `net_weight` to the `Stock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_name` to the `Stock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storage_date` to the `Stock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `update_date` to the `Stock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Stock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vessel_weight` to the `Stock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `field_name` to the `StockExtraConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `field_type` to the `StockExtraConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `extra_config_id` to the `StockExtraConfigSelect` table without a default value. This is not possible if the table is not empty.
  - Added the required column `performed_by_id` to the `StockHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stock_id` to the `StockHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weight_change` to the `StockHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `allowed_error_percentage` to the `StockInfoRule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `material_id` to the `StockInfoRule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creator_id` to the `StockReservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `material_id` to the `StockReservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `outbound_date` to the `StockReservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `required_amount` to the `StockReservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `return_date` to the `StockReservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `StockReservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Vessel` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "InventorySplitHistory" DROP CONSTRAINT "InventorySplitHistory_parentStockId_fkey";

-- DropForeignKey
ALTER TABLE "InventorySplitHistory" DROP CONSTRAINT "InventorySplitHistory_performedById_fkey";

-- DropForeignKey
ALTER TABLE "Material" DROP CONSTRAINT "Material_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Material" DROP CONSTRAINT "Material_manufacturerId_fkey";

-- DropForeignKey
ALTER TABLE "Material" DROP CONSTRAINT "Material_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "Stock" DROP CONSTRAINT "Stock_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "Stock" DROP CONSTRAINT "Stock_materialId_fkey";

-- DropForeignKey
ALTER TABLE "Stock" DROP CONSTRAINT "Stock_parentStockId_fkey";

-- DropForeignKey
ALTER TABLE "Stock" DROP CONSTRAINT "Stock_vesselId_fkey";

-- DropForeignKey
ALTER TABLE "StockExtraConfigSelect" DROP CONSTRAINT "StockExtraConfigSelect_extraConfigId_fkey";

-- DropForeignKey
ALTER TABLE "StockHistory" DROP CONSTRAINT "StockHistory_performedById_fkey";

-- DropForeignKey
ALTER TABLE "StockHistory" DROP CONSTRAINT "StockHistory_stockId_fkey";

-- DropForeignKey
ALTER TABLE "StockInfoRule" DROP CONSTRAINT "StockInfoRule_materialId_fkey";

-- DropForeignKey
ALTER TABLE "StockReservation" DROP CONSTRAINT "StockReservation_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "StockReservation" DROP CONSTRAINT "StockReservation_materialId_fkey";

-- DropForeignKey
ALTER TABLE "Vessel" DROP CONSTRAINT "Vessel_materialId_fkey";

-- DropIndex
DROP INDEX "StockInfoRule_materialId_key";

-- AlterTable
ALTER TABLE "InventorySplitHistory" DROP COLUMN "childStockIds",
DROP COLUMN "parentStockId",
DROP COLUMN "performedById",
DROP COLUMN "splitDate",
DROP COLUMN "splitDetails",
ADD COLUMN     "child_stock_ids" JSONB NOT NULL,
ADD COLUMN     "parent_stock_id" INTEGER NOT NULL,
ADD COLUMN     "performed_by_id" INTEGER NOT NULL,
ADD COLUMN     "split_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "split_details" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Manufacturer" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Material" DROP COLUMN "categoryId",
DROP COLUMN "createdAt",
DROP COLUMN "customAttributes",
DROP COLUMN "manufacturerId",
DROP COLUMN "packageCount",
DROP COLUMN "supplierId",
DROP COLUMN "unitWeight",
DROP COLUMN "updatedAt",
ADD COLUMN     "category_id" INTEGER NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "custom_attributes" JSONB,
ADD COLUMN     "manufacturer_id" INTEGER NOT NULL,
ADD COLUMN     "package_count" INTEGER,
ADD COLUMN     "supplier_id" INTEGER NOT NULL,
ADD COLUMN     "unit_weight" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Stock" DROP COLUMN "createdAt",
DROP COLUMN "creatorId",
DROP COLUMN "currentWeight",
DROP COLUMN "expirationDate",
DROP COLUMN "extraConfig",
DROP COLUMN "inboundWeight",
DROP COLUMN "materialId",
DROP COLUMN "netWeight",
DROP COLUMN "parentStockId",
DROP COLUMN "productName",
DROP COLUMN "registrationDate",
DROP COLUMN "storageDate",
DROP COLUMN "updateDate",
DROP COLUMN "updatedAt",
DROP COLUMN "vesselId",
DROP COLUMN "vesselWeight",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "creator_id" INTEGER NOT NULL,
ADD COLUMN     "current_weight" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "expiration_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "extra_config" JSONB,
ADD COLUMN     "inbound_weight" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "material_id" INTEGER NOT NULL,
ADD COLUMN     "net_weight" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "parent_stock_id" INTEGER,
ADD COLUMN     "product_name" TEXT NOT NULL,
ADD COLUMN     "registration_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "storage_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "update_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vessel_id" INTEGER,
ADD COLUMN     "vessel_weight" DECIMAL(65,30) NOT NULL;

-- AlterTable
ALTER TABLE "StockExtraConfig" DROP COLUMN "fieldName",
DROP COLUMN "fieldType",
ADD COLUMN     "field_name" TEXT NOT NULL,
ADD COLUMN     "field_type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StockExtraConfigSelect" DROP COLUMN "extraConfigId",
ADD COLUMN     "extra_config_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "StockHistory" DROP COLUMN "performedAt",
DROP COLUMN "performedById",
DROP COLUMN "stockId",
DROP COLUMN "weightChange",
ADD COLUMN     "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "performed_by_id" INTEGER NOT NULL,
ADD COLUMN     "stock_id" INTEGER NOT NULL,
ADD COLUMN     "weight_change" DECIMAL(65,30) NOT NULL;

-- AlterTable
ALTER TABLE "StockInfoRule" DROP COLUMN "allowedErrorPercentage",
DROP COLUMN "materialId",
ADD COLUMN     "allowed_error_percentage" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "material_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "StockReservation" DROP COLUMN "createdAt",
DROP COLUMN "creatorId",
DROP COLUMN "materialId",
DROP COLUMN "outboundDate",
DROP COLUMN "requiredAmount",
DROP COLUMN "returnDate",
DROP COLUMN "testName",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "creator_id" INTEGER NOT NULL,
ADD COLUMN     "material_id" INTEGER NOT NULL,
ADD COLUMN     "outbound_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "required_amount" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "return_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "test_name" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Supplier" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Vessel" DROP COLUMN "createdAt",
DROP COLUMN "materialId",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "material_id" INTEGER,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "StockInfoRule_material_id_key" ON "StockInfoRule"("material_id");

-- AddForeignKey
ALTER TABLE "InventorySplitHistory" ADD CONSTRAINT "InventorySplitHistory_parent_stock_id_fkey" FOREIGN KEY ("parent_stock_id") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySplitHistory" ADD CONSTRAINT "InventorySplitHistory_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "Manufacturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_vessel_id_fkey" FOREIGN KEY ("vessel_id") REFERENCES "Vessel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_parent_stock_id_fkey" FOREIGN KEY ("parent_stock_id") REFERENCES "Stock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockExtraConfigSelect" ADD CONSTRAINT "StockExtraConfigSelect_extra_config_id_fkey" FOREIGN KEY ("extra_config_id") REFERENCES "StockExtraConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockHistory" ADD CONSTRAINT "StockHistory_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockHistory" ADD CONSTRAINT "StockHistory_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockInfoRule" ADD CONSTRAINT "StockInfoRule_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vessel" ADD CONSTRAINT "Vessel_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;
