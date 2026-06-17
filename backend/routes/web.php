<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Cache;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/redis-test', function () {
    Cache::put('hello', 'world', 60);

    return Cache::get('hello');
});
