<?php
declare(strict_types=1);
header('Content-Type: application/json');

require_once __DIR__ . '/connection.php';
$pdo = db();

$in = json_decode(file_get_contents('php://input'), true) ?? [];
$q = isset($in['q']) ? trim((string)$in['q']) : '';
$limit = (int)($in['limit'] ?? 20);
$limit = max(1, min($limit, 100));

try {
    $like = '%'.$q.'%';

    // Aggregate stats: current sector (from progress), best score, last played from scores/progress/checkpoints
    $sql = "
      SELECT
        u.id,
        u.username,
        u.avatar_key,
        u.created_at,
        p.current_sector,
        COALESCE(MAX(s.points), 0)           AS best_score,
        GREATEST(
          COALESCE(MAX(s.created_at),   TIMESTAMP('1970-01-01')),
          COALESCE(p.updated_at,        TIMESTAMP('1970-01-01')),
          COALESCE(MAX(c.updated_at),   TIMESTAMP('1970-01-01'))
        ) AS last_played
      FROM users u
      LEFT JOIN progress    p ON p.user_id = u.id
      LEFT JOIN scores      s ON s.user_id = u.id
      LEFT JOIN checkpoints c ON c.user_id = u.id
      ".($q !== '' ? "WHERE u.username LIKE :q" : "")."
      GROUP BY u.id, u.username, u.avatar_key, u.created_at, p.current_sector, p.updated_at
      ORDER BY last_played DESC
      LIMIT :lim
    ";
    $stmt = $pdo->prepare($sql);
    if ($q !== '') $stmt->bindValue(':q', $like);
    $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
    $stmt->execute();

    echo json_encode(['ok'=>true, 'users'=>$stmt->fetchAll()]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false, 'error'=>'list_users failed']);
}
