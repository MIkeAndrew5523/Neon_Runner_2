<?php
// php/get_checkpoint.php
declare(strict_types=1);
require __DIR__ . '/connection.php';
header('Content-Type: application/json');

$in = json_decode(file_get_contents('php://input'), true) ?: [];
$user_id = (int)($in['user_id'] ?? 0);
if ($user_id <= 0) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'bad_input']); exit; }

try {
  $stmt = db()->prepare("SELECT user_id, sector, level_key, progress_pct,
                                state_json, updated_at
                           FROM checkpoints WHERE user_id=:uid");
  $stmt->execute([':uid'=>$user_id]);
  $row = $stmt->fetch();
  if (!$row) { echo json_encode(['ok'=>true,'found'=>false]); exit; }
  $row['state'] = json_decode($row['state_json'] ?? '{}', true);
  unset($row['state_json']);
  echo json_encode(['ok'=>true,'found'=>true,'checkpoint'=>$row]);
} catch (Throwable $e) {
  http_response_code(500); echo json_encode(['ok'=>false,'error'=>'db']);
}
