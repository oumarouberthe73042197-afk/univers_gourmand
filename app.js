function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

const seed = {
  currency: 'FCFA',
  dishes: [
    { id: 1, name: 'Bœuf bourguignon', category: 'Plats', price: 9500, available: true },
    { id: 2, name: 'Tartelette aux légumes', category: 'Entrées', price: 4500, available: true },
    { id: 3, name: 'Saumon rôti', category: 'Plats', price: 8000, available: true },
    { id: 4, name: 'Velouté de potimarron', category: 'Entrées', price: 3500, available: false },
    { id: 5, name: 'Canard confit', category: 'Plats', price: 9000, available: true },
    { id: 6, name: 'Tarte citron meringuée', category: 'Desserts', price: 3000, available: true }
  ],
  orders: [
    { id: 1048, table: 12, items: 'Bœuf bourguignon ×2', total: 19000, status: 'preparation', date: localDateKey(), time: '12:42' },
    { id: 1047, table: 5, items: 'Saumon rôti ×1, Tartelette ×2', total: 17000, status: 'servi', date: localDateKey(), time: '12:38' },
    { id: 1046, table: 8, items: 'Canard confit ×2', total: 18000, status: 'preparation', date: localDateKey(), time: '12:31' },
    { id: 1045, table: 3, items: 'Menu du jour ×2', total: 16000, status: 'paye', date: localDateKey(), time: '12:18' }
  ],
  tables: [
    { id: 1, seats: 2, status: 'free', order: null }, { id: 2, seats: 4, status: 'occupied', order: 1044 },
    { id: 3, seats: 4, status: 'free', order: null }, { id: 4, seats: 2, status: 'free', order: null },
    { id: 5, seats: 6, status: 'occupied', order: 1047 }, { id: 6, seats: 2, status: 'free', order: null },
    { id: 7, seats: 4, status: 'occupied', order: 1043 }, { id: 8, seats: 4, status: 'occupied', order: 1046 },
    { id: 9, seats: 2, status: 'free', order: null }, { id: 10, seats: 6, status: 'free', order: null },
    { id: 11, seats: 4, status: 'free', order: null }, { id: 12, seats: 4, status: 'occupied', order: 1048 }
  ],
  stock: [
    { id: 1, name: 'Tomates', unit: 'kg', quantity: 18, alert: 10 },
    { id: 2, name: 'Saumon', unit: 'kg', quantity: 3.5, alert: 5 },
    { id: 3, name: 'Bœuf', unit: 'kg', quantity: 7, alert: 8 },
    { id: 4, name: 'Pommes de terre', unit: 'kg', quantity: 26, alert: 12 },
    { id: 5, name: 'Huile d’olive', unit: 'L', quantity: 6, alert: 4 },
    { id: 6, name: 'Farine', unit: 'kg', quantity: 14, alert: 6 }
  ],
  settings: { name: 'Univers Gourmand', address: 'Abidjan, Côte d’Ivoire', phone: '+225 07 00 00 00', open: '11:30', close: '22:30', menuUrl: '', payments: { orange: { enabled: false, number: '' }, wave: { enabled: false, number: '', link: '' }, moov: { enabled: false, number: '' } } },
  expenses: [
    { id: 1, label: 'Loyer du local', category: 'Coûts fixes', amount: 350000, date: '2026-11-01', recurring: true },
    { id: 2, label: 'Salaires du personnel', category: 'Coûts fixes', amount: 420000, date: '2026-11-05', recurring: true },
    { id: 3, label: 'Électricité', category: 'Services publics', amount: 95000, date: '2026-11-08', recurring: true },
    { id: 4, label: 'Eau', category: 'Services publics', amount: 28000, date: '2026-11-09', recurring: true },
    { id: 5, label: 'Internet et téléphone', category: 'Coûts fixes', amount: 35000, date: '2026-11-10', recurring: true },
    { id: 6, label: 'Achats de produits frais', category: 'Coûts variables', amount: 185000, date: '2026-11-11', recurring: false },
    { id: 7, label: 'Livraison fournisseur', category: 'Coûts variables', amount: 24000, date: '2026-11-12', recurring: false },
    { id: 8, label: 'Entretien cuisine', category: 'Maintenance', amount: 45000, date: '2026-11-13', recurring: false },
    { id: 9, label: 'Publicité réseaux sociaux', category: 'Marketing', amount: 60000, date: '2026-11-14', recurring: false },
    { id: 10, label: 'Emballages à emporter', category: 'Coûts variables', amount: 32000, date: '2026-11-15', recurring: false }
  ]
};

function cloneSeed() {
  return JSON.parse(JSON.stringify(seed));
}

function loadLocalState() {
  try {
    const savedState = localStorage.getItem('universGourmand');
    if (!savedState) return cloneSeed();
    const parsedState = JSON.parse(savedState);
    if (!parsedState || typeof parsedState !== 'object' || Array.isArray(parsedState)) {
      throw new Error('Stored application state is not an object.');
    }
    return parsedState;
  } catch (error) {
    console.error('Univers Gourmand local state load error:', error);
    return cloneSeed();
  }
}

function normalizeState(candidate) {
  let normalized = candidate && candidate.currency
    ? { ...cloneSeed(), ...candidate }
    : cloneSeed();

  if (!Array.isArray(normalized.expenses)) normalized.expenses = cloneSeed().expenses;
  if (!normalized.settings || typeof normalized.settings !== 'object' || Array.isArray(normalized.settings)) {
    normalized.settings = cloneSeed().settings;
  }

  for (const collection of ['dishes', 'orders', 'tables', 'stock', 'expenses']) {
    if (!Array.isArray(normalized[collection])) {
      throw new Error(`Shared application data has an invalid ${collection} collection.`);
    }
  }

  normalized.orders.forEach(order => {
    if (!parseDateKey(order.date)) order.date = localDateKey();
  });
  const defaults = cloneSeed().settings;
  const savedPayments = normalized.settings.payments && typeof normalized.settings.payments === 'object' ? normalized.settings.payments : {};
  normalized.settings = { ...defaults, ...normalized.settings, payments: {
    orange: { ...defaults.payments.orange, ...(savedPayments.orange || {}) },
    wave: { ...defaults.payments.wave, ...(savedPayments.wave || {}) },
    moov: { ...defaults.payments.moov, ...(savedPayments.moov || {}) }
  } };
  normalized.dishes.forEach(dish => { if (dish.category === 'Plats') dish.category = 'Plats principaux'; });
  return normalized;
}

let state = normalizeState(loadLocalState());
let stateSyncReady = false;
let saveQueue = Promise.resolve();
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';
const container = document.getElementById('viewContainer');
const modal = document.getElementById('modalBackdrop');
let currentView = 'dashboard';

async function stateApiRequest(method, payload) {
  const options = {
    method,
    credentials: 'same-origin',
    headers: { Accept: 'application/json' }
  };
  if (payload) {
    options.headers['Content-Type'] = 'application/json';
    options.headers['X-CSRF-Token'] = csrfToken;
    options.body = JSON.stringify(payload);
  }

  const response = await fetch('state_api.php', options);
  let result;
  try {
    result = await response.json();
  } catch (error) {
    throw new Error('Le serveur a renvoyé une réponse illisible.');
  }
  if (!response.ok || result.success !== true) {
    throw new Error(result.message || `Erreur de synchronisation (${response.status}).`);
  }
  return result;
}

async function synchronizeState() {
  const response = await stateApiRequest('GET');
  let shouldSaveNormalizedState = false;

  if (response.state === null) {
    const initialState = normalizeState(state);
    const initialized = await stateApiRequest('POST', { state: initialState, initialize: true });
    state = normalizeState(initialized.state);
  } else {
    const serverStateJson = JSON.stringify(response.state);
    state = normalizeState(response.state);
    shouldSaveNormalizedState = JSON.stringify(state) !== serverStateJson;
  }

  stateSyncReady = true;
  try {
    localStorage.setItem('universGourmand', JSON.stringify(state));
  } catch (error) {
    console.warn('Univers Gourmand local cache could not be updated:', error);
  }
  if (shouldSaveNormalizedState && !(await save())) {
    throw new Error('Les données normalisées n’ont pas pu être synchronisées.');
  }
}

function save() {
  const serializedState = JSON.stringify(state);
  try {
    localStorage.setItem('universGourmand', serializedState);
  } catch (error) {
    console.warn('Univers Gourmand local cache could not be updated:', error);
  }
  if (!stateSyncReady) return Promise.resolve(false);

  saveQueue = saveQueue.then(async () => {
    await stateApiRequest('POST', { state: JSON.parse(serializedState) });
    return true;
  }).catch(error => {
    console.error('Univers Gourmand state sync error:', error);
    toast('La modification n’a pas pu être synchronisée avec les autres appareils.');
    return false;
  });
  return saveQueue;
}

