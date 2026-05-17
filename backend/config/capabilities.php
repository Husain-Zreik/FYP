<?php

/*
 * Configurable capabilities for government_staff and shelter_staff.
 * government_admin and shelter_admin always have full access within their scope.
 *
 * Format: role => [ [key, label, description, group] ]
 */

return [

    'government_staff' => [
        // Shelters
        ['key' => 'shelters.view',          'label' => 'View shelters',                'description' => 'Access the full shelter list and detail pages.',                    'group' => 'Shelters'],
        ['key' => 'shelters.edit',          'label' => 'Edit shelter details',         'description' => 'Update shelter info, capacity, and contact details.',              'group' => 'Shelters'],

        // People
        ['key' => 'users.view',             'label' => 'View staff accounts',          'description' => 'Access the staff management page.',                                'group' => 'People'],
        ['key' => 'civilians.view',         'label' => 'View civilians',               'description' => 'Access the civilians list and individual profiles.',               'group' => 'People'],
        ['key' => 'civilians.update',       'label' => 'Edit civilian profiles',       'description' => 'Modify civilian personal information and housing status.',         'group' => 'People'],

        // Requests
        ['key' => 'requests.manage',        'label' => 'Accept & reject join requests','description' => 'Review, accept or reject civilian shelter join requests.',         'group' => 'Requests'],

        // Aid — Inventory
        ['key' => 'aid.inventory.view',     'label' => 'View aid inventory',           'description' => 'Access the aid stock levels and category overview.',               'group' => 'Aid Inventory'],
        ['key' => 'aid.batches.create',     'label' => 'Record incoming batches',      'description' => 'Log new aid batches received from donors and organizations.',      'group' => 'Aid Inventory'],

        // Aid — Dispatching
        ['key' => 'aid.dispatches.view',    'label' => 'View dispatches',              'description' => 'See all aid dispatches sent to shelters.',                          'group' => 'Aid Dispatching'],
        ['key' => 'aid.dispatches.send',    'label' => 'Send aid to shelters',         'description' => 'Create direct aid dispatches to shelters.',                        'group' => 'Aid Dispatching'],
        ['key' => 'aid.schedules.manage',   'label' => 'Manage recurring schedules',   'description' => 'Create, pause, and delete scheduled aid deliveries.',              'group' => 'Aid Dispatching'],

        // Aid — Requests
        ['key' => 'aid.requests.view',      'label' => 'View shelter aid requests',    'description' => 'See requests submitted by shelters to the government.',            'group' => 'Aid Requests'],
        ['key' => 'aid.requests.review',    'label' => 'Review aid requests',          'description' => 'Approve, partially approve, or reject shelter aid requests.',      'group' => 'Aid Requests'],

        // Reports
        ['key' => 'reports.view',           'label' => 'View reports',                 'description' => 'Access generated reports and statistics.',                          'group' => 'Reports'],
        ['key' => 'reports.export',         'label' => 'Export reports',               'description' => 'Download reports in CSV or PDF format.',                           'group' => 'Reports'],
    ],

    'shelter_staff' => [
        // Civilians
        ['key' => 'civilians.view',         'label' => 'View civilians',               'description' => 'Access the civilian list within this shelter.',                    'group' => 'Civilians'],
        ['key' => 'civilians.create',       'label' => 'Register new civilians',       'description' => 'Add new civilians to the system and assign them to this shelter.', 'group' => 'Civilians'],
        ['key' => 'civilians.update',       'label' => 'Edit civilian profiles',       'description' => 'Modify civilian information, housing, and ID details.',             'group' => 'Civilians'],
        ['key' => 'civilians.invite',       'label' => 'Invite unassigned civilians',  'description' => 'Send shelter invitations to civilians not yet in a shelter.',       'group' => 'Civilians'],

        // Requests
        ['key' => 'requests.manage',        'label' => 'Manage join requests',         'description' => 'Accept or reject civilian requests to join this shelter.',         'group' => 'Requests'],

        // Aid — Incoming
        ['key' => 'aid.incoming.view',      'label' => 'View incoming aid',            'description' => 'See aid dispatches sent to this shelter.',                         'group' => 'Aid'],
        ['key' => 'aid.incoming.accept',    'label' => 'Accept / reject incoming aid', 'description' => 'Confirm receipt or decline aid deliveries from the government.',   'group' => 'Aid'],
        ['key' => 'aid.requests.create',    'label' => 'Submit aid requests',          'description' => 'Create requests for supplies to be sent by the government.',       'group' => 'Aid'],
        ['key' => 'aid.civilians.dispatch', 'label' => 'Send aid to civilians',        'description' => 'Dispatch supplies from shelter stock to individual civilians.',    'group' => 'Aid'],
        ['key' => 'aid.civilians.schedule', 'label' => 'Manage civilian aid schedules','description' => 'Set up recurring aid deliveries to civilians.',                    'group' => 'Aid'],

        // Civilian Needs
        ['key' => 'civilian.needs.view',    'label' => 'View civilian needs',          'description' => 'See need requests submitted by civilians in this shelter.',        'group' => 'Civilian Needs'],
        ['key' => 'civilian.needs.manage',  'label' => 'Review civilian needs',        'description' => 'Assess, fulfill, or reject civilian need requests.',               'group' => 'Civilian Needs'],

        // Reports
        ['key' => 'reports.view',           'label' => 'View reports',                 'description' => 'Access shelter-level reports and statistics.',                      'group' => 'Reports'],
    ],

];
