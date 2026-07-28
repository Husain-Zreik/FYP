<?php

namespace App\Http\Controllers;

use App\Http\Requests\Aid\AcceptAidDispatchRequest;
use App\Http\Requests\Aid\StoreAidDispatchRequest;
use App\Http\Resources\AidDispatchResource;
use App\Models\AidBatch;
use App\Models\AidDispatch;
use App\Models\AidRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AidDispatchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = AidDispatch::with(['shelter', 'civilian', 'category', 'dispatcher', 'responder', 'schedule'])
            ->orderBy('dispatched_at', 'desc');

        if (in_array($user->role, ['government_admin', 'government_staff'])) {
            $query->where('level', 'government_shelter');

            if ($request->filled('shelter_id')) {
                $query->where('shelter_id', $request->shelter_id);
            }
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }
            if ($request->filled('aid_category_id')) {
                $query->where('aid_category_id', $request->aid_category_id);
            }
        } elseif ($user->isShelterScoped()) {
            $direction = $request->query('direction');

            if ($direction === 'incoming') {
                $query->where('level', 'government_shelter')->where('shelter_id', $user->shelter_id);
            } elseif ($direction === 'outgoing') {
                $query->where('level', 'shelter_civilian')->where('shelter_id', $user->shelter_id);
            } else {
                $query->where('shelter_id', $user->shelter_id);
            }
        } else {
            $query->where('level', 'shelter_civilian')->where('civilian_id', $user->id);
        }

        return response()->json([
            'data'    => AidDispatchResource::collection($query->get()),
            'message' => 'OK',
        ]);
    }

    public function store(StoreAidDispatchRequest $request): JsonResponse
    {
        $user = $request->user();

        if (in_array($user->role, ['government_admin', 'government_staff'])) {
            if ($request->aid_request_id) {
                $aidRequest = AidRequest::where('id', $request->aid_request_id)
                    ->where('shelter_id', $request->shelter_id)
                    ->whereIn('status', ['approved', 'partially_approved'])
                    ->first();

                abort_if(! $aidRequest, 422, 'Invalid or unapproved aid request for this shelter.');

                $alreadyDispatched = AidDispatch::where('aid_request_id', $aidRequest->id)
                    ->where('status', '!=', 'rejected')
                    ->sum('quantity');

                $remainingApproved = $aidRequest->quantity_approved - $alreadyDispatched;

                abort_if(
                    $request->quantity > $remainingApproved,
                    422,
                    "Cannot dispatch more than the remaining approved quantity ({$remainingApproved})."
                );
            }

            $outcome = DB::transaction(function () use ($request, $user) {
                $result = AidBatch::deductFifo($request->aid_category_id, $request->quantity);

                if ($result !== true) {
                    return ['available' => $result];
                }

                return ['dispatch' => AidDispatch::create([
                    'level'                 => 'government_shelter',
                    'dispatched_by'         => $user->id,
                    'shelter_id'            => $request->shelter_id,
                    'aid_category_id'       => $request->aid_category_id,
                    'quantity'              => $request->quantity,
                    'notes'                 => $request->notes,
                    'expected_arrival_date' => $request->expected_arrival_date,
                    'aid_request_id'        => $request->aid_request_id,
                    'status'                => 'pending',
                    'dispatched_at'         => now(),
                ])];
            });
        } elseif ($user->isShelterScoped()) {
            $civilian = User::where('id', $request->civilian_id)
                ->where('shelter_id', $user->shelter_id)
                ->where('role', 'civilian')
                ->first();

            abort_if(! $civilian, 422, 'Civilian does not belong to your shelter.');

            $outcome = DB::transaction(function () use ($request, $user) {
                $result = AidDispatch::reserveForShelter($user->shelter_id, $request->aid_category_id, $request->quantity);

                if ($result !== true) {
                    return ['available' => $result];
                }

                return ['dispatch' => AidDispatch::create([
                    'level'                 => 'shelter_civilian',
                    'dispatched_by'         => $user->id,
                    'shelter_id'            => $user->shelter_id,
                    'civilian_id'           => $request->civilian_id,
                    'aid_category_id'       => $request->aid_category_id,
                    'quantity'              => $request->quantity,
                    'notes'                 => $request->notes,
                    'expected_arrival_date' => $request->expected_arrival_date,
                    'civilian_need_id'      => $request->civilian_need_id,
                    'status'                => 'pending',
                    'dispatched_at'         => now(),
                ])];
            });
        } else {
            abort(403);
        }

        if (isset($outcome['available'])) {
            return response()->json([
                'message'   => "Insufficient stock. Only {$outcome['available']} units available for this category.",
                'available' => $outcome['available'],
            ], 422);
        }

        $dispatch = $outcome['dispatch'];
        $dispatch->load('shelter', 'civilian', 'category', 'dispatcher');

        return response()->json([
            'data'    => new AidDispatchResource($dispatch),
            'message' => 'Aid dispatched successfully.',
        ], 201);
    }

    public function accept(AcceptAidDispatchRequest $request, AidDispatch $aidDispatch): JsonResponse
    {
        $user = $request->user();

        $this->authorizeResponse($user, $aidDispatch);
        abort_if($aidDispatch->status !== 'pending', 422, 'This dispatch has already been responded to.');

        DB::transaction(function () use ($request, $user, $aidDispatch) {
            $aidDispatch->update([
                'status'       => 'accepted',
                'responded_at' => now(),
                'received_at'  => $request->received_at,
                'responded_by' => $user->id,
            ]);

            if ($aidDispatch->level === 'government_shelter' && $aidDispatch->aid_request_id) {
                AidRequest::where('id', $aidDispatch->aid_request_id)
                    ->where('shelter_id', $aidDispatch->shelter_id)
                    ->whereIn('status', ['approved', 'partially_approved'])
                    ->update([
                        'status'                 => 'fulfilled',
                        'received_at'            => $request->received_at,
                        'shelter_received_notes' => $request->notes,
                    ]);
            }
        });

        $aidDispatch->load('shelter', 'civilian', 'category', 'dispatcher', 'responder');

        return response()->json([
            'data'    => new AidDispatchResource($aidDispatch),
            'message' => 'Dispatch accepted.',
        ]);
    }

    public function reject(Request $request, AidDispatch $aidDispatch): JsonResponse
    {
        $user = $request->user();

        $this->authorizeResponse($user, $aidDispatch);
        abort_if($aidDispatch->status !== 'pending', 422, 'This dispatch has already been responded to.');

        $request->validate(['rejection_reason' => 'nullable|string|max:300']);

        DB::transaction(function () use ($request, $user, $aidDispatch) {
            $aidDispatch->update([
                'status'           => 'rejected',
                'responded_at'     => now(),
                'responded_by'     => $user->id,
                'rejection_reason' => $request->rejection_reason,
            ]);

            if ($aidDispatch->level === 'government_shelter') {
                AidBatch::refundFifo($aidDispatch->aid_category_id, $aidDispatch->quantity);
            }
        });

        $aidDispatch->load('shelter', 'civilian', 'category', 'dispatcher', 'responder');

        return response()->json([
            'data'    => new AidDispatchResource($aidDispatch),
            'message' => 'Dispatch rejected.',
        ]);
    }

    private function authorizeResponse(User $user, AidDispatch $aidDispatch): void
    {
        if ($aidDispatch->level === 'government_shelter') {
            abort_if(
                ! $user->isShelterScoped() || $user->shelter_id !== $aidDispatch->shelter_id,
                403
            );
        } else {
            $isCivilian      = $user->role === 'civilian' && $user->id === $aidDispatch->civilian_id;
            $isShelterMember = $user->isShelterScoped() && $user->shelter_id === $aidDispatch->shelter_id;

            abort_if(! $isCivilian && ! $isShelterMember, 403);
        }
    }
}
