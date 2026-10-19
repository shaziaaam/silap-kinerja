<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginFormTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        User::create([
            'nama' => 'Edy Susanto', 'email' => 'edy@bmkg.go.id', 'role' => 'pengamat', 'nip' => '199001012015031001',
            'password' => bcrypt('rahasia123'), 'must_change_password' => false,
        ]);
    }

    public function test_too_many_attempts_shows_a_message_on_the_form_instead_of_an_error_page(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->from('/login')->post('/login', ['nip' => '199001012015031001', 'password' => 'salah'])
                ->assertRedirect('/login')
                ->assertSessionHasErrors(['nip' => 'NIP/email atau kata sandi salah.']);
        }

        $this->from('/login')->post('/login', ['nip' => '199001012015031001', 'password' => 'rahasia123'])
            ->assertRedirect('/login')
            ->assertSessionHasErrors('nip');
        $this->assertStringContainsString('Terlalu banyak percobaan', session('errors')->first('nip'));
        $this->assertGuest();
    }

    public function test_email_login_ignores_letter_case_and_remember_me_works(): void
    {
        $this->post('/login', ['nip' => '  EDY@BMKG.go.id ', 'password' => 'rahasia123', 'remember' => true])
            ->assertRedirect(route('dashboard'));

        $this->assertAuthenticated();
        $this->assertNotNull(User::first()->remember_token);
    }

    public function test_login_page_has_no_link_to_the_public_website(): void
    {
        $halaman = file_get_contents(resource_path('js/Pages/Auth/Login.jsx'));
        $this->assertStringNotContainsString('staklim-jateng.bmkg.go.id', $halaman);
    }
}