function money(value) { return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value) + ' FCFA'; }
function statusLabel(status) { return { preparation: 'En préparation', pret: 'Prête', servi: 'Servi', paye: 'Payé', free: 'Libre', occupied: 'Occupée' }[status] || status; }
function toast(text, ms = 2400) { const el = document.getElementById('toast'); el.textContent = text; el.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), ms); }
function ico(name) { return `<svg class="ico" aria-hidden="true"><use href="#i-${name}"/></svg>`; }
const PROVIDER_LABELS = { orange: 'Orange Money', wave: 'Wave', moov: 'Moov Money' };
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c])); }
function hasDishImage(image) { return typeof image === 'string' && /^data:image\/(?:jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(image); }
function dishPhotoContent(dish) {
  return hasDishImage(dish.image)
    ? `<img src="${dish.image}" alt="${escapeHtml(dish.name)}">`
    : '<span class="dish-photo-placeholder">Aucune photo</span>';
}
function compressDishImage(file) {
  return new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(file);
    const image = new Image();
    const cleanup = () => URL.revokeObjectURL(sourceUrl);

    image.onload = () => {
      cleanup();
      const maxDimension = 640;
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Le navigateur ne peut pas traiter cette image.'));
        return;
      }

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      try {
        const webp = canvas.toDataURL('image/webp', 0.8);
        resolve(webp.startsWith('data:image/webp;base64,') ? webp : canvas.toDataURL('image/jpeg', 0.8));
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => {
      cleanup();
      reject(new Error('Le fichier sélectionné ne peut pas être ouvert comme une image.'));
    };
    image.src = sourceUrl;
  });
}

function setToday() {
  const d = new Date();
  document.getElementById('todayLabel').textContent = d.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
}

const titles = { dashboard:'Tableau de bord', menu:'Menu', orders:'Commandes', qr:'QR codes', tables:'Tables', stock:'Stock', reports:'Rapports', finances:'Dépenses & bénéfices', settings:'Paramètres' };

function switchView(view) {
  currentView = view;
  document.querySelectorAll('[data-view]').forEach(el => el.classList.toggle('active', el.dataset.view === view));
  document.getElementById('pageTitle').textContent = titles[view];
  document.querySelector('.sidebar').classList.remove('open');
  const action = document.getElementById('headerAction');
  action.hidden = view === 'reports' || view === 'settings' || view === 'qr';
  document.getElementById('headerActionLabel').textContent = view === 'tables' ? 'Nouvelle table' : view === 'menu' ? 'Nouveau plat' : view === 'stock' ? 'Nouvel ingrédient' : view === 'finances' ? 'Nouvelle dépense' : 'Nouvelle commande';
  const renderers = { dashboard:renderDashboard, menu:renderMenu, orders:renderOrders, qr:renderQr, tables:renderTables, stock:renderStock, reports:renderReports, finances:renderFinances, settings:renderSettings };
  renderers[view]();
}

function renderDashboard() {
  const paidOrders = state.orders.filter(o => o.status === 'paye');
  const revenue = paidOrders.reduce((total, order) => total + order.total, 0);
  const occupied = state.tables.filter(table => table.status === 'occupied').length;
  const occupiedSeats = state.tables.filter(table => table.status === 'occupied').reduce((total, table) => total + table.seats, 0);
  const lowStock = state.stock.filter(item => item.quantity <= item.alert);
  const active = state.orders.filter(order => order.status !== 'paye');
  const averageTicket = paidOrders.length ? revenue / paidOrders.length : 0;

  container.innerHTML = `<div class="stats-grid">
    <article class="stat-card"><div class="stat-head"><span class="stat-label">Chiffre encaissé</span><span class="stat-icon">${ico('coins')}</span></div><strong>${money(revenue)}</strong><small class="up">${paidOrders.length} paiement${paidOrders.length > 1 ? 's' : ''} aujourd’hui</small></article>
    <article class="stat-card"><div class="stat-head"><span class="stat-label">Service en cours</span><span class="stat-icon">${ico('receipt')}</span></div><strong>${active.length}</strong><small>${state.orders.filter(order => order.status === 'preparation').length} en préparation</small></article>
    <article class="stat-card"><div class="stat-head"><span class="stat-label">Salle occupée</span><span class="stat-icon">${ico('table')}</span></div><strong>${occupied} <small>/ ${state.tables.length}</small></strong><small>${occupiedSeats} places occupées · ${Math.round(occupied / state.tables.length * 100)} %</small></article>
    <article class="stat-card"><div class="stat-head"><span class="stat-label">Panier moyen</span><span class="stat-icon">${ico('receipt')}</span></div><strong>${money(averageTicket)}</strong><small>${lowStock.length ? lowStock.length + ' alerte(s) stock' : 'Aucune alerte stock'}</small></article>
  </div>
  <div class="dashboard-grid">
    <section class="panel">
      <div class="panel-header"><h2>Commandes du moment</h2><button class="text-button" data-go="orders">Voir toutes les commandes →</button></div>
      ${state.orders.length ? state.orders.slice(0, 4).map(order => `<div class="order-row"><span class="order-number">#${order.id}</span><div class="order-info"><strong>Table ${order.table}</strong><span>${escapeHtml(order.items)}</span></div><span class="order-total">${money(order.total)}</span><span class="status ${order.status}">${statusLabel(order.status)}</span></div>`).join('') : '<div class="empty-state">Aucune commande pour le moment.</div>'}
    </section>
    <section class="panel">
      <div class="panel-header"><h2>Alertes stock</h2><button class="text-button" data-go="stock">Gérer le stock →</button></div>
      <div class="alert-list">
        ${lowStock.length ? lowStock.slice(0, 4).map(item => `<div class="alert-item"><span class="alert-dot"></span><div><strong>${escapeHtml(item.name)}</strong><span>Seuil d’alerte : ${item.alert} ${item.unit}</span></div><b>${item.quantity} ${item.unit}</b></div>`).join('') : '<div class="alert-item"><div><strong>Aucune alerte</strong><span>Les stocks sont suffisants</span></div></div>'}
      </div>
      <div class="quick-actions"><button class="secondary-button" data-go="menu">Mettre à jour le menu</button><button class="secondary-button" data-go="stock">Mettre à jour le stock</button></div>
    </section>
  </div>`;
  bindDynamic();
}

function renderMenu() {
  container.innerHTML = `<div class="update-banner"><div><strong>Comment mettre à jour le menu</strong><span>Utilisez « Nouveau plat » pour ajouter, le crayon pour modifier, puis cliquez sur la disponibilité pour activer ou retirer un plat.</span></div><button class="text-button" id="addDishHint">Ajouter un plat →</button></div><div class="toolbar"><input class="search" id="dishSearch" placeholder="Rechercher un plat"><select id="categoryFilter"><option value="">Toutes les catégories</option><option>Entrées</option><option>Plats principaux</option><option>Accompagnements</option><option>Boissons</option><option>Desserts</option></select></div><div class="menu-grid" id="menuGrid"></div>`;
  function draw() { const q=(document.getElementById('dishSearch').value||'').toLowerCase(); const cat=document.getElementById('categoryFilter').value; document.getElementById('menuGrid').innerHTML=state.dishes.filter(d=>(!q||d.name.toLowerCase().includes(q))&&(!cat||d.category===cat)).map(d=>`<article class="dish-card"><div class="dish-photo">${dishPhotoContent(d)}</div><div class="dish-body"><div class="dish-top"><div><strong>${escapeHtml(d.name)}</strong><span>${escapeHtml(d.category)}</span></div><span class="dish-price">${money(d.price)}</span></div><div class="dish-footer"><button class="toggle" data-toggle-dish="${d.id}">${d.available?'● Disponible':'○ Indisponible'}</button><div class="card-actions"><button title="Modifier" data-edit-dish="${d.id}">${ico('edit')}</button><button title="Supprimer" data-delete-dish="${d.id}">${ico('trash')}</button></div></div></div></article>`).join('') || '<p>Aucun plat trouvé.</p>'; }
  document.getElementById('dishSearch').oninput=draw; document.getElementById('categoryFilter').onchange=draw; draw(); bindDynamic();
  document.getElementById('addDishHint').onclick = () => openModal('dish');
}

const ORDER_STATUSES = [['preparation', 'En préparation'], ['pret', 'Prête'], ['servi', 'Servi'], ['paye', 'Payé']];

function paymentNote(o) {
  if (o.source !== 'qr') return '';
  const method = PROVIDER_LABELS[o.payment] || 'mobile money';
  if (o.paymentStatus === 'confirmed') return `<small class="pay ok">Payé · ${method}</small>`;
  if (o.paymentStatus === 'declared') return `<small class="pay wait">Paiement à vérifier · ${method}${o.reference ? ' · réf. ' + escapeHtml(o.reference) : ''}</small>`;
  if (o.status === 'pret') return '<small class="pay">En attente du paiement client</small>';
  return '';
}

function orderRowHtml(o) {
  const online = o.source === 'qr';
  const actions = (o.status === 'preparation' ? `<button class="mini-button" type="button" data-ready="${o.id}">Marquer prête</button>` : '')
    + (online && o.paymentStatus === 'declared' ? `<button class="mini-button strong" type="button" data-confirm-pay="${o.id}">Confirmer le paiement</button>` : '');
  return `<tr><td data-label="Commande"><span><strong>#${o.id}</strong>${online ? '<span class="tag-online">En ligne</span>' : ''}</span></td><td data-label="Table">Table ${o.table}</td><td class="details" data-label="Détails">${escapeHtml(o.items)}${o.customer ? `<small class="muted-line">Client : ${escapeHtml(o.customer)}</small>` : ''}</td><td data-label="Heure">${escapeHtml(o.time || '')}</td><td data-label="Total"><strong>${money(o.total)}</strong></td><td data-label="Statut"><div><select data-order-status="${o.id}" aria-label="Statut de la commande ${o.id}">${ORDER_STATUSES.map(([value, label]) => `<option value="${value}" ${o.status === value ? 'selected' : ''}>${label}</option>`).join('')}</select>${paymentNote(o)}</div></td><td data-label="Actions"><div class="row-actions">${actions}<button class="icon-button delete-order-button" type="button" data-delete-order="${o.id}" aria-label="Supprimer la commande ${o.id}" title="Supprimer">${ico('trash')}</button></div></td></tr>`;
}

