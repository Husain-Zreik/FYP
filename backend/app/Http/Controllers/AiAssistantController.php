<?php

namespace App\Http\Controllers;

use App\Http\Requests\Ai\AskAssistantRequest;
use App\Services\GeminiAssistantService;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class AiAssistantController extends Controller
{
    public function __construct(private readonly GeminiAssistantService $assistant)
    {
    }

    public function chat(AskAssistantRequest $request): JsonResponse
    {
        abort_if($request->user()->role !== 'civilian', 403);

        try {
            $reply = $this->assistant->reply(
                $request->validated('messages'),
                $request->validated('context.screen'),
            );
        } catch (RuntimeException $e) {
            report($e);

            return response()->json([
                'message' => 'The assistant is unavailable right now. Please try again later.',
            ], 503);
        }

        return response()->json([
            'data' => ['reply' => $reply],
            'message' => 'OK',
        ]);
    }
}
