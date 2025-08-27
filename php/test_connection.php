<?php
// php/test_connection.php
declare(strict_types=1);

header('Content-Type: application/json');

require_once __DIR__ . '/connection.php';

try {
    $pdo = db();

    // Basic server & database info
    $ver      = $pdo->getAttribute(PDO::ATTR_SERVER_VERSION);
    $dbRow    = $pdo->query('SELECT DATABASE() AS db')->fetch() ?: ['db' => null];
    $charset  = $pdo->query('SELECT @@character_set_server AS charset')->fetch()['charset'] ?? null;
    $coll     = $pdo->query('SELECT @@collation_server AS coll')->fetch()['coll'] ?? null;
    $tz       = $pdo->query('SELECT @@time_zone AS tz')->fetch()['tz'] ?? null;
    $tables   = $pdo->query('SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE()')->fetch()['n'] ?? null;
    $ping     = (int)$pdo->query('SELECT 1')->fetchColumn();

    echo json_encode([
        'ok' => true,
        'server_version' => $ver,
        'database'       => $dbRow['db'],
        'tables'         => (int)$tables,
        'charset'        => $charset,
        'collation'      => $coll,
        'time_zone'      => $tz,
        'ping'           => $ping
    ], JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    http_response_code(500);
    $debug = getenv('APP_DEBUG') === '1';
    echo json_encode([
        'ok' => false,
        'error' => $debug ? $e->getMessage() : 'Connection failed'
    ], JSON_PRETTY_PRINT);
}
