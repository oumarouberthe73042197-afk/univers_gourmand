/* Univers Gourmand — page client : menu, commande, suivi, jeu d'attente, paiement mobile money */
(function () {
  'use strict';

  const API = 'public_api.php';
  const CATEGORY_ORDER = ['Entrées', 'Plats principaux', 'Accompagnements', 'Boissons', 'Desserts'];
  const PROVIDERS = {
    orange: { label: 'Orange Money', color: '#ff7900', how: 'Ouvrez Orange Money, choisissez « Transfert d’argent » puis saisissez le numéro ci-dessous.' },
    wave: { label: 'Wave', color: '#1dc8ff', how: 'Ouvrez Wave, choisissez « Envoyer » puis saisissez le numéro ci-dessous.' },
    moov: { label: 'Moov Money', color: '#0069b4', how: 'Ouvrez Moov Money, choisissez « Transfert d’argent » puis saisissez le numéro ci-dessous.' }
  };
  const ICON_DISH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3v8a2 2 0 0 0 2 2v8M11 3v8M7 7h4M17 21V3c-2.2 1.2-3 4-3 7v3h3"/></svg>';
  const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  const params = new URLSearchParams(location.search);

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* stockage indisponible */ } },
    remove(key) { try { localStorage.removeItem(key); } catch (e) { /* stockage indisponible */ } }
  };

  let data = null;
  let cart = new Map();
  let tableNo = parseInt(params.get('t'), 10) || 0;
  let category = 'all';
  let session = readSession();
  let order = null;
  let sheet = null;          // null | 'cart' | 'pay'
  let payMethod = null;
  let pollTimer = null;
  let installEvent = null;
  let game = null;
  let audio = null;
  let sheetDismissed = false;
  let busy = false;
  let customerName = '';

  /* ---------- utilitaires ---------- */
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = value => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value).replace(/\u202f/g, '\u00a0') + '\u00a0' + ((data && data.currency) || 'FCFA');

  function readSession() {
    try {
      const raw = JSON.parse(store.get('ug_order') || 'null');
      return raw && raw.id && typeof raw.token === 'string' ? raw : null;
    } catch (e) { return null; }
  }

  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  async function api(action, options) {
    const opts = options || {};
    const init = { method: opts.body ? 'POST' : 'GET', headers: { Accept: 'application/json' }, credentials: 'same-origin' };
    if (opts.body) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(opts.body);
    }
    let response;
    try {
      response = await fetch(API + '?a=' + action + (opts.query || ''), init);
    } catch (e) {
      const error = new Error('Connexion impossible. Vérifiez votre réseau.');
      error.offline = true;
      throw error;
    }
    let result = null;
    try { result = await response.json(); } catch (e) { /* réponse illisible */ }
    if (!response.ok || !result || result.success !== true) {
      const error = new Error((result && result.message) || 'Une erreur est survenue.');
      error.status = response.status;
      throw error;
    }
    return result;
  }

  /* ---------- son, vibration, notification ---------- */
  function unlockAudio() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
    } catch (e) { audio = null; }
  }

  function beep() {
    if (!audio) return;
    try {
      [880, 1175].forEach((frequency, index) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        const start = audio.currentTime + index * 0.18;
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
        osc.connect(gain).connect(audio.destination);
        osc.start(start);
        osc.stop(start + 0.18);
      });
    } catch (e) { /* son indisponible */ }
  }

  function askNotificationPermission() {
    try {
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    } catch (e) { /* non pris en charge */ }
  }

  function notify(title, body) {
    try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) { /* ignoré */ }
    beep();
    toast(title);
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const options = { body, icon: 'assets/icons/icon-192.png', badge: 'assets/icons/icon-192.png', tag: 'ug-order', renotify: true, data: { url: location.href } };
    const direct = () => { try { new Notification(title, options); } catch (e) { /* ignoré */ } };
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(reg => reg.showNotification(title, options)).catch(direct);
    } else {
      direct();
    }
  }

  /* ---------- données du menu ---------- */
  function groupedDishes() {
    const groups = new Map();
    data.dishes.forEach(dish => {
      if (category !== 'all' && dish.category !== category) return;
      if (!groups.has(dish.category)) groups.set(dish.category, []);
      groups.get(dish.category).push(dish);
    });
    return [...groups.entries()].sort((a, b) => rank(a[0]) - rank(b[0]));
  }
  function rank(name) { const i = CATEGORY_ORDER.indexOf(name); return i === -1 ? 99 : i; }
  function categories() {
    return [...new Set(data.dishes.map(dish => dish.category))].sort((a, b) => rank(a) - rank(b));
  }
  function cartCount() { let n = 0; cart.forEach(q => { n += q; }); return n; }
  function cartTotal() {
    let total = 0;
    cart.forEach((qty, id) => { const dish = data.dishes.find(d => d.id === id); if (dish) total += dish.price * qty; });
    return total;
  }
  function setQty(id, delta) {
    const next = Math.max(0, Math.min(20, (cart.get(id) || 0) + delta));
    if (next === 0) cart.delete(id); else cart.set(id, next);
    renderMenuBody();
    renderCartBar();
    if (sheet === 'cart') renderSheet();
  }

  /* ---------- écran : menu ---------- */
  function renderShell() {
    const r = data.restaurant;
    const hours = r.open && r.close ? 'Ouvert de ' + esc(r.open) + ' à ' + esc(r.close) : esc(r.address || '');
    document.title = 'Menu — ' + r.name;
    const hasOrder = !!session;
    app.innerHTML =
      '<header class="topbar"><img class="logo" src="assets/images/logo.svg" alt="">' +
      '<div class="who"><strong>' + esc(r.name) + '</strong><span>' + hours + '</span></div>' +
      (hasOrder
        ? '<button class="chip" id="toTrack" type="button">Ma commande</button>'
        : '<button class="chip" id="tableChip" type="button">' + (tableNo ? 'Table ' + tableNo : 'Choisir ma table') + '</button>') +
      '</header>' +
      '<div id="installSlot"></div>' +
      '<nav class="cats" id="cats" role="tablist" aria-label="Catégories"></nav>' +
      '<main class="menu" id="menuBody"></main>' +
      '<div class="foot">' + (r.phone ? esc(r.phone) + ' · ' : '') + 'Les prix sont en ' + esc(data.currency) + '</div>' +
      '<div class="cartbar" id="cartBar" hidden></div>' +
      '<div id="sheetRoot"></div>';
    renderCats();
    renderMenuBody();
    renderCartBar();
    renderInstall();
    const chip = document.getElementById('tableChip');
    if (chip) chip.onclick = () => openSheet('cart');
    const track = document.getElementById('toTrack');
    if (track) track.onclick = showTracking;
  }

  function renderCats() {
    const list = categories();
    const el = document.getElementById('cats');
    el.hidden = list.length < 2;
    el.innerHTML = ['all'].concat(list).map(name =>
      '<button class="cat" role="tab" type="button" data-cat="' + esc(name) + '" aria-selected="' + (name === category) + '">' + (name === 'all' ? 'Tout le menu' : esc(name)) + '</button>').join('');
    el.onclick = event => {
      const button = event.target.closest('[data-cat]');
      if (!button) return;
      category = button.dataset.cat;
      renderCats();
      renderMenuBody();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  }

  function renderMenuBody() {
    const body = document.getElementById('menuBody');
    if (!body) return;
    const groups = groupedDishes();
    if (!groups.length) {
      body.innerHTML = '<div class="empty"><strong>Le menu est en cours de mise à jour</strong>Revenez dans quelques instants ou demandez au serveur.</div>';
      return;
    }
    body.innerHTML = groups.map(([name, dishes]) =>
      '<section aria-label="' + esc(name) + '"><h2>' + esc(name) + '</h2><div class="count">' + dishes.length + ' plat' + (dishes.length > 1 ? 's' : '') + '</div>' +
      dishes.map(dish => {
        const qty = cart.get(dish.id) || 0;
        return '<article class="dish"><div class="photo">' + (dish.img ? '<img src="' + esc(dish.img) + '" alt="" loading="lazy">' : ICON_DISH) + '</div>' +
          '<div><h3>' + esc(dish.name) + '</h3><div class="row"><span class="price">' + money(dish.price) + '</span>' +
          (qty
            ? '<span class="stepper"><button type="button" data-dec="' + dish.id + '" aria-label="Retirer un ' + esc(dish.name) + '">−</button><b>' + qty + '</b><button type="button" data-inc="' + dish.id + '" aria-label="Ajouter un ' + esc(dish.name) + '">+</button></span>'
            : '<button class="add" type="button" data-inc="' + dish.id + '">Ajouter</button>') +
          '</div></div></article>';
      }).join('') + '</section>').join('');
    body.onclick = event => {
      const inc = event.target.closest('[data-inc]');
      const dec = event.target.closest('[data-dec]');
      if (inc) setQty(Number(inc.dataset.inc), 1);
      else if (dec) setQty(Number(dec.dataset.dec), -1);
    };
  }

  function renderCartBar() {
    const bar = document.getElementById('cartBar');
    if (!bar) return;
    const count = cartCount();
    bar.hidden = count === 0 || !!session;
    if (bar.hidden) return;
    bar.innerHTML = '<button class="btn" type="button" id="openCart"><span>Voir ma commande <small>(' + count + ' article' + (count > 1 ? 's' : '') + ')</small></span><span>' + money(cartTotal()) + '</span></button>';
    document.getElementById('openCart').onclick = () => openSheet('cart');
  }

  /* ---------- feuilles : panier et paiement ---------- */
  function openSheet(name) { sheet = name; renderSheet(true); }
  function closeSheet() { sheet = null; payMethod = null; renderSheet(); }

  function renderSheet(animate) {
    const root = document.getElementById('sheetRoot');
    if (!root) return;
    if (!sheet) { root.innerHTML = ''; return; }
    root.innerHTML = '<div class="backdrop" id="backdrop"><section class="sheet' + (animate ? ' enter' : '') + '" role="dialog" aria-modal="true" aria-labelledby="sheetTitle">' +
      (sheet === 'cart' ? cartSheetHtml() : paySheetHtml()) + '</section></div>';
    const backdrop = document.getElementById('backdrop');
    backdrop.onclick = event => { if (event.target === backdrop) { sheetDismissed = true; closeSheet(); } };
    const close = document.getElementById('closeSheet');
    if (close) close.onclick = () => { sheetDismissed = true; closeSheet(); };
    if (sheet === 'cart') bindCartSheet(); else bindPaySheet();
  }

  function cartSheetHtml() {
    const lines = [...cart.entries()].map(([id, qty]) => {
      const dish = data.dishes.find(d => d.id === id);
      if (!dish) return '';
      return '<div class="line"><div class="name">' + esc(dish.name) + '<span>' + money(dish.price) + '</span></div>' +
        '<span class="stepper"><button type="button" data-dec="' + id + '" aria-label="Retirer">−</button><b>' + qty + '</b><button type="button" data-inc="' + id + '" aria-label="Ajouter">+</button></span></div>';
    }).join('');
    const tableOptions = '<option value="">Choisir…</option>' + data.tables.map(t => '<option value="' + t + '"' + (t === tableNo ? ' selected' : '') + '>Table ' + t + '</option>').join('');
    return '<div class="sheet-head"><h2 id="sheetTitle">Votre commande</h2><button class="close" id="closeSheet" type="button" aria-label="Fermer">×</button></div>' +
      (lines || '<div class="empty"><strong>Votre panier est vide</strong>Ajoutez des plats depuis le menu.</div>') +
      '<label class="field">Votre table<select id="tableSelect">' + tableOptions + '</select></label>' +
      '<label class="field">Votre prénom (facultatif)<input id="customerName" type="text" maxlength="60" autocomplete="given-name" placeholder="Pour que nous vous appelions" value="' + esc(customerName) + '"></label>' +
      '<div class="total"><span>Total</span><b>' + money(cartTotal()) + '</b></div>' +
      '<div id="sheetError"></div>' +
      '<button class="btn center" id="sendOrder" type="button"' + (cart.size ? '' : ' disabled') + '>Envoyer la commande</button>' +
      '<p class="hint">Vous êtes prévenu ici dès que votre commande est prête. Vous pouvez alors payer par Orange Money, Wave ou Moov Money.</p>';
  }

  function bindCartSheet() {
    const sheetEl = document.querySelector('.sheet');
    sheetEl.onclick = event => {
      const inc = event.target.closest('[data-inc]');
      const dec = event.target.closest('[data-dec]');
      if (inc) setQty(Number(inc.dataset.inc), 1);
      else if (dec) setQty(Number(dec.dataset.dec), -1);
    };
    const select = document.getElementById('tableSelect');
    select.onchange = () => { tableNo = parseInt(select.value, 10) || 0; };
    document.getElementById('customerName').oninput = event => { customerName = event.target.value; };
    const send = document.getElementById('sendOrder');
    if (send) send.onclick = submitOrder;
  }

  async function submitOrder() {
    if (busy) return;
    const errorBox = document.getElementById('sheetError');
    const select = document.getElementById('tableSelect');
    tableNo = parseInt(select.value, 10) || 0;
    if (!tableNo) {
      errorBox.innerHTML = '<div class="error" role="alert">Choisissez votre numéro de table.</div>';
      return;
    }
    busy = true;
    unlockAudio();
    askNotificationPermission();
    const button = document.getElementById('sendOrder');
    button.disabled = true;
    button.textContent = 'Envoi en cours…';
    try {
      const result = await api('order', {
        body: {
          table: tableNo,
          name: document.getElementById('customerName').value,
          items: [...cart.entries()].map(([id, qty]) => ({ id, qty }))
        }
      });
      session = { id: result.id, token: result.token };
      store.set('ug_order', JSON.stringify(session));
      cart = new Map();
      order = null;
      sheet = null;
      sheetDismissed = false;
      showTracking();
    } catch (error) {
      errorBox.innerHTML = '<div class="error" role="alert">' + esc(error.message) + '</div>';
      button.disabled = false;
      button.textContent = 'Envoyer la commande';
    } finally {
      busy = false;
    }
  }

  /* ---------- écran : suivi de commande ---------- */
  function stageOf(o) {
    if (!o) return 0;
    if (o.status === 'paye' || o.paymentStatus === 'confirmed') return 3;
    if (o.status === 'pret' || o.status === 'servi') return 2;
    return 1;
  }

  function showTracking() {
    document.title = 'Ma commande — ' + data.restaurant.name;
    const r = data.restaurant;
    app.innerHTML =
      '<header class="topbar"><img class="logo" src="assets/images/logo.svg" alt="">' +
      '<div class="who"><strong>' + esc(r.name) + '</strong><span id="orderNo">Commande en cours</span></div>' +
      '<button class="chip" id="toMenu" type="button">Menu</button></header>' +
      '<section id="statusCard"></section><div id="recap"></div><section class="game" id="gameBox" aria-label="Jeu d’attente"></section>' +
      '<div id="installSlot"></div><div id="sheetRoot"></div>';
    document.getElementById('toMenu').onclick = () => { stopPolling(); game = null; renderShell(); };
    game = createGame(document.getElementById('gameBox'));
    renderInstall();
    renderStatus();
    poll();
    startPolling();
  }

  function renderStatus() {
    const card = document.getElementById('statusCard');
    if (!card) return;
    const stage = stageOf(order);
    const paid = stage === 3;
    const ready = stage === 2;
    const declared = order && order.paymentStatus === 'declared';
    let title = 'Commande envoyée';
    let text = 'Nous la transmettons à la cuisine…';
    if (order) {
      if (paid) { title = 'Paiement confirmé'; text = 'Merci pour votre visite et bon appétit !'; }
      else if (declared) { title = 'Paiement en cours de vérification'; text = 'Nous confirmons la réception de votre paiement.'; }
      else if (ready) { title = 'Votre commande est prête'; text = 'Vous pouvez régler maintenant par mobile money.'; }
      else { title = 'Votre commande est en préparation'; text = 'Nous vous prévenons ici dès qu’elle est prête.'; }
    }
    const labels = ['Reçue', 'En préparation', 'Prête', 'Payée'];
    card.innerHTML = '<div class="status-card ' + (ready && !declared ? 'ready' : paid ? 'done' : '') + '"><h1>' + esc(title) + '</h1><p>' + esc(text) + '</p>' +
      '<ol class="steps" aria-label="Avancement">' + labels.map((label, i) => '<li class="' + (i <= stage ? 'on' : '') + (i === stage && !paid ? ' now' : '') + '">' + label + '</li>').join('') + '</ol>' +
      (ready && !declared ? '<button class="btn center" id="payNow" type="button">Payer ' + money(order.total) + '</button>' : '') +
      (paid ? '<button class="btn center" id="newOrder" type="button">Faire une nouvelle commande</button>' : '') + '</div>';
    const payNow = document.getElementById('payNow');
    if (payNow) payNow.onclick = () => { sheetDismissed = false; openSheet('pay'); };
    const again = document.getElementById('newOrder');
    if (again) again.onclick = resetOrder;

    const recap = document.getElementById('recap');
    if (recap && order) {
      document.getElementById('orderNo').textContent = 'Commande n° ' + order.id + ' · Table ' + order.table;
      recap.innerHTML = '<div class="recap"><div><span>Total</span><b>' + money(order.total) + '</b></div><p>' + esc(order.items) + '</p></div>';
    }
  }

  function resetOrder() {
    stopPolling();
    store.remove('ug_order');
    session = null; order = null; sheet = null; payMethod = null; game = null;
    renderShell();
  }

  /* ---------- interrogation régulière du serveur ---------- */
  function startPolling() { stopPolling(); pollTimer = setInterval(poll, 4000); }
  function stopPolling() { if (pollTimer) clearInterval(pollTimer); pollTimer = null; }

  async function poll() {
    if (!session || document.hidden) return;
    try {
      const next = await api('status', { query: '&id=' + encodeURIComponent(session.id) + '&token=' + encodeURIComponent(session.token) });
      handleStatus(next);
    } catch (error) {
      if (error.status === 404) { resetOrder(); toast('Cette commande n’existe plus.'); }
    }
  }

  function handleStatus(next) {
    const before = order;
    const wasStage = stageOf(before);
    const nowStage = stageOf(next);
    order = next;
    renderStatus();
    if (before && nowStage === 2 && wasStage < 2) {
      notify('Votre commande est prête', 'Payez ' + money(next.total) + ' par Orange Money, Wave ou Moov Money.');
    }
    if (before && nowStage === 3 && wasStage < 3) {
      notify('Paiement confirmé', 'Merci ! Bon appétit.');
    }
    if (nowStage === 3) { stopPolling(); if (sheet === 'pay') closeSheet(); return; }
    const changed = !before || before.status !== next.status || before.paymentStatus !== next.paymentStatus;
    if (nowStage === 2 && next.paymentStatus === 'none' && !sheetDismissed && sheet === null) openSheet('pay');
    else if (sheet === 'pay' && changed) renderSheet();
  }

  document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });

  /* ---------- paiement ---------- */
  function enabledProviders() {
    const config = (order && order.payments) || {};
    return Object.keys(PROVIDERS).filter(key => config[key] && config[key].enabled);
  }

  function paySheetHtml() {
    const head = '<div class="sheet-head"><h2 id="sheetTitle">Paiement</h2><button class="close" id="closeSheet" type="button" aria-label="Fermer">×</button></div>';
    if (!order) return head + '<div class="waiting"><div class="spinner"></div></div>';
    const amount = '<div class="amount"><span>À payer</span><b>' + money(order.total) + '</b></div>';
    if (order.paymentStatus === 'declared') {
      return head + '<div class="waiting"><div class="spinner" aria-hidden="true"></div><strong>Vérification en cours</strong><p>Nous confirmons la réception de votre paiement. Cette page se met à jour automatiquement.</p></div>';
    }
    if (order.paymentStatus === 'confirmed' || order.status === 'paye') {
      return head + '<div class="waiting"><div class="checkmark">' + ICON_CHECK + '</div><strong>Paiement confirmé</strong><p>Merci et bon appétit !</p></div>';
    }
    const providers = enabledProviders();
    if (!providers.length) {
      return head + amount + '<p class="hint">Le paiement mobile n’est pas activé pour le moment. Réglez directement auprès d’un serveur.</p>';
    }
    if (payMethod && providers.indexOf(payMethod) !== -1) {
      const info = PROVIDERS[payMethod];
      const config = order.payments[payMethod];
      return head + amount +
        '<ol class="steps-list"><li>' + esc(info.how) + '</li><li>Envoyez exactement <b>' + money(order.total) + '</b>.</li><li>Revenez ici et touchez « J’ai payé ».</li></ol>' +
        (config.number ? '<div class="copyrow"><b>' + esc(config.number) + '</b><button type="button" id="copyNumber">Copier</button></div>' : '') +
        '<p class="hint" style="margin-top:6px">Référence à indiquer si demandée : <b>UG-' + order.id + '</b></p>' +
        (config.link ? '<a class="btn center ghost" style="margin-top:14px;text-decoration:none" href="' + esc(config.link) + '" target="_blank" rel="noopener">Ouvrir ' + esc(info.label) + '</a>' : '') +
        '<label class="field">Numéro de transaction (facultatif)<input id="txRef" type="text" maxlength="40" autocomplete="off" placeholder="Reçu par SMS"></label>' +
        '<div id="sheetError"></div>' +
        '<button class="btn center" id="declare" type="button" style="margin-top:16px">J’ai payé</button>' +
        '<button class="btn center ghost" id="backMethods" type="button" style="margin-top:10px;box-shadow:none">Changer de moyen de paiement</button>';
    }
    return head + amount + '<p style="margin-bottom:10px;font-weight:600">Choisissez votre moyen de paiement</p><div class="methods">' +
      providers.map(key => '<button class="method" type="button" data-method="' + key + '"><i style="background:' + PROVIDERS[key].color + '"></i>' + PROVIDERS[key].label + '<small>Choisir</small></button>').join('') + '</div>';
  }

  function bindPaySheet() {
    const root = document.getElementById('sheetRoot');
    root.querySelectorAll('[data-method]').forEach(button => {
      button.onclick = () => { payMethod = button.dataset.method; renderSheet(); };
    });
    const back = document.getElementById('backMethods');
    if (back) back.onclick = () => { payMethod = null; renderSheet(); };
    const copy = document.getElementById('copyNumber');
    if (copy) copy.onclick = () => {
      const number = order.payments[payMethod].number;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(number).then(() => toast('Numéro copié'), () => toast(number));
      } else { toast(number); }
    };
    const declare = document.getElementById('declare');
    if (declare) declare.onclick = async () => {
      declare.disabled = true;
      declare.textContent = 'Envoi…';
      try {
        await api('pay', { body: { id: session.id, token: session.token, method: payMethod, reference: document.getElementById('txRef').value } });
        order.paymentStatus = 'declared';
        order.paymentMethod = payMethod;
        renderStatus();
        renderSheet();
      } catch (error) {
        document.getElementById('sheetError').innerHTML = '<div class="error" role="alert">' + esc(error.message) + '</div>';
        declare.disabled = false;
        declare.textContent = 'J’ai payé';
      }
    };
  }

  /* ---------- jeu d'attente : mémoire des plats ---------- */
  function createGame(el) {
    const FACES = ['🍔', '🍕', '🍗', '🥗', '🍰', '🍹'];
    let deck = [];
    let first = null;
    let locked = false;
    let moves = 0;
    let matched = 0;
    let startedAt = 0;
    let timer = null;

    function shuffle(list) {
      const a = list.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    }
    function best() { return parseInt(store.get('ug_best_moves'), 10) || 0; }

    function start() {
      clearInterval(timer);
      deck = shuffle(FACES.concat(FACES));
      first = null; locked = false; moves = 0; matched = 0; startedAt = 0;
      const record = best();
      el.innerHTML =
        '<div class="game-head"><div><h2>Pendant que vous patientez</h2><p>Retrouvez les six paires de plats' + (record ? ' · record : ' + record + ' coups' : '') + '.</p></div>' +
        '<div class="game-stats"><span id="gMoves">0 coup</span><span id="gTime">0 s</span></div></div>' +
        '<div class="board">' + deck.map((face, i) => '<button class="card" type="button" data-i="' + i + '" aria-label="Carte ' + (i + 1) + '"><span class="face back"></span><span class="face front" aria-hidden="true">' + face + '</span></button>').join('') + '</div>' +
        '<div id="gWin"></div>';
      el.querySelector('.board').onclick = event => {
        const card = event.target.closest('.card');
        if (card) flip(card);
      };
    }

    function tick() {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      const t = el.querySelector('#gTime');
      if (t) t.textContent = seconds + ' s';
    }

    function flip(card) {
      if (locked || card.classList.contains('open') || card.classList.contains('matched')) return;
      if (!startedAt) { startedAt = Date.now(); timer = setInterval(tick, 1000); }
      card.classList.add('open');
      if (!first) { first = card; return; }
      moves++;
      el.querySelector('#gMoves').textContent = moves + (moves > 1 ? ' coups' : ' coup');
      const a = first;
      first = null;
      if (deck[a.dataset.i] === deck[card.dataset.i]) {
        a.classList.add('matched'); card.classList.add('matched');
        matched++;
        if (matched === FACES.length) win();
      } else {
        locked = true;
        setTimeout(() => { a.classList.remove('open'); card.classList.remove('open'); locked = false; }, 800);
      }
    }

    function win() {
      clearInterval(timer);
      const seconds = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
      const record = best();
      const isRecord = !record || moves < record;
      if (isRecord) store.set('ug_best_moves', String(moves));
      el.querySelector('#gWin').innerHTML = '<div class="game-win"><strong>Bravo !</strong><p>' + moves + ' coups en ' + seconds + ' s' + (isRecord ? ' · nouveau record' : '') + '</p><button class="btn center" id="replay" type="button">Rejouer</button></div>';
      el.querySelector('#replay').onclick = start;
    }

    start();
    return { restart: start };
  }

  /* ---------- installation PWA ---------- */
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installEvent = event;
    renderInstall();
  });
  window.addEventListener('appinstalled', () => { installEvent = null; renderInstall(); });

  function renderInstall() {
    const slot = document.getElementById('installSlot');
    if (!slot) return;
    if (!installEvent) { slot.innerHTML = ''; return; }
    slot.innerHTML = '<div class="install"><span>Installez l’application pour retrouver le menu en un geste.</span><button type="button" id="installBtn">Installer</button></div>';
    document.getElementById('installBtn').onclick = async () => {
      installEvent.prompt();
      try { await installEvent.userChoice; } catch (e) { /* ignoré */ }
      installEvent = null;
      renderInstall();
    };
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* hors HTTPS : sans effet */ }));
  }

  /* ---------- démarrage ---------- */
  async function start() {
    try {
      data = await api('menu');
    } catch (error) {
      app.innerHTML = '<div class="splash"><img src="assets/images/logo.svg" alt="" width="64" height="64"><p>' + esc(error.message) + '</p><button class="chip" style="margin:0" type="button" onclick="location.reload()">Réessayer</button></div>';
      return;
    }
    if (!data.ready) {
      app.innerHTML = '<div class="splash"><img src="assets/images/logo.svg" alt="" width="64" height="64"><p>Le menu n’est pas encore disponible.</p></div>';
      return;
    }
    if (tableNo && data.tables.indexOf(tableNo) === -1) tableNo = 0;
    if (session) { showTracking(); } else { renderShell(); }
  }

  start();
})();
