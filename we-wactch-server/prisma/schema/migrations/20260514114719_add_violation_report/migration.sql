-- CreateTable
CREATE TABLE "ViolationReport" (
    "id" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "roomTitle" TEXT NOT NULL,
    "hostId" UUID NOT NULL,
    "hostName" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "adminId" UUID NOT NULL,
    "adminName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ViolationReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ViolationReport_hostId_idx" ON "ViolationReport"("hostId");

-- CreateIndex
CREATE INDEX "ViolationReport_adminId_idx" ON "ViolationReport"("adminId");
