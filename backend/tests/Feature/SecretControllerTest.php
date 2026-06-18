<?php

namespace Tests\Feature;

use Tests\TestCase;

class SecretControllerTest extends TestCase
{
    public function test_it_stores_secret_with_custom_expiry_within_range(): void
    {
        $response = $this->postJson('/api/secrets', [
            'ciphertext' => '{"iv":"abc","ciphertext":"def"}',
            'expires_in' => 120,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('expires_in', 120)
            ->assertJsonStructure(['token', 'expires_in', 'max_uses']);
    }

    public function test_it_stores_secret_with_custom_max_uses(): void
    {
        $response = $this->postJson('/api/secrets', [
            'ciphertext' => '{"iv":"abc","ciphertext":"def"}',
            'max_uses' => 5,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('max_uses', 5)
            ->assertJsonStructure(['token', 'expires_in', 'max_uses']);
    }

    public function test_it_defaults_max_uses_to_one(): void
    {
        $response = $this->postJson('/api/secrets', [
            'ciphertext' => '{"iv":"abc","ciphertext":"def"}',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('max_uses', 1);
    }

    public function test_it_rejects_max_uses_below_one(): void
    {
        $response = $this->postJson('/api/secrets', [
            'ciphertext' => '{"iv":"abc","ciphertext":"def"}',
            'max_uses' => 0,
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['max_uses']);
    }

    public function test_it_rejects_max_uses_above_one_hundred(): void
    {
        $response = $this->postJson('/api/secrets', [
            'ciphertext' => '{"iv":"abc","ciphertext":"def"}',
            'max_uses' => 101,
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['max_uses']);
    }

    public function test_it_rejects_expiry_below_one_minute(): void
    {
        $response = $this->postJson('/api/secrets', [
            'ciphertext' => '{"iv":"abc","ciphertext":"def"}',
            'expires_in' => 59,
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['expires_in']);
    }

    public function test_it_rejects_expiry_above_six_hours(): void
    {
        $response = $this->postJson('/api/secrets', [
            'ciphertext' => '{"iv":"abc","ciphertext":"def"}',
            'expires_in' => 21601,
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['expires_in']);
    }

    public function test_it_expires_secret_after_configured_time(): void
    {
        $createResponse = $this->postJson('/api/secrets', [
            'ciphertext' => '{"iv":"abc","ciphertext":"def"}',
            'expires_in' => 60,
        ]);

        $token = $createResponse->json('token');

        $this->travel(61)->seconds();

        $this->getJson("/api/secrets/{$token}")
            ->assertNotFound();
    }

    public function test_it_allows_reads_until_max_uses_is_reached(): void
    {
        $createResponse = $this->postJson('/api/secrets', [
            'ciphertext' => '{"iv":"abc","ciphertext":"def"}',
            'expires_in' => 300,
            'max_uses' => 3,
        ]);

        $token = $createResponse->json('token');

        $this->getJson("/api/secrets/{$token}")
            ->assertOk()
            ->assertJsonPath('ciphertext', '{"iv":"abc","ciphertext":"def"}');

        $this->getJson("/api/secrets/{$token}")
            ->assertOk()
            ->assertJsonPath('ciphertext', '{"iv":"abc","ciphertext":"def"}');

        $this->getJson("/api/secrets/{$token}")
            ->assertOk()
            ->assertJsonPath('ciphertext', '{"iv":"abc","ciphertext":"def"}');

        $this->getJson("/api/secrets/{$token}")
            ->assertNotFound();
    }
}
