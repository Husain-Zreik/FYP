<?php

/*
 * All system permissions.
 *
 * Format: 'resource.action'
 *
 * Adding a permission: add it here, then run php artisan db:seed --class=RoleSeeder
 * Removing a permission: delete it here, run the seeder — it will be removed from all roles (including custom ones)
 */

return [

    // ─── Users ───────────────────────────────────────────────────────────
    'users.view_any',       // list users (scoped by role)
    'users.view',           // view a single user profile
    'users.create',         // create a new user
    'users.update',         // edit a user
    'users.delete',         // permanently delete a user
    'users.deactivate',     // toggle is_active

    // ─── Shelters ────────────────────────────────────────────────────────
    'shelters.view_any',    // list all shelters
    'shelters.view',        // view a single shelter
    'shelters.create',
    'shelters.update',
    'shelters.delete',

    // ─── Civilians ───────────────────────────────────────────────────────
    'civilians.view_any',   // list civilians (scoped by shelter for shelter roles)
    'civilians.view',       // view a single civilian profile
    'civilians.create',     // register a new civilian
    'civilians.update',
    'civilians.delete',
    'civilians.admit',      // assign a civilian to a shelter
    'civilians.discharge',  // remove a civilian from a shelter

    // ─── Roles & Permissions ─────────────────────────────────────────────
    'roles.view',           // view roles available in the shelter
    'roles.create',         // shelter_admin can create custom roles
    'roles.update',
    'roles.delete',
    'roles.assign',         // assign a role to a user

    // ─── Reports ─────────────────────────────────────────────────────────
    'reports.view',
    'reports.export',

];
