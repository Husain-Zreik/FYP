<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ShelterController;
use App\Http\Controllers\ShelterRequestController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\RoleCapabilityController;
use App\Http\Controllers\AidCategoryController;
use App\Http\Controllers\AidBatchController;
use App\Http\Controllers\AidRequestController;
use App\Http\Controllers\CivilianNeedController;
use App\Http\Controllers\AidDispatchController;
use App\Http\Controllers\AidScheduleController;

// ── Public ────────────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('login',    [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
});

// ── Protected ─────────────────────────────────────────────────────────────────
Route::middleware('auth:api')->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get ('me',     [AuthController::class, 'me']);
    });

    // Stats
    Route::prefix('stats')->group(function () {
        Route::get('government', [StatsController::class, 'government']);
        Route::get('shelter',    [StatsController::class, 'shelter']);
    });

    // Shelters
    Route::apiResource('shelters', ShelterController::class);
    Route::post('shelters/{shelter}/upload-image', [ShelterController::class, 'uploadImage']);

    // Users
    Route::apiResource('users', UserController::class);
    Route::post('users/{user}/upload-id', [UserController::class, 'uploadIdDocument']);

    // Civilian join requests
    Route::prefix('shelter-requests')->group(function () {
        Route::get ('/',                         [ShelterRequestController::class, 'index']);
        Route::post('invite',                    [ShelterRequestController::class, 'invite']);
        Route::patch('{shelterRequest}/accept',  [ShelterRequestController::class, 'accept']);
        Route::patch('{shelterRequest}/reject',  [ShelterRequestController::class, 'reject']);
        Route::patch('{shelterRequest}/cancel',  [ShelterRequestController::class, 'cancel']);
    });
    Route::get('civilians/{user}/requests', [ShelterRequestController::class, 'civilianRequests']);
    Route::get('civilians/available',       [ShelterRequestController::class, 'available']);

    // Role capabilities
    Route::get ('role-capabilities', [RoleCapabilityController::class, 'index']);
    Route::patch('role-capabilities', [RoleCapabilityController::class, 'update']);

    // Aid — categories
    Route::apiResource('aid-categories', AidCategoryController::class);

    // Aid — inventory batches
    Route::apiResource('aid-batches', AidBatchController::class)->except(['update']);

    // Aid — shelter requests to government
    Route::apiResource('aid-requests', AidRequestController::class)->except(['destroy']);

    // Aid — civilian needs
    Route::apiResource('civilian-needs', CivilianNeedController::class)->except(['destroy']);

    // Aid — dispatches (direct sends)
    Route::prefix('aid-dispatches')->group(function () {
        Route::get ('/',                            [AidDispatchController::class, 'index']);
        Route::post('/',                            [AidDispatchController::class, 'store']);
        Route::patch('{aidDispatch}/accept',        [AidDispatchController::class, 'accept']);
        Route::patch('{aidDispatch}/reject',        [AidDispatchController::class, 'reject']);
    });

    // Aid — schedules
    Route::apiResource('aid-schedules', AidScheduleController::class);
    Route::post('aid-schedules/{aidSchedule}/dispatch', [AidScheduleController::class, 'dispatch']);
});
