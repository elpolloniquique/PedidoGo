# Checklist QA manual — RapideX / PedidosGo

Marca cada ítem al probarlo en **local** o **Vercel**.  
Usa dos navegadores o ventana normal + incógnito para merchant y driver.

## Preparación

- [ ] Migraciones Supabase `00001`…`00021` aplicadas
- [ ] Seed o datos de prueba (comercio El Pollón, usuarios)
- [ ] 4 apps corriendo (o URLs Vercel)
- [ ] Mapbox token configurado

---

## 1. Admin (`:3001`)

- [ ] Login con cuenta admin
- [ ] `/drivers` — lista repartidores
- [ ] Aprobar o rechazar solicitud pendiente
- [ ] `/finance` — ver regla de comisión, pagos pending
- [ ] Aprobar un pago de comisión de prueba
- [ ] `/system` — métricas cargan
- [ ] **Avisos** — campana muestra notificaciones
- [ ] `/api/health` → `{ "ok": true }`

---

## 2. Merchant (`:3002`)

- [ ] Login / registro comercio
- [ ] Onboarding comercio si aplica
- [ ] Crear sucursal con ubicación
- [ ] **Pedidos → Nuevo pedido** con dirección y mapa
- [ ] Publicar a repartidores
- [ ] Recibir notificación de nueva oferta
- [ ] Aceptar oferta → ver código retiro + PIN + **enlace tracking**
- [ ] Mapa en detalle pedido (local, entrega, driver en vivo)
- [ ] Copiar enlace tracking y abrir en incógnito (`:3004`)
- [ ] Tras entregar: **calificar repartidor** 1–5
- [ ] `/api/health` OK

---

## 3. Driver (`:3003`)

- [ ] Registro + completar onboarding (si cuenta nueva)
- [ ] Login repartidor aprobado
- [ ] `/jobs` — ver pedido publicado
- [ ] Enviar oferta con precio
- [ ] Tras asignación: notificación + `/delivery` activa
- [ ] Avanzar estados: hacia local → recogido → hacia cliente → entregado
- [ ] GPS / disponibilidad (si pruebas en móvil)
- [ ] `/wallet` — ingreso y comisión tras entregar
- [ ] Declarar pago de comisión
- [ ] PWA: prompt instalar (HTTPS / Vercel)
- [ ] `/api/health` OK

---

## 4. Customer tracking (`:3004`)

- [ ] Abrir `/t/TOKEN` del pedido asignado
- [ ] Ver estado, mapa, PIN de entrega
- [ ] Token inválido → mensaje de error
- [ ] Home `/` — pegar enlace y redirigir
- [ ] `/api/health` OK

---

## 5. Flujo integrado (happy path)

1. [ ] Merchant crea pedido y publica  
2. [ ] Driver oferta  
3. [ ] Merchant acepta  
4. [ ] Cliente abre tracking  
5. [ ] Driver entrega  
6. [ ] Merchant califica  
7. [ ] Driver ve wallet + notificación  
8. [ ] Admin aprueba pago comisión (si aplica)  

---

## 6. Producción (Vercel)

- [ ] 4 proyectos desplegados (`docs/DEPLOY-VERCEL.md`)
- [ ] Variables de entorno en cada proyecto
- [ ] Supabase Redirect URLs con dominios Vercel
- [ ] Mapbox restringido por URL
- [ ] `NEXT_PUBLIC_CUSTOMER_TRACKING_URL` en merchant

---

## Notas / bugs encontrados

| # | Paso | Descripción | Severidad |
|---|------|-------------|-----------|
| 1 | | | |
| 2 | | | |
