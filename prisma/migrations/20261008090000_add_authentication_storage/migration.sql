-- CreateTable
CREATE TABLE "AuthenticationSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3) NOT NULL,
    "mfa" TEXT,
    "metadata" JSONB,
    CONSTRAINT "AuthenticationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthenticationRefreshToken" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "familyExpiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "claims" JSONB,
    CONSTRAINT "AuthenticationRefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaAuthenticator" (
    "userId" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "confirmed" BOOLEAN NOT NULL,
    "pendingSecret" TEXT,
    "lastUsedStep" INTEGER,
    CONSTRAINT "MfaAuthenticator_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "MfaRecoveryCode" (
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    CONSTRAINT "MfaRecoveryCode_pkey" PRIMARY KEY ("userId", "codeHash")
);

-- CreateTable
CREATE TABLE "MfaFailure" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "failedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MfaFailure_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthenticationSession_userId_idx" ON "AuthenticationSession"("userId");
CREATE INDEX "AuthenticationSession_expiresAt_idx" ON "AuthenticationSession"("expiresAt");
CREATE INDEX "AuthenticationRefreshToken_familyId_idx" ON "AuthenticationRefreshToken"("familyId");
CREATE INDEX "AuthenticationRefreshToken_userId_idx" ON "AuthenticationRefreshToken"("userId");
CREATE INDEX "AuthenticationRefreshToken_familyExpiresAt_idx" ON "AuthenticationRefreshToken"("familyExpiresAt");
CREATE INDEX "MfaFailure_userId_failedAt_idx" ON "MfaFailure"("userId", "failedAt");
CREATE INDEX "MfaFailure_failedAt_idx" ON "MfaFailure"("failedAt");

ALTER TABLE "AuthenticationSession"
ADD CONSTRAINT "AuthenticationSession_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuthenticationRefreshToken"
ADD CONSTRAINT "AuthenticationRefreshToken_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
