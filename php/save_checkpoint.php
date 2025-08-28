<?php
// php/save_checkpoint.php
declare(strict_types=1);
require __DIR__ . '/connection.php';
header('Content-Type: application/json');

$in = json_decode(file_get_contents('php://input'), true) ?: [];
$user_id = (int)($in['user_id'] ?? 0);
$sector  = (int)($in['sector']   ?? 0);
$level   = trim((string)($in['level_key'] ?? ''));
$ppct    = (int)($in['progress_pct'] ?? 0);
$state   = json_encode($in['state'] ?? new stdClass(), JSON_UNESCAPED_SLASHES);

if ($user_id <= 0 || $sector <= 0 || $level === '') {
  http_response_code(400); echo json_encode(['ok'=>false,'error'=>'bad_input']); exit;
}

try {
  $sql = "INSERT INTO checkpoints (user_id, sector, level_key, progress_pct, state_json, updated_at)
          VALUES (:uid,:sec,:lvl,:pct,:st, NOW())
          ON DUPLICATE KEY UPDATE
            sector=VALUES(sector),
            level_key=VALUES(level_key),
            progress_pct=VALUES(progress_pct),
            state_json=VALUES(state_json),
            updated_at=NOW()";
  $stmt = db()->prepare($sql);
  $stmt->execute([':uid'=>$user_id, ':sec'=>$sector, ':lvl'=>$level, ':pct'=>$ppct, ':st'=>$state]);
  echo json_encode(['ok'=>true]);
} catch (Throwable $e) {
  http_response_code(500); echo json_encode(['ok'=>false,'error'=>'db']); 
}
