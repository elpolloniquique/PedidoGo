-- Activa cuentas pendientes de confirmación de correo (Auth).
-- Ejecutar en Supabase → SQL Editor.

-- 1) Tu cuenta de repartidor (ajustá el email si hace falta):
UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email = lower('tutacanehuillca@gmail.com');

-- 2) (Opcional) Confirmar TODAS las cuentas aún pendientes:
-- UPDATE auth.users
-- SET
--   email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
--   confirmed_at = COALESCE(confirmed_at, NOW())
-- WHERE email_confirmed_at IS NULL;

-- Verificar:
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = lower('tutacanehuillca@gmail.com');
