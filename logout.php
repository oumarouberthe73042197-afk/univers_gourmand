<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';
startAppSession();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    http_response_code(405);
    exit('Méthode non autorisée.');
}

if (!validCsrfToken($_POST['csrf_token'] ?? null)) {
    http_response_code(403);
    exit('Requête invalide. Rechargez la page et réessayez.');
}

$_SESSION = [];
$cookie = session_get_cookie_params();
setcookie(session_name(), '', [
    'expires' => time() - 42000,
    'path' => $cookie['path'],
    'domain' => $cookie['domain'],
    'secure' => $cookie['secure'],
    'httponly' => $cookie['httponly'],
    'samesite' => 'Lax',
]);
session_destroy();

header('Location: login.php');
exit;
