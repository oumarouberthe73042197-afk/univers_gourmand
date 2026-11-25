<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';
startAppSession();
$user = requireAuthorizedUser();

header('Cache-Control: no-store, private');
$userName = htmlspecialchars($user['name'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$csrf = htmlspecialchars(csrfToken(), ENT_QUOTES, 'UTF-8');

$initials = '';
foreach (array_slice(preg_split('/\s+/u', trim((string) $user['name'])) ?: [], 0, 2) as $part) {
    if ($part !== '' && preg_match('/^./us', $part, $first) === 1) {
        $initials .= function_exists('mb_strtoupper') ? mb_strtoupper($first[0], 'UTF-8') : strtoupper($first[0]);
    }
}
$initials = htmlspecialchars($initials !== '' ? $initials : 'UG', ENT_QUOTES, 'UTF-8');
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="csrf-token" content="<?= $csrf ?>">
  <meta name="theme-color" content="#0b7a42">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="UG Gestion">
  <title>Univers Gourmand — Gestion</title>
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="icon" type="image/png" href="assets/icons/favicon-32.png">
  <link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css?v=<?= filemtime(__DIR__ . '/styles.css') ?>" />
</head>
<body>
  <svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true" focusable="false">
    <symbol id="i-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></symbol>
    <symbol id="i-menu" viewBox="0 0 24 24"><path d="M7 3v8a2 2 0 0 0 2 2v8M11 3v8M7 7h4M17 21V3c-2.2 1.2-3 4-3 7v3h3"/></symbol>
    <symbol id="i-receipt" viewBox="0 0 24 24"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></symbol>
    <symbol id="i-table" viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="3" rx="1.2"/><path d="M6 12v7M18 12v7M3 9l1.5-4h15L21 9"/></symbol>
    <symbol id="i-box" viewBox="0 0 24 24"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/></symbol>
    <symbol id="i-chart" viewBox="0 0 24 24"><path d="M5 20v-8M12 20V5M19 20v-5M3 21h18"/></symbol>
    <symbol id="i-wallet" viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2z"/><circle cx="16.5" cy="14.5" r="1.2"/></symbol>
    <symbol id="i-qr" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h3M20 17v4"/></symbol>
    <symbol id="i-users" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></symbol>
    <symbol id="i-settings" viewBox="0 0 24 24"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></symbol>
    <symbol id="i-logout" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></symbol>
    <symbol id="i-bell" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10.3 21a1.9 1.9 0 0 0 3.4 0"/></symbol>
    <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
    <symbol id="i-burger" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></symbol>
    <symbol id="i-more" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/></symbol>
    <symbol id="i-edit" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></symbol>
    <symbol id="i-trash" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/></symbol>
    <symbol id="i-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></symbol>
    <symbol id="i-coins" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M14.8 9.2c-.5-.8-1.5-1.2-2.8-1.2-1.7 0-2.8.8-2.8 2 0 3 5.8 1.4 5.8 4.2 0 1.2-1.2 2-3 2-1.4 0-2.5-.5-3-1.4M12 6v2M12 16v2"/></symbol>
    <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></symbol>
    <symbol id="i-trend" viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8M15 7h6v6"/></symbol>
    <symbol id="i-down" viewBox="0 0 24 24"><path d="M3 7l6 6 4-4 8 8M15 17h6v-6"/></symbol>
    <symbol id="i-percent" viewBox="0 0 24 24"><path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.2"/><circle cx="17" cy="17" r="2.2"/></symbol>
    <symbol id="i-dot" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/></symbol>
    <symbol id="i-download" viewBox="0 0 24 24"><path d="M12 3v12M7 11l5 5 5-5M4 21h16"/></symbol>
    <symbol id="i-printer" viewBox="0 0 24 24"><path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/></symbol>
    <symbol id="i-link" viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></symbol>
  </svg>

  <div class="app-shell">
    <aside class="sidebar" id="sidebar">
      <div class="brand">
        <div class="brand-mark">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
            <circle cx="32" cy="32" r="30" fill="#ffffff"/>
            <circle cx="32" cy="32" r="27" fill="none" stroke="#0b7a42" stroke-width="1.6"/>
            <path d="M32 10c-1 7-5 11-12 12 1-7 5-11 12-12Zm0 0c1 7 5 11 12 12-1-7-5-11-12-12Z" fill="#0b7a42"/>
            <path d="M32 12v13" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
            <text x="32" y="49" fill="#0b7a42" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="700" letter-spacing="-1" text-anchor="middle">UG</text>
          </svg>
        </div>
        <div><strong>Univers Gourmand</strong><span>Gestion du restaurant</span></div>
      </div>

      <nav class="main-nav" aria-label="Navigation principale">
        <button class="nav-item active" data-view="dashboard"><svg class="ico"><use href="#i-grid"/></svg><span>Tableau de bord</span></button>
        <button class="nav-item" data-view="orders"><svg class="ico"><use href="#i-receipt"/></svg><span>Commandes</span><b id="ordersBadge" class="nav-badge">0</b></button>
        <button class="nav-item" data-view="menu"><svg class="ico"><use href="#i-menu"/></svg><span>Menu</span></button>
        <button class="nav-item" data-view="tables"><svg class="ico"><use href="#i-table"/></svg><span>Tables</span></button>
        <button class="nav-item" data-view="qr"><svg class="ico"><use href="#i-qr"/></svg><span>QR codes</span></button>
        <button class="nav-item" data-view="stock"><svg class="ico"><use href="#i-box"/></svg><span>Stock</span></button>
        <button class="nav-item" data-view="reports"><svg class="ico"><use href="#i-chart"/></svg><span>Rapports</span></button>
        <button class="nav-item" data-view="finances"><svg class="ico"><use href="#i-wallet"/></svg><span>Dépenses &amp; bénéfices</span></button>
      </nav>

      <div class="sidebar-bottom">
        <button class="nav-item" id="installApp" hidden><svg class="ico"><use href="#i-download"/></svg><span>Installer l’application</span></button>
        <?php if ($user['role'] === 'admin'): ?>
          <a class="nav-item admin-nav-item" href="users.php"><svg class="ico"><use href="#i-users"/></svg><span>Accès utilisateurs</span></a>
        <?php endif; ?>
        <button class="nav-item" data-view="settings"><svg class="ico"><use href="#i-settings"/></svg><span>Paramètres</span></button>
        <div class="profile">
          <div class="avatar"><?= $initials ?></div>
          <div><strong><?= $userName ?></strong><span><?= $user['role'] === 'admin' ? 'Administrateur' : 'Utilisateur autorisé' ?></span></div>
          <form class="logout-form" method="post" action="logout.php">
            <input type="hidden" name="csrf_token" value="<?= $csrf ?>">
            <button class="icon-button" type="submit" title="Déconnexion" aria-label="Déconnexion"><svg class="ico"><use href="#i-logout"/></svg></button>
          </form>
        </div>
      </div>
    </aside>

    <main class="main-content">
      <header class="topbar">
        <button class="mobile-menu" id="mobileMenu" aria-label="Ouvrir le menu"><svg class="ico"><use href="#i-burger"/></svg></button>
        <div class="page-heading">
          <p class="eyebrow" id="todayLabel">&nbsp;</p>
          <h1 id="pageTitle">Tableau de bord</h1>
        </div>
        <div class="top-actions">
          <button class="icon-button notification" id="notifyBtn" title="Alertes de nouvelles commandes" aria-label="Alertes de nouvelles commandes"><svg class="ico"><use href="#i-bell"/></svg><span id="alertDot" hidden></span></button>
          <button class="primary-button" id="headerAction"><svg class="ico"><use href="#i-plus"/></svg><span id="headerActionLabel">Nouvelle commande</span></button>
        </div>
      </header>

      <div id="viewContainer"></div>
    </main>
  </div>

  <nav class="bottom-nav" aria-label="Navigation rapide">
    <button data-view="dashboard" class="tab active"><svg class="ico"><use href="#i-grid"/></svg><span>Accueil</span></button>
    <button data-view="orders" class="tab"><svg class="ico"><use href="#i-receipt"/></svg><span>Commandes</span><b id="ordersBadgeMobile" class="tab-badge" hidden>0</b></button>
    <button data-view="menu" class="tab"><svg class="ico"><use href="#i-menu"/></svg><span>Menu</span></button>
    <button data-view="qr" class="tab"><svg class="ico"><use href="#i-qr"/></svg><span>QR</span></button>
    <button id="moreTab" class="tab" aria-label="Plus d’options"><svg class="ico"><use href="#i-more"/></svg><span>Plus</span></button>
  </nav>

  <div class="modal-backdrop" id="modalBackdrop" hidden>
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <header class="modal-header">
        <div><p class="eyebrow">Nouvel élément</p><h2 id="modalTitle">Nouvelle commande</h2></div>
        <button class="icon-button" id="closeModal" aria-label="Fermer"><svg class="ico"><use href="#i-x"/></svg></button>
      </header>
      <div id="modalBody"></div>
    </section>
  </div>

  <div class="toast" id="toast" role="status"></div>
  <script src="assets/qr.js?v=<?= filemtime(__DIR__ . '/assets/qr.js') ?>"></script>
  <script src="app.js?v=<?= filemtime(__DIR__ . '/app.js') ?>"></script>
</body>
</html>
