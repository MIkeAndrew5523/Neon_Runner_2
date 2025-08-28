<?php
// php/save_progress.php
declare(strict_types=1);
require __DIR__ . '/connection.php';
header('Content-Type: application/json');

$in = json_decode(file_get_contents('php://input'), true) ?: [];
$user_id = (int)($in['user_id'] ?? 0);
$current = (int)($in['current_sector'] ?? 1);
$s1done  = (int)($in['sector1_complete'] ?? 0);
$s2done  = (int)($in['sector2_complete'] ?? 0);
$s3done  = (int)($in['sector3_complete'] ?? 0);
$flags   = json_encode($in['story_flags'] ?? new stdClass(), JSON_UNESCAPED_SLASHES);

if ($user_id <= 0) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'bad_input']); exit; }

try {
  $sql = "INSERT INTO progress (user_id,current_sector,sector1_complete,sector2_complete,sector3_complete,story_flags,updated_at)
          VALUES (:uid,:cur,:s1,:s2,:s3,:flags,NOW())
          ON DUPLICATE KEY UPDATE
            current_sector=VALUES(current_sector),
            sector1_complete=VALUES(sector1_complete),
            sector2_complete=VALUES(sector2_complete),
            sector3_complete=VALUES(sector3_complete),
            story_flags=VALUES(story_flags),
            updated_at=NOW()";
  $stmt = db()->prepare($sql);
  $stmt->execute([':uid'=>$user_id, ':cur'=>$current, ':s1'=>$s1done, ':s2'=>$s2done, ':s3'=>$s3done, ':flags'=>$flags]);
  echo json_encode(['ok'=>true]);
} catch (Throwable $e) {
  http_response_code(500); echo json_encode(['ok'=>false,'error'=>'db']);
}
