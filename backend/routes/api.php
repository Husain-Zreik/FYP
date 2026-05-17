<?php

use App\Http\Controllers\AidBatchController;
use App\Http\Controllers\AidCategoryController;
use App\Http\Controllers\AidRequestController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CivilianNeedController;
use App\Http\Controllers\RoleCapabilityController;
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

    Route::get ('role-capabilities',             [RoleCapabilityController::class, 'index']);
    Route::patch('role-capabilities',            [RoleCapabilityController::class, 'update']);
    Route::get('stats/government',               [StatsController::class, 'government']);
    Route::get('stats/shelter',                  [StatsController::class, 'shelter']);
    Route::apiResource('shelters',               ShelterController::class);
    Route::post('shelters/{shelter}/upload-image', [ShelterController::class, 'uploadImage']);
    Route::apiResource('users',                  UserController::class);
    Route::post('users/{user}/upload-id',        [UserController::class, 'uploadIdDocument']);

    // Shelter request / invitation management
    Route::get ('civilians/{user}/requests',                             [ShelterRequestController::class, 'civilianRequests']);
    Route::get ('civilians/available',                           [ShelterRequestController::class, 'available']);
    Route::get ('shelter-requests',                              [ShelterRequestController::class, 'index']);
    Route::post('shelter-requests/invite',                       [ShelterRequestController::class, 'invite']);
    Route::patch('shelter-requests/{shelterRequest}/accept',     [ShelterRequestController::class, 'accept']);
    Route::patch('shelter-requests/{shelterRequest}/reject',     [ShelterRequestController::class, 'reject']);
    Route::patch('shelter-requests/{shelterRequest}/cancel',     [ShelterRequestController::class, 'cancel']);

    // Aid categories
    Route::apiResource('aid-categories', AidCategoryController::class);

    // Aid inventory (batches)
    Route::apiResource('aid-batches', AidBatchController::class)->except(['update']);

    // Aid requests (shelter → government)
    Route::apiResource('aid-requests', AidRequestController::class)->except(['destroy']);

    // Civilian needs (civilian → shelter)
    Route::apiResource('civilian-needs', CivilianNeedController::class)->except(['destroy']);

});
