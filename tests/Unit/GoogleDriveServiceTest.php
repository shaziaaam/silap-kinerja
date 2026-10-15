<?php

namespace Tests\Unit;

use App\Services\GoogleDriveService;
use Tests\TestCase;

class GoogleDriveServiceTest extends TestCase
{
    public function test_service_is_unconfigured_when_no_credentials_provided(): void
    {
        config([
            'google.service_account_path' => null,
            'google.service_account_json' => null,
        ]);

        $service = new GoogleDriveService();

        $this->assertFalse($service->isConfigured());
        $this->assertNull($service->uploadPhoto('content', 'test.jpg'));
        $this->assertNull($service->getFileContent('file-id-123'));
        $this->assertFalse($service->deleteFile('file-id-123'));
        $this->assertEmpty($service->listFiles());
    }

    public function test_config_defaults_load_supports_all_drives(): void
    {
        $this->assertTrue(config('google.supports_all_drives'));
    }
}
