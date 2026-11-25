<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';
startAppSession();

header('Cache-Control: no-store, private');

$error = '';
$success = '';
$databaseReady = true;
$setupMode = false;
$registerMode = false;
$requestedAction = $_SERVER['REQUEST_METHOD'] === 'POST'
    && isset($_POST['action'])
    && is_string($_POST['action'])
    ? $_POST['action']
    : '';

try {
    $pdo = databaseConnection();
    $setupMode = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn() === 0;
    $pdo->query('SELECT email, role, is_authorized FROM users LIMIT 0');
} catch (PDOException $exception) {
    error_log('Univers Gourmand database error: ' . $exception->getMessage());
    $databaseReady = false;
}

if ($databaseReady && isAuthenticated()) {
    $user = currentAuthorizedUser();
    if ($user !== null) {
        header('Location: index.php');
        exit;
    }
}

$registerMode = !$setupMode && (
    $requestedAction === 'register'
    || ($_SERVER['REQUEST_METHOD'] !== 'POST' && ($_GET['register'] ?? '') === '1')
);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $registerMode = !$setupMode && $requestedAction === 'register';
    if (!validCsrfToken($_POST['csrf_token'] ?? null)) {
        http_response_code(403);
        $error = 'Votre session a expiré. Rechargez la page et réessayez.';
    } elseif (!$databaseReady) {
        $error = 'La base de données est indisponible. Vérifiez MySQL et la configuration de connexion.';
    } else {
        $identifier = isset($_POST['username']) && is_string($_POST['username'])
            ? trim($_POST['username'])
            : '';
        $email = isset($_POST['email']) && is_string($_POST['email'])
            ? strtolower(trim($_POST['email']))
            : '';
        $password = isset($_POST['password']) && is_string($_POST['password'])
            ? $_POST['password']
            : '';

        if ($setupMode) {
            $name = isset($_POST['name']) && is_string($_POST['name'])
                ? trim($_POST['name'])
                : '';
            $confirmation = isset($_POST['password_confirmation']) && is_string($_POST['password_confirmation'])
                ? $_POST['password_confirmation']
                : '';
            $passwordCharacters = [];
            $characterCount = preg_match_all('/./us', $password, $passwordCharacters);

            if ($name === '' || strlen($name) > 150) {
                $error = 'Saisissez un nom valide (150 caractères maximum).';
            } elseif (strlen($email) > 254 || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
                $error = 'Saisissez une adresse e-mail valide.';
            } elseif ($characterCount === false || $characterCount < 12 || strlen($password) > 72) {
                $error = 'Choisissez un mot de passe de 12 caractères minimum (72 octets maximum).';
            } elseif ($password !== $confirmation) {
                $error = 'Les deux mots de passe ne correspondent pas.';
            } else {
                $lockAcquired = false;

                try {
                    $lockAcquired = (int) $pdo
                        ->query("SELECT GET_LOCK('univers_gourmand_admin_setup', 5)")
                        ->fetchColumn() === 1;

                    if (!$lockAcquired) {
                        $error = 'Une autre initialisation est en cours. Réessayez dans quelques instants.';
                    } elseif ((int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn() > 0) {
                        $setupMode = false;
                        $error = 'Le compte administrateur existe déjà. Connectez-vous.';
                    } else {
                        $username = 'account_' . bin2hex(random_bytes(16));
                        $statement = $pdo->prepare(
                            'INSERT INTO users (name, username, email, password_hash, role, is_authorized)
                             VALUES (:name, :username, :email, :password_hash, \'admin\', TRUE)'
                        );
                        $statement->execute([
                            'name' => $name,
                            'username' => $username,
                            'email' => $email,
                            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
                        ]);
                        authenticateUser([
                            'id' => $pdo->lastInsertId(),
                            'name' => $name,
                        ]);
                        header('Location: index.php');
                        exit;
                    }
                } catch (PDOException $exception) {
                    error_log('Univers Gourmand account setup error: ' . $exception->getMessage());
                    $error = 'Le compte n’a pas pu être créé. Vérifiez que l’adresse n’est pas déjà utilisée et que la base est à jour.';
                } finally {
                    if ($lockAcquired) {
                        $pdo->query("SELECT RELEASE_LOCK('univers_gourmand_admin_setup')");
                    }
                }
            }
        } elseif ($registerMode) {
            $name = isset($_POST['name']) && is_string($_POST['name'])
                ? trim($_POST['name'])
                : '';
            $confirmation = isset($_POST['password_confirmation']) && is_string($_POST['password_confirmation'])
                ? $_POST['password_confirmation']
                : '';
            $passwordCharacters = [];
            $characterCount = preg_match_all('/./us', $password, $passwordCharacters);

            if ($name === '' || strlen($name) > 150) {
                $error = 'Saisissez un nom valide (150 caractères maximum).';
            } elseif (strlen($email) > 254 || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
                $error = 'Saisissez une adresse e-mail valide.';
            } elseif ($characterCount === false || $characterCount < 12 || strlen($password) > 72) {
                $error = 'Choisissez un mot de passe de 12 caractères minimum (72 octets maximum).';
            } elseif ($password !== $confirmation) {
                $error = 'Les deux mots de passe ne correspondent pas.';
            } else {
                try {
                    $statement = $pdo->prepare(
                        'SELECT id FROM users WHERE email = :email OR username = :username LIMIT 1'
                    );
                    $statement->execute(['email' => $email, 'username' => $email]);

                    if ($statement->fetch()) {
                        $error = 'Cette adresse e-mail est déjà utilisée.';
                    } else {
                        $statement = $pdo->prepare(
                            'INSERT INTO users (name, username, email, password_hash, role, is_authorized)
                             VALUES (:name, :username, :email, :password_hash, \'user\', FALSE)'
                        );
                        $statement->execute([
                            'name' => $name,
                            'username' => 'account_' . bin2hex(random_bytes(16)),
                            'email' => $email,
                            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
                        ]);
                        $success = 'Votre demande a été envoyée. L’administrateur doit autoriser votre compte avant que vous puissiez accéder au tableau de bord.';
                    }
                } catch (PDOException $exception) {
                    error_log('Univers Gourmand account registration error: ' . $exception->getMessage());
                    $error = 'Le compte n’a pas pu être créé. Vérifiez que l’adresse n’est pas déjà utilisée et que la base est à jour.';
                }
            }
        } else {
            $statement = $pdo->prepare(
                'SELECT id, name, password_hash, is_authorized FROM users WHERE email = :email LIMIT 1'
            );
            $statement->execute(['email' => strtolower($identifier)]);
            $user = $statement->fetch();
            if (!$user) {
                $statement = $pdo->prepare(
                    'SELECT id, name, password_hash, is_authorized FROM users WHERE username = :username LIMIT 1'
                );
                $statement->execute(['username' => $identifier]);
                $user = $statement->fetch();
            }

            if ($user && password_verify($password, $user['password_hash'])) {
                if (!(bool) $user['is_authorized']) {
                    $error = 'Votre compte est en attente d’autorisation par l’administrateur.';
                } else {
                    authenticateUser($user);
                    header('Location: index.php');
                    exit;
                }
            } else {
                $error = 'Identifiant ou mot de passe incorrect.';
            }
        }
    }
}

$csrf = htmlspecialchars(csrfToken(), ENT_QUOTES, 'UTF-8');
$title = $setupMode
    ? 'Créer le compte administrateur'
    : ($registerMode ? 'Créer un compte' : 'Connexion');
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?> — Univers Gourmand</title>
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
  <main class="auth-panel">
    <div class="auth-brand">
      <div class="brand-mark">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
          <circle cx="32" cy="32" r="30" fill="#0b7a42"/><circle cx="32" cy="32" r="27" fill="none" stroke="#ffffff" stroke-width="1.6"/>
          <path d="M32 11c-1 7-5 11-12 12 1-7 5-11 12-12Zm0 0c1 7 5 11 12 12-1-7-5-11-12-12Z" fill="#ffffff"/>
          <path d="M32 13v13" fill="none" stroke="#0b7a42" stroke-width="1.4" stroke-linecap="round"/>
          <text x="32" y="49" fill="#ffffff" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="700" letter-spacing="-2" text-anchor="middle">UG</text>
        </svg>
      </div>
      <div><strong>Univers Gourmand</strong><span>Gestion du restaurant</span></div>
    </div>
    <p class="eyebrow">Espace sécurisé</p>
    <h1><?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?></h1>
    <p class="auth-description"><?= $setupMode
      ? 'Configurez votre compte pour protéger l’accès à votre espace de gestion.'
      : ($registerMode
        ? 'Créez une demande d’accès avec votre adresse e-mail. L’administrateur devra autoriser votre compte.'
        : 'Connectez-vous avec votre identifiant ou adresse e-mail et votre mot de passe.') ?></p>

    <?php if (!$databaseReady): ?>
      <div class="auth-notice error" role="alert">La base de données ou son schéma est indisponible. Vérifiez la connexion MySQL et appliquez les migrations nécessaires.</div>
    <?php endif; ?>
    <?php if ($success !== ''): ?>
      <div class="auth-notice success" role="status"><?= htmlspecialchars($success, ENT_QUOTES, 'UTF-8') ?></div>
    <?php endif; ?>
    <?php if ($error !== ''): ?>
      <div class="auth-notice error" role="alert"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
    <?php endif; ?>

    <?php if ($databaseReady): ?>
      <form class="auth-form" method="post" action="login.php">
        <input type="hidden" name="csrf_token" value="<?= $csrf ?>">
        <input type="hidden" name="action" value="<?= $registerMode ? 'register' : 'login' ?>">
        <?php if ($setupMode || $registerMode): ?>
          <label>Nom complet
            <input name="name" type="text" autocomplete="name" maxlength="150" required value="<?= htmlspecialchars(isset($_POST['name']) && is_string($_POST['name']) ? $_POST['name'] : '', ENT_QUOTES, 'UTF-8') ?>">
          </label>
        <?php endif; ?>
        <?php if ($setupMode || $registerMode): ?>
          <label>Adresse e-mail
            <input name="email" type="email" autocomplete="email" maxlength="254" required value="<?= htmlspecialchars(isset($_POST['email']) && is_string($_POST['email']) ? $_POST['email'] : '', ENT_QUOTES, 'UTF-8') ?>">
          </label>
        <?php else: ?>
          <label>Identifiant ou adresse e-mail
            <input name="username" type="text" autocomplete="username" maxlength="254" required value="<?= htmlspecialchars(isset($_POST['username']) && is_string($_POST['username']) ? $_POST['username'] : '', ENT_QUOTES, 'UTF-8') ?>">
          </label>
        <?php endif; ?>
        <label>Mot de passe
          <input name="password" type="password" autocomplete="<?= $setupMode || $registerMode ? 'new-password' : 'current-password' ?>" minlength="<?= $setupMode || $registerMode ? '12' : '1' ?>" maxlength="72" required>
        </label>
        <?php if ($setupMode || $registerMode): ?>
          <label>Confirmer le mot de passe
            <input name="password_confirmation" type="password" autocomplete="new-password" minlength="12" maxlength="72" required>
          </label>
        <?php endif; ?>
        <button class="primary-button auth-submit" type="submit"><?= $setupMode || $registerMode ? 'Créer le compte' : 'Se connecter' ?></button>
      </form>
    <?php endif; ?>

    <?php if (!$setupMode && $databaseReady): ?>
      <p class="auth-footnote"><a href="<?= $registerMode ? 'login.php' : 'login.php?register=1' ?>"><?= $registerMode ? 'Déjà un compte ? Se connecter' : 'Demander un accès' ?></a></p>
    <?php else: ?>
      <p class="auth-footnote">La création du compte administrateur est disponible lors de la première configuration.</p>
    <?php endif; ?>
  </main>
</body>
</html>
