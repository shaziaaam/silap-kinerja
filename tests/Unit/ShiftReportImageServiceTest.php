<?php

namespace Tests\Unit;

use App\Services\ShiftReportImageService;
use Tests\TestCase;

class ShiftReportImageServiceTest extends TestCase
{
    public function test_service_instantiation()
    {
        $service = new ShiftReportImageService();
        $this->assertInstanceOf(ShiftReportImageService::class, $service);
    }
}
