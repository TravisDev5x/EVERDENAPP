# Project Constitution v1

Documento rector para construir un Punto de Venta (POS) multitenant, multinegocio, con backend fuerte, preciso e inmutable en operaciones criticas.

## 1. Proposito y alcance

Este proyecto busca entregar una plataforma POS para multiples giros (abarrotes, farmacia, ferreteria, bisuteria, dulces) con:

- Aislamiento estricto entre tenants.
- Operacion confiable online y offline.
- Trazabilidad total de operaciones sensibles.
- Evolucion por capacidades, sin romper el nucleo.

Fuera de alcance inicial (MVP): contabilidad avanzada, BI complejo, integraciones fiscales de alta complejidad y automatizaciones enterprise no criticas para venta/caja.

## 2. Principios inmutables del sistema

1. **Tenant-first:** ninguna operacion de negocio existe fuera de un tenant.
2. **Backend source of truth:** la UI acelera flujos, no define la verdad contable.
3. **No mutacion de transacciones criticas:** se corrige por compensacion, no por edicion destructiva.
4. **Idempotencia obligatoria:** comandos criticos deben resistir reintentos sin duplicar efectos.
5. **Auditoria por defecto:** toda accion sensible deja evidencia completa.
6. **Deny by default:** lo no permitido de forma explicita esta prohibido.

## 3. Modelo multitenancy y aislamiento

### 3.1 Estrategia inicial

- Base de datos compartida con `tenant_id` obligatorio en entidades de negocio.
- Indices compuestos por tenant para unicidad y rendimiento.
- Contexto tenant obligatorio en middleware y capa de acceso a datos.

### 3.2 Defensas en profundidad

- Resolucion de tenant por contexto autenticado (dominio, sucursal, token o sesion).
- Scopes forzados por tenant en consultas.
- Validaciones de integridad tenant en comandos criticos.
- Pruebas automaticas de no-fuga entre tenants.

### 3.3 Evolucion prevista

- Preparar arquitectura para migracion selectiva a database-per-tenant cuando aplique por escala o cumplimiento.

## 4. Dominios nucleares del MVP

1. Tenant Core (tenant, sucursal, caja, series, configuracion base).
2. Identidad y Acceso (usuarios, roles, permisos por capacidad).
3. Catalogo Comercial (productos, precios, impuestos, cliente basico).
4. Motor de Venta (carrito, totales, confirmacion, cancelacion).
5. Caja y Pagos (apertura, movimientos, cierre, arqueo).
6. Inventario (kardex, existencia por sucursal, ajustes).
7. Offline Sync (cola local, reintentos, reconciliacion).
8. Auditoria y Observabilidad (eventos, trazas, alertas operativas).

## 5. Invariantes de negocio (no negociables)

1. Una venta confirmada no se edita; se cancela/revierte.
2. Un pago aplicado no se altera; se compensa con movimiento inverso.
3. No hay movimiento de inventario sin traza de origen.
4. La caja no cierra con operaciones pendientes criticas.
5. Los folios no se duplican por (`tenant`, `sucursal`, `serie`).
6. Ninguna accion puede leer/escribir recursos de otro tenant.
7. Toda operacion sensible guarda: actor, dispositivo, timestamp, origen online/offline.

## 6. Estados canonicos por modulo

- Venta: `draft -> confirmed -> cancelled`
- Pago: `pending -> applied -> reversed`
- Caja: `closed -> open -> closing -> closed`
- Sync: `pending -> sent -> ack | rejected`

No se permiten estados implicitos ni transiciones por fuera de reglas de dominio.

## 7. Contratos de aplicacion

### 7.1 Comandos

- Cada comando critico incluye `idempotency_key`.
- Los handlers validan invariantes antes de persistir.
- Comandos invalidos responden con errores de dominio tipados y auditables.

### 7.2 Eventos de negocio

