<?php

namespace App\Http\Controllers;

use App\Http\Requests\Aid\StoreAidScheduleRequest;
use App\Http\Requests\Aid\UpdateAidScheduleRequest;
use App\Http\Resources\AidDispatchResource;
use App\Http\Resources\AidScheduleResource;
use App\Models\AidDispatch;
use App\Models\AidSchedule;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AidScheduleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = AidSchedule::with(['shelter', 'civilian', 'category', 'creator']);

        if (in_array($user->role, ['government_admin', 'government_staff'])) {
            $query->where('level', 'government_shelter');
        } elseif ($user->isShelterScoped()) {
            $query->where('level', 'shelter_civilian')->where('shelter_id', $user->shelter_id);
        } else {
            abort(403);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        return response()->json([
            'data'    => AidScheduleResource::collection($query->get()),
            'message' => 'OK',
        ]);
    }

    public function store(StoreAidScheduleRequest $request): JsonResponse
    {
        $user = $request->user();

        if (in_array($user->role, ['government_admin', 'government_staff'])) {
            $schedule = AidSchedule::create([
                'level'           => 'government_shelter',
                'created_by'      => $user->id,
                'shelter_id'      => $request->shelter_id,
                'aid_category_id' => $request->aid_category_id,
                'quantity'        => $request->quantity,
                'frequency'       => $request->frequency,
                'notes'           => $request->notes,
                'starts_at'       => $request->starts_at,
                'ends_at'         => $request->ends_at,
            ]);
        } elseif ($user->isShelterScoped()) {
            $civilian = User::where('id', $request->civilian_id)
                ->where('shelter_id', $user->shelter_id)
                ->where('role', 'civilian')
                ->first();

            abort_if(! $civilian, 422, 'Civilian does not belong to your shelter.');

            $schedule = AidSchedule::create([
                'level'           => 'shelter_civilian',
                'created_by'      => $user->id,
                'shelter_id'      => $user->shelter_id,
                'civilian_id'     => $request->civilian_id,
                'aid_category_id' => $request->aid_category_id,
                'quantity'        => $request->quantity,
                'frequency'       => $request->frequency,
                'notes'           => $request->notes,
                'starts_at'       => $request->starts_at,
                'ends_at'         => $request->ends_at,
            ]);
        } else {
            abort(403);
        }

        $schedule->load('shelter', 'civilian', 'category', 'creator');

        return response()->json([
            'data'    => new AidScheduleResource($schedule),
            'message' => 'Aid schedule created successfully.',
        ], 201);
    }

    public function show(Request $request, AidSchedule $aidSchedule): JsonResponse
    {
        $user = $request->user();

        $this->authorizeAccess($user, $aidSchedule);

        $aidSchedule->load('shelter', 'civilian', 'category', 'creator');
        $aidSchedule->setRelation(
            'dispatches',
            $aidSchedule->dispatches()->with(['dispatcher', 'responder'])->latest('dispatched_at')->take(5)->get()
        );

        return response()->json([
            'data'    => new AidScheduleResource($aidSchedule),
            'message' => 'OK',
        ]);
    }

    public function update(UpdateAidScheduleRequest $request, AidSchedule $aidSchedule): JsonResponse
    {
        $user = $request->user();

        $this->authorizeAccess($user, $aidSchedule);

        $aidSchedule->update($request->validated());

        $aidSchedule->load('shelter', 'civilian', 'category', 'creator');

        return response()->json([
            'data'    => new AidScheduleResource($aidSchedule),
            'message' => 'Aid schedule updated successfully.',
        ]);
    }

    public function destroy(Request $request, AidSchedule $aidSchedule): JsonResponse
    {
        $user = $request->user();

        $this->authorizeAdminAccess($user, $aidSchedule);

        if ($aidSchedule->dispatches()->exists()) {
            $aidSchedule->update(['is_active' => false]);

            return response()->json(['message' => 'Aid schedule deactivated.']);
        }

        $aidSchedule->delete();

        return response()->json(['message' => 'Aid schedule deleted.']);
    }

    public function dispatch(Request $request, AidSchedule $aidSchedule): JsonResponse
    {
        $user = $request->user();

        $this->authorizeAccess($user, $aidSchedule);
        abort_if(! $aidSchedule->is_active, 422, 'This schedule is not active.');

        $dispatch = AidDispatch::create([
            'level'           => $aidSchedule->level,
            'dispatched_by'   => $user->id,
            'shelter_id'      => $aidSchedule->shelter_id,
            'civilian_id'     => $aidSchedule->civilian_id,
            'aid_category_id' => $aidSchedule->aid_category_id,
            'quantity'        => $aidSchedule->quantity,
            'notes'           => $aidSchedule->notes,
            'aid_schedule_id' => $aidSchedule->id,
            'status'          => 'pending',
            'dispatched_at'   => now(),
        ]);

        $aidSchedule->update(['last_sent_at' => today()]);

        $dispatch->load('shelter', 'civilian', 'category', 'dispatcher');

        return response()->json([
            'data'    => new AidDispatchResource($dispatch),
            'message' => 'Dispatch created from schedule.',
        ], 201);
    }

    private function authorizeAccess(User $user, AidSchedule $aidSchedule): void
    {
        if (in_array($user->role, ['government_admin', 'government_staff'])) {
            abort_if($aidSchedule->level !== 'government_shelter', 403);
        } elseif ($user->isShelterScoped()) {
            abort_if(
                $aidSchedule->level !== 'shelter_civilian' || $aidSchedule->shelter_id !== $user->shelter_id,
                403
            );
        } else {
            abort(403);
        }
    }

    private function authorizeAdminAccess(User $user, AidSchedule $aidSchedule): void
    {
        if (in_array($user->role, ['government_admin', 'government_staff'])) {
            abort_if($aidSchedule->level !== 'government_shelter', 403);
        } elseif ($user->isShelterAdmin()) {
            abort_if(
                $aidSchedule->level !== 'shelter_civilian' || $aidSchedule->shelter_id !== $user->shelter_id,
                403
            );
        } else {
            abort(403);
        }
    }
}
