# Tenancy Enterprise Roadmap

Roadmap para evolucionar el modelo actual (`tenant_id` compartido) a una arquitectura tenancy nivel enterprise, sin frenar entrega de producto.

## Objetivo

Construir una plataforma multi-tenant con aislamiento fuerte, operacion por sucursal, provisioning automatizado y capacidad de ofrecer modo enterprise con base dedicada por cliente.

## Estado actual

- Tenant por columna (`tenant_id`) funcionando.
- Contexto tenant + sucursal activa en middleware.
- Politicas de autorizacion por tenant/sucursal en operaciones criticas.
- Trazabilidad de auditoria por tenant y branch.
- Operacion core de ventas/caja/pagos/inventario en modo shared DB.

## Principios de evolucion

1. No hacer big-bang migration.
2. Mantener backward compatibility por fases.
3. Encapsular tenancy en servicios (no en controladores).
4. Definir gatillos de paso a modo enterprise.
5. Medir costo operativo de cada fase antes de promoverla.

## Fase 0 - Foundation (actual + inmediata)

### Entregables

- [x] `TenantContext` centralizado para resolver tenant/sucursal actual.
- [x] Persistencia de metadata de tenancy enterprise en tabla `tenants`.
- [x] Documentacion de decision y checklist de hardening.

### Resultado

Base preparada para separar resolucion de contexto de la logica de negocio.

## Fase 1 - Tenant Abstraction Layer

### Objetivo

Desacoplar completamente el dominio de `app('current_tenant_id')`.

### Entregables

- [ ] `TenantResolver` (web/session/api/domain).
- [ ] `TenantConnectionManager` (shared/dedicated).
- [ ] `TenantLifecycleService` (create/suspend/reactivate/archive).
- [ ] Contratos para repositorios tenant-aware.

### Criterio de salida

Controladores y servicios de dominio usan solo contratos de tenancy, no acceso directo al contenedor.

## Fase 2 - Enterprise Provisioning

### Objetivo

Automatizar alta de clientes enterprise con base dedicada opcional.

### Entregables

- [ ] Provisioning transaccional (tenant + branch + owner + config).
- [ ] Creacion de DB dedicada (si `tenancy_mode = dedicated`).
- [ ] Pipeline de migraciones por tenant.
- [ ] Rotacion y almacenamiento seguro de credenciales de DB por tenant.

### Criterio de salida

Onboarding enterprise en un flujo reproducible y auditable.

## Fase 3 - Operational Hardening

### Objetivo

Soporte de operacion enterprise y cumplimiento.

### Entregables

- [ ] Backup/restore por tenant.
- [ ] Observabilidad por tenant (latencia, errores, colas, costos).
- [ ] Cuotas/rate limits por tenant.
- [ ] Alertas operativas por tenant/sucursal.

### Criterio de salida

Operacion confiable bajo SLA definido.

## Fase 4 - Compliance & Governance

### Objetivo

Cerrar brechas para clientes enterprise regulados.

### Entregables

- [ ] Auditoria extendida (request id, actor, dispositivo, branch, tenant).
- [ ] Data retention policies por tenant.
- [ ] Soporte para requisitos de residencia y borrado seguro.
- [ ] Revisiones periodicas de privilegios y acceso.

### Criterio de salida

Checklist de cumplimiento aprobado para onboarding enterprise.

## Matriz de modo tenancy

- `shared`:
  - costo bajo
  - operacion simple
  - ideal SMB y early scale
- `dedicated`:
  - aislamiento fuerte
  - costo/operacion mayor
  - ideal enterprise/regulado

## Trigger points para promover tenant a dedicated

Promover a dedicated cuando se cumplan 2 o mas:

1. Requisito contractual de aislamiento fisico.
2. Requisito regulatorio.
3. Carga alta sostenida o hotspots.
4. Requisito de backup/restore independiente.
5. Necesidad de tuning/ventanas de mantenimiento exclusivas.

## Riesgos y mitigaciones

1. **Complejidad operativa**  
   Mitigacion: onboarding automatizado + runbooks + pruebas de restore.

2. **Fragmentacion de arquitectura**  
   Mitigacion: contratos unificados y mismas APIs en shared/dedicated.

3. **Costo de soporte**  
   Mitigacion: tiering de tenants y SLO/SLA claros.

## Metricas de exito

- Tiempo de onboarding tenant enterprise.
- Incidentes de aislamiento (objetivo: 0).
- Tiempo medio de restauracion por tenant.
- Error rate por tenant/sucursal.
- Costo operativo por tenant.

## Implementacion inicial realizada

- Tenant context central (`TenantContext`) incorporado.
- Tabla `tenants` extendida con metadatos enterprise:
  - `tenancy_mode`
  - `db_connection`
  - `db_database`
  - `db_host`
  - `db_port`
  - `enterprise_enabled`

