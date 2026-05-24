<?php

return [
    'paths'                    => ['api/*'],
    'allowed_methods'          => ['*'],
    'allowed_origins'          => [
        'http://localhost:5173',   // React dev server
    ],
    'allowed_origins_patterns' => [
        '#^http://localhost(:\d+)?$#', // Flutter web (any localhost port)
    ],
    'allowed_headers'          => ['*'],
    'exposed_headers'          => [],
    'max_age'                  => 0,
    'supports_credentials'     => false,
];
