<?php
declare(strict_types=1);

require_once __DIR__ . '/database.php';

function startAppSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    ini_set('session.use_strict_mode', '1');
    $scriptDirectory = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/'));
    $cookiePath = rtrim($scriptDirectory, '/') . '/';
    $https = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';

    session_name('univers_gourmand_session');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => $cookiePath === '//' ? '/' : $cookiePath,
        'secure' => $https,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function csrfToken(): string
{
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return $_SESSION['csrf_token'];
}

function validCsrfToken($token): bool
{
    return is_string($token)
        && isset($_SESSION['csrf_token'])
        && hash_equals($_SESSION['csrf_token'], $token);
}

function isAuthenticated(): bool
{
    return isset($_SESSION['user_id'], $_SESSION['user_name']);
}

function currentAuthorizedUser(): ?array
{
    if (!isAuthenticated()) {
        return null;
    }

    $statement = databaseConnection()->prepare(
        'SELECT id, name, role, is_authorized FROM users WHERE id = :id LIMIT 1'
    );
    $statement->execute(['id' => $_SESSION['user_id']]);
    $user = $statement->fetch();

    if (!$user || !(bool) $user['is_authorized']) {
        unset($_SESSION['user_id'], $_SESSION['user_name'], $_SESSION['csrf_token']);
        return null;
    }

    $_SESSION['user_name'] = $user['name'];
    return [
        'id' => (int) $user['id'],
        'name' => $user['name'],
        'role' => $user['role'],
    ];
}

function requireAuthorizedUser(): array
{
    $user = currentAuthorizedUser();
    if ($user === null) {
        header('Location: login.php');
        exit;
    }

    return $user;
}

function requireAdminUser(): array
{
    $user = requireAuthorizedUser();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        exit('Accès réservé à l’administrateur.');
    }

    return $user;
}

function authenticateUser(array $user): void
{
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['user_name'] = $user['name'];
    unset($_SESSION['csrf_token']);
}
