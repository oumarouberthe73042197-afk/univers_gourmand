<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';
startAppSession();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');

function respond(int $status, bool $success, string $message): void
{
    http_response_code($status);
    echo json_encode(['success' => $success, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, false, 'Méthode non autorisée.');
}
$user = currentAuthorizedUser();
if ($user === null) {
    respond(401, false, 'Connexion requise.');
}
if (!validCsrfToken($_SERVER['HTTP_X_CSRF_TOKEN'] ?? null)) {
    respond(403, false, 'Session expirée. Rechargez la page.');
}

$input = json_decode((string) file_get_contents('php://input'), true);
$current = is_array($input) && is_string($input['current'] ?? null) ? $input['current'] : '';
$new = is_array($input) && is_string($input['new'] ?? null) ? $input['new'] : '';
$confirmation = is_array($input) && is_string($input['confirm'] ?? null) ? $input['confirm'] : '';

$characters = [];
$count = preg_match_all('/./us', $new, $characters);
if ($count === false || $count < 12 || strlen($new) > 72) {
    respond(422, false, 'Choisissez un mot de passe de 12 caractères minimum (72 octets maximum).');
}
if ($new !== $confirmation) {
    respond(422, false, 'Les deux mots de passe ne correspondent pas.');
}

try {
    $pdo = databaseConnection();
    $statement = $pdo->prepare('SELECT password_hash FROM users WHERE id = :id LIMIT 1');
    $statement->execute(['id' => $user['id']]);
    $row = $statement->fetch();
    if (!$row || !password_verify($current, (string) $row['password_hash'])) {
        respond(403, false, 'Le mot de passe actuel est incorrect.');
    }
    $statement = $pdo->prepare('UPDATE users SET password_hash = :hash WHERE id = :id');
    $statement->execute(['hash' => password_hash($new, PASSWORD_DEFAULT), 'id' => $user['id']]);
    session_regenerate_id(true);
    respond(200, true, 'Mot de passe mis à jour.');
} catch (PDOException $exception) {
    error_log('Univers Gourmand password change error: ' . $exception->getMessage());
    respond(500, false, 'Le mot de passe n’a pas pu être modifié.');
}
