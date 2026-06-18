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
            ->assertJsonStructure(['token', 'expires_in']);
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
}
