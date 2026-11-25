# Univers Gourmand — mise à jour

## Mise en ligne
1. Envoyez tout le contenu du dossier sur votre hébergement (remplace les anciens fichiers).
2. Les identifiants de la base sont maintenant dans `config.php`. **Changez le mot de passe MySQL** (il était en clair dans l'ancien `database.php`) puis mettez-le à jour dans `config.php`.
3. Aucune migration manuelle : la table `customer_orders` se crée toute seule à la première commande.
4. Ouvrez le tableau de bord → **Paramètres** : activez Orange Money / Wave / Moov Money et saisissez vos numéros marchands, puis enregistrez.
5. Ouvrez **QR codes** : imprimez le QR général ou les QR par table.

## Ce qui a été ajouté
- `menu.php` : page client (menu, commande, suivi, jeu d'attente, paiement).
- `public_api.php` / `orders_api.php` : échanges clients ↔ restaurant.
- PWA : `manifest.webmanifest`, `manifest-client.webmanifest`, `sw.js`, `assets/icons/`. Fonctionne uniquement en HTTPS.
- Thème vert/blanc, navigation mobile, `change_password.php` (le bouton « Modifier le mot de passe » est maintenant réel).

## Limites à connaître
- Paiement : le client envoie l'argent à votre numéro marchand puis touche « J'ai payé » ; vous confirmez dans *Commandes*. Un paiement entièrement automatique demande un compte marchand/API auprès de chaque opérateur.
- Notifications client : elles arrivent tant que la page est ouverte (même en arrière-plan sur Android). Une notification page fermée demande un service Web Push dédié.
