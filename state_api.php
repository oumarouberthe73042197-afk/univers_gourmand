<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';
startAppSession();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');

function respondWithJson(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (!isAuthenticated()) {
    respondWithJson(401, ['success' => false, 'message' => 'Connexion requise.']);
}

$user = currentAuthorizedUser();
if ($user === null) {
    respondWithJson(403, ['success' => false, 'message' => 'Votre compte n’est pas autorisé à accéder au tableau de bord.']);
}

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method !== 'GET' && $method !== 'POST') {
    header('Allow: GET, POST');
    respondWithJson(405, ['success' => false, 'message' => 'Méthode non autorisée.']);
}

try {
    $pdo = databaseConnection();

    if ($method === 'GET') {
        $statement = $pdo->query('SELECT state_json FROM app_state WHERE id = 1');
        $row = $statement->fetch();
        $state = $row ? json_decode($row['state_json'], true, 512, JSON_THROW_ON_ERROR) : null;

        if ($row && !is_array($state)) {
            respondWithJson(500, ['success' => false, 'message' => 'Les données partagées sont invalides.']);
        }

        respondWithJson(200, ['success' => true, 'state' => $state]);
    }

    if (!validCsrfToken($_SERVER['HTTP_X_CSRF_TOKEN'] ?? null)) {
        respondWithJson(403, ['success' => false, 'message' => 'Session expirée. Rechargez la page.']);
    }

    $requestBody = file_get_contents('php://input');
    if ($requestBody === false || strlen($requestBody) > 6 * 1024 * 1024) {
        respondWithJson(413, ['success' => false, 'message' => 'Les données à synchroniser sont trop volumineuses.']);
    }

    $request = json_decode($requestBody, true, 512, JSON_THROW_ON_ERROR);
    $state = $request['state'] ?? null;
    $requiredCollections = ['dishes', 'orders', 'tables', 'stock', 'expenses'];
    if (!is_array($state) || !isset($state['settings']) || !is_array($state['settings'])) {
        respondWithJson(400, ['success' => false, 'message' => 'Format des données invalide.']);
    }
    foreach ($requiredCollections as $collection) {
        if (!isset($state[$collection]) || !is_array($state[$collection])) {
            respondWithJson(400, ['success' => false, 'message' => 'Format des données invalide.']);
        }
    }

    $stateJson = json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    if (($request['initialize'] ?? false) === true) {
        $statement = $pdo->prepare(
            'INSERT IGNORE INTO app_state (id, state_json) VALUES (1, :state_json)'
        );
    } else {
        $statement = $pdo->prepare(
            'INSERT INTO app_state (id, state_json) VALUES (1, :state_json)
             ON DUPLICATE KEY UPDATE state_json = VALUES(state_json)'
        );
    }
    $statement->execute(['state_json' => $stateJson]);

    $statement = $pdo->query('SELECT state_json FROM app_state WHERE id = 1');
    $row = $statement->fetch();
    if (!$row) {
        throw new RuntimeException('Shared application state was not saved.');
    }

    $savedState = json_decode($row['state_json'], true, 512, JSON_THROW_ON_ERROR);
    respondWithJson(200, ['success' => true, 'state' => $savedState]);
} catch (JsonException $exception) {
    error_log('Univers Gourmand state JSON error: ' . $exception->getMessage());
    respondWithJson(400, ['success' => false, 'message' => 'Les données envoyées sont invalides.']);
} catch (PDOException $exception) {
    error_log('Univers Gourmand state database error: ' . $exception->getMessage());
    respondWithJson(500, ['success' => false, 'message' => 'La synchronisation avec la base de données a échoué.']);
} catch (RuntimeException $exception) {
    error_log('Univers Gourmand state save error: ' . $exception->getMessage());
    respondWithJson(500, ['success' => false, 'message' => 'La synchronisation avec la base de données a échoué.']);
}
