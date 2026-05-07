/*
  Warnings:

  - Added the required column `videoKey` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "videoKey" TEXT NOT NULL;