function renderOrders() {
  container.innerHTML = `<div class="toolbar"><input class="search" id="orderSearch" placeholder="Rechercher une commande"><select id="orderFilter"><option value="">Tous les statuts</option>${ORDER_STATUSES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div><section class="panel"><div class="table-scroll"><table class="data-table orders-table"><thead><tr><th>Commande</th><th>Table</th><th>Détails</th><th>Heure</th><th>Total</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="ordersTable"></tbody></table></div></section>`;
  function draw() {
    const q = (document.getElementById('orderSearch').value || '').toLowerCase();
    const f = document.getElementById('orderFilter').value;
    document.getElementById('ordersTable').innerHTML = state.orders
      .filter(o => (!q || ('#' + o.id).includes(q) || o.items.toLowerCase().includes(q) || String(o.table).includes(q)) && (!f || o.status === f))
      .map(orderRowHtml).join('') || '<tr><td colspan="7">Aucune commande trouvée.</td></tr>';
    bindDynamic();
  }
  document.getElementById('orderSearch').oninput = draw;
  document.getElementById('orderFilter').onchange = draw;
  draw();
}

function renderTables() {
  container.innerHTML = `<div class="toolbar"><input class="search" id="tableSearch" placeholder="Rechercher une table"><select id="tableFilter"><option value="">Tous les statuts</option><option value="free">Libre</option><option value="occupied">Occupée</option></select></div><div class="table-grid" id="tableGrid"></div>`;
  function draw(){ const q=document.getElementById('tableSearch').value; const f=document.getElementById('tableFilter').value; document.getElementById('tableGrid').innerHTML=state.tables.filter(t=>(!q||String(t.id).includes(q)||String(t.seats).includes(q))&&(!f||t.status===f)).map(t=>`<article class="table-card ${t.status}"><div class="table-head"><div class="table-number">${t.id}</div><span class="status ${t.status}">${statusLabel(t.status)}</span></div><h3>${t.seats} places</h3><p>${t.order?'Commande #'+t.order:'Aucune commande active'}</p><button class="secondary-button" data-toggle-table="${t.id}">${t.status==='free'?'Occuper':'Libérer'}</button></article>`).join(''); }
  document.getElementById('tableSearch').oninput=draw; document.getElementById('tableFilter').onchange=draw; draw(); bindDynamic();
}

function renderStock() {
  container.innerHTML = `<div class="update-banner"><div><strong>Comment mettre à jour le stock</strong><span>Utilisez − ou + pour ajuster une quantité. « Nouvel ingrédient » permet d’ajouter un produit avec son seuil d’alerte.</span></div><button class="text-button" id="addStockHint">Ajouter un ingrédient →</button></div><div class="toolbar"><input class="search" id="stockSearch" placeholder="Rechercher un ingrédient"><select id="stockFilter"><option value="">Tout le stock</option><option value="low">Stock bas</option></select></div><section class="panel"><table class="data-table"><thead><tr><th>Ingrédient</th><th>Quantité</th><th>Seuil d’alerte</th><th>État</th></tr></thead><tbody id="stockTable"></tbody></table></section>`;
  document.getElementById('addStockHint').onclick = () => openModal('stock');
  function draw(){ const q=document.getElementById('stockSearch').value.toLowerCase(); const f=document.getElementById('stockFilter').value; document.getElementById('stockTable').innerHTML=state.stock.filter(s=>(!q||s.name.toLowerCase().includes(q))&&(!f||s.quantity<=s.alert)).map(s=>`<tr><td><strong>${escapeHtml(s.name)}</strong></td><td><div class="quantity-control"><button data-stock-change="${s.id}" data-delta="-1">−</button><b>${s.quantity} ${s.unit}</b><button data-stock-change="${s.id}" data-delta="1">+</button></div></td><td>${s.alert} ${s.unit}</td><td><span class="status ${s.quantity<=s.alert?'occupied':'free'}">${s.quantity<=s.alert?'À réapprovisionner':'Disponible'}</span></td></tr>`).join(''); }
  document.getElementById('stockSearch').oninput=draw; document.getElementById('stockFilter').onchange=draw; draw(); bindDynamic();
}

function reportRange(period, referenceDate = new Date(), previous = false) {
  if (period === 'week') {
    const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - (previous ? 7 : 0));
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  }

  const months = period === 'month' ? 1 : period === 'semester' ? 6 : 12;
  const firstMonth = period === 'year'
    ? 0
    : period === 'semester'
      ? Math.floor(referenceDate.getMonth() / 6) * 6
      : referenceDate.getMonth();
  const start = new Date(referenceDate.getFullYear(), firstMonth - (previous ? months : 0), 1);
  const end = new Date(start.getFullYear(), start.getMonth() + months, 1);
  return { start, end };
}

function reportOrdersInRange(range) {
  return state.orders.filter(order => {
    const date = parseDateKey(order.date);
    return date && date >= range.start && date < range.end;
  });
}

function summarizeOrders(orders) {
  const paidOrders = orders.filter(order => order.status === 'paye');
  const revenue = paidOrders.reduce((total, order) => total + Number(order.total || 0), 0);
  return {
    orders: orders.length,
    paid: paidOrders.length,
    revenue,
    average: paidOrders.length ? revenue / paidOrders.length : 0,
    paidRate: orders.length ? paidOrders.length / orders.length * 100 : 0
  };
}

function reportBuckets(period, range) {
  const buckets = [];
  if (period === 'week' || period === 'month') {
    const daysPerBucket = period === 'week' ? 1 : 7;
    for (let start = new Date(range.start), index = 0; start < range.end; index++) {
      const end = new Date(start);
      end.setDate(end.getDate() + daysPerBucket);
      if (end > range.end) end.setTime(range.end.getTime());
      const label = period === 'week'
        ? start.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
        : `Semaine ${index + 1}`;
      buckets.push({ start: new Date(start), end, label });
      start = end;
    }
    return buckets;
  }

  for (let start = new Date(range.start); start < range.end; start = new Date(start.getFullYear(), start.getMonth() + 1, 1)) {
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    buckets.push({
      start: new Date(start),
      end: end > range.end ? new Date(range.end) : end,
      label: start.toLocaleDateString('fr-FR', { month: 'short' })
    });
  }
  return buckets;
}

function reportDays(range) {
  const days = [];
  for (let date = new Date(range.start); date < range.end; date.setDate(date.getDate() + 1)) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    days.push({
      start,
      end,
      label: start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    });
  }
  return days;
}

function reportPercent(value) {
  return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
}

function reportComparison(current, previous, formatter, isRate = false) {
  if (previous === 0) {
    return `<small>Pas de référence sur la période précédente</small>`;
  }
  const difference = current - previous;
  const sign = difference > 0 ? '+' : difference < 0 ? '−' : '';
  const trend = difference > 0 ? 'up' : difference < 0 ? 'down' : '';
  const amount = isRate
    ? `${Math.abs(difference).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} point${Math.abs(difference) === 1 ? '' : 's'}`
    : `${formatter(Math.abs(difference))} · ${reportPercent(Math.abs(difference / previous * 100))}`;
  return `<small class="${trend}">${sign}${amount} vs période précédente</small>`;
}

