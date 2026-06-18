<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class SecretController extends Controller
{
    private const DEFAULT_MIN_TTL_SECONDS = 60;

    private const DEFAULT_MAX_TTL_SECONDS = 21600;

    private const DEFAULT_TTL_SECONDS = 900;

    private const DEFAULT_MIN_USES = 1;

    private const DEFAULT_MAX_USES = 100;

    private const DEFAULT_USES = 1;

    public function store(Request $request): JsonResponse
    {
        $minTtlSeconds = $this->minTtlSeconds();
        $maxTtlSeconds = $this->maxTtlSeconds();
        $minUses = $this->minUses();
        $maxUses = $this->maxUses();

        $validated = $request->validate([
            'ciphertext' => ['required', 'string', 'max:65535'],
            'expires_in' => ['nullable', 'integer', "between:{$minTtlSeconds},{$maxTtlSeconds}"],
            'max_uses' => ['nullable', 'integer', "between:{$minUses},{$maxUses}"],
        ]);

        $defaultTtlSeconds = $this->defaultTtlSeconds();
        $defaultMaxUses = $this->defaultMaxUses();
        $ttlSeconds = (int) ($validated['expires_in'] ?? $defaultTtlSeconds);
        $uses = (int) ($validated['max_uses'] ?? $defaultMaxUses);
        $token = $this->generateToken();

        $secretData = [
            'ciphertext' => $validated['ciphertext'],
            'uses_remaining' => $uses,
            'expires_at' => now()->addSeconds($ttlSeconds)->getTimestamp(),
        ];

        Cache::put($this->cacheKey($token), $secretData, now()->addSeconds($ttlSeconds));

        return response()->json([
            'token' => $token,
            'expires_in' => $ttlSeconds,
            'max_uses' => $uses,
        ], 201);
    }

    public function show(string $token): JsonResponse
    {
        $cacheKey = $this->cacheKey($token);
        $secretData = Cache::get($cacheKey);

        if (! is_array($secretData) || empty($secretData['ciphertext']) || ! isset($secretData['uses_remaining'])) {
            return response()->json([
                'message' => 'Secret not found or already consumed.',
            ], 404);
        }

        $usesRemaining = (int) $secretData['uses_remaining'];

        if ($usesRemaining <= 0) {
            Cache::forget($cacheKey);

            return response()->json([
                'message' => 'Secret not found or already consumed.',
            ], 404);
        }

        if ($usesRemaining === 1) {
            Cache::forget($cacheKey);
        } else {
            $secondsRemaining = $this->remainingSeconds($secretData['expires_at'] ?? null);

            if ($secondsRemaining <= 0) {
                Cache::forget($cacheKey);

                return response()->json([
                    'message' => 'Secret not found or already consumed.',
                ], 404);
            }

            $secretData['uses_remaining'] = $usesRemaining - 1;
            Cache::put($cacheKey, $secretData, now()->addSeconds($secondsRemaining));
        }

        return response()->json([
            'ciphertext' => $secretData['ciphertext'],
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
        return min(max($ttlSeconds, $this->minTtlSeconds()), $this->maxTtlSeconds());
    }

    private function normalizeUses(int $uses): int
    {
        return min(max($uses, $this->minUses()), $this->maxUses());
    }

    private function remainingSeconds(mixed $expiresAt): int
    {
        if (! is_int($expiresAt) && ! (is_string($expiresAt) && ctype_digit($expiresAt))) {
            return 0;
        }

        return (int) $expiresAt - now()->getTimestamp();
    }

    private function minTtlSeconds(): int
    {
        return max(1, (int) env('SECRET_MIN_TTL_SECONDS', self::DEFAULT_MIN_TTL_SECONDS));
    }

    private function maxTtlSeconds(): int
    {
        return max($this->minTtlSeconds(), (int) env('SECRET_MAX_TTL_SECONDS', self::DEFAULT_MAX_TTL_SECONDS));
    }

    private function defaultTtlSeconds(): int
    {
        $ttl = (int) env('SECRET_DEFAULT_TTL_SECONDS', env('SECRET_TTL_SECONDS', self::DEFAULT_TTL_SECONDS));

        return $this->normalizeTtl($ttl);
    }

    private function minUses(): int
    {
        return max(1, (int) env('SECRET_MIN_USES', self::DEFAULT_MIN_USES));
    }

    private function maxUses(): int
    {
        return max($this->minUses(), (int) env('SECRET_MAX_USES', self::DEFAULT_MAX_USES));
    }

    private function defaultMaxUses(): int
    {
        return $this->normalizeUses((int) env('SECRET_DEFAULT_MAX_USES', self::DEFAULT_USES));
    }
}