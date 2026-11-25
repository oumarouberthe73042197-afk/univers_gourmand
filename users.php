<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';
startAppSession();
requireAdminUser();
header('Cache-Control: no-store, private');

$message = '';
$messageType = 'success';
$csrf = csrfToken();
$pdo = databaseConnection();
$method = $_SERVER['REQUEST_METHOD'] ?? '';

if ($method !== 'GET' && $method !== 'POST') {
    header('Allow: GET, POST');
    http_response_code(405);
    exit('Méthode non autorisée.');
}

if ($method === 'POST') {
    if (!validCsrfToken($_POST['csrf_token'] ?? null)) {
        http_response_code(403);
        $message = 'Votre session a expiré. Rechargez la page et réessayez.';
        $messageType = 'error';
    } else {
        $userId = filter_var($_POST['user_id'] ?? null, FILTER_VALIDATE_INT);
        $action = $_POST['action'] ?? '';
        if ($userId === false || $userId === null || !in_array($action, ['authorize', 'revoke'], true)) {
            http_response_code(400);
            $message = 'La demande est invalide.';
            $messageType = 'error';
        } else {
            $statement = $pdo->prepare('SELECT id FROM users WHERE id = :id AND role = \'user\' LIMIT 1');
            $statement->execute(['id' => $userId]);
            if (!$statement->fetch()) {
                http_response_code(404);
                $message = 'Cet utilisateur est introuvable.';
                $messageType = 'error';
            } else {
                $authorized = $action === 'authorize';
                $statement = $pdo->prepare(
                    'UPDATE users SET is_authorized = :is_authorized WHERE id = :id AND role = \'user\''
                );
                $statement->execute(['is_authorized' => $authorized ? 1 : 0, 'id' => $userId]);
                $message = $authorized
                    ? 'L’accès de cet utilisateur a été autorisé.'
                    : 'L’accès de cet utilisateur a été retiré.';
            }
        }
    }
}

$users = $pdo->query(
    'SELECT id, name, email, role, is_authorized, created_at FROM users ORDER BY role, name'
)->fetchAll();
$escape = static function ($value): string {
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
};
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accès utilisateurs — Univers Gourmand</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <meta name="theme-color" content="#0b7a42">
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="icon" type="image/png" href="assets/icons/favicon-32.png">
  <link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png">
  <link rel="stylesheet" href="styles.css?v=<?= filemtime(__DIR__ . '/styles.css') ?>">
</head>
<body class="auth-page">
  <main class="auth-panel user-management">
    <p class="eyebrow">Administration</p>
    <h1>Accès utilisateurs</h1>
    <p class="auth-description">Seuls les comptes autorisés peuvent ouvrir le tableau de bord. Vous pouvez accorder ou retirer l’accès ici.</p>
    <?php if ($message !== ''): ?>
      <div class="auth-notice <?= $messageType ?>" role="<?= $messageType === 'error' ? 'alert' : 'status' ?>"><?= $escape($message) ?></div>
    <?php endif; ?>
    <div class="user-list">
      <?php foreach ($users as $user): ?>
        <section class="user-row">
          <div>
            <strong><?= $escape($user['name']) ?></strong>
            <span><?= $escape($user['email'] ?? '') ?></span>
            <small><?= $user['role'] === 'admin' ? 'Administrateur' : ((bool) $user['is_authorized'] ? 'Accès autorisé' : 'En attente') ?></small>
          </div>
          <?php if ($user['role'] !== 'admin'): ?>
            <form method="post" action="users.php">
              <input type="hidden" name="csrf_token" value="<?= $escape($csrf) ?>">
              <input type="hidden" name="user_id" value="<?= (int) $user['id'] ?>">
              <?php if ((bool) $user['is_authorized']): ?>
                <input type="hidden" name="action" value="revoke">
                <button class="danger-button" type="submit">Retirer l’accès</button>
              <?php else: ?>
                <input type="hidden" name="action" value="authorize">
                <button class="primary-button" type="submit">Autoriser</button>
              <?php endif; ?>
            </form>
          <?php endif; ?>
        </section>
      <?php endforeach; ?>
    </div>
    <p class="auth-footnote"><a href="index.php">Retour au tableau de bord</a></p>
  </main>
</body>
</html>
