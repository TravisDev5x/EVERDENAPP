# Sprint 1 Execution Plan

Plan de ejecucion para establecer la fundacion tecnica del POS multitenant multinegocio.

Duracion sugerida: 10 dias habiles (2 semanas)  
Objetivo del sprint: dejar lista la base de tenant isolation, identidad/acceso y catalogo comercial minimo con calidad de produccion inicial.

## 1. Objetivos del Sprint 1

1. Habilitar aislamiento estricto por tenant en backend.
2. Implementar autenticacion base y control de acceso por roles.
3. Entregar modulo de catalogo comercial MVP.
4. Establecer estandares de calidad, pruebas y observabilidad minima.
5. Cerrar sprint con demo funcional navegable en entorno local.

## 2. Alcance (In Scope)

- Tenant context end-to-end en flujo web/API interno.
- Roles base: `owner`, `admin`, `supervisor`, `cajero`.
- Permisos base para gestion de catalogo.
- CRUD de productos por tenant.
- Estructura base para futuras capacidades por giro.
- Pruebas de aislamiento y autorizacion.

## 3. Fuera de alcance (Out of Scope)

- Ventas, pagos, caja e inventario operativo completo.
- Sync offline en produccion.
- Reporteria avanzada.
- Integraciones externas (fiscal, ERP, pasarelas).

## 4. Entregables esperados

1. Tenant isolation implementado y probado.
2. Matriz inicial de roles/permisos documentada.
3. Catalogo comercial funcional con validaciones base.
4. Pipeline local con pruebas de modulos criticos del sprint.
5. Documentacion tecnica minima actualizada.

## 5. Backlog tecnico del sprint

## 5.1 Bloque A - Fundacion de arquitectura

- [ ] Definir estructura de modulos backend (`Tenant`, `Auth`, `Catalog`).
- [ ] Definir convenciones de nombres para comandos, handlers y policies.
- [ ] Definir esquema de errores de dominio tipados.
- [ ] Configurar base de logs estructurados para acciones criticas.

## 5.2 Bloque B - Tenant isolation

- [ ] Resolver contexto tenant por sesion/usuario autenticado.
- [ ] Aplicar middleware obligatorio de tenant context.
- [ ] Aplicar scope tenant en repositorios/consultas de negocio.
- [ ] Agregar validaciones defensivas para impedir cruces de tenant.
- [ ] Crear pruebas de no-fuga entre tenants.

## 5.3 Bloque C - Identidad y acceso

- [ ] Habilitar autenticacion base.
- [ ] Configurar roles base y permisos iniciales.
- [ ] Definir policy para acciones de catalogo.
- [ ] Implementar deny-by-default y pruebas de autorizacion.

## 5.4 Bloque D - Catalogo comercial MVP

- [ ] Entidad producto base (nombre, sku, precio, impuesto, unidad, estado).
- [ ] CRUD por tenant con validaciones de negocio.
- [ ] Restriccion de edicion/activacion segun permisos.
- [ ] Trazabilidad minima para cambios sensibles (precio/estado).
- [ ] Vista inicial en frontend para gestion de productos.

## 5.5 Bloque E - Calidad y pruebas

- [ ] Suite de pruebas minima para tenant + auth + catalog.
- [ ] Casos borde de autorizacion y validacion.
- [ ] Checklist de DoD aplicado a cada historia.
- [ ] Demo script del sprint.

## 6. Plan dia por dia (10 dias)

## Dia 1 - Setup y base de arquitectura

- Crear estructura modular inicial.
- Definir convenciones y criterios de PR.
- Acordar contrato de errores y respuestas.

## Dia 2 - Tenant context

- Implementar resolucion de tenant.
- Integrar middleware tenant obligatorio.
- Primera ronda de pruebas de aislamiento basicas.

## Dia 3 - Hardening de aislamiento

- Refuerzo en consultas y validaciones defensivas.
- Indices y restricciones de tenant en entidades clave.
- Pruebas negativas de acceso cruzado.

## Dia 4 - Auth base

- Integrar autenticacion.
- Preparar bootstrap de roles y permisos iniciales.
- Definir politica de sesion por usuario/tenant.

## Dia 5 - Autorizacion real

- Policies para modulo catalogo.
- Deny-by-default en endpoints.
- Pruebas automatizadas de autorizacion.

## Dia 6 - Catalogo backend I

- Implementar crear/listar productos por tenant.
- Validaciones de negocio (sku, precio, impuesto, estado).

## Dia 7 - Catalogo backend II

- Editar/activar/desactivar producto con trazabilidad.
- Cobertura de pruebas de reglas de producto.

## Dia 8 - Frontend catalogo MVP

- Pantalla base de productos (listar/crear/editar).
- Integracion de permisos en UI (sin confiar solo en UI).

## Dia 9 - Calidad y estabilizacion

- Correccion de defectos y ajustes de UX minima.
- Pruebas end-to-end de flujo tenant + auth + catalogo.
- Verificacion contra checklist MVP.

## Dia 10 - Cierre de sprint

- Demo interna.
- Registro de deuda tecnica priorizada.
- Preparacion de Sprint 2 (ventas + caja inicial).

## 7. Dependencias y orden critico

Dependencias obligatorias:

1. Tenant context antes de catalogo.
2. Auth y permisos antes de exponer acciones de escritura.
3. Pruebas de aislamiento antes de cierre de sprint.

Orden recomendado:

`Arquitectura base -> Tenant isolation -> Auth/Permisos -> Catalogo -> Pruebas/Hardening`

## 8. Riesgos del sprint y mitigaciones

1. **Riesgo:** fugas entre tenants por query sin scope.  
   **Mitigacion:** pruebas negativas + revisiones de codigo enfocadas en acceso a datos.

2. **Riesgo:** permisos incompletos en backend.  
   **Mitigacion:** policy por accion y pruebas por rol.

3. **Riesgo:** deuda tecnica por acelerar frontend temprano.  
   **Mitigacion:** priorizar backend y contratos antes de UX.

4. **Riesgo:** ambiguedad en reglas de producto multigiro.  
   **Mitigacion:** producto base canonico y capacidades por vertical diferidas.

## 9. Definition of Done del Sprint 1

El sprint se considera completado solo si:

- [ ] Aislamiento tenant validado por pruebas automatizadas.
- [ ] Roles/permisos base activos y auditables.
- [ ] Catalogo comercial operativo por tenant.
- [ ] Casos criticos del sprint en verde en pruebas.
- [ ] Documentacion de arquitectura actualizada.
- [ ] Demo ejecutada con flujo completo de alcance.

## 10. Criterios de aceptacion del Product Owner

- [ ] Un `admin` de tenant A no puede ver ni editar productos de tenant B.
- [ ] Un `cajero` no puede hacer acciones administrativas del catalogo.
- [ ] Un `owner/admin` puede gestionar productos de su tenant con validaciones correctas.
- [ ] El sistema responde errores claros cuando hay violacion de permisos o tenant.

## 11. Preparacion para Sprint 2

Inputs requeridos al cerrar Sprint 1:

- [ ] Matriz final de permisos validada.
- [ ] Definicion de reglas de venta (totales, descuento, impuesto).
- [ ] Politica de caja inicial (apertura, cierre, diferencias).
- [ ] Lista priorizada de historias para motor de venta.

---

**Estado:** Activo  
**Version:** v1  
**Fecha:** 2026-05-08
