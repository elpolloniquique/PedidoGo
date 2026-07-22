# Fase 5 — PWA instalable (driver-pwa)

## Objetivo

Hacer instalable la app del repartidor en Android e iPhone, detectar standalone, ofrecer actualización controlada y un modo offline limitado.

## Qué se implementó

| Pieza | Ubicación |
|-------|-----------|
| Manifest | `apps/driver-pwa/public/manifest.json` |
| Iconos 192 / 512 / maskable / Apple | `public/icons/` |
| Service Worker | `public/sw.js` |
| Detección install / iOS / standalone | `src/lib/pwa/detect.ts` |
| Prompt Android + guía Apple | `src/components/pwa/install-prompt.tsx` |
| Aviso de actualización | `src/components/pwa/service-worker-register.tsx` |
| Offline IndexedDB | `src/lib/pwa/offline.ts` |
| Página `/offline` | pública (sin login) |

## Condiciones del aviso “Instalar”

Solo si:

- Rol driver y estado `approved`
- No está en `display-mode: standalone` / `navigator.standalone`
- No fue instalada (flag local)
- No rechazó el mensaje en los últimos 7 días
- Dispositivo compatible

## Actualizaciones

Si hay SW nuevo:

- Muestra “Hay una nueva versión disponible”
- **No** fuerza update si `localStorage` tiene `pedidosgo.pwa.activeDelivery=1`
  (reservado para pedidos activos en fases posteriores)

## Offline limitado

Guarda en IndexedDB:

- Snapshot de perfil/estado
- Cola de acciones pendientes (API lista)

No permite (documentado en UI): pagos definitivos, aceptar pedidos vencidos sin revalidar.

## Limitación importante (sin push externo)

Con la infraestructura autorizada (sin Firebase/OneSignal), una PWA **cerrada** puede no recibir avisos inmediatos.  
Con la app abierta: Realtime (Fase 10). Al reabrir: sincronizar pendientes.

## Cómo probar

```bash
pnpm --filter @pedidosgo/driver-pwa dev
# Abrir http://localhost:3003
```

1. Aprueba un repartidor (Fase 4)
2. Inicia sesión en driver-pwa
3. Debe aparecer el aviso de instalación
4. En Chrome Android: “Instalar aplicativo”
5. En iPhone Safari: instrucciones Compartir → Agregar a inicio
6. DevTools → Application → Manifest / Service Workers

> En `localhost` HTTP la instalación puede estar limitada; en HTTPS (Vercel) funciona completo.

## Checklist

- [ ] Manifest válido (Lighthouse / DevTools)
- [ ] Iconos visibles
- [ ] SW registrado
- [ ] Prompt solo si `approved`
- [ ] Guía iOS en Safari iPhone
- [ ] `/offline` accesible sin sesión
- [ ] `pnpm build` OK

## Próxima fase

**Fase 6** — Comercios, sucursales, horarios y modo manual/automático. Ver `docs/FASE-6.md`.