function renderReports() {
  container.innerHTML = `<div class="toolbar report-toolbar"><label for="reportPeriod">Période<select id="reportPeriod"><option value="week">Hebdomadaire</option><option value="month">Mensuelle</option><option value="semester">Semestrielle</option><option value="year">Annuelle</option></select></label><p class="report-range" id="reportRange"></p></div>
  <section class="panel daily-summary-panel"><div class="panel-header"><div><h2>Ventes du jour</h2><p id="reportTodayDate"></p></div></div><div class="stats-grid" id="reportDailyStats"></div></section>
  <div class="stats-grid" id="reportStats"></div>
  <section class="panel report-chart-panel"><div class="panel-header"><div><h2 id="reportChartTitle">Évolution du chiffre encaissé</h2><p id="reportComparisonRange"></p></div></div><div class="chart" id="reportChart"></div></section>
  <div class="reports-grid report-details"><section class="panel"><div class="panel-header"><h2>Détail par période</h2></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Période</th><th>Commandes</th><th>Payées</th><th>Chiffre encaissé</th><th>Part</th></tr></thead><tbody id="reportBreakdown"></tbody></table></div></section>
  <section class="panel"><div class="panel-header"><h2>Statut des commandes</h2></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Statut</th><th>Nombre</th><th>Part</th></tr></thead><tbody id="reportStatuses"></tbody></table></div></section></div>
  <section class="panel report-daily-panel"><div class="panel-header"><div><h2>Ventes jour par jour</h2><p>Une ligne par jour de la période sélectionnée</p></div></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Date</th><th>Commandes</th><th>Payées</th><th>Chiffre encaissé</th><th>Part</th></tr></thead><tbody id="reportDailyBreakdown"></tbody></table></div></section>
  <section class="panel report-history"><div class="panel-header"><h2>Historique complet des ventes et commandes</h2><span id="reportHistoryCount"></span></div><div class="toolbar report-history-filters"><input class="search" id="reportHistorySearch" placeholder="Rechercher une commande"><select id="reportHistoryStatus"><option value="">Tous les statuts</option><option value="paye">Payées</option><option value="servi">Servies</option><option value="pret">Prêtes</option><option value="preparation">En préparation</option></select></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Date</th><th>Heure</th><th>Commande</th><th>Table</th><th>Détails</th><th>Statut</th><th>Montant</th><th>Action</th></tr></thead><tbody id="reportHistoryRows"></tbody></table></div></section>`;

  const periodSelect = document.getElementById('reportPeriod');
  const historySearch = document.getElementById('reportHistorySearch');
  const historyStatus = document.getElementById('reportHistoryStatus');
  function drawHistory() {
    const query = historySearch.value.trim().toLowerCase();
    const status = historyStatus.value;
    const historyOrders = state.orders
      .filter(order => {
        const searchText = `${order.id} ${order.date} ${order.table} ${order.items} ${statusLabel(order.status)}`.toLowerCase();
        return (!status || order.status === status) && (!query || searchText.includes(query));
      })
      .slice()
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))
        || String(b.time || '').localeCompare(String(a.time || ''))
        || Number(b.id || 0) - Number(a.id || 0));
    document.getElementById('reportHistoryCount').textContent = `${historyOrders.length} commande(s) affichée(s) sur ${state.orders.length}`;
    document.getElementById('reportHistoryRows').innerHTML = historyOrders.length
      ? historyOrders.map(order => {
        const date = parseDateKey(order.date);
        const formattedDate = date ? date.toLocaleDateString('fr-FR') : 'Date inconnue';
        return `<tr><td>${formattedDate}</td><td>${escapeHtml(order.time || '')}</td><td><strong>#${escapeHtml(String(order.id))}</strong></td><td>Table ${escapeHtml(String(order.table))}</td><td>${escapeHtml(String(order.items || ''))}</td><td>${escapeHtml(statusLabel(order.status))}</td><td><strong>${money(Number(order.total || 0))}</strong></td><td><button class="icon-button delete-order-button" type="button" data-delete-order="${escapeHtml(String(order.id))}" aria-label="Supprimer la commande ${escapeHtml(String(order.id))}" title="Supprimer">${ico('trash')}</button></td></tr>`;
      }).join('')
      : '<tr><td colspan="8">Aucune commande ne correspond à la recherche.</td></tr>';
    bindDynamic();
  }

  function draw() {
    const period = periodSelect.value;
    const currentRange = reportRange(period);
    const previousRange = reportRange(period, new Date(), true);
    const currentOrders = reportOrdersInRange(currentRange);
    const previousOrders = reportOrdersInRange(previousRange);
    const current = summarizeOrders(currentOrders);
    const previous = summarizeOrders(previousOrders);
    const buckets = reportBuckets(period, currentRange).map(bucket => ({
      ...bucket,
      summary: summarizeOrders(reportOrdersInRange(bucket))
    }));
    const periodTitle = periodSelect.options[periodSelect.selectedIndex].textContent;
    const dateLabel = date => date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const rangeEnd = new Date(currentRange.end);
    rangeEnd.setDate(rangeEnd.getDate() - 1);
    const previousRangeEnd = new Date(previousRange.end);
    previousRangeEnd.setDate(previousRangeEnd.getDate() - 1);
    const today = new Date();
    const todayKey = localDateKey(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const todaySummary = summarizeOrders(state.orders.filter(order => order.date === todayKey));
    const yesterdaySummary = summarizeOrders(state.orders.filter(order => order.date === localDateKey(yesterday)));

    document.getElementById('reportRange').textContent = `Du ${dateLabel(currentRange.start)} au ${dateLabel(rangeEnd)}`;
    document.getElementById('reportComparisonRange').textContent = `Comparaison : du ${dateLabel(previousRange.start)} au ${dateLabel(previousRangeEnd)}`;
    document.getElementById('reportTodayDate').textContent = dateLabel(today);
    document.getElementById('reportChartTitle').textContent = `Chiffre encaissé — ${periodTitle.toLowerCase()}`;
    document.getElementById('reportDailyStats').innerHTML = `
      <article class="stat-card"><div class="stat-head"><span class="stat-label">Ventes encaissées</span><span class="stat-icon">${ico('coins')}</span></div><strong>${money(todaySummary.revenue)}</strong>${reportComparison(todaySummary.revenue, yesterdaySummary.revenue, value => money(value))}</article>
      <article class="stat-card"><div class="stat-head"><span class="stat-label">Commandes du jour</span><span class="stat-icon">${ico('receipt')}</span></div><strong>${todaySummary.orders}</strong>${reportComparison(todaySummary.orders, yesterdaySummary.orders, value => `${Math.round(value)} commande(s)`)}</article>
      <article class="stat-card"><div class="stat-head"><span class="stat-label">Commandes payées</span><span class="stat-icon">${ico('check')}</span></div><strong>${todaySummary.paid}</strong><small>${reportPercent(todaySummary.paidRate)} des commandes du jour</small></article>
      <article class="stat-card"><div class="stat-head"><span class="stat-label">Panier moyen du jour</span><span class="stat-icon">${ico('trend')}</span></div><strong>${money(todaySummary.average)}</strong>${reportComparison(todaySummary.average, yesterdaySummary.average, value => money(value))}</article>`;
    document.getElementById('reportStats').innerHTML = `
      <article class="stat-card"><div class="stat-head"><span class="stat-label">Chiffre encaissé</span><span class="stat-icon">${ico('coins')}</span></div><strong>${money(current.revenue)}</strong>${reportComparison(current.revenue, previous.revenue, value => money(value))}</article>
      <article class="stat-card"><div class="stat-head"><span class="stat-label">Commandes</span><span class="stat-icon">${ico('receipt')}</span></div><strong>${current.orders}</strong>${reportComparison(current.orders, previous.orders, value => `${Math.round(value)} commande(s)`)}</article>
      <article class="stat-card"><div class="stat-head"><span class="stat-label">Panier moyen payé</span><span class="stat-icon">${ico('trend')}</span></div><strong>${money(current.average)}</strong>${reportComparison(current.average, previous.average, value => money(value))}</article>
      <article class="stat-card"><div class="stat-head"><span class="stat-label">Taux de paiement</span><span class="stat-icon">${ico('percent')}</span></div><strong>${reportPercent(current.paidRate)}</strong>${reportComparison(current.paidRate, previous.paidRate, value => value, true)}</article>`;

    const maxRevenue = Math.max(...buckets.map(bucket => bucket.summary.revenue), 0);
    document.getElementById('reportChart').innerHTML = buckets.map(bucket => {
      const height = maxRevenue ? Math.max(2, bucket.summary.revenue / maxRevenue * 100) : 0;
      const compactRevenue = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(bucket.summary.revenue);
      return `<div class="bar-wrap" title="${escapeHtml(bucket.label)} : ${money(bucket.summary.revenue)}, ${bucket.summary.orders} commande(s)"><small class="bar-value">${compactRevenue}</small><div class="bar" style="height:${height}%"></div><span>${escapeHtml(bucket.label)}</span><small class="bar-orders">${bucket.summary.orders} cmd.</small></div>`;
    }).join('');

    document.getElementById('reportBreakdown').innerHTML = buckets.map(bucket => {
      const share = current.revenue ? bucket.summary.revenue / current.revenue * 100 : 0;
      return `<tr><td>${escapeHtml(bucket.label)}</td><td>${bucket.summary.orders}</td><td>${bucket.summary.paid}</td><td><strong>${money(bucket.summary.revenue)}</strong></td><td>${reportPercent(share)}</td></tr>`;
    }).join('');

    const days = reportDays(currentRange).map(day => ({
      ...day,
      summary: summarizeOrders(reportOrdersInRange(day))
    }));
    document.getElementById('reportDailyBreakdown').innerHTML = days.map(day => {
      const share = current.revenue ? day.summary.revenue / current.revenue * 100 : 0;
      return `<tr><td>${escapeHtml(day.label)}</td><td>${day.summary.orders}</td><td>${day.summary.paid}</td><td><strong>${money(day.summary.revenue)}</strong></td><td>${reportPercent(share)}</td></tr>`;
    }).join('');

    const statuses = ['preparation', 'pret', 'servi', 'paye'];
    document.getElementById('reportStatuses').innerHTML = statuses.map(status => {
      const count = currentOrders.filter(order => order.status === status).length;
      const share = current.orders ? count / current.orders * 100 : 0;
      return `<tr><td>${escapeHtml(statusLabel(status))}</td><td>${count}</td><td>${reportPercent(share)}</td></tr>`;
    }).join('') || '<tr><td colspan="3">Aucune commande sur cette période.</td></tr>';
    drawHistory();
  }
  periodSelect.onchange = draw;
  historySearch.oninput = drawHistory;
  historyStatus.onchange = drawHistory;
  draw();
}

