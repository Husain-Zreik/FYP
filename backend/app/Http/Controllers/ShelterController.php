<?php

namespace App\Http\Controllers;

use App\Models\Shelter;
use Illuminate\Http\JsonResponse;

class ShelterController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data'    => Shelter::orderBy('name')->get(['id', 'name']),
            'message' => 'OK',
        ]);
    }
}
