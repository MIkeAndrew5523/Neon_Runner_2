<?php
/**
 * php/connection.php
 * PDO MySQL/MariaDB connection using YOUR environment variables (with .env fallback).
 */
declare(strict_types=1);

/** Minimal .env loader (../.env), non-destructive (doesn't override real env) */
(function () {
    $envFile = realpath(__DIR__ . '/../.env');
    if ($envFile && is_readable($envFile)) {
        foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') continue;
            [$k, $v] = array_pad(explode('=', $line, 2), 2, '');
            $k = trim($k); $v = trim($v);
            if ($k !== '' && getenv($k) === false) {
                putenv("$k=$v");
                $_ENV[$k] = $v;
            }
        }
    }
})();

/** Read first non-empty env value from a list of keys */
function env_first(array $keys, ?string $default = null): ?string {
    foreach ($keys as $k) {
        $v = getenv($k);
        if ($v !== false && $v !== '') return $v;
        if (isset($_ENV[$k]) && $_ENV[$k] !== '') return $_ENV[$k];
    }
    return $default;
}

/** Parse a mysql:// URL into DSN/user/pass (supports query param charset) */
function parse_mysql_url(string $url): array {
    $parts = parse_url($url);
    if ($parts === false || !isset($parts['scheme'])) {
        throw new RuntimeException('Invalid DATABASE_URL');
    }
    $scheme = strtolower($parts['scheme']);
    if (!in_array($scheme, ['mysql','mariadb'], true)) {
        throw new RuntimeException("Unsupported scheme: $scheme");
    }
    $host = $parts['host'] ?? '127.0.0.1';
    $port = isset($parts['port']) ? (string)$parts['port'] : '3306';
    $user = isset($parts['user']) ? urldecode($parts['user']) : 'root';
    $pass = isset($parts['pass']) ? urldecode($parts['pass']) : '';
    $db   = isset($parts['path']) ? ltrim($parts['path'], '/') : '';
    parse_str($parts['query'] ?? '', $q);
    $charset = $q['charset'] ?? 'utf8mb4';
    $dsn = "mysql:host={$host};port={$port};dbname={$db};charset={$charset}";
    return [$dsn, $user, $pass];
}

/** Get a singleton PDO */
function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;

    // 1) URL-style env (highest precedence)
    $url = env_first(['DATABASE_URL','JAWSDB_URL','CLEARDB_DATABASE_URL','PLANETSCALE_DATABASE_URL']);
    if ($url) {
        [$dsn, $user, $pass] = parse_mysql_url($url);
    } else {
        // 2) Discrete env vars (common vendor names → your names)
        $host    = env_first(['MYSQLHOST','MYSQL_HOST','DB_HOST'], '127.0.0.1');
        $port    = env_first(['MYSQLPORT','MYSQL_PORT','DB_PORT'], '3306');
        $dbname  = env_first(['MYSQLDATABASE','MYSQL_DATABASE','DB_NAME'], 'cyberdrift');
        $user    = env_first(['MYSQLUSER','MYSQL_USER','DB_USER'], 'root');
        $pass    = env_first(['MYSQLPASSWORD','MYSQL_PASSWORD','DB_PASS'], '');
        $charset = env_first(['MYSQL_CHARSET','DB_CHARSET'], 'utf8mb4');

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";
    }

    $opts = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // throw on errors
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // associative arrays
        PDO::ATTR_EMULATE_PREPARES   => false,                  // native prepares
    ];

    try {
        $pdo = new PDO($dsn, $user, $pass, $opts);

        // Optional: make behavior consistent across environments
        // $pdo->exec("SET time_zone = '+00:00'");
        // $pdo->exec(\"SET SESSION sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'\");

        // Optional TLS if provided (uncomment + add to env)
        // $ca = env_first(['DB_SSL_CA']); if ($ca) {
        //     $pdo->setAttribute(PDO::MYSQL_ATTR_SSL_CA, $ca);
        // }

        return $pdo;
    } catch (PDOException $e) {
        // Show details only in dev
        $debug = env_first(['APP_DEBUG','DEBUG'], '0') === '1';
        http_response_code(500);
        if ($debug) {
            exit('Database connection failed: ' . $e->getMessage());
        }
        exit('Database connection failed.');
    }
}
