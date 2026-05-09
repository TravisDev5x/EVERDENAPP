# MVP Acceptance Checklist

Checklist operativo para validar el MVP del POS multitenant multinegocio con criterios de aceptacion verificables.

## 1. Tenant Isolation

### Criterios de aceptacion

- [ ] Toda entidad de negocio incluye `tenant_id`.
- [ ] Ningun endpoint de negocio responde datos de otro tenant.
- [ ] Queries criticas aplican scope tenant de forma obligatoria.
- [ ] Existen indices compuestos por `tenant_id` en claves de negocio.
- [ ] Pruebas de acceso cruzado entre tenants fallan correctamente.

### Evidencia requerida

- [ ] Casos de prueba automatizados de aislamiento.
- [ ] Registro de intentos bloqueados en auditoria/seguridad.

---

## 2. Identidad, Roles y Permisos

### Criterios de aceptacion

- [ ] Roles base disponibles: `owner`, `admin`, `supervisor`, `cajero`.
- [ ] Permisos se validan en backend, no solo en UI.
- [ ] Denegacion por defecto para acciones no autorizadas.
- [ ] Asignacion de permisos por capacidad activa del tenant.
- [ ] Acciones sensibles requieren permisos de alto nivel (ej. cancelaciones, ajustes).

### Evidencia requerida

- [ ] Matriz rol -> permiso versionada.
- [ ] Pruebas de autorizacion por endpoint/comando.

---

## 3. Catalogo Comercial

### Criterios de aceptacion

- [ ] CRUD de productos por tenant.
- [ ] Precio, impuesto, unidad y estado del producto correctamente validados.
- [ ] Catalogo por sucursal cuando aplique disponibilidad local.
- [ ] Producto inactivo no puede venderse.
- [ ] Cambios de precio dejan trazabilidad minima.

### Evidencia requerida

- [ ] Pruebas de validacion de datos y reglas de negocio.
- [ ] Auditoria de cambios de catalogo sensible.

---

## 4. Motor de Venta

### Criterios de aceptacion

- [ ] Flujo completo: crear borrador -> agregar items -> confirmar venta.
- [ ] Totales calculados con precision decimal (sin errores de flotante).
- [ ] Validaciones de stock/precio/impuesto al confirmar.
- [ ] Venta confirmada no permite edicion destructiva.
- [ ] Cancelacion/reversion sigue flujo formal con motivo.

### Evidencia requerida

- [ ] Pruebas de calculo de totales y redondeo.
- [ ] Pruebas de transicion de estados de venta.

---

## 5. Caja y Pagos

### Criterios de aceptacion

- [ ] Caja requiere apertura antes de vender/cobrar.
- [ ] Registro de movimientos de caja (entrada/salida/ajuste) con motivo.
- [ ] Pago aplicado no se edita; se revierte por compensacion.
- [ ] Doble envio del mismo pago no duplica cobro (idempotencia).
- [ ] Cierre de caja genera resumen y diferencias justificadas.

### Evidencia requerida

- [ ] Pruebas de idempotencia de pago y cierre de caja.
- [ ] Bitacora de movimientos de caja auditables.

---

## 6. Inventario (Kardex)

### Criterios de aceptacion

- [ ] Todo cambio de existencias genera movimiento de kardex.
- [ ] Existencia actual por sucursal es consistente con kardex historico.
- [ ] Venta confirmada descuenta inventario segun reglas.
- [ ] Cancelacion/reversion de venta revierte inventario de forma trazable.
- [ ] Ajustes manuales requieren permiso y motivo.

### Evidencia requerida

- [ ] Pruebas de consistencia stock actual vs historial.
- [ ] Auditoria de ajustes sensibles.

---

## 7. Offline y Sincronizacion (MVP acotado)

### Criterios de aceptacion

- [ ] Offline permite crear venta y cobrar efectivo.
- [ ] Operaciones offline se encolan localmente con identificador unico.
- [ ] Reconexion sincroniza sin duplicar ventas/pagos.
- [ ] Operaciones rechazadas en sync quedan visibles para correccion.
- [ ] Estado de sincronizacion visible: `pending`, `sent`, `ack`, `rejected`.

### Evidencia requerida

- [ ] Pruebas de reconexion y reintentos.
- [ ] Reporte de cola offline con conteo de pendientes/rechazadas.

---

## 8. Auditoria y Observabilidad

### Criterios de aceptacion

- [ ] Eventos criticos registran actor, tenant, sucursal, dispositivo y timestamp.
- [ ] Errores de negocio y tecnicos tienen trazabilidad correlacionable.
- [ ] Metricas minimas habilitadas: errores, latencia, sync, cierres de caja.
- [ ] Alertas basicas para fallos de sync y errores en flujo de venta.

### Evidencia requerida

- [ ] Dashboard operativo basico.
- [ ] Registro consultable de eventos criticos.

---

## 9. Calidad, Pruebas y Seguridad

### Criterios de aceptacion

- [ ] Cobertura en flujos criticos: venta, pago, cierre, inventario, sync.
- [ ] Pruebas de aislamiento multitenant pasan en CI.
- [ ] Validaciones backend para permisos e invariantes activas.
- [ ] Manejo de errores tipado y consistente.
- [ ] Sin vulnerabilidades criticas conocidas en dependencias base.

### Evidencia requerida

- [ ] Pipeline CI con pruebas automáticas.
- [ ] Reporte de seguridad/dependencias.

---

## 10. Definition of Done por historia

Una historia solo se marca como terminada si cumple todo:

- [ ] Criterio funcional aprobado por QA/PO.
- [ ] Pruebas automaticas agregadas/actualizadas.
- [ ] Validacion de permisos backend implementada.
- [ ] Auditoria incluida cuando aplica.
- [ ] Documentacion tecnica minima actualizada.
- [ ] Sin regresiones en modulos criticos.

---

## 11. Go/No-Go del MVP

### Go (lanzar)

- [ ] 0 fugas tenant detectadas en pruebas.
- [ ] 0 duplicados de pago/venta por reintentos.
- [ ] Cierre de caja consistente en escenarios normales.
- [ ] Sync offline estable en pruebas de reconexion.
- [ ] Errores operativos criticos monitoreados y alertables.

### No-Go (bloquear salida)

- [ ] Cualquier fuga de datos entre tenants.
- [ ] Inconsistencia no explicable de caja/inventario.
- [ ] Duplicacion de operaciones criticas.
- [ ] Ausencia de auditoria en eventos sensibles.

---

## 12. Matriz de firma de aceptacion

- [ ] Tech Lead
- [ ] Product Owner
- [ ] QA Lead
- [ ] Operaciones/Soporte

Fecha de aprobacion MVP: `____-__-__`

