/*
  Warnings:

  - Added the required column `vessel_id` to the `Stock` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Stock" ADD COLUMN     "vessel_id" INTEGER NOT NULL;