function renderFinances() {
  const revenue = state.orders.filter(order => order.status === 'paye').reduce((total, order) => total + order.total, 0);
  const fixedCosts = state.expenses.filter(expense => expense.category === 'Coûts fixes').reduce((total, expense) => total + expense.amount, 0);
  const variableCosts = state.expenses.filter(expense => expense.category === 'Coûts variables').reduce((total, expense) => total + expense.amount, 0);
  const otherCosts = state.expenses.filter(expense => !['Coûts fixes', 'Coûts variables'].includes(expense.category)).reduce((total, expense) => total + expense.amount, 0);
  const totalExpenses = fixedCosts + variableCosts + otherCosts;
  const profit = revenue - totalExpenses;
  const margin = revenue ? profit / revenue * 100 : 0;

  container.innerHTML = `<div class="update-banner"><div><strong>Gestion financière</strong><span>Suivez les revenus, les coûts fixes, les coûts variables, les charges et le bénéfice réel.</span></div></div>
  <div class="stats-grid"><article class="stat-card"><div class="stat-head"><span class="stat-label">Revenu encaissé</span><span class="stat-icon">${ico('trend')}</span></div><strong>${money(revenue)}</strong><small>${state.orders.filter(order => order.status === 'paye').length} paiement(s)</small></article><article class="stat-card"><div class="stat-head"><span class="stat-label">Dépenses totales</span><span class="stat-icon">${ico('down')}</span></div><strong>${money(totalExpenses)}</strong><small>${state.expenses.length} dépenses enregistrées</small></article><article class="stat-card"><div class="stat-head"><span class="stat-label">Bénéfice net</span><span class="stat-icon">${ico('coins')}</span></div><strong class="${profit >= 0 ? 'profit-positive' : 'profit-negative'}">${money(profit)}</strong><small>${margin >= 0 ? '↗' : '↘'} Marge : ${margin.toFixed(1)} %</small></article><article class="stat-card"><div class="stat-head"><span class="stat-label">Coûts fixes</span><span class="stat-icon">${ico('dot')}</span></div><strong>${money(fixedCosts)}</strong><small>Coûts récurrents</small></article></div>
  <div class="finance-grid"><section class="panel"><div class="panel-header"><h2>Répartition des dépenses</h2></div><div class="cost-breakdown"><div><span>Coûts fixes</span><b>${money(fixedCosts)}</b></div><div><span>Coûts variables</span><b>${money(variableCosts)}</b></div><div><span>Services, entretien & marketing</span><b>${money(otherCosts)}</b></div></div></section><section class="panel"><div class="panel-header"><h2>Calcul du bénéfice</h2></div><div class="profit-calculation"><div><span>Revenus</span><b>${money(revenue)}</b></div><div><span>− Dépenses</span><b>${money(totalExpenses)}</b></div><div class="profit-total"><span>Bénéfice net</span><b>${money(profit)}</b></div></div></section></div>
  <section class="panel expense-panel"><div class="panel-header"><h2>Historique des dépenses</h2><div class="expense-filters"><select id="expenseCategoryFilter"><option value="">Toutes catégories</option><option>Coûts fixes</option><option>Coûts variables</option><option>Services publics</option><option>Maintenance</option><option>Marketing</option><option>Taxes et charges</option></select></div></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Date</th><th>Description</th><th>Catégorie</th><th>Type</th><th>Montant</th><th></th></tr></thead><tbody id="expensesTable"></tbody></table></div></section>`;

  function draw(){
    const category=document.getElementById('expenseCategoryFilter').value;
    document.getElementById('expensesTable').innerHTML=state.expenses.filter(expense=>!category||expense.category===category).slice().sort((a,b)=>b.date.localeCompare(a.date)).map(expense=>`<tr><td>${escapeHtml(expense.date)}</td><td><strong>${escapeHtml(expense.label)}</strong></td><td>${escapeHtml(expense.category)}</td><td><span class="status ${expense.recurring?'preparation':'paye'}">${expense.recurring?'Récurrent':'Ponctuel'}</span></td><td><strong>${money(expense.amount)}</strong></td><td><button class="icon-button" title="Supprimer" data-delete-expense="${expense.id}">${ico('trash')}</button></td></tr>`).join('') || '<tr><td colspan="6">Aucune dépense enregistrée.</td></tr>';
    document.querySelectorAll('[data-delete-expense]').forEach(button=>button.onclick=()=>{const index=state.expenses.findIndex(expense=>expense.id===+button.dataset.deleteExpense);if(index>=0){state.expenses.splice(index,1);save();renderFinances();toast('Dépense supprimée');}});
  }
  document.getElementById('expenseCategoryFilter').onchange=draw;
  draw();
}

