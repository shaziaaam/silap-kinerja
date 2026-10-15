<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Google Workspace Shared Drive Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for storing observation evidence photos using Google Drive API
    | with Service Account as Content Manager on the institutional Shared Drive.
    |
    */

    // Path to the downloaded service account JSON key file
    'service_account_path' => env('GOOGLE_SERVICE_ACCOUNT_PATH', storage_path('app/google-service-account.json')),

    // Optional raw JSON credentials content (useful for CI/CD or docker env variables)
    'service_account_json' => env('GOOGLE_SERVICE_ACCOUNT_JSON'),

    // Shared Drive (Team Drive) ID where the service account is a member (Content manager)
    'shared_drive_id' => env('GOOGLE_DRIVE_SHARED_DRIVE_ID'),

    // Specific Folder ID inside the Shared Drive to store photos (defaults to Shared Drive root if empty)
    'folder_id' => env('GOOGLE_DRIVE_FOLDER_ID'),

    // Mandatory parameter for Shared Drives operations
    'supports_all_drives' => env('GOOGLE_DRIVE_SUPPORTS_ALL_DRIVES', true),
];
