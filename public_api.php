<?php
declare(strict_types=1);

/**
 * API publique utilisée par la page client (menu.php) : menu, commande, suivi, paiement.
 * Aucune session requise. Les prix sont toujours recalculés côté serveur.
 */

require_once __DIR__ . '/database.php';

const UG_PROVIDERS = ['orange', 'wave', 'moov'];

function jsonOut(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function loadSharedState(PDO $pdo): ?array
{
    $row = $pdo->query('SELECT state_json FROM app_state WHERE id = 1')->fetch();
    if (!$row) {
        return null;
    }
    $state = json_decode((string) $row['state_json'], true);
    return is_array($state) ? $state : null;
}

function cut(string $value, int $length): string
{
    return function_exists('mb_substr') ? mb_substr($value, 0, $length) : substr($value, 0, $length);
}

function normalizeCategory(string $category): string
{
    return $category === 'Plats' ? 'Plats principaux' : $category;
}

function dishImageParts($image): ?array
{
    if (!is_string($image) || !preg_match('#^data:image/(jpeg|webp);base64,([A-Za-z0-9+/=]+)$#', $image, $m)) {
        return null;
    }
    return ['mime' => 'image/' . $m[1], 'data' => $m[2]];
}

function paymentConfig(array $state): array
{
    $settings = isset($state['settings']) && is_array($state['settings']) ? $state['settings'] : [];
    $payments = isset($settings['payments']) && is_array($settings['payments']) ? $settings['payments'] : [];
    $result = [];
    foreach (UG_PROVIDERS as $key) {
        $config = isset($payments[$key]) && is_array($payments[$key]) ? $payments[$key] : [];
        $number = trim((string) preg_replace('/[^0-9+ ]/', '', (string) ($config['number'] ?? '')));
        $link = (string) ($config['link'] ?? '');
        if ($key !== 'wave' || !preg_match('#^https://[A-Za-z0-9.\-]+/[^\s"<>]*$#', $link)) {
            $link = '';
        }
        $result[$key] = [
            'enabled' => !empty($config['enabled']) && ($number !== '' || $link !== ''),
            'number' => $number,
            'link' => $link,
        ];
    }
    return $result;
}

function availableDishes(array $state): array
{
    $dishes = [];
    foreach (($state['dishes'] ?? []) as $dish) {
        if (!is_array($dish) || empty($dish['available']) || !isset($dish['id'], $dish['name'], $dish['price'])) {
            continue;
        }
        $dishes[(int) $dish['id']] = $dish;
    }
    return $dishes;
}

function tableIds(array $state): array
{
    $ids = [];
    foreach (($state['tables'] ?? []) as $table) {
        if (is_array($table) && isset($table['id'])) {
            $ids[] = (int) $table['id'];
        }
    }
    sort($ids);
    return $ids;
}

function clientIpHash(): string
{
    $ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? '';
    if ($ip === '' && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = trim(explode(',', (string) $_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
    }
    if ($ip === '') {
        $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    }
    return substr(hash('sha256', $ip . '|univers-gourmand'), 0, 16);
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || strlen($raw) > 64 * 1024) {
        jsonOut(413, ['success' => false, 'message' => 'Requête trop volumineuse.']);
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        jsonOut(400, ['success' => false, 'message' => 'Requête invalide.']);
    }
    return $data;
}

function findOrder(PDO $pdo, $id, $token): array
{
    $id = filter_var($id, FILTER_VALIDATE_INT);
    if ($id === false || !is_string($token) || strlen($token) !== 32) {
        jsonOut(404, ['success' => false, 'message' => 'Commande introuvable.']);
    }
    $statement = $pdo->prepare('SELECT * FROM customer_orders WHERE id = :id AND archived = 0 LIMIT 1');
    $statement->execute(['id' => $id]);
    $row = $statement->fetch();
    if (!$row || !hash_equals((string) $row['public_token'], $token)) {
        jsonOut(404, ['success' => false, 'message' => 'Commande introuvable.']);
    }
    return $row;
}

$action = isset($_GET['a']) && is_string($_GET['a']) ? $_GET['a'] : '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    $pdo = databaseConnection();

    // --- Photo d'un plat (binaire, mise en cache) ---------------------------------
    if ($action === 'img') {
        $state = loadSharedState($pdo);
        $dishes = $state ? availableDishes($state) : [];
        $id = (int) ($_GET['id'] ?? 0);
        $parts = isset($dishes[$id]) ? dishImageParts($dishes[$id]['image'] ?? null) : null;
        $binary = $parts ? base64_decode($parts['data'], true) : false;
        if ($binary === false) {
            http_response_code(404);
            exit;
        }
        header('Content-Type: ' . $parts['mime']);
        header('Cache-Control: public, max-age=31536000, immutable');
        header('X-Content-Type-Options: nosniff');
        echo $binary;
        exit;
    }

    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, private');
    header('X-Content-Type-Options: nosniff');

    ensureCustomerOrdersSchema($pdo);

    // --- Menu ------------------------------------------------------------------------
    if ($action === 'menu' && $method === 'GET') {
        $state = loadSharedState($pdo);
        if ($state === null) {
            jsonOut(200, ['success' => true, 'ready' => false]);
        }
        $settings = isset($state['settings']) && is_array($state['settings']) ? $state['settings'] : [];
        $dishes = [];
        foreach (availableDishes($state) as $id => $dish) {
            $parts = dishImageParts($dish['image'] ?? null);
            $dishes[] = [
                'id' => $id,
                'name' => (string) $dish['name'],
                'category' => normalizeCategory((string) ($dish['category'] ?? '')),
                'price' => (float) $dish['price'],
                'img' => $parts
                    ? 'public_api.php?a=img&id=' . $id . '&v=' . substr(md5($parts['data']), 0, 8)
                    : null,
            ];
        }
        jsonOut(200, [
            'success' => true,
            'ready' => true,
            'restaurant' => [
                'name' => (string) ($settings['name'] ?? 'Univers Gourmand'),
                'address' => (string) ($settings['address'] ?? ''),
                'phone' => (string) ($settings['phone'] ?? ''),
                'open' => (string) ($settings['open'] ?? ''),
                'close' => (string) ($settings['close'] ?? ''),
            ],
            'currency' => (string) ($state['currency'] ?? 'FCFA'),
            'tables' => tableIds($state),
            'dishes' => $dishes,
        ]);
    }

    // --- Nouvelle commande ----------------------------------------------------------
    if ($action === 'order' && $method === 'POST') {
        $input = readJsonBody();
        $state = loadSharedState($pdo);
        if ($state === null) {
            jsonOut(503, ['success' => false, 'message' => 'Le menu n’est pas encore disponible.']);
        }

        $table = filter_var($input['table'] ?? null, FILTER_VALIDATE_INT);
        if ($table === false || !in_array($table, tableIds($state), true)) {
            jsonOut(422, ['success' => false, 'message' => 'Choisissez votre numéro de table.']);
        }

        $dishes = availableDishes($state);
        $quantities = [];
        foreach (array_slice(is_array($input['items'] ?? null) ? $input['items'] : [], 0, 40) as $line) {
            if (!is_array($line)) {
                continue;
            }
            $dishId = filter_var($line['id'] ?? null, FILTER_VALIDATE_INT);
            $quantity = filter_var($line['qty'] ?? null, FILTER_VALIDATE_INT);
            if ($dishId === false || $quantity === false || $quantity < 1 || !isset($dishes[$dishId])) {
                continue;
            }
            $quantities[$dishId] = min(20, ($quantities[$dishId] ?? 0) + $quantity);
        }
        if (!$quantities) {
            jsonOut(422, ['success' => false, 'message' => 'Votre panier est vide ou contient des plats indisponibles.']);
        }

        $total = 0.0;
        $lines = [];
        $labels = [];
        foreach ($quantities as $dishId => $quantity) {
            $price = (float) $dishes[$dishId]['price'];
            $name = (string) $dishes[$dishId]['name'];
            $total += $price * $quantity;
            $lines[] = ['id' => $dishId, 'name' => $name, 'qty' => $quantity, 'price' => $price];
            $labels[] = $name . ' ×' . $quantity;
        }
        $label = cut(implode(', ', $labels), 500);

        $name = trim((string) preg_replace('/[\x00-\x1F\x7F]/u', '', (string) ($input['name'] ?? '')));
        $name = cut($name, 60);

        $ipHash = clientIpHash();
        $statement = $pdo->prepare('SELECT COUNT(*) FROM customer_orders WHERE ip_hash = :ip AND created_at >= :since');
        $statement->execute(['ip' => $ipHash, 'since' => gmdate('Y-m-d H:i:s', time() - 600)]);
        if ((int) $statement->fetchColumn() >= 8) {
            jsonOut(429, ['success' => false, 'message' => 'Trop de commandes en peu de temps. Appelez un serveur.']);
        }

        $token = bin2hex(random_bytes(16));
        $statement = $pdo->prepare(
            'INSERT INTO customer_orders
               (public_token, table_number, customer_name, items_json, items_label, total, status, payment_status, ip_hash, created_at)
             VALUES (:token, :tbl, :name, :items, :label, :total, \'preparation\', \'none\', :ip, :created)'
        );
        $statement->execute([
            'token' => $token,
            'tbl' => $table,
            'name' => $name !== '' ? $name : null,
            'items' => json_encode($lines, JSON_UNESCAPED_UNICODE),
            'label' => $label,
            'total' => $total,
            'ip' => $ipHash,
            'created' => gmdate('Y-m-d H:i:s'),
        ]);

        jsonOut(201, ['success' => true, 'id' => (int) $pdo->lastInsertId(), 'token' => $token, 'total' => $total]);
    }

    // --- Suivi d'une commande -------------------------------------------------------
    if ($action === 'status' && $method === 'GET') {
        $row = findOrder($pdo, $_GET['id'] ?? null, $_GET['token'] ?? null);
        $response = [
            'success' => true,
            'id' => (int) $row['id'],
            'table' => (int) $row['table_number'],
            'items' => (string) $row['items_label'],
            'total' => (float) $row['total'],
            'status' => (string) $row['status'],
            'paymentStatus' => (string) $row['payment_status'],
            'paymentMethod' => $row['payment_method'],
        ];
        if ($row['status'] !== 'preparation' && $row['payment_status'] !== 'confirmed') {
            $state = loadSharedState($pdo);
            $response['payments'] = $state ? paymentConfig($state) : [];
        }
        jsonOut(200, $response);
    }

    // --- Le client indique qu'il a payé -----------------------------------------------
    if ($action === 'pay' && $method === 'POST') {
        $input = readJsonBody();
        $row = findOrder($pdo, $input['id'] ?? null, $input['token'] ?? null);
        if (!in_array($row['status'], ['pret', 'servi'], true) || $row['payment_status'] === 'confirmed') {
            jsonOut(409, ['success' => false, 'message' => 'Le paiement n’est pas possible pour cette commande.']);
        }

        $provider = (string) ($input['method'] ?? '');
        $state = loadSharedState($pdo);
        $config = $state ? paymentConfig($state) : [];
        if (!in_array($provider, UG_PROVIDERS, true) || empty($config[$provider]['enabled'])) {
            jsonOut(422, ['success' => false, 'message' => 'Ce moyen de paiement n’est pas disponible.']);
        }

        $reference = substr((string) preg_replace('/[^A-Za-z0-9_\-]/', '', (string) ($input['reference'] ?? '')), 0, 40);
        $statement = $pdo->prepare(
            'UPDATE customer_orders SET payment_method = :method, payment_status = \'declared\', payment_reference = :ref WHERE id = :id'
        );
        $statement->execute([
            'method' => $provider,
            'ref' => $reference !== '' ? $reference : null,
            'id' => (int) $row['id'],
        ]);

        jsonOut(200, ['success' => true]);
    }

    jsonOut(404, ['success' => false, 'message' => 'Action inconnue.']);
} catch (Throwable $exception) {
    error_log('Univers Gourmand public API error: ' . $exception->getMessage());
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
    }
    jsonOut(500, ['success' => false, 'message' => 'Service momentanément indisponible. Réessayez dans un instant.']);
}
