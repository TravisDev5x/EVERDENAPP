<?php

namespace App\Support;

/**
 * Catálogo único de permisos (clave estable para código y políticas).
 */
final class Permissions
{
    public const CATALOG_PRODUCTS_VIEW = 'catalog.products.view';

    public const CATALOG_PRODUCTS_MANAGE = 'catalog.products.manage';

    public const BRANCHES_VIEW = 'branches.view';

    public const BRANCHES_MANAGE = 'branches.manage';

    public const INVENTORY_VIEW = 'inventory.view';

    public const INVENTORY_MANAGE = 'inventory.manage';

    public const SALES_OPERATE = 'sales.operate';

    public const PAYMENTS_CASH = 'payments.cash';

    public const CASH_SESSION = 'cash.session';

    public const FINANCE_VIEW = 'finance.view';

    public const REPORTS_VIEW = 'reports.view';

    public const CUSTOMER_CUSTODY_VIEW = 'customer-custody.view';

    public const CUSTOMER_CUSTODY_MANAGE = 'customer-custody.manage';

    public const TEAM_USERS_VIEW = 'team.users.view';

    public const TEAM_USERS_MANAGE = 'team.users.manage';

    public const TEAM_ROLES_VIEW = 'team.roles.view';

    public const TEAM_ROLES_MANAGE = 'team.roles.manage';

    /**
     * @return list<array{key: string, group: string, label: string, sort_order: int}>
     */
    public static function definitions(): array
    {
        return [
            ['key' => self::CATALOG_PRODUCTS_VIEW, 'group' => 'Catálogo', 'label' => 'Ver productos', 'sort_order' => 10],
            ['key' => self::CATALOG_PRODUCTS_MANAGE, 'group' => 'Catálogo', 'label' => 'Gestionar productos', 'sort_order' => 20],
            ['key' => self::BRANCHES_VIEW, 'group' => 'Sucursales', 'label' => 'Ver sucursales', 'sort_order' => 30],
            ['key' => self::BRANCHES_MANAGE, 'group' => 'Sucursales', 'label' => 'Gestionar sucursales', 'sort_order' => 40],
            ['key' => self::INVENTORY_VIEW, 'group' => 'Inventario', 'label' => 'Ver inventario', 'sort_order' => 50],
            ['key' => self::INVENTORY_MANAGE, 'group' => 'Inventario', 'label' => 'Gestionar inventario', 'sort_order' => 60],
            ['key' => self::SALES_OPERATE, 'group' => 'Ventas', 'label' => 'Operar ventas (ticket, confirmar)', 'sort_order' => 70],
            ['key' => self::PAYMENTS_CASH, 'group' => 'Cobros', 'label' => 'Cobrar en efectivo', 'sort_order' => 80],
            ['key' => self::CASH_SESSION, 'group' => 'Caja', 'label' => 'Abrir y cerrar caja', 'sort_order' => 90],
            ['key' => self::FINANCE_VIEW, 'group' => 'Finanzas', 'label' => 'Ver finanzas y libro', 'sort_order' => 100],
            ['key' => self::REPORTS_VIEW, 'group' => 'Reportes', 'label' => 'Ver reportes operativos', 'sort_order' => 110],
            ['key' => self::CUSTOMER_CUSTODY_VIEW, 'group' => 'Custodia', 'label' => 'Ver clientes y solicitudes ARCO', 'sort_order' => 120],
            ['key' => self::CUSTOMER_CUSTODY_MANAGE, 'group' => 'Custodia', 'label' => 'Gestionar consentimiento y derechos ARCO', 'sort_order' => 130],
            ['key' => self::TEAM_USERS_VIEW, 'group' => 'Equipo', 'label' => 'Ver usuarios del equipo', 'sort_order' => 140],
            ['key' => self::TEAM_USERS_MANAGE, 'group' => 'Equipo', 'label' => 'Gestionar usuarios (roles)', 'sort_order' => 150],
            ['key' => self::TEAM_ROLES_VIEW, 'group' => 'Equipo', 'label' => 'Ver roles y permisos', 'sort_order' => 160],
            ['key' => self::TEAM_ROLES_MANAGE, 'group' => 'Equipo', 'label' => 'Crear y editar roles', 'sort_order' => 170],
        ];
    }

    /**
     * @return list<string>
     */
    public static function allKeys(): array
    {
        return array_column(self::definitions(), 'key');
    }
}
