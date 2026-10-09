-- Authentication now uses the existing RefreshToken table and stateless JWT access tokens.
DROP TABLE "AuthenticationRefreshToken";
DROP TABLE "AuthenticationSession";
