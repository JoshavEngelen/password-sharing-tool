<?php

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('api')->group(function () {

    // Test route to check if Redis is working
    Route::get('/redis-test', function () {
        Cache::put('hello', 'world', 60);

        return Cache::get('hello');
    });

    Route::post('/secrets', function () {
        return [];
    });

    Route::get('/secrets/{token}', function () {
        return [];
    });

});