function renderSettings() {
  const st = state.settings;
  const pay = st.payments;
  container.innerHTML = `<div class="settings-stack">
  <section class="panel"><div class="panel-header"><h2>Informations du restaurant</h2></div><div class="form-grid"><label>Nom du restaurant<input id="settingName" value="${escapeHtml(st.name)}"></label><label>Téléphone<input id="settingPhone" value="${escapeHtml(st.phone)}"></label><label class="full">Adresse<input id="settingAddress" value="${escapeHtml(st.address)}"></label><label>Ouverture<input id="settingOpen" type="time" value="${escapeHtml(st.open)}"></label><label>Fermeture<input id="settingClose" type="time" value="${escapeHtml(st.close)}"></label><label class="full">Adresse publique du menu (QR code)<input id="settingMenuUrl" type="url" placeholder="${escapeHtml(defaultMenuUrl())}" value="${escapeHtml(st.menuUrl || '')}"></label></div><p class="settings-note">Laissez vide pour utiliser l’adresse actuelle du site. Renseignez-la si votre site a un nom de domaine définitif.</p></section>
  <section class="panel"><div class="panel-header"><h2>Paiements mobile money</h2></div>
    <p class="settings-note" style="padding-top:14px">Quand une commande est prête, le client choisit un moyen de paiement parmi ceux activés ici, envoie le montant à votre numéro marchand puis touche « J’ai payé ». Vous confirmez ensuite la réception dans la liste des commandes.</p>
    <div class="pay-row"><label class="switch"><input type="checkbox" id="payOrangeOn" ${pay.orange.enabled ? 'checked' : ''}>Orange Money</label><div><label for="payOrangeNum">Numéro marchand</label><input id="payOrangeNum" type="tel" inputmode="tel" placeholder="Ex. +223 70 00 00 00" value="${escapeHtml(pay.orange.number)}"></div></div>
    <div class="pay-row"><label class="switch"><input type="checkbox" id="payWaveOn" ${pay.wave.enabled ? 'checked' : ''}>Wave</label><div class="stack"><div><label for="payWaveNum">Numéro marchand</label><input id="payWaveNum" type="tel" inputmode="tel" placeholder="Ex. +223 76 00 00 00" value="${escapeHtml(pay.wave.number)}"></div><div><label for="payWaveLink">Lien de paiement Wave (facultatif)</label><input id="payWaveLink" type="url" placeholder="https://pay.wave.com/m/…" value="${escapeHtml(pay.wave.link || '')}"></div></div></div>
    <div class="pay-row"><label class="switch"><input type="checkbox" id="payMoovOn" ${pay.moov.enabled ? 'checked' : ''}>Moov Money</label><div><label for="payMoovNum">Numéro marchand</label><input id="payMoovNum" type="tel" inputmode="tel" placeholder="Ex. +223 60 00 00 00" value="${escapeHtml(pay.moov.number)}"></div></div>
  </section>
  <div class="settings-actions"><button class="primary-button" id="saveSettings">Enregistrer les paramètres</button></div>
  <section class="panel"><div class="panel-header"><h2>Sécurité</h2></div><div class="form-grid"><label class="full">Mot de passe actuel<input id="pwdCurrent" type="password" autocomplete="current-password"></label><label>Nouveau mot de passe<input id="pwdNew" type="password" autocomplete="new-password" minlength="12"></label><label>Confirmer le mot de passe<input id="pwdConfirm" type="password" autocomplete="new-password" minlength="12"></label></div><p class="settings-note">12 caractères minimum.</p><div class="settings-actions" style="padding:14px 18px 18px"><button class="secondary-button" id="savePassword">Modifier le mot de passe</button></div></section></div>`;
  const val = id => document.getElementById(id).value.trim();
  document.getElementById('saveSettings').onclick = () => {
    const link = val('payWaveLink');
    const checks = [['Orange Money', 'payOrangeOn', val('payOrangeNum')], ['Moov Money', 'payMoovOn', val('payMoovNum')]];
    for (const [label, box, number] of checks) {
      if (document.getElementById(box).checked && !number) { toast(`Saisissez le numéro ${label} avant de l’activer.`); return; }
    }
    if (document.getElementById('payWaveOn').checked && !val('payWaveNum') && !link) { toast('Saisissez un numéro ou un lien Wave avant de l’activer.'); return; }
    if (link && !/^https:\/\/[^\s]+$/.test(link)) { toast('Le lien Wave doit commencer par https://'); return; }
    const menuUrl = val('settingMenuUrl');
    if (menuUrl && !/^https?:\/\/[^\s]+$/.test(menuUrl)) { toast('L’adresse du menu doit commencer par https://'); return; }
    Object.assign(state.settings, { name: val('settingName'), phone: val('settingPhone'), address: val('settingAddress'), open: document.getElementById('settingOpen').value, close: document.getElementById('settingClose').value, menuUrl });
    state.settings.payments = {
      orange: { enabled: document.getElementById('payOrangeOn').checked, number: val('payOrangeNum') },
      wave: { enabled: document.getElementById('payWaveOn').checked, number: val('payWaveNum'), link },
      moov: { enabled: document.getElementById('payMoovOn').checked, number: val('payMoovNum') }
    };
    save();
    toast('Paramètres enregistrés');
  };
  document.getElementById('savePassword').onclick = async () => {
    const button = document.getElementById('savePassword');
    button.disabled = true;
    try {
      const response = await fetch('change_password.php', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken }, body: JSON.stringify({ current: document.getElementById('pwdCurrent').value, new: document.getElementById('pwdNew').value, confirm: document.getElementById('pwdConfirm').value }) });
      const result = await response.json();
      toast(result.message || 'Erreur.');
      if (result.success) ['pwdCurrent', 'pwdNew', 'pwdConfirm'].forEach(id => { document.getElementById(id).value = ''; });
    } catch (error) { toast('Le mot de passe n’a pas pu être modifié.'); }
    button.disabled = false;
  };
}

