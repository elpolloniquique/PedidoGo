# Manual de Mapbox

## Tokens

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Token **público** `pk.` en el navegador |
| `MAPBOX_SECRET_TOKEN` | Token **secreto** `sk.` solo servidor (Directions, etc.) |

No uses un `pk.` como secreto.

## Restricciones

En Mapbox → token `pk.` → URL restrictions:

- `http://localhost:3001` … `3004`
- `https://*.vercel.app`
- Dominios propios cuando existan

## Funciones en el producto

- Geocoding al crear sucursal / pedido
- Mapa de seguimiento (comercio, driver, cliente)
- Ruta Directions cuando hay token secreto

## Fallos comunes

- Mapa vacío → falta `NEXT_PUBLIC_MAPBOX_TOKEN`
- Ruta no dibuja → falta o inválido `MAPBOX_SECRET_TOKEN`
