-- CreateTable
CREATE TABLE "InstitutionSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "institutionName" TEXT NOT NULL,
    "appName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "contactEmail" TEXT,
    "footerText" TEXT,
    "allowPublicBank" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
