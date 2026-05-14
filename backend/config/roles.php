<?php

/*
 * Default system roles and their permission assignments.
 *
 * Rules:
 * - These roles are managed by the seeder — do not delete them manually from the DB.
 * - Permissions must exist in config/permissions.php.
 * - '*' assigns every permission defined in config/permissions.php to the role.
 * - Shelter admins can create *custom* roles using only permissions from config/permissions.php.
 *   Those custom roles are never touched by this seeder.
 */

return [

    'super_admin' => [
        'permissions' => '*',   // automatically gets all current + future permissions
    ],

    'government_staff' => [
        'permissions' => [
            'users.view_any',
            'users.view',
            'shelters.view_any',
            'shelters.view',
            'civilians.view_any',
            'civilians.view',
            'reports.view',
            'reports.export',
        ],
    ],

    'shelter_admin' => [
        'permissions' => [
            // Users within their shelter
            'users.view_any',
            'users.view',
            'users.create',
            'users.update',
            'users.deactivate',
            // Civilians within their shelter
            'civilians.view_any',
            'civilians.view',
            'civilians.create',
            'civilians.update',
            'civilians.admit',
            'civilians.discharge',
            // Custom roles for their shelter
            'roles.view',
            'roles.create',
            'roles.update',
            'roles.delete',
            'roles.assign',
            // Reports
            'reports.view',
        ],
    ],

    'shelter_staff' => [
        'permissions' => [
            'civilians.view_any',
            'civilians.view',
            'civilians.create',
            'civilians.update',
            'reports.view',
        ],
    ],

    'civilian' => [
        'permissions' => [],    // mobile-only users — no dashboard permissions
    ],

];
