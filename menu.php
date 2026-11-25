<?php
declare(strict_types=1);
header('Cache-Control: no-cache');
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#0b7a42">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="Univers Gourmand">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <title>Menu — Univers Gourmand</title>
  <link rel="manifest" href="manifest-client.webmanifest">
  <link rel="icon" type="image/png" href="assets/icons/favicon-32.png">
  <link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="customer.css?v=<?= filemtime(__DIR__ . '/customer.css') ?>">
</head>
<body>
  <div id="app" class="app" aria-live="polite">
    <div class="splash"><img src="assets/images/logo.svg" alt="" width="64" height="64"><p>Chargement du menu…</p></div>
  </div>
  <div id="toast" class="toast" role="status"></div>
  <noscript><p style="padding:24px;font-family:sans-serif">Activez JavaScript pour consulter le menu et commander.</p></noscript>
  <script src="customer.js?v=<?= filemtime(__DIR__ . '/customer.js') ?>"></script>
</body>
</html>
