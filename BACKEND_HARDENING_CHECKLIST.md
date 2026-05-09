# Backend Hardening Checklist

Checklist tecnico para validar robustez de backend antes de considerar produccion.

## 1. Dinero y precision

- [x] Calculos sensibles migrados a centavos enteros en logica critica (`SaleController`, `PaymentController`).
- [x] Redondeo controlado y consistente via helper `App\Support\Money`.
- [ ] Migrar completamente todas las operaciones monetarias restantes a centavos en todo el dominio.

## 2. Idempotencia

- [x] Cobro en efectivo requiere `idempotency_key`.
- [x] Restriccion unica por (`tenant_id`, `branch_id`, `idempotency_key`) en `payments`.
- [x] Reintento con misma llave no duplica pagos.
- [ ] Extender idempotencia a confirmacion de venta y cierre de caja.

## 3. Concurrencia y transacciones

- [x] Confirmacion de venta usa transaccion y bloqueos (`lockForUpdate`) para venta/productos.
- [x] Cobro en efectivo usa transaccion y bloqueo de venta.
- [ ] Agregar pruebas dedicadas de condiciones de carrera (DB real con engine de produccion).

## 4. Aislamiento tenant + sucursal

- [x] Contexto de tenant/sucursal activo forzado por middleware.
- [x] Venta, caja, pago y reporte filtrados por sucursal activa.
- [x] Auditoria con `branch_id` para trazabilidad por sucursal.
- [ ] Agregar verificacion automatica en CI para bloquear queries de negocio sin contexto tenant.

## 5. Inmutabilidad y reglas criticas

- [x] Venta confirmada no acepta nuevos items.
- [x] Pago aplicado no se duplica por reintento idempotente.
- [x] Cierre de caja exige motivo cuando hay diferencia.
- [ ] Implementar reversa formal de pago/venta via eventos de compensacion.

## 6. Auditoria y observabilidad

- [x] Eventos clave auditados: producto, venta, caja, pago, sucursal.
- [x] Reporte diario incluye seccion de auditoria.
- [ ] Agregar correlacion por request id y dispositivo en metadata.

## 7. Seguridad operativa

- [x] Policies para acciones sensibles por rol.
- [x] Validaciones backend para tenant/sucursal en comandos criticos.
- [ ] Rate limit especifico para endpoints de cobro y cierre.

## 8. Pruebas backend

- [x] Tests de flujo feliz de venta/caja/pago.
- [x] Test de idempotencia de pago.
- [x] Test de rechazo por monto incorrecto en cobro.
- [x] Test de inventario insuficiente al confirmar venta.
- [ ] Incorporar suite de integracion contra PostgreSQL para validar locks reales.