function openModal(type, id=null) {
  document.getElementById('modalTitle').textContent = type==='dish'?'Ajouter un plat':type==='order'?'Nouvelle commande':type==='stock'?'Ajouter un ingrédient':type==='finance'?'Nouvelle dépense':'Nouvelle table';
  const body=document.getElementById('modalBody');
  if(type==='dish') {
    const d=id?state.dishes.find(x=>x.id===id):null;
    let selectedImage = null;
    let removeSelectedImage = false;
    let previewUrl = null;
    body.innerHTML=`<form class="modal-form" id="dishForm"><div class="form-grid"><label>Nom du plat<input name="name" required value="${d?escapeHtml(d.name):''}"></label><label>Catégorie<select name="category"><option ${d?.category==='Entrées'?'selected':''}>Entrées</option><option ${d?.category==='Plats principaux'?'selected':''}>Plats principaux</option><option ${d?.category==='Accompagnements'?'selected':''}>Accompagnements</option><option ${d?.category==='Boissons'?'selected':''}>Boissons</option><option ${d?.category==='Desserts'?'selected':''}>Desserts</option></select></label><label>Prix (FCFA)<input name="price" type="number" step="any" required value="${d?d.price:''}"></label><label class="full">Photo du plat<input id="dishImageInput" type="file" accept="image/jpeg,image/png,image/webp"><small>JPG, PNG ou WebP · 5 Mo maximum. Photo conservée dans ce navigateur.</small></label><div class="dish-image-preview full" id="dishImagePreview">${d&&hasDishImage(d.image)?`<img src="${d.image}" alt="Photo actuelle de ${escapeHtml(d.name)}">`:'<span class="dish-photo-placeholder">Aucune photo</span>'}</div><button class="text-button full" id="removeDishImage" type="button" ${d&&hasDishImage(d.image)?'':'hidden'}>Retirer la photo</button></div><div class="modal-actions"><button type="button" class="secondary-button" data-close-modal>Annuler</button><button class="primary-button" type="submit">${d?'Modifier':'Ajouter'}</button></div></form>`;
    const imageInput=document.getElementById('dishImageInput');
    const preview=document.getElementById('dishImagePreview');
    const removeImageButton=document.getElementById('removeDishImage');
    imageInput.onchange=()=>{
      const file=imageInput.files[0];
      if(!file) return;
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)){
        imageInput.value='';
        toast('Choisissez une image JPG, PNG ou WebP.');
        return;
      }
      if(file.size>5*1024*1024){
        imageInput.value='';
        toast('La photo doit faire 5 Mo maximum.');
        return;
      }
      selectedImage=file;
      removeSelectedImage=false;
      if(previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl=URL.createObjectURL(file);
      preview.innerHTML=`<img src="${previewUrl}" alt="Aperçu de la photo sélectionnée">`;
      removeImageButton.hidden=false;
    };
    removeImageButton.onclick=()=>{
      selectedImage=null;
      removeSelectedImage=true;
      imageInput.value='';
      if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}
      preview.innerHTML='<span class="dish-photo-placeholder">Aucune photo</span>';
      removeImageButton.hidden=true;
    };
    document.getElementById('dishForm').onsubmit=async e=>{
      e.preventDefault();
      const form=e.currentTarget;
      const submitButton=form.querySelector('button[type="submit"]');
      const fd=new FormData(form);
      submitButton.disabled=true;
      let image=d?.image || null;
      if(selectedImage){
        try {
          image=await compressDishImage(selectedImage);
        } catch(error) {
          console.error('Univers Gourmand dish image error:',error);
          toast('La photo n’a pas pu être traitée.');
          submitButton.disabled=false;
          return;
        }
      } else if(removeSelectedImage) {
        image=null;
      }
      const dish={...(d || {id:Date.now(),available:true}),name:fd.get('name'),category:fd.get('category'),price:+fd.get('price'),image};
      delete dish.emoji;
      const dishes=d?state.dishes.map(item=>item.id===d.id?dish:item):[...state.dishes,dish];
      state.dishes=dishes;
      if (!(await save())) {
        submitButton.disabled=false;
        return;
      }
      if(previewUrl) URL.revokeObjectURL(previewUrl);
      closeModal();
      renderMenu();
      toast(d?'Plat modifié':'Plat ajouté');
    };
  }
  if(type==='order') { body.innerHTML=`<form class="modal-form" id="orderForm"><div class="form-grid"><label>Table<select name="table">${state.tables.map(t=>`<option value="${t.id}">Table ${t.id} — ${t.seats} places</option>`).join('')}</select></label><label>Statut<select name="status"><option value="preparation">En préparation</option><option value="servi">Servi</option><option value="paye">Payé</option></select></label><label class="full">Détail des plats<textarea name="items" required placeholder="Ex. Bœuf bourguignon ×2, saumon ×1"></textarea></label><label>Montant (FCFA)<input name="total" type="number" step="any" required></label></div><div class="modal-actions"><button type="button" class="secondary-button" data-close-modal>Annuler</button><button class="primary-button">Créer la commande</button></div></form>`;
    document.getElementById('orderForm').onsubmit=async e=>{
      e.preventDefault();
      const form=e.currentTarget;
      const submitButton=form.querySelector('button[type="submit"], .primary-button');
      submitButton.disabled=true;
      const fd=new FormData(form);
      let id=Date.now();
      while(state.orders.some(order=>Number(order.id)===id)) id++;
      const tableNumber=Number(fd.get('table'));
      const order={id,table:tableNumber,items:fd.get('items'),total:Number(fd.get('total')),status:fd.get('status'),date:localDateKey(),time:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})};
      const previousState=state;
      state={
        ...state,
        orders:[order,...state.orders],
        tables:state.tables.map(table=>table.id===tableNumber?{...table,status:'occupied',order:id}:table)
      };
      if (!(await save())) {
        state=previousState;
        submitButton.disabled=false;
        return;
      }
      closeModal();
      renderOrders();
      toast('Commande créée');
    };
  }
  if(type==='table') { body.innerHTML=`<form class="modal-form" id="tableForm"><div class="form-grid"><label>Numéro de table<input name="id" type="number" min="1" required></label><label>Nombre de places<input name="seats" type="number" min="1" max="20" required value="4"></label></div><div class="modal-actions"><button type="button" class="secondary-button" data-close-modal>Annuler</button><button class="primary-button">Ajouter la table</button></div></form>`; document.getElementById('tableForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target);const id=+fd.get('id');if(state.tables.some(t=>t.id===id)){toast('Cette table existe déjà');return;}state.tables.push({id,seats:+fd.get('seats'),status:'free',order:null});save();closeModal();renderTables();toast('Table ajoutée');}; }
  if(type==='stock') { body.innerHTML=`<form class="modal-form" id="stockForm"><div class="form-grid"><label>Nom de l’ingrédient<input name="name" required placeholder="Ex. Riz"></label><label>Unité<select name="unit"><option>kg</option><option>L</option><option>pièce</option><option>sachet</option></select></label><label>Quantité actuelle<input name="quantity" type="number" step="0.1" min="0" required value="0"></label><label>Seuil d’alerte<input name="alert" type="number" step="0.1" min="0" required value="5"></label></div><div class="modal-actions"><button type="button" class="secondary-button" data-close-modal>Annuler</button><button class="primary-button">Ajouter l’ingrédient</button></div></form>`;
    document.getElementById('stockForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target);state.stock.push({id:Date.now(),name:fd.get('name'),unit:fd.get('unit'),quantity:+fd.get('quantity'),alert:+fd.get('alert')});save();closeModal();renderStock();toast('Ingrédient ajouté');}; }
  if(type==='finance') {
    body.innerHTML=`<form class="modal-form" id="expenseForm"><div class="form-grid"><label>Description de la dépense<input name="label" required placeholder="Ex. Achat de boissons"></label><label>Catégorie<select name="category"><option>Coûts fixes</option><option>Coûts variables</option><option>Services publics</option><option>Maintenance</option><option>Marketing</option><option>Taxes et charges</option><option>Autres dépenses</option></select></label><label>Montant (FCFA)<input name="amount" type="number" min="1" step="any" required></label><label>Date<input name="date" type="date" required value="${new Date().toISOString().slice(0,10)}"></label><label class="full">Type<select name="recurring"><option value="false">Dépense ponctuelle</option><option value="true">Dépense récurrente / fixe</option></select></label></div><div class="modal-actions"><button type="button" class="secondary-button" data-close-modal>Annuler</button><button class="primary-button">Ajouter la dépense</button></div></form>`;
    document.getElementById('expenseForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target);state.expenses.push({id:Date.now(),label:fd.get('label'),category:fd.get('category'),amount:+fd.get('amount'),date:fd.get('date'),recurring:fd.get('recurring')==='true'});save();closeModal();renderFinances();toast('Dépense enregistrée');};
  }
  modal.hidden=false;
  modal.querySelector('[data-close-modal]')?.addEventListener('click',closeModal);
}
function closeModal(){modal.hidden=true;}

function deleteOrder(id) {
  const index = state.orders.findIndex(order => order.id === id);
  if (index === -1) return;

  const order = state.orders[index];
  if (!window.confirm(`Supprimer la commande #${order.id} ? Cette action est définitive.`)) return;

  if (order.source === 'qr') {
    ordersApi('POST', { action: 'archive', id: order.id }).catch(error => toast(error.message));
  }
  state.orders.splice(index, 1);
  const linkedTable = state.tables.find(table => table.order === id);
  if (linkedTable) {
    linkedTable.order = null;
    linkedTable.status = 'free';
  }
  save();
  document.getElementById('ordersBadge').textContent = state.orders.filter(item => item.status !== 'paye').length;
  if (currentView === 'reports') renderReports();
  else renderOrders();
  toast(`Commande #${order.id} supprimée`);
}

function bindDynamic(){
  document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>switchView(b.dataset.go));
  document.querySelectorAll('[data-toggle-dish]').forEach(b=>b.onclick=()=>{const d=state.dishes.find(x=>x.id===+b.dataset.toggleDish);d.available=!d.available;save();renderMenu();});
  document.querySelectorAll('[data-edit-dish]').forEach(b=>b.onclick=()=>openModal('dish',+b.dataset.editDish));
  document.querySelectorAll('[data-delete-dish]').forEach(b=>b.onclick=()=>{const i=state.dishes.findIndex(x=>x.id===+b.dataset.deleteDish);if(i>=0){state.dishes.splice(i,1);save();renderMenu();toast('Plat supprimé');}});
  document.querySelectorAll('[data-delete-order]').forEach(button=>button.onclick=()=>deleteOrder(Number(button.dataset.deleteOrder)));
  document.querySelectorAll('[data-order-status]').forEach(s=>s.onchange=async()=>{const o=state.orders.find(x=>x.id===+s.dataset.orderStatus);if(!(await setOrderStatus(o,s.value))){s.value=o.status;return;}toast('Statut mis à jour');if(currentView==='orders')renderOrders();});
  document.querySelectorAll('[data-ready]').forEach(b=>b.onclick=async()=>{const o=state.orders.find(x=>x.id===+b.dataset.ready);if(await setOrderStatus(o,'pret')){toast(o.source==='qr'?'Commande prête : le client est prévenu':'Commande prête');if(currentView==='orders')renderOrders();else switchView(currentView);}});
  document.querySelectorAll('[data-confirm-pay]').forEach(b=>b.onclick=async()=>{const o=state.orders.find(x=>x.id===+b.dataset.confirmPay);try{await ordersApi('POST',{action:'confirm_payment',id:o.id});o.status='paye';o.paymentStatus='confirmed';save();refreshBadges();toast('Paiement confirmé');renderOrders();}catch(error){toast(error.message);}});
  document.querySelectorAll('[data-toggle-table]').forEach(b=>b.onclick=()=>{const t=state.tables.find(x=>x.id===+b.dataset.toggleTable);t.status=t.status==='free'?'occupied':'free';if(t.status==='free')t.order=null;save();renderTables();});
  document.querySelectorAll('[data-stock-change]').forEach(b=>b.onclick=()=>{const s=state.stock.find(x=>x.id===+b.dataset.stockChange);s.quantity=Math.max(0,+(s.quantity+(+b.dataset.delta)).toFixed(1));save();renderStock();});
}

/* ---------- Commandes en ligne (QR code) ---------- */
async function ordersApi(method, payload) {
  const options = { method, credentials: 'same-origin', headers: { Accept: 'application/json' } };
  if (payload) {
    options.headers['Content-Type'] = 'application/json';
    options.headers['X-CSRF-Token'] = csrfToken;
    options.body = JSON.stringify(payload);
  }
  const response = await fetch('orders_api.php', options);
  let result;
  try { result = await response.json(); } catch (error) { throw new Error('Réponse illisible du serveur.'); }
  if (!response.ok || result.success !== true) throw new Error(result.message || `Erreur (${response.status}).`);
  return result;
}

async function setOrderStatus(order, status) {
  if (!order) return false;
  if (order.source === 'qr') {
    try { await ordersApi('POST', { action: 'status', id: order.id, status }); } catch (error) { toast(error.message); return false; }
  }
  order.status = status;
  if (status === 'paye' && order.paymentStatus === 'declared') order.paymentStatus = 'confirmed';
  save();
  refreshBadges();
  return true;
}

function mergeOnlineOrders(remote) {
  let changed = false;
  const added = [];
  remote.forEach(r => {
    const when = new Date(r.ts * 1000);
    const local = state.orders.find(o => o.id === r.id);
    if (!local) {
      state.orders.unshift({ id: r.id, table: r.table, items: r.items, total: r.total, status: r.status, date: localDateKey(when), time: when.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), source: 'qr', customer: r.customer || '', payment: r.payment, paymentStatus: r.paymentStatus, reference: r.reference || '' });
      const table = state.tables.find(t => t.id === r.table);
      if (table && r.status !== 'paye') { table.status = 'occupied'; table.order = r.id; }
      added.push(r);
      changed = true;
    } else if (local.source === 'qr') {
      const next = { status: r.status, payment: r.payment, paymentStatus: r.paymentStatus, reference: r.reference || '' };
      Object.keys(next).forEach(key => { if (local[key] !== next[key]) { local[key] = next[key]; changed = true; } });
    }
  });
  return { changed, added };
}

let audioContext = null;
function unlockAudio() {
  try { audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)(); if (audioContext.state === 'suspended') audioContext.resume(); } catch (error) { audioContext = null; }
}
function playAlert() {
  if (!audioContext) return;
  try {
    [740, 988, 1319].forEach((frequency, index) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const start = audioContext.currentTime + index * 0.16;
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.15);
      osc.connect(gain).connect(audioContext.destination);
      osc.start(start);
      osc.stop(start + 0.16);
    });
  } catch (error) { /* son indisponible */ }
}

function systemNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const options = { body, icon: 'assets/icons/icon-192.png', badge: 'assets/icons/icon-192.png', tag: 'ug-new-order', renotify: true, data: { url: 'index.php#orders' } };
  if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(reg => reg.showNotification(title, options)).catch(() => {});
  else { try { new Notification(title, options); } catch (error) { /* ignoré */ } }
}

function announceOrders(list) {
  const text = list.length === 1 ? `Nouvelle commande — table ${list[0].table}` : `${list.length} nouvelles commandes`;
  toast(text, 5000);
  playAlert();
  try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (error) { /* ignoré */ }
  systemNotification('Univers Gourmand', text);
}

function refreshBadges() {
  const open = state.orders.filter(o => o.status !== 'paye').length;
  document.getElementById('ordersBadge').textContent = open;
  const mobile = document.getElementById('ordersBadgeMobile');
  mobile.textContent = open;
  mobile.hidden = open === 0;
  const dot = document.getElementById('alertDot');
  dot.hidden = !state.orders.some(o => o.source === 'qr' && (o.status === 'preparation' || o.paymentStatus === 'declared'));
}

function refreshViewIfIdle() {
  const active = document.activeElement;
  const typing = active && container.contains(active) && ['INPUT', 'SELECT', 'TEXTAREA'].includes(active.tagName);
  if (typing || !modal.hidden) return;
  if (['dashboard', 'orders', 'tables'].includes(currentView)) switchView(currentView);
}

async function pullOnlineOrders() {
  if (!stateSyncReady) return;
  try {
    const result = await ordersApi('GET');
    const { changed, added } = mergeOnlineOrders(result.orders);
    if (added.length) announceOrders(added);
    if (changed) { save(); refreshBadges(); refreshViewIfIdle(); }
  } catch (error) {
    console.warn('Univers Gourmand online orders:', error);
  }
}

function updateAlertButton() {
  const on = 'Notification' in window && Notification.permission === 'granted';
  document.getElementById('notifyBtn').classList.toggle('on', on);
}

async function enableAlerts() {
  unlockAudio();
  playAlert();
  if (!('Notification' in window)) { toast('Alerte sonore activée sur cet appareil.'); return; }
  if (Notification.permission === 'default') {
    try { await Notification.requestPermission(); } catch (error) { /* ignoré */ }
  }
  updateAlertButton();
  toast(Notification.permission === 'granted' ? 'Alertes de nouvelles commandes activées.' : 'Notifications refusées : seul le son reste actif.');
}

/* ---------- QR codes ---------- */
function defaultMenuUrl() {
  const url = new URL('menu.php', location.href);
  return url.origin + url.pathname;
}
function menuBaseUrl() { return (state.settings.menuUrl || '').trim() || defaultMenuUrl(); }
function tableUrl(id) { const base = menuBaseUrl(); return base + (base.includes('?') ? '&' : '?') + 't=' + id; }

function printSection(element) {
  document.querySelectorAll('.print-target').forEach(el => el.classList.remove('print-target'));
  element.classList.add('print-target');
  window.addEventListener('afterprint', () => element.classList.remove('print-target'), { once: true });
  window.print();
}

function renderQr() {
  const base = menuBaseUrl();
  const options = { fg: '#0a4f2e', margin: 2 };
  container.innerHTML = `<div class="update-banner"><div><strong>Menu numérique</strong><span>Collez ces QR codes sur vos tables : vos clients voient le menu, commandent et paient depuis leur téléphone. Les commandes arrivent ici automatiquement.</span></div></div>
  <section class="panel qr-hero" id="qrMain"><div class="qr-box" id="qrMainBox"></div><div class="qr-info"><h2>QR code du menu</h2><p>Ce code ouvre le menu sans numéro de table : le client choisit sa table au moment de commander. Idéal pour l’entrée, la vitrine ou les réseaux sociaux.</p><code class="qr-link" id="qrLink"></code><div class="qr-actions"><button class="primary-button" id="qrCopy" type="button">${ico('link')}Copier le lien</button><a class="secondary-button" id="qrOpen" target="_blank" rel="noopener">Voir la page client</a><button class="secondary-button" id="qrDownload" type="button">${ico('download')}Télécharger</button><button class="secondary-button" id="qrPrint" type="button">${ico('printer')}Imprimer</button></div></div></section>
  <section class="panel qr-tables" id="qrTables"><div class="panel-header"><div><h2>QR codes par table</h2><p style="margin:4px 0 0;color:var(--muted);font-size:12px">Chaque code pré-remplit le numéro de table du client.</p></div><button class="secondary-button" id="qrPrintTables" type="button">${ico('printer')}Imprimer les tables</button></div><div class="qr-grid" id="qrGrid"></div></section>`;
  let svg = '';
  try { svg = UGQR.svg(base, options); } catch (error) { svg = ''; }
  document.getElementById('qrMainBox').innerHTML = svg || '<p style="padding:20px;font-size:12px">Adresse trop longue pour un QR code.</p>';
  document.getElementById('qrLink').textContent = base;
  document.getElementById('qrOpen').href = base;
  document.getElementById('qrGrid').innerHTML = state.tables.slice().sort((a, b) => a.id - b.id).map(t => {
    let tableSvg = '';
    try { tableSvg = UGQR.svg(tableUrl(t.id), options); } catch (error) { tableSvg = ''; }
    return `<article class="qr-card">${tableSvg}<strong>Table ${t.id}</strong><span>Scannez pour voir le menu et commander</span></article>`;
  }).join('') || '<div class="empty-state">Ajoutez des tables pour générer leurs QR codes.</div>';
  document.getElementById('qrCopy').onclick = async () => {
    try { await navigator.clipboard.writeText(base); toast('Lien copié'); } catch (error) { toast(base, 6000); }
  };
  document.getElementById('qrDownload').onclick = () => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'qr-menu-univers-gourmand.svg';
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };
  document.getElementById('qrPrint').onclick = () => printSection(document.getElementById('qrMain'));
  document.getElementById('qrPrintTables').onclick = () => printSection(document.getElementById('qrTables'));
}

/* ---------- Installation (PWA) ---------- */
let installPrompt = null;
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
  const button = document.getElementById('installApp');
  if (button) button.hidden = false;
});
window.addEventListener('appinstalled', () => { installPrompt = null; const button = document.getElementById('installApp'); if (button) button.hidden = true; });
document.getElementById('installApp').onclick = async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  try { await installPrompt.userChoice; } catch (error) { /* ignoré */ }
  installPrompt = null;
  document.getElementById('installApp').hidden = true;
};
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

function initializeInterface() {
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{switchView(b.dataset.view);history.replaceState(null,'','#'+b.dataset.view);});
  document.getElementById('headerAction').onclick=()=>openModal(currentView==='menu'?'dish':currentView==='tables'?'table':currentView==='stock'?'stock':currentView==='finances'?'finance':'order');
  document.getElementById('closeModal').onclick=closeModal;
  modal.onclick=e=>{if(e.target===modal)closeModal();};
  document.getElementById('mobileMenu').onclick=()=>document.querySelector('.sidebar').classList.toggle('open');
  document.getElementById('moreTab').onclick=()=>document.querySelector('.sidebar').classList.toggle('open');
  document.addEventListener('click',event=>{const sb=document.querySelector('.sidebar');if(sb.classList.contains('open')&&!event.target.closest('.sidebar, #mobileMenu, #moreTab'))sb.classList.remove('open');});
  document.getElementById('notifyBtn').onclick=enableAlerts;
  document.addEventListener('click',unlockAudio,{once:true});
  setToday();
  refreshBadges();
  const startView=location.hash.slice(1);
  switchView(titles[startView]?startView:'dashboard');
  pullOnlineOrders();
  setInterval(pullOnlineOrders,6000);
  updateAlertButton();
}

async function startApplication() {
  try {
    await synchronizeState();
    initializeInterface();
  } catch (error) {
    console.error('Univers Gourmand startup sync error:', error);
    container.innerHTML='<section class="panel"><div class="empty-state" role="alert"><strong>Impossible de charger les données partagées.</strong><p>Vérifiez la connexion à la base de données et la mise à jour de la table de synchronisation, puis réessayez.</p><button class="secondary-button" id="retryStateSync">Réessayer</button></div></section>';
    document.getElementById('headerAction').disabled=true;
    document.getElementById('retryStateSync').onclick=()=>window.location.reload();
  }
}

startApplication();