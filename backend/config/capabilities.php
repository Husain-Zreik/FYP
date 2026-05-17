<?php

/*
 * Configurable capabilities for government_staff and shelter_staff.
 * government_admin and shelter_admin always have full access within their scope.
 *
 * Format: role => [ [key, label, group] ]
 */

return [

    'government_staff' => [
        ['key' => 'shelters.view',       'label' => 'View shelters',               'group' => 'Shelters'],
        ['key' => 'users.view',          'label' => 'View staff accounts',         'group' => 'Staff'],
        ['key' => 'civilians.view',      'label' => 'View civilians',              'group' => 'Civilians'],
        ['key' => 'civilians.update',    'label' => 'Edit civilian profiles',      'group' => 'Civilians'],
        ['key' => 'requests.manage',     'label' => 'Accept & reject join requests', 'group' => 'Requests'],
        ['key' => 'reports.view',        'label' => 'View reports',                'group' => 'Reports'],
        ['key' => 'reports.export',      'label' => 'Export reports',              'group' => 'Reports'],
    ],

    'shelter_staff' => [
        ['key' => 'civilians.view',      'label' => 'View civilians',              'group' => 'Civilians'],
        ['key' => 'civilians.create',    'label' => 'Register new civilians',      'group' => 'Civilians'],
        ['key' => 'civilians.update',    'label' => 'Edit civilian profiles',      'group' => 'Civilians'],
        ['key' => 'civilians.invite',    'label' => 'Invite unassigned civilians', 'group' => 'Civilians'],
        ['key' => 'requests.manage',     'label' => 'Accept & reject join requests', 'group' => 'Requests'],
        ['key' => 'reports.view',        'label' => 'View reports',                'group' => 'Reports'],
    ],

];
