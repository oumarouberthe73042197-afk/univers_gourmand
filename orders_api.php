<?php
declare(strict_types=1);

/** API réservée au personnel : commandes envoyées par les clients via le QR code. */

require_once __DIR__ . '/auth.php';
startAppSession();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (!isAuthenticated()) {
    respond(401, ['success' => false, 'message' => 'Connexion requise.']);
}
if (currentAuthorizedUser() === null) {
    respond(403, ['success' => false, 'message' => 'Votre compte n’est pas autorisé.']);
}

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method !== 'GET' && $method !== 'POST') {
    header('Allow: GET, POST');
    respond(405, ['success' => false, 'message' => 'Méthode non autorisée.']);
}

try {
    $pdo = databaseConnection();
    ensureCustomerOrdersSchema($pdo);

    if ($method === 'GET') {
        $statement = $pdo->prepare(
            'SELECT id, table_number, customer_name, items_label, total, status, payment_method, payment_status, payment_reference, created_at
             FROM customer_orders
             WHERE archived = 0 AND (status <> \'paye\' OR created_at >= :since)
             ORDER BY id DESC LIMIT 300'
        );
        $statement->execute(['since' => gmdate('Y-m-d H:i:s', time() - 14 * 86400)]);
        $orders = [];
        foreach ($statement->fetchAll() as $row) {
            $orders[] = [
                'id' => (int) $row['id'],
                'table' => (int) $row['table_number'],
                'customer' => $row['customer_name'],
                'items' => (string) $row['items_label'],
                'total' => (float) $row['total'],
                'status' => (string) $row['status'],
                'payment' => $row['payment_method'],
                'paymentStatus' => (string) $row['payment_status'],
                'reference' => $row['payment_reference'],
                'ts' => (int) strtotime($row['created_at'] . ' UTC'),
            ];
        }
        respond(200, ['success' => true, 'orders' => $orders]);
    }

    if (!validCsrfToken($_SERVER['HTTP_X_CSRF_TOKEN'] ?? null)) {
        respond(403, ['success' => false, 'message' => 'Session expirée. Rechargez la page.']);
    }
    $input = json_decode((string) file_get_contents('php://input'), true);
    $id = is_array($input) ? filter_var($input['id'] ?? null, FILTER_VALIDATE_INT) : false;
    $action = is_array($input) ? (string) ($input['action'] ?? '') : '';
    if ($id === false) {
        respond(400, ['success' => false, 'message' => 'Requête invalide.']);
    }

    if ($action === 'status') {
        $status = (string) ($input['status'] ?? '');
        if (!in_array($status, ['preparation', 'pret', 'servi', 'paye'], true)) {
            respond(422, ['success' => false, 'message' => 'Statut invalide.']);
        }
        $statement = $pdo->prepare(
            'UPDATE customer_orders
             SET status = :status,
                 payment_status = IF(:paid = 1 AND payment_status = \'declared\', \'confirmed\', payment_status)
             WHERE id = :id AND archived = 0'
        );
        $statement->execute(['status' => $status, 'paid' => $status === 'paye' ? 1 : 0, 'id' => $id]);
    } elseif ($action === 'confirm_payment') {
        $statement = $pdo->prepare(
            'UPDATE customer_orders SET payment_status = \'confirmed\', status = \'paye\' WHERE id = :id AND archived = 0'
        );
        $statement->execute(['id' => $id]);
    } elseif ($action === 'archive') {
        $statement = $pdo->prepare('UPDATE customer_orders SET archived = 1 WHERE id = :id');
        $statement->execute(['id' => $id]);
    } else {
        respond(400, ['success' => false, 'message' => 'Action inconnue.']);
    }

    respond(200, ['success' => true]);
} catch (Throwable $exception) {
    error_log('Univers Gourmand orders API error: ' . $exception->getMessage());
    respond(500, ['success' => false, 'message' => 'Erreur de base de données.']);
}
