-- Confirma TODOS los correos pendientes (cualquier usuario Auth).
-- Esto desbloquea login para cuentas que digan "revisá tu correo".

UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

SELECT email, email_confirmed_at IS NOT NULL AS confirmado, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;
