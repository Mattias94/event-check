-- Usuários existentes antes da verificação por e-mail são considerados verificados
UPDATE "User" SET "emailVerified" = true WHERE "emailVerified" = false;
