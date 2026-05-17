<?php

namespace Database\Seeders;

use App\Models\CivilianProfile;
use App\Models\Shelter;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class MediaSeeder extends Seeder
{
    // Color themes per governorate
    private const GOV_COLORS = [
        'Beirut'          => [0x1E, 0x1B, 0x4B],
        'Mount Lebanon'   => [0x16, 0x4E, 0x63],
        'North Lebanon'   => [0x1A, 0x4A, 0x2E],
        'South Lebanon'   => [0x4A, 0x2B, 0x1A],
        'Bekaa'           => [0x3B, 0x1A, 0x4A],
        'Nabatieh'        => [0x1A, 0x3A, 0x4A],
        'Akkar'           => [0x4A, 0x3B, 0x1A],
        'Baalbek-Hermel'  => [0x4A, 0x1A, 0x2B],
    ];

    public function run(): void
    {
        if (! extension_loaded('gd')) {
            $this->command->warn('GD extension not available — skipping image generation.');
            return;
        }

        $this->command->info('Generating shelter cover images…');
        foreach (Shelter::all() as $shelter) {
            $this->makeShelterImage($shelter);
        }

        $this->command->info('Generating civilian ID documents…');
        foreach (CivilianProfile::whereNotNull('id_number')->with('user')->get() as $profile) {
            $this->makeIdDocument($profile);
        }

        $this->command->info('Media seeding complete.');
    }

    // ─── Shelter cover ────────────────────────────────────────────────────────

    private function makeShelterImage(Shelter $shelter): void
    {
        [$r, $g, $b] = self::GOV_COLORS[$shelter->governorate] ?? [0x1E, 0x1B, 0x4B];

        $w = 800; $h = 480;
        $im = imagecreatetruecolor($w, $h);

        // Gradient-like background: dark base + lighter bands
        $base   = imagecolorallocate($im, $r, $g, $b);
        $mid    = imagecolorallocate($im, min(255, $r + 40), min(255, $g + 40), min(255, $b + 40));
        $light  = imagecolorallocate($im, min(255, $r + 70), min(255, $g + 70), min(255, $b + 70));
        $white  = imagecolorallocate($im, 255, 255, 255);
        $cream  = imagecolorallocate($im, 238, 228, 218);
        $accent = imagecolorallocate($im, 167, 139, 250);    // violet accent

        imagefill($im, 0, 0, $base);

        // Diagonal highlight bands
        for ($i = 0; $i < 6; $i++) {
            $x1 = $w * $i / 5 - 100;
            imagefilledpolygon($im, [$x1, 0, $x1 + 60, 0, $x1 + 160, $h, $x1 + 100, $h], $mid);
        }

        // Bottom bar
        imagefilledrectangle($im, 0, $h - 120, $w, $h, $mid);
        imagefilledrectangle($im, 0, $h - 5,   $w, $h, $accent);

        // Top label strip
        imagefilledrectangle($im, 0, 0, $w, 6, $accent);

        // Building icon (simple silhouette)
        $bx = 60; $by = $h - 120 - 140;
        $bldg = imagecolorallocate($im, min(255, $r + 90), min(255, $g + 90), min(255, $b + 90));
        imagefilledrectangle($im, $bx,       $by + 40,  $bx + 90,  $by + 130, $bldg);
        imagefilledrectangle($im, $bx + 100, $by,       $bx + 200, $by + 130, $bldg);
        imagefilledrectangle($im, $bx + 210, $by + 20,  $bx + 280, $by + 130, $bldg);
        // Windows
        $win = imagecolorallocate($im, min(255, $r + 150), min(255, $g + 150), min(255, $b + 150));
        for ($row = 0; $row < 3; $row++) {
            for ($col = 0; $col < 2; $col++) {
                imagefilledrectangle(
                    $im,
                    $bx + 110 + $col * 35, $by + 15 + $row * 35,
                    $bx + 130 + $col * 35, $by + 30 + $row * 35,
                    $win
                );
            }
        }

        // Text: shelter name
        $name  = $shelter->name;
        $words = explode(' ', $name);
        $line1 = implode(' ', array_slice($words, 0, 3));
        $line2 = count($words) > 3 ? implode(' ', array_slice($words, 3)) : '';

        $this->drawText($im, $line1, 5, $w / 2, $h - 95, $white, true);
        if ($line2) {
            $this->drawText($im, $line2, 4, $w / 2, $h - 65, $cream, false);
        }
        $this->drawText(
            $im,
            "{$shelter->governorate}, Lebanon  |  Capacity: {$shelter->capacity}",
            2, $w / 2, $h - 30, $accent, false
        );

        // Save
        $path = "shelter_images/{$shelter->id}/cover.jpg";
        $dir  = storage_path("app/public/shelter_images/{$shelter->id}");
        if (! is_dir($dir)) mkdir($dir, 0755, true);

        imagejpeg($im, storage_path("app/public/{$path}"), 90);
        imagedestroy($im);

        $shelter->update(['image_path' => $path]);
    }

    // ─── Civilian ID document ─────────────────────────────────────────────────

    private function makeIdDocument(CivilianProfile $profile): void
    {
        $user = $profile->user;
        $w = 680; $h = 440;
        $im = imagecreatetruecolor($w, $h);

        $white  = imagecolorallocate($im, 255, 255, 255);
        $offWhite = imagecolorallocate($im, 248, 248, 240);
        $darkBlue = imagecolorallocate($im, 10, 42, 100);
        $medBlue  = imagecolorallocate($im, 30, 80, 170);
        $red      = imagecolorallocate($im, 200, 0, 0);
        $gray     = imagecolorallocate($im, 180, 180, 180);
        $darkGray = imagecolorallocate($im, 80, 80, 80);
        $gold     = imagecolorallocate($im, 200, 160, 40);

        imagefill($im, 0, 0, $offWhite);

        // Card border
        imagefilledrectangle($im, 0, 0, $w - 1, 6, $darkBlue);
        imagefilledrectangle($im, 0, $h - 7, $w - 1, $h - 1, $darkBlue);
        imagefilledrectangle($im, 0, 0, 6, $h - 1, $darkBlue);
        imagefilledrectangle($im, $w - 7, 0, $w - 1, $h - 1, $darkBlue);

        // Header bar
        imagefilledrectangle($im, 7, 7, $w - 8, 75, $darkBlue);

        // Lebanon flag stripe (simplified: red-white-red)
        imagefilledrectangle($im, 7, 7, 30, 75, $red);
        imagefilledrectangle($im, $w - 31, 7, $w - 8, 75, $red);

        // Header text
        $this->drawText($im, 'LEBANESE REPUBLIC', 4, $w / 2, 20, $white, true);
        $this->drawText($im, 'الجمهورية اللبنانية', 3, $w / 2, 42, $gold, false);
        $type = strtoupper(str_replace('_', ' ', $profile->id_type ?? 'NATIONAL ID'));
        $this->drawText($im, $type, 3, $w / 2, 60, $white, false);

        // Photo placeholder box
        $px = $w - 170; $py = 90;
        imagefilledrectangle($im, $px, $py, $px + 140, $py + 175, $gray);
        imagerectangle($im, $px, $py, $px + 140, $py + 175, $darkGray);
        $this->drawText($im, 'PHOTO', 3, $px + 70, $py + 80, $darkGray, false);

        // Field layout
        $leftX = 30; $startY = 100; $step = 38;
        $fields = [
            ['FULL NAME',      $user->name],
            ['ID NUMBER',      $profile->id_number ?? '—'],
            ['DATE OF BIRTH',  $profile->date_of_birth ? $profile->date_of_birth->format('d/m/Y') : '—'],
            ['GENDER',         ucfirst($profile->gender ?? '—')],
        ];

        foreach ($fields as $i => [$label, $value]) {
            $y = $startY + $i * $step;
            // Label line
            imagefilledrectangle($im, $leftX, $y, $leftX + 220, $y + 1, $medBlue);
            $this->drawText($im, $label, 2, $leftX, $y + 4, $medBlue, false);
            // Value
            $this->drawText($im, $value, 4, $leftX, $y + 16, $darkBlue, false);
        }

        // Bottom strip
        imagefilledrectangle($im, 7, $h - 70, $w - 8, $h - 50, $darkBlue);
        $issued  = date('d/m/Y', strtotime('-' . rand(1, 4) . ' years'));
        $expiry  = date('d/m/Y', strtotime('+' . rand(3, 6) . ' years'));
        $this->drawText($im, "ISSUED: {$issued}    EXPIRY: {$expiry}", 2, $w / 2, $h - 64, $white, false);

        // Barcode simulation
        imagefilledrectangle($im, 7, $h - 47, $w - 8, $h - 8, $white);
        $barW = $w - 14;
        for ($i = 0; $i < $barW; $i += 3) {
            $thick = rand(1, 2);
            if (rand(0, 1)) {
                imagefilledrectangle($im, 7 + $i, $h - 44, 7 + $i + $thick, $h - 12, $darkGray);
            }
        }

        // Save
        $path = "id_documents/{$user->id}/document.jpg";
        $dir  = storage_path("app/public/id_documents/{$user->id}");
        if (! is_dir($dir)) mkdir($dir, 0755, true);

        imagejpeg($im, storage_path("app/public/{$path}"), 88);
        imagedestroy($im);

        $profile->update(['id_document_path' => $path]);
    }

    // ─── Helper: center-aligned text ──────────────────────────────────────────

    private function drawText($im, string $text, int $font, int $cx, int $y, $color, bool $bold): void
    {
        $charW = imagefontwidth($font);
        $x     = (int) ($cx - strlen($text) * $charW / 2);
        if ($x < 5) $x = 5;

        if ($bold) {
            imagestring($im, $font, $x - 1, $y, $text, $color);
            imagestring($im, $font, $x + 1, $y, $text, $color);
        }
        imagestring($im, $font, $x, $y, $text, $color);
    }
}
