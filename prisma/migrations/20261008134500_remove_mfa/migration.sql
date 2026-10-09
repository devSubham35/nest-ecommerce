DROP TABLE "MfaFailure";
DROP TABLE "MfaRecoveryCode";
DROP TABLE "MfaAuthenticator";

ALTER TABLE "AuthenticationSession" DROP COLUMN "mfa";
