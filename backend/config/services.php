<?php

return [
    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],
    'ses' => [
        'key'    => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],
    'resend' => [
        'key' => env('RESEND_KEY'),
    ],
    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel'              => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
    'openai' => [
        'api_key'      => env('OPENAI_API_KEY'),
        'organization' => env('OPENAI_ORGANIZATION'),
        'request_timeout' => env('OPENAI_REQUEST_TIMEOUT', 30),
    ],
    'asaas' => [
        'enabled'        => env('ASAAS_ENABLED', false),
        'api_key'        => env('ASAAS_API_KEY'),
        'base_url'       => env('ASAAS_BASE_URL', 'https://api.asaas.com/v3'),
        'webhook_token'  => env('ASAAS_WEBHOOK_TOKEN'),
        'timeout'        => env('ASAAS_TIMEOUT', 15),
        'default_billing_type' => env('ASAAS_DEFAULT_BILLING_TYPE', 'UNDEFINED'),
    ],
];
