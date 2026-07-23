# Fase 21 — API keys, preferencias y reportes CSV

> Continuación post-MVP (después de Fase 20).

## Objetivo

1. **API keys** por comercio para integraciones HTTP.
2. **Preferencias de notificación** editables en perfil (admin / merchant / driver).
3. **Reportes CSV** para superadmin (pedidos, repartidores, pagos).

## Migración

`supabase/migrations/20260721000027_api_keys_reports_fase21.sql`

| RPC | Uso |
|-----|-----|
| `create_merchant_api_key` | Genera `rx_…` (plaintext una sola vez) |
| `list_merchant_api_keys` | Lista keys del comercio |
| `revoke_merchant_api_key` | Desactiva key |
| `resolve_merchant_api_key` | Valida Bearer (service_role / API) |
| `get_my_notification_preferences` | Lee prefs del usuario |
| `set_my_notification_preferences` | Guarda prefs |
| `export_admin_orders_report` | Pedidos N días (máx. 5000) |
| `export_admin_drivers_report` | Repartidores |
| `export_admin_payments_report` | Pagos N días |

## UI

| App | Ruta | Qué |
|-----|------|-----|
| merchant-web | `/api-keys` | Crear / listar / revocar |
| merchant-web | `GET /api/v1/orders` | Lista últimos 50 pedidos (`Authorization: Bearer rx_…`) |
| admin-web | `/reports` | Descargas CSV |
| admin / merchant / driver | `/profile` | Preferencias de notificación |

## Ejemplo API

```bash
curl -H "Authorization: Bearer rx_TU_KEY" \
  "https://TU_MERCHANT_URL/api/v1/orders"
```

## Aplicar en Supabase

```text
20260721000027_api_keys_reports_fase21.sql
```

Verificar: `supabase/scripts/verificar_fase21.sql`

## Checklist

- [ ] Migración `00027` aplicada
- [ ] Owner/admin comercio genera API key y la ve una sola vez
- [ ] `GET /api/v1/orders` responde con key válida
- [ ] Admin descarga CSV desde `/reports`
- [ ] Preferencias se guardan en `/profile`
