<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class SecretController extends Controller
{
    private const MIN_TTL_SECONDS = 60;

    private const MAX_TTL_SECONDS = 21600;

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ciphertext' => ['required', 'string', 'max:65535'],
            'expires_in' => ['nullable', 'integer', 'between:60,21600'],
        ]);

        $defaultTtlSeconds = $this->normalizeTtl((int) env('SECRET_TTL_SECONDS', 900));
        $ttlSeconds = (int) ($validated['expires_in'] ?? $defaultTtlSeconds);
        $token = $this->generateToken();

        Cache::put($this->cacheKey($token), $validated['ciphertext'], now()->addSeconds($ttlSeconds));

        return response()->json([
            'token' => $token,
            'expires_in' => $ttlSeconds,
        ], 201);
    }

    public function show(string $token): JsonResponse
    {
        $ciphertext = Cache::pull($this->cacheKey($token));

        if (! is_string($ciphertext) || $ciphertext === '') {
            return response()->json([
                'message' => 'Secret not found or already consumed.',
            ], 404);
        }

        return response()->json([
            'ciphertext' => $ciphertext,
        ]);
    }

    private function generateToken(): string
    {
        do {
            $token = Str::random(32);
        } while (Cache::has($this->cacheKey($token)));

        return $token;
    }

    private function cacheKey(string $token): string
    {
        return sprintf('secret:%s', $token);
    }

    private function normalizeTtl(int $ttlSeconds): int
    {
        return min(max($ttlSeconds, self::MIN_TTL_SECONDS), self::MAX_TTL_SECONDS);
    }
}