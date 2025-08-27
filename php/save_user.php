<?php
declare(strict_types=1);
header('Content-Type: application/json');

require_once __DIR__ . '/connection.php';
$pdo = db();

$in = json_decode(file_get_contents('php://input'), true) ?? [];
$username   = trim((string)($in['username'] ?? ''));
$avatar_key = trim((string)($in['avatar_key'] ?? ''));
$email      = isset($in['email']) ? trim((string)$in['email']) : null;

if ($username === '' || $avatar_key === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'username and avatar_key are required']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Try to insert user; on duplicate, fetch existing id
    $stmt = $pdo->prepare('INSERT INTO users (username, avatar_key, email)
                           VALUES (:u, :a, :e)');
    try {
        $stmt->execute([':u' => $username, ':a' => $avatar_key, ':e' => $email]);
        $userId = (int)$pdo->lastInsertId();
    } catch (PDOException $e) {
        // Duplicate username → fetch existing
        if ((int)$e->errorInfo[1] !== 1062) throw $e; // not a duplicate
        $userId = (int)($pdo->prepare('SELECT id FROM users WHERE username = :u')
                           ->execute([':u' => $username]) ?: 0);
        $userId = (int)$pdo->query("SELECT id FROM users WHERE username=" . $pdo->quote($username))->fetchColumn();
        // Optionally update avatar on re-register:
        $pdo->prepare('UPDATE users SET avatar_key = :a WHERE id = :id')
            ->execute([':a' => $avatar_key, ':id' => $userId]);
    }

    // Ensure a progress row exists
    $pdo->prepare('INSERT IGNORE INTO progress (user_id, current_sector, sector1_complete, sector2_complete, sector3_complete, story_flags)
                   VALUES (:id, 1, 0, 0, 0, JSON_OBJECT())')
        ->execute([':id' => $userId]);

    $pdo->commit();
    echo json_encode(['ok' => true, 'user_id' => $userId, 'username' => $username, 'avatar_key' => $avatar_key]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'save_user failed']);
}
