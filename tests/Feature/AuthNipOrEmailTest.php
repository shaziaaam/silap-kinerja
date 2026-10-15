<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthNipOrEmailTest extends TestCase
{
    use RefreshDatabase;

    protected function createUser(array $attributes = []): User
    {
        static $counter = 1000;
        $counter++;

        return User::create(array_merge([
            'nama' => 'Test User ' . $counter,
            'nip' => 'NIP' . $counter,
            'email' => "user{$counter}@bmkg.go.id",
            'role' => 'pengamat',
            'password' => Hash::make('password123'),
            'must_change_password' => false,
        ], $attributes));
    }

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_user_can_authenticate_using_nip(): void
    {
        $user = $this->createUser([
            'nip' => '198901012015011001',
            'email' => 'pegawai@bmkg.go.id',
            'password' => Hash::make('password123'),
            'must_change_password' => false,
        ]);

        $response = $this->post('/login', [
            'nip' => '198901012015011001',
            'password' => 'password123',
        ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(route('dashboard'));
    }

    public function test_user_can_authenticate_using_email(): void
    {
        $user = $this->createUser([
            'nip' => '198901012015011002',
            'email' => 'pengamat@bmkg.go.id',
            'password' => Hash::make('password123'),
            'must_change_password' => false,
        ]);

        $response = $this->post('/login', [
            'nip' => 'pengamat@bmkg.go.id',
            'password' => 'password123',
        ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(route('dashboard'));
    }

    public function test_user_cannot_authenticate_with_invalid_password(): void
    {
        $user = $this->createUser([
            'nip' => '198901012015011003',
            'email' => 'salah@bmkg.go.id',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->from('/login')->post('/login', [
            'nip' => 'salah@bmkg.go.id',
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
        $response->assertRedirect('/login');
        $response->assertSessionHasErrors('nip');
    }

    public function test_user_with_must_change_password_is_redirected_to_force_change(): void
    {
        $user = $this->createUser([
            'nip' => 'P001',
            'email' => 'teguh@bmkg.go.id',
            'password' => Hash::make('password123'),
            'must_change_password' => true,
        ]);

        $response = $this->post('/login', [
            'nip' => 'P001',
            'password' => 'password123',
        ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(route('password.force_change'));

        // Middleware EnsurePasswordIsChanged blocks access to dashboard
        $dashResponse = $this->actingAs($user)->get('/dashboard');
        $dashResponse->assertRedirect(route('password.force_change'));
    }

    public function test_user_can_force_change_password(): void
    {
        $user = $this->createUser([
            'nip' => 'P002',
            'password' => Hash::make('password123'),
            'must_change_password' => true,
        ]);

        $response = $this->actingAs($user)->post(route('password.force_update'), [
            'current_password' => 'password123',
            'password' => 'newPassword123!',
            'password_confirmation' => 'newPassword123!',
        ]);

        $response->assertRedirect(route('dashboard'));
        $user->refresh();
        $this->assertFalse($user->must_change_password);
        $this->assertTrue(Hash::check('newPassword123!', $user->password));

        // Now can access dashboard freely
        $dashResponse = $this->actingAs($user)->get('/dashboard');
        $dashResponse->assertStatus(200);
    }

    public function test_admin_can_create_user_with_email_and_nullable_email(): void
    {
        $admin = $this->createUser([
            'role' => 'admin',
            'must_change_password' => false,
        ]);

        // Create with email
        $response = $this->actingAs($admin)->post(route('admin.users.store'), [
            'nama' => 'Budi Santoso',
            'nip' => 'B001',
            'email' => 'budi@bmkg.go.id',
            'role' => 'pengamat',
            'password' => 'password123',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('users', [
            'nip' => 'B001',
            'email' => 'budi@bmkg.go.id',
        ]);

        // Create with empty email (should be saved as null)
        $response2 = $this->actingAs($admin)->post(route('admin.users.store'), [
            'nama' => 'Siti Rahma',
            'nip' => 'S001',
            'email' => '',
            'role' => 'pengamat',
            'password' => 'password123',
        ]);

        $response2->assertSessionHasNoErrors();
        $this->assertDatabaseHas('users', [
            'nip' => 'S001',
            'email' => null,
        ]);
    }

    public function test_admin_can_update_user_email(): void
    {
        $admin = $this->createUser([
            'role' => 'admin',
            'must_change_password' => false,
        ]);

        $targetUser = $this->createUser([
            'nama' => 'Joko',
            'nip' => 'J001',
            'email' => 'joko.lama@bmkg.go.id',
            'role' => 'pengamat',
        ]);

        $response = $this->actingAs($admin)->put(route('admin.users.update', $targetUser->id), [
            'nama' => 'Joko Cahyono',
            'nip' => 'J001',
            'email' => 'joko.baru@bmkg.go.id',
            'role' => 'pengamat',
        ]);

        $response->assertSessionHasNoErrors();
        $targetUser->refresh();
        $this->assertEquals('joko.baru@bmkg.go.id', $targetUser->email);
        $this->assertEquals('Joko Cahyono', $targetUser->nama);
    }

    public function test_duplicate_email_is_rejected(): void
    {
        $admin = $this->createUser([
            'role' => 'admin',
            'must_change_password' => false,
        ]);

        $this->createUser([
            'nip' => 'U001',
            'email' => 'kembar@bmkg.go.id',
        ]);

        $response = $this->actingAs($admin)->post(route('admin.users.store'), [
            'nama' => 'Pengguna Baru',
            'nip' => 'U002',
            'email' => 'kembar@bmkg.go.id',
            'role' => 'pengamat',
            'password' => 'password123',
        ]);

        $response->assertSessionHasErrors('email');
    }
}
