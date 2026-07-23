# Manual del comercio

App: **merchant-web**

## Primer uso

1. Registrarse / iniciar sesión
2. Completar onboarding del comercio (o vincular demo)
3. Crear sucursal con dirección (Mapbox)
4. Crear pedido → publicar → elegir oferta

## Módulos

| Ruta | Uso |
|------|-----|
| `/` | Resumen + métricas del día |
| `/orders` | Pedidos y seguimiento |
| `/orders/new` | Alta manual |
| `/branches` | Sucursales y horario |
| `/webhooks` | Integración HTTP |
| `/support` | Ayuda con la plataforma |
| `/users` | Equipo del comercio |

## Webhooks

1. URL **HTTPS**
2. Copiar el secreto al crearlo
3. Validar `X-RapideX-Signature: sha256=…`
4. Usar **Probar** / **Despachar pendientes**

Evento principal: `order.status_changed`.
