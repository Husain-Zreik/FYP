<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ShelterController;
use App\Http\Controllers\UserController;

// ─── Public ───────────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/login',    [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
});

// ─── Protected ────────────────────────────────────────────────────────────────
Route::middleware('auth:api')->group(function () {

    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me',      [AuthController::class, 'me']);
    });

    Route::get('shelters',         [ShelterController::class, 'index']);
    Route::apiResource('users',    UserController::class)->except(['show']);

});