- Eventos versionados desde el inicio.
- Eventos inmutables para ventas, pagos, caja e inventario.
- Reprocesamiento seguro para recuperacion y conciliacion.

### 7.3 Consultas

- Las vistas de lectura pueden ser denormalizadas, pero siempre derivadas de eventos/estado autorizado.
- Toda lectura de negocio respeta el contexto tenant y permisos efectivos.

## 8. Estrategia multinegocio por capacidades

El nucleo no incorpora condicionales dispersas por giro. Se aplica matriz de capacidades por tenant:

- Core comun (MVP): venta base, pago, inventario, caja, reportes operativos.
- Grocery/Dulces: peso y promociones simples.
- Ferreteria: variantes tecnicas y fraccionado.
- Bisuteria: atributos esteticos y lotes pequenos.
- Farmacia: lotes, caducidad y reglas de cumplimiento.

Capacidades se activan por tenant y controlan UI, validaciones y permisos.

## 9. Offline policy (MVP)

### 9.1 Funciones offline habilitadas

- Crear venta.
- Cobro en efectivo.
- Impresion de ticket local.
- Cola de sincronizacion con reintento.

### 9.2 Funciones offline no habilitadas en MVP

- Administracion avanzada.
- Reporteria compleja.
- Cambios masivos de precios.
- Flujos regulatorios sensibles.

### 9.3 Reconciliacion

- Reintentos idempotentes.
- Resolucion de conflictos por reglas de dominio, no por ultima escritura ciega.
- Visibilidad operativa del estado de sync: pendiente, confirmado, rechazado.

## 10. Seguridad y acceso

- Roles base: `owner`, `admin`, `supervisor`, `cajero`.
- Permisos por accion y contexto (tenant, sucursal, capacidad, monto limite).
- Acciones de alto riesgo requieren autorizacion reforzada y auditoria de motivo.
- Backend valida permisos siempre, aunque el frontend oculte acciones.

## 11. Observabilidad y auditoria

### 11.1 Telemetria minima

- Tasa de errores por modulo.
- Latencia de endpoints criticos (venta, pago, cierre).
- Cola de sync: pendientes, reintentos, rechazos.
- Integridad de caja: diferencias por cierre.

### 11.2 Auditoria de negocio

- Registro estructurado de operaciones criticas.
- Correlacion por tenant/sucursal/caja/usuario/dispositivo.
- Retencion y consulta operativa para soporte.

## 12. Calidad y Definition of Done (DoD)

Una historia se considera terminada solo si:

1. Cumple invariantes de dominio y politicas de tenant.
2. Incluye pruebas unitarias/integracion del caso feliz y casos borde.
3. Registra eventos/auditoria cuando aplica.
4. Respeta idempotencia en operaciones criticas.
5. Incluye validacion de permisos en backend.
6. No introduce regresiones de rendimiento relevantes.
7. Cuenta con criterios de aceptacion verificados por QA/PO.

## 13. Pruebas obligatorias por release

- Aislamiento tenant (intento de acceso cruzado debe fallar).
- No duplicacion por reintentos de comandos.
- Flujo completo venta -> pago -> cierre de caja.
- Coherencia inventario (stock actual trazable a kardex).
- Reconexion offline sin corrupcion de estado.

## 14. Roadmap de ejecucion recomendado

1. Fundacion: tenant core, auth/permisos, catalogo.
2. Operacion: venta online, pago, caja, auditoria.
3. Exactitud: inventario y reconciliacion operativa.
4. Resiliencia: offline acotado y hardening.
5. Escala: optimizacion por tenant y capacidades avanzadas por giro.

## 15. Regla de cambio constitucional

Toda decision que rompa principios, invariantes o contratos de este documento requiere:

- Decision tecnica registrada.
- Analisis de impacto (seguridad, datos, operacion).
- Plan de migracion y rollback.
- Aprobacion de responsable tecnico del producto.

---

**Estado:** Activo  
**Version:** v1  
**Fecha:** 2026-05-08
