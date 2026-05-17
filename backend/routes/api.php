<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ShelterController;
use App\Http\Controllers\ShelterRequestController;
use App\Http\Controllers\StatsController;
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

    Route::get('stats/government',               [StatsController::class, 'government']);
    Route::get('stats/shelter',                  [StatsController::class, 'shelter']);
    Route::apiResource('shelters',               ShelterController::class);
    Route::apiResource('users',                  UserController::class);

    // Shelter request / invitation management
    Route::get ('civilians/available',                           [ShelterRequestController::class, 'available']);
    Route::get ('shelter-requests',                              [ShelterRequestController::class, 'index']);
    Route::post('shelter-requests/invite',                       [ShelterRequestController::class, 'invite']);
    Route::patch('shelter-requests/{shelterRequest}/accept',     [ShelterRequestController::class, 'accept']);
    Route::patch('shelter-requests/{shelterRequest}/reject',     [ShelterRequestController::class, 'reject']);

});
