/*
  Warnings:

  - Added the required column `note` to the `Material` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "note" TEXT NOT NULL;
