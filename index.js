// Configuração do Tailwind via JS
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        }
      }
    }
  }
};

// Dados padrão extraídos diretamente dos arquivos originais da empresa
const INITIAL_DATA = [
  { id: 1, name: "ALEFE", seg: "FERIADO", ter: "EUD SH BAHIA", qua: "SH DA BAHIA", qui: "SH DA BAHIA", sex: "EUD SH BAHIA", sab: "SH DA BAHIA" },
  { id: 2, name: "ANDREA MILENA", seg: "FERIADO", ter: "PARIPE", qua: "PARIPE", qui: "LIBERDADE", sex: "SÃO CAETANO", sab: "LIBERDADE" },
  { id: 3, name: "ATOS ADRIANO", seg: "FERIADO", ter: "EUD SH BAHIA", qua: "-", qui: "-", sex: "-", sab: "-" },
  { id: 4, name: "ELISANGELA SENA", seg: "FERIADO", ter: "PERIPERI", qua: "CABULA", qui: "G OUTLET", sex: "RIBEIRA", sab: "PERIPERI" },
  { id: 5, name: "GUGLIELMO NEVES", seg: "FÉRIAS", ter: "FÉRIAS", qua: "FÉRIAS", qui: "FÉRIAS", sex: "FÉRIAS", sab: "FÉRIAS" },
  { id: 6, name: "IVISSON SANTOS", seg: "FERIADO", ter: "SH ITAIGARA", qua: "BELA VISTA", qui: "BELA VISTA", sex: "CAJ RÓTULA", sab: "CAJ RÓTULA" },
  { id: 7, name: "JULIANA ALMEIDA", seg: "FERIADO", ter: "EUD SSA", qua: "COSTA AZUL", qui: "QDB SSA", sex: "EUD SSA", sab: "COSTA AZUL" },
  { id: 8, name: "MAGNO DA SILVA", seg: "FERIADO", ter: "FERR COSTA BARRIS", qua: "SH BARRA", qui: "SH BROTAS", sex: "SH BARRA", sab: "SH BROTAS" },
  { id: 9, name: "UBIRATAN SANTOS", seg: "FERIADO", ter: "SH PARALELA", qua: "SH. SSA NORTE", qui: "SH. PARALELA", sex: "SH. SSA NORTE", sab: "SH. PARALELA" },
  { id: 10, name: "UESLEI BRITO", seg: "FERIADO", ter: "CASTELO BRANCO", qua: "MADISON", qui: "FERR COSTA PARALELA", sex: "CENTRO MATA", sab: "MADISON" },
  { id: 11, name: "WESLEY LIMA", seg: "FERIADO", ter: "SH. SSA 2", qua: "SH. SSA 1", qui: "SH. SSA 2", sex: "SH. SSA 1", sab: "SH. SSA 2" },
  { id: 12, name: "JOSÉ CARLOS", seg: "FERIADO", ter: "SH LAPA", qua: "SH LAPA", qui: "SH PIEDADE", sex: "QUIOSQ LAPA", sab: "SH PIEDADE" },
  { id: 13, name: "JOSEANA", seg: "FERIADO", ter: "PORTÃO", qua: "MIX STELA", qui: "CENTRO LAURO", sex: "SH SEC", sab: "PARK SHOPPING" }
];

let employeesData = [];
let storesCache = [];
// Modelo mensal: um dia por coluna (d{today}..dN) do mês corrente até o fim do mês.
// Mostra apenas os dias úteis (Seg a Sáb); datas passadas e domingos saem da tela (dados salvos).
function getMonthDays() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const count = new Date(year, month + 1, 0).getDate();
  const startDay = now.getDate();
  const days = [];
  for (let day = startDay; day <= count; day++) {
    const date = new Date(year, month, day);
    if (date.getDay() !== 0) days.push({ key: 'd' + day, date });
  }
  return days;
}
const MONTH_DAYS = getMonthDays();
const ASSIGNMENT_KEYS = MONTH_DAYS.map(d => d.key);
const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
function weekdayLabel(date) {
  return WEEKDAY_LABELS[date.getDay()];
}
const LEGACY_WEEK_KEYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const LEGACY_ASSIGNMENT_KEYS = ['seg1', 'ter1', 'qua1', 'qui1', 'sex1', 'sab1', 'seg2', 'ter2', 'qua2', 'qui2', 'sex2', 'sab2'];
const STORE_KEY = 'escala_operacional_varejo_stores';
const STORES_MANAGED_KEY = 'escala_operacional_varejo_stores_managed';
const DATA_KEY = 'escala_operacional_varejo_data';
const MIGRATION_KEY = 'escala_firebase_migrated';
const DEFAULT_STORES = [
  'EUD SH BAHIA', 'SH DA BAHIA', 'PARIPE', 'LIBERDADE', 'SÃO CAETANO',
  'PERIPERI', 'CABULA', 'G OUTLET', 'RIBEIRA', 'SH ITAIGARA', 'BELA VISTA',
  'CAJ RÓTULA', 'EUD SSA', 'COSTA AZUL', 'QDB SSA', 'FERR COSTA BARRIS',
  'SH BARRA', 'SH BROTAS', 'SH PARALELA', 'SH. SSA NORTE', 'CASTELO BRANCO',
  'MADISON', 'FERR COSTA PARALELA', 'CENTRO MATA', 'SH. SSA 2', 'SH. SSA 1',
  'SH LAPA', 'SH PIEDADE', 'QUIOSQ LAPA', 'PORTÃO', 'MIX STELA',
  'CENTRO LAURO', 'SH SEC', 'PARK SHOPPING'
];

// Lojas oficiais = união das lojas dos hubs (base de gerentes do seed / Firestore).
function getHubBaseStores() {
  const seedManagers = (typeof window !== 'undefined' && window.MANAGERS_SEED && Array.isArray(window.MANAGERS_SEED.managers))
    ? window.MANAGERS_SEED.managers
    : [];
  const hubs = seedManagers.length ? seedManagers : managersCache;
  const stores = new Set();
  hubs.forEach(hub => {
    (Array.isArray(hub.stores) ? hub.stores : []).forEach(store => stores.add(store));
  });
  return stores.size ? Array.from(stores) : DEFAULT_STORES;
}

// ============================================================
// ESTADO DO FIREBASE
// ============================================================
const IS_FIREBASE_CONFIGURED = typeof firebase !== 'undefined' &&
  firebaseConfig && firebaseConfig.apiKey && !String(firebaseConfig.apiKey).includes('SUA_API_KEY');

let isLocalMode = false;
let employeeUnsubscribe = null;
let storeUnsubscribe = null;
let managerUnsubscribe = null;

// ---- Estado de administradores ----
const ADMIN_EMAILS = ['xaununnes@gmail.com'];
let adminsCache = [];
let managersCache = [];
let isAdminUser = false;
let currentAdminEmail = null;
let adminUnsubscribe = null;

function isUsingFirebase() {
  return IS_FIREBASE_CONFIGURED && auth.currentUser && !isLocalMode;
}

function normalizeText(value) {
  return String(value || '').trim().toLocaleLowerCase('pt-BR')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
}

function getAssignments(employee) {
  return ASSIGNMENT_KEYS.map(key => String(employee[key] || '-'));
}

function normalizeEmployee(employee) {
  const normalized = migrateLegacyToDayKeys(employee);
  MONTH_DAYS.forEach(d => {
    if (normalized[d.key] == null || normalized[d.key] === '-') {
      normalized[d.key] = '-';
    }
  });
  return normalized;
}

// Converte o formato antigo (seg/ter/... e seg1..sab2) para o dia correspondente do mês,
// ancorando semanas no primeiro Seg do mês (mantém o alinhamento da planilha original).
function migrateLegacyToDayKeys(employee) {
  const result = { ...employee };
  LEGACY_WEEK_KEYS.forEach((base, wi) => {
    const target = getMonthWeekDayKey(0, wi);
    if (target && result[base] != null && (result[target] == null || result[target] === '-')) {
      result[target] = result[base];
    }
  });
  LEGACY_ASSIGNMENT_KEYS.forEach(key => {
    const m = /^(seg|ter|qua|qui|sex|sab)([12])$/.exec(key);
    if (m) {
      const wi = LEGACY_WEEK_KEYS.indexOf(m[1]);
      const target = getMonthWeekDayKey(Number(m[2]) - 1, wi);
      if (target && result[key] != null && (result[target] == null || result[target] === '-')) {
        result[target] = result[key];
      }
    }
  });
  return result;
}

// Dia do mês correspondente a uma posição (weekIndex 0 ou 1; dowIndex 0=Seg..5=Sáb).
function getMonthWeekDayKey(weekIndex, dowIndex) {
  const first = MONTH_DAYS[0].date;
  const y = first.getFullYear();
  const m = first.getMonth();
  let firstMonday = 1;
  while (new Date(y, m, firstMonday).getDay() !== 1) firstMonday++;
  const target = new Date(y, m, firstMonday + weekIndex * 7 + dowIndex);
  if (target.getMonth() !== m) return null;
  return 'd' + target.getDate();
}

function getPeriodDates() {
  return MONTH_DAYS.map(d => d.date);
}

function getStoreListFromAssignments() {
  const stores = new Set();
  employeesData.forEach(emp => {
    ASSIGNMENT_KEYS.forEach(key => {
      const value = String(emp[key] || '').trim();
      if (value && !isSpecialAssignment(value)) stores.add(value.toUpperCase());
    });
  });
  return Array.from(stores);
}

function mergeStoreLists(...lists) {
  const seen = new Set();
  const result = [];
  lists.forEach(list => {
    (list || []).forEach(item => {
      const key = normalizeText(item);
      if (item && !seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    });
  });
  return result;
}

function getStoreList() {
  return mergeStoreLists(storesCache, getStoreListFromAssignments());
}

async function saveStoreList(stores) {
  storesManuallyManaged = true;
  localStorage.setItem(STORES_MANAGED_KEY, 'true');
  storesCache = [...stores];
  if (isUsingFirebase()) {
    try {
      await db.collection('config').doc('stores').set({ stores }, { merge: true });
    } catch (error) {
      alert('Erro ao salvar lojas: ' + error.message);
    }
  } else {
    localStorage.setItem(STORE_KEY, JSON.stringify(stores));
  }
  populateAssignmentSelects();
  populateLocationDropdown();
  updateKPIs();
}

function isSpecialAssignment(value) {
  const normalized = normalizeText(value);
  return !value || value === '-' || ['feriado', 'ferias', 'folga', 'atestado'].includes(normalized);
}

// Correspondência de loja entre a escala e a base de gerentes
// Implementação compartilhada em matching.js (window.Matching.storeNameMatches)

let storesSyncPending = false;
let storesManuallyManaged = localStorage.getItem(STORES_MANAGED_KEY) === 'true';

async function ensureStoresDoc() {
  if (!isUsingFirebase() || storesSyncPending) return;
  storesSyncPending = true;
  try {
    if (storesManuallyManaged) return;
    const ref = db.collection('config').doc('stores');
    const doc = await ref.get();
    const current = doc.exists && Array.isArray(doc.data().stores) ? doc.data().stores : [];
    const currentNorm = current.map(normalizeText);
    const wantedNorm = getHubBaseStores().map(normalizeText);
    const needsRepair =
      currentNorm.length !== wantedNorm.length ||
      currentNorm.some((name, i) => name !== wantedNorm[i]);
    if (needsRepair) {
      storesCache = getHubBaseStores();
      await ref.set({ stores: storesCache }, { merge: true });
      populateAssignmentSelects();
      populateLocationDropdown();
      updateKPIs();
    } else {
      storesCache = current;
    }
    storesManuallyManaged = true;
    localStorage.setItem(STORES_MANAGED_KEY, 'true');
  } catch (error) {
    console.error('Erro ao sincronizar lojas:', error);
  } finally {
    storesSyncPending = false;
  }
}

function populateAssignmentSelects() {
  const options = ['<option value="-">-</option>', '<option value="FERIADO">FERIADO</option>', '<option value="FÉRIAS">FÉRIAS</option>', '<option value="FOLGA">FOLGA</option>', '<option value="ATESTADO">ATESTADO</option>']
    .concat(getStoreList().sort().map(store => `<option value="${escapeHtml(store)}">${escapeHtml(store)}</option>`))
    .join('');
  document.querySelectorAll('.assignment-select').forEach(select => {
    const currentValue = select.value;
    select.innerHTML = options;
    select.value = currentValue || '-';
  });
}

// Gerenciamento de lojas (modal)
function openStoreManager() {
  renderStoreList();
  document.getElementById('newStoreInput').value = '';
  document.getElementById('storeModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('newStoreInput').focus(), 0);
}

function closeStoreModal() {
  document.getElementById('storeModal').classList.add('hidden');
}

function getRegisteredStoreList() {
  const map = new Map();
  storesCache.forEach(store => {
    if (!map.has(normalizeText(store))) map.set(normalizeText(store), store);
  });
  return Array.from(map.values());
}

function renderStoreList() {
  const stores = getRegisteredStoreList();
  const list = document.getElementById('storeList');
  list.innerHTML = '';
  document.getElementById('storesEmptyMsg').classList.toggle('hidden', stores.length > 0);
  stores.sort().forEach(store => {
    const li = document.createElement('li');
    li.className = 'flex items-center justify-between py-2.5 gap-3';
    li.dataset.storeName = store;
    li.innerHTML = `
      <span class="flex items-center gap-2 text-sm font-medium text-slate-700"><i class="fa-solid fa-store text-emerald-600"></i>${escapeHtml(store)}</span>
      <div class="flex items-center gap-1">
        <button type="button" class="edit-store-btn text-sky-600 hover:text-sky-700 px-2 text-sm font-semibold" data-store="${escapeHtml(store)}" title="Editar loja"><i class="fa-solid fa-pen"></i></button>
        <button type="button" class="remove-store-btn text-red-500 hover:text-red-600 text-sm font-semibold" data-store="${escapeHtml(store)}" title="Excluir loja"><i class="fa-solid fa-trash mr-1"></i>Excluir</button>
      </div>
    `;
    list.appendChild(li);
  });
}

function startStoreEdit(button) {
  const li = button.closest('li');
  const storeName = button.dataset.store;
  li.innerHTML = `
    <input type="text" class="store-edit-input flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" value="${escapeHtml(storeName)}">
    <div class="flex items-center gap-1">
      <button type="button" class="store-edit-save bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-2 text-sm font-semibold" title="Salvar">Salvar</button>
      <button type="button" class="store-edit-cancel text-slate-500 hover:text-slate-700 rounded-lg px-3 py-2 text-sm font-semibold" title="Cancelar">Cancelar</button>
    </div>
  `;
  const input = li.querySelector('.store-edit-input');
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitStoreEdit(li, storeName);
    } else if (event.key === 'Escape') {
      renderStoreList();
    }
  });
  input.focus();
  input.select();
}

async function commitStoreEdit(li, oldName) {
  const input = li.querySelector('.store-edit-input');
  const newName = (input.value || '').trim().toUpperCase();
  if (!newName) {
    input.focus();
    return;
  }
  if (normalizeText(newName) === normalizeText(oldName)) {
    renderStoreList();
    return;
  }
  const stores = getStoreList();
  if (stores.some(store => normalizeText(store) === normalizeText(newName))) {
    alert('Já existe uma loja com este nome.');
    return;
  }
  await renameStore(oldName, newName);
  renderStoreList();
}

async function renameStore(oldName, newName) {
  const stores = getStoreList().map(store =>
    normalizeText(store) === normalizeText(oldName) ? newName : store
  );
  let recalculated = false;
  employeesData.forEach(emp => {
    ASSIGNMENT_KEYS.forEach(key => {
      if (normalizeText(emp[key]) === normalizeText(oldName)) {
        emp[key] = newName;
        recalculated = true;
      }
    });
  });
  await saveStoreList(stores);
  if (recalculated) await saveData();
  refreshUI();
}

async function addStore(storeName) {
  const store = (storeName || '').trim();
  if (!store) return;
  const stores = getStoreList();
  if (stores.some(existing => normalizeText(existing) === normalizeText(store))) {
    alert('Esta loja já existe na lista.');
    return;
  }
  stores.push(store);
  await saveStoreList(stores);
}

async function addStoreFromInput() {
  const input = document.getElementById('newStoreInput');
  const store = (input.value || '').trim();
  if (!store) return;
  const normalizedStore = store.toUpperCase();
  await addStore(normalizedStore);
  renderStoreList();
  input.value = '';
  input.focus();
}

async function deleteStore(storeName) {
  if (!confirm(`Excluir a loja "${storeName}" da lista padrão?`)) return;
  const stores = getStoreList().filter(store => normalizeText(store) !== normalizeText(storeName));
  await saveStoreList(stores);
  renderStoreList();
}

// Une lojas que representam a mesma unidade (por matching) e remove as duplicadas.
async function removeDuplicateStores() {
  const current = getRegisteredStoreList();
  if (!current.length) {
    alert('Nenhuma loja cadastrada.');
    return;
  }
  const bases = getHubBaseStores();
  const matchSame = (a, b) => normalizeText(a) === normalizeText(b) ||
    (typeof window !== 'undefined' && window.Matching && window.Matching.storeNameMatches(a, b));
  const seen = new Set();
  const removed = [];
  const merged = [];
  current.forEach(store => {
    const canonical = bases.find(base => matchSame(base, store)) || null;
    const key = normalizeText(canonical || store);
    if (seen.has(key)) {
      removed.push(store);
      return;
    }
    seen.add(key);
    merged.push(canonical || store);
  });
  if (!removed.length) {
    alert('Nenhuma loja duplicada encontrada.');
    return;
  }
  if (!confirm(`Encontradas ${removed.length} loja(s) duplicada(s).\n\nRemovendo:\n${removed.join(', ')}\n\nContinuar?`)) return;
  await saveStoreList(merged);
  renderStoreList();
}

function formatShortDate(date) {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  });
}

let tableHeadersInitialized = false;

// Gera as colunas de dias do mês no cabeçalho da tabela (Funcionário | d1..dN | Ações)
function initTableHeaders() {
  const row = document.getElementById('tableHeaderRow');
  if (!row || tableHeadersInitialized) return;
  tableHeadersInitialized = true;
  const actionsTh = row.querySelector('th.no-print');
  MONTH_DAYS.forEach((d, i) => {
    const th = document.createElement('th');
    th.dataset.dayIndex = i;
    th.className = 'py-2 px-2 text-center text-[10px] sm:text-xs';
    row.insertBefore(th, actionsTh);
  });
  updatePrintPeriod();
}

function updatePrintPeriod() {
  const dates = getPeriodDates();

  document.getElementById('printPeriod').innerText =
    `Período: ${formatShortDate(dates[0])} a ${formatShortDate(dates[dates.length - 1])}`;
  const summary = document.getElementById('periodSummary');
  if (summary) {
    summary.innerText = `${formatShortDate(dates[0])} a ${formatShortDate(dates[dates.length - 1])}`;
  }
  const now = new Date();
  document.getElementById('printDate').innerText =
    now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
  document.querySelectorAll('#escalaTable th[data-day-index]').forEach(element => {
    const index = Number(element.dataset.dayIndex);
    const date = dates[index];
    element.innerHTML = `<span class="day-name">${weekdayLabel(date)}</span><span class="day-date">${formatShortDate(date)}</span>`;
  });
}

// Preenche os selects por dia do mês no modal de colaborador
function buildEmployeeDayFields() {
  const grid = document.getElementById('fieldGrid');
  if (!grid) return;
  grid.innerHTML = '';
  MONTH_DAYS.forEach(d => {
    const label = document.createElement('label');
    label.className = 'text-xs font-semibold text-slate-600';
    label.innerHTML = `${d.date.getDate()}/${String(d.date.getMonth() + 1).padStart(2, '0')} <span class="text-slate-400">${weekdayLabel(d.date)}</span>`;
    const select = document.createElement('select');
    select.id = 'field' + d.key;
    select.className = 'assignment-select block w-full mt-1 border border-slate-300 rounded-lg px-2 py-2 text-sm';
    select.innerHTML = '<option value="-">-</option>';
    label.appendChild(select);
    grid.appendChild(label);
  });
  populateAssignmentSelects();
}

// Inicialização de elementos de UI que dependem de data
function initPrintUI() {
  const now = new Date();
  document.getElementById('printDate').innerText = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
  initTableHeaders();
  buildEmployeeDayFields();
  updatePrintPeriod();
}

// ============================================================
// AUTENTICAÇÃO
// ============================================================
function getAuthErrorMessage(error) {
  const code = error.code || '';
  const map = {
    'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
    'auth/invalid-email': 'Endereço de e-mail inválido.',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
    'auth/user-not-found': 'Nenhuma conta encontrada com este e-mail.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns instantes.',
    'auth/network-request-failed': 'Falha de conexão. Verifique sua internet.',
    'auth/operation-not-allowed': 'Login com e-mail/senha não habilitado no Firebase Console.',
    'auth/invalid-api-key': 'API key inválida. Verifique a configuração do Firebase.'
  };
  return map[code] || error.message || 'Erro inesperado.';
}

function setAuthLoading(loading) {
  const button = document.getElementById('loginSubmitBtn');
  if (loading) {
    if (!button.dataset.original) button.dataset.original = button.innerHTML;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Aguarde...';
    button.classList.add('btn-loading');
  } else {
    if (button.dataset.original) button.innerHTML = button.dataset.original;
    button.classList.remove('btn-loading');
  }
}

function showFormError(message) {
  const element = document.getElementById('loginError');
  element.textContent = message;
  element.classList.remove('hidden');
  element.classList.remove('auth-error');
  void element.offsetWidth;
  element.classList.add('auth-error');
}

async function handleLogin(event) {
  event.preventDefault();
  if (!IS_FIREBASE_CONFIGURED) {
    showFormError('Firebase não configurado. Use o modo local.');
    return;
  }
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  setAuthLoading(true);
  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (err) {
    showFormError(getAuthErrorMessage(err));
  } finally {
    setAuthLoading(false);
  }
}

async function handleLogout() {
  stopListeners();
  stopAdminListener();
  isLocalMode = false;
  if (IS_FIREBASE_CONFIGURED) {
    try { await auth.signOut(); } catch (e) { /* ignore */ }
  }
  showLogin();
}

function enterLocalMode() {
  isLocalMode = true;
  loadStoresFromLocalStorage();
  const saved = localStorage.getItem(DATA_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      employeesData = Array.isArray(parsed) ? parsed.map(normalizeEmployee) : INITIAL_DATA.map(normalizeEmployee);
    } catch (e) {
      employeesData = INITIAL_DATA.map(normalizeEmployee);
    }
  } else {
    employeesData = INITIAL_DATA.map(normalizeEmployee);
  }
  if (!storesCache.length) storesCache = [...DEFAULT_STORES];
  initPrintUI();
  showApp();
  refreshUI();
}

function loadStoresFromLocalStorage() {
  const saved = localStorage.getItem(STORE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) storesCache = parsed;
    } catch (e) { /* ignore */ }
  }
}

function showApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appContent').classList.remove('hidden');
  if (typeof auth !== 'undefined' && auth.currentUser) {
    document.getElementById('userDisplay').innerText = auth.currentUser.displayName || auth.currentUser.email || '';
  }
}

function showLogin() {
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('appContent').classList.add('hidden');
}

// ============================================================
// FIREBASE - DADOS E MIGRAÇÃO
// ============================================================
function refreshUI() {
  updateKPIs();
  populateLocationDropdown();
  populatePersonDropdown();
  renderTable();
  renderStoreCoverage();
}

async function migrateLocalToFirestore() {
  if (localStorage.getItem(MIGRATION_KEY)) return;
  const savedData = localStorage.getItem(DATA_KEY);
  const savedStores = localStorage.getItem(STORE_KEY);
  if (!savedData && !savedStores) return;

  const batch = db.batch();
  let migrated = false;

  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      const list = Array.isArray(parsed) ? parsed.map(normalizeEmployee) : [];
      list.forEach(emp => {
        const { id, ...data } = emp;
        batch.set(db.collection('employees').doc(String(id)), data);
      });
      if (list.length) migrated = true;
    } catch (e) { /* ignore */ }
  }

  if (savedStores) {
    try {
      const parsed = JSON.parse(savedStores);
      if (Array.isArray(parsed) && parsed.length) {
        batch.set(db.collection('config').doc('stores'), { stores: parsed });
        migrated = true;
      }
    } catch (e) { /* ignore */ }
  }

  if (migrated) {
    await batch.commit();
    localStorage.setItem(MIGRATION_KEY, 'true');
  }
}

function setupFirestoreListeners() {
  employeeUnsubscribe = db.collection('employees')
    .onSnapshot(snapshot => {
      employeesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...normalizeEmployee(doc.data())
      }));
      refreshUI();
      ensureStoresDoc();
    }, error => {
      console.error('Erro ao escutar funcionários:', error);
    });

  storeUnsubscribe = db.collection('config').doc('stores')
    .onSnapshot(doc => {
      if (doc.exists) {
        const data = doc.data();
        if (Array.isArray(data.stores) && data.stores.length) {
          storesCache = data.stores;
        }
      } else {
        storesCache = [];
        ensureStoresDoc();
      }
      populateAssignmentSelects();
      populateLocationDropdown();
      updateKPIs();
    }, error => {
      console.error('Erro ao escutar lojas:', error);
    });

  managerUnsubscribe = db.collection('managers')
    .onSnapshot(snapshot => {
      managersCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      populatePersonDropdown();
      renderManagersAdmin();
    }, error => {
      console.error('Erro ao escutar gerentes:', error);
    });
}

function stopListeners() {
  if (employeeUnsubscribe) employeeUnsubscribe();
  if (storeUnsubscribe) storeUnsubscribe();
  if (managerUnsubscribe) managerUnsubscribe();
  employeeUnsubscribe = null;
  storeUnsubscribe = null;
  managerUnsubscribe = null;
}

async function initFirebaseSession() {
  initPrintUI();
  await migrateLocalToFirestore();
  setupFirestoreListeners();
}

function setupAuth() {
  if (!IS_FIREBASE_CONFIGURED) {
    storesCache = [...DEFAULT_STORES];
    document.getElementById('firebaseWarning').classList.remove('hidden');
    document.getElementById('localModeBtn').classList.remove('hidden');
    return;
  }
  auth.onAuthStateChanged(user => {
    if (user) {
      showApp();
      stopListeners();
      stopAdminListener();
      initFirebaseSession();
      setupAdminListener();
    } else {
      stopListeners();
      stopAdminListener();
      showLogin();
    }
  });
}

// ============================================================
// ADMINISTRADORES
// ============================================================
function setupAdminListener() {
  const user = auth.currentUser;
  if (!user || !user.email) return;
  currentAdminEmail = user.email.toLowerCase();

  adminUnsubscribe = db.collection('admins')
    .onSnapshot(snapshot => {
      adminsCache = snapshot.docs.map(doc => {
        const data = doc.data() || {};
        return { id: doc.id, email: (data.email || doc.id).toLowerCase(), name: data.name || doc.id, ...data };
      });
      isAdminUser = true;
      bootstrapSelfAdmin(currentAdminEmail);
      renderAdminList();
      seedManagers();
      document.getElementById('tabAdminBtn').classList.remove('hidden');
    }, error => {
      // Apenas administradores podem ler a coleção admins
      isAdminUser = false;
      hideAdminUI();
    });
}

function stopAdminListener() {
  if (adminUnsubscribe) adminUnsubscribe();
  adminUnsubscribe = null;
  adminsCache = [];
  isAdminUser = false;
  hideAdminUI();
}

function bootstrapSelfAdmin(email) {
  if (!ADMIN_EMAILS.includes(email)) return;
  if (adminsCache.some(admin => admin.email === email)) return;
  const user = auth.currentUser;
  db.collection('admins').doc(email).set({
    email: email,
    name: (user && user.displayName) || email,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    createdBy: 'sistema (bootstrap)'
  }).catch(err => console.error('Erro ao registrar administrador inicial:', err));
}

let managersSeeded = false;

// Popula a coleção "managers" (gerentes -> lojas) no Firestore se ainda não existir
async function seedManagers() {
  if (managersSeeded || !isUsingFirebase() || !isAdminUser) return;
  if (!window.MANAGERS_SEED || !Array.isArray(window.MANAGERS_SEED.managers)) return;
  managersSeeded = true;
  try {
    const snapshot = await db.collection('managers').limit(1).get();
    if (!snapshot.empty) return;
    const batch = db.batch();
    window.MANAGERS_SEED.managers.forEach(manager => {
      const name = String(manager.hub || '').replace(/^Hub\s+/i, '');
      const id = 'hub-' + normalizeText(name).replace(/\s+/g, '-');
      batch.set(db.collection('managers').doc(id), {
        name,
        hub: manager.hub,
        division: window.MANAGERS_SEED.division,
        stores: manager.stores || [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: 'sistema (seed)'
      });
    });
    await batch.commit();
    console.log('Coleção "managers" populada com ' + window.MANAGERS_SEED.managers.length + ' gerentes.');
  } catch (error) {
    managersSeeded = false;
    console.error('Erro ao semear gerentes:', error);
  }
}

function renderManagersAdmin() {
  const count = document.getElementById('managersCount');
  const list = document.getElementById('managersList');
  if (!count || !list) return;
  count.textContent = managersCache.length;
  list.innerHTML = '';
  if (!managersCache.length) {
    list.innerHTML = '<p class="text-sm text-slate-400 col-span-full">Nenhum gerente importado ainda. Clique em "Importar gerentes do seed".</p>';
    return;
  }
  managersCache
    .slice()
    .sort((a, b) => normalizeText(a.hub).localeCompare(normalizeText(b.hub)))
    .forEach(manager => {
      const card = document.createElement('div');
      card.className = 'border border-slate-200 rounded-lg p-3';
      card.innerHTML =
        '<p class="font-semibold text-slate-800 text-sm">' + escapeHtml(manager.hub) + '</p>' +
        '<p class="text-xs text-slate-500 mt-1">' + (Array.isArray(manager.stores) ? manager.stores : []).map(escapeHtml).join(', ') + '</p>';
      list.appendChild(card);
    });
}

async function importManagers() {
  const status = document.getElementById('managersStatus');
  if (!status) return;
  if (!isUsingFirebase() || !isAdminUser) {
    status.textContent = 'Faça login como administrador para importar os gerentes.';
    return;
  }
  if (!window.MANAGERS_SEED || !Array.isArray(window.MANAGERS_SEED.managers)) {
    status.textContent = 'Dados de seed não encontrados.';
    return;
  }
  status.textContent = 'Importando...';
  try {
    await db.collection('managers').get();
    const batch = db.batch();
    window.MANAGERS_SEED.managers.forEach(manager => {
      const name = String(manager.hub || '').replace(/^Hub\s+/i, '');
      const id = 'hub-' + normalizeText(name).replace(/\s+/g, '-');
      batch.set(db.collection('managers').doc(id), {
        name,
        hub: manager.hub,
        division: window.MANAGERS_SEED.division,
        stores: manager.stores || [],
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });
    await batch.commit();
    status.textContent = 'Importação concluída com sucesso! (' + window.MANAGERS_SEED.managers.length + ' gerentes)';
  } catch (error) {
    status.textContent = 'Erro na importação: ' + (error.message || error);
  }
}

function hideAdminUI() {
  const button = document.getElementById('tabAdminBtn');
  if (button) button.classList.add('hidden');
  const view = document.getElementById('adminView');
  if (view && !view.classList.contains('hidden')) {
    switchTab('table');
  }
}

function renderAdminList() {
  const list = document.getElementById('adminList');
  list.innerHTML = '';

  if (!adminsCache.length) {
    list.innerHTML = '<li class="text-sm text-slate-500">Nenhum administrador cadastrado.</li>';
    return;
  }

  adminsCache.forEach(admin => {
    const currentUserEmail = auth.currentUser && auth.currentUser.email ? auth.currentUser.email.toLowerCase() : '';
    const isSelf = admin.email === currentUserEmail;

    const li = document.createElement('li');
    li.className = 'flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3';

    const nameDisplay = escapeHtml((admin.name || admin.email).trim());
    const emailDisplay = escapeHtml(admin.email);

    li.innerHTML = `
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">${escapeHtml(String(admin.name || admin.email).trim().charAt(0).toUpperCase())}</div>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-slate-800 truncate">${nameDisplay} ${isSelf ? '<span class="text-xs text-emerald-600 font-medium ml-1">(você)</span>' : ''}</p>
          <p class="text-xs text-slate-500 truncate">${emailDisplay}</p>
        </div>
      </div>
      ${isSelf ? '' : `<button type="button" class="remove-admin-btn px-2.5 py-1.5 rounded-md text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition" data-email="${escapeHtml(admin.email)}" title="Remover administrador"><i class="fa-solid fa-user-minus mr-1"></i>Remover</button>`}
    `;

    list.appendChild(li);
  });
}

function setAdminLoading(loading) {
  const button = document.getElementById('adminCreateBtn');
  if (loading) {
    if (!button.dataset.original) button.dataset.original = button.innerHTML;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Criando...';
    button.classList.add('btn-loading');
  } else {
    if (button.dataset.original) button.innerHTML = button.dataset.original;
    button.classList.remove('btn-loading');
  }
}

function showAdminError(message) {
  const element = document.getElementById('adminCreateError');
  element.textContent = message;
  element.classList.remove('hidden');
}

async function createAdminUser(event) {
  event.preventDefault();
  const errorEl = document.getElementById('adminCreateError');
  errorEl.classList.add('hidden');

  const name = document.getElementById('adminNewName').value.trim().toUpperCase();
  const email = document.getElementById('adminNewEmail').value.trim().toLowerCase();
  const password = document.getElementById('adminNewPassword').value;
  const adminPassword = document.getElementById('adminConfirmPassword').value;
  const previousAdminEmail = currentAdminEmail;

  if (email === previousAdminEmail) {
    errorEl.textContent = 'Este e-mail já é o seu. Informe um e-mail diferente.';
    errorEl.classList.remove('hidden');
    return;
  }

  setAdminLoading(true);
  try {
    // 1. Registra o novo admin (validação: regras do Firestore)
    await db.collection('admins').doc(email).set({
      email: email,
      name: name,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: previousAdminEmail
    });

    // 2. Cria a conta no Firebase Auth
    let credential;
    try {
      credential = await auth.createUserWithEmailAndPassword(email, password);
      await credential.user.updateProfile({ displayName: name });
    } catch (err) {
      await db.collection('admins').doc(email).delete().catch(() => {});
      throw err;
    }

    // 3. Restaura a sessão do administrador original
    try {
      await auth.signInWithEmailAndPassword(previousAdminEmail, adminPassword);
    } catch (restoreError) {
      await auth.signOut().catch(() => {});
      errorEl.textContent = 'Conta criada, mas a sessão não pôde ser restaurada. Entre novamente com seu e-mail.';
      errorEl.classList.remove('hidden');
      return;
    }

    alert(`Administrador ${name} (${email}) criado com sucesso!`);
    document.getElementById('adminCreateForm').reset();
    errorEl.classList.add('hidden');
  } catch (err) {
    errorEl.textContent = getAuthErrorMessage(err);
    errorEl.classList.remove('hidden');
  } finally {
    setAdminLoading(false);
  }
}

async function removeAdmin(email) {
  if (!confirm('Deseja remover este usuário da lista de administradores?')) return;

  const currentUserEmail = auth.currentUser && auth.currentUser.email ? auth.currentUser.email.toLowerCase() : '';
  if (email === currentUserEmail) {
    alert('Você não pode remover a si mesmo.');
    return;
  }

  try {
    await db.collection('admins').doc(email.toLowerCase()).delete();
  } catch (error) {
    alert('Erro ao remover administrador: ' + error.message);
  }
}

// ============================================================
// PERSISTÊNCIA
// ============================================================
async function saveData() {
  if (isUsingFirebase()) {
    try {
      const batch = db.batch();
      employeesData.forEach(emp => {
        const { id, ...data } = emp;
        batch.set(db.collection('employees').doc(String(id)), data, { merge: true });
      });
      await batch.commit();
    } catch (error) {
      alert('Erro ao salvar dados: ' + error.message);
    }
    return;
  }
  localStorage.setItem(DATA_KEY, JSON.stringify(employeesData));
  refreshUI();
}

async function resetData() {
  if (!confirm('Deseja restaurar a escala para o formato original da planilha?')) return;
  if (isUsingFirebase()) {
    try {
      const snapshot = await db.collection('employees').get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      INITIAL_DATA.map(normalizeEmployee).forEach(emp => {
        const { id, ...data } = emp;
        batch.set(db.collection('employees').doc(String(id)), data);
      });
      await batch.commit();
    } catch (error) {
      alert('Erro ao restaurar dados: ' + error.message);
    }
    return;
  }
  employeesData = INITIAL_DATA.map(normalizeEmployee);
  saveData();
}

// ============================================================
// RENDERIZAÇÃO
// ============================================================

// Formatação de badges de localização/status
function formatCellBadge(text) {
  if (!text || text === '-' || text.trim() === '') {
    return `<span class="inline-block px-2 py-1 rounded text-xs font-medium text-slate-400 bg-slate-50" title="-">-</span>`;
  }
  
  const cleanText = String(text).trim();
  const safeText = escapeHtml(cleanText);
  const upper = cleanText.toUpperCase();

  if (upper.includes('FERIADO')) {
    return `<span class="inline-block px-2.5 py-1 rounded-md text-xs font-semibold badge-feriado" title="${safeText}"><i class="fa-solid fa-flag mr-1 text-red-500"></i>${safeText}</span>`;
  }
  if (upper.includes('FÉRIAS') || upper.includes('FERIAS')) {
    return `<span class="inline-block px-2.5 py-1 rounded-md text-xs font-semibold badge-ferias" title="${safeText}"><i class="fa-solid fa-sun mr-1 text-amber-500"></i>${safeText}</span>`;
  }
  if (upper.includes('FOLGA')) {
    return `<span class="inline-block px-2 py-1 rounded-md text-xs font-medium badge-folga" title="${safeText}">${safeText}</span>`;
  }
  if (upper.includes('ATESTADO')) {
    return `<span class="inline-block px-2.5 py-1 rounded-md text-xs font-semibold badge-atestado" title="${safeText}"><i class="fa-solid fa-file-medical mr-1 text-violet-500"></i>${safeText}</span>`;
  }

  return `<span class="inline-block px-2.5 py-1 rounded-md text-xs font-semibold badge-loja" title="${safeText}"><i class="fa-solid fa-store mr-1 text-sky-500"></i>${safeText}</span>`;
}

// Renderizar tabela principal
// Lojas efetivas de um gerente = doc do Firestore + seed local (fonte de verdade), sem duplicar.
function getManagerStores(manager) {
  const docStores = Array.isArray(manager.stores) ? manager.stores : [];
  let seedStores = [];
  if (window.MANAGERS_SEED && Array.isArray(window.MANAGERS_SEED.managers)) {
    const sm = window.MANAGERS_SEED.managers.find(sm => normalizeText(sm.hub) === normalizeText(manager.hub));
    if (sm && Array.isArray(sm.stores)) seedStores = sm.stores;
  }
  return mergeStoreLists(docStores, seedStores);
}

function renderManagerBanner(manager) {
  const banner = document.getElementById('managerBanner');
  const title = document.getElementById('managerBannerTitle');
  const stores = document.getElementById('managerBannerStores');
  if (!manager) {
    banner.classList.add('hidden');
    return;
  }
  stores.innerHTML = '';
  const managerStores = getManagerStores(manager);
  title.textContent = manager.hub + ' atende ' + managerStores.length + ' loja(s):';
  managerStores.forEach(store => {
    const chip = document.createElement('span');
    chip.className = 'inline-flex items-center gap-1 bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold px-2 py-1 rounded-md';
    chip.innerHTML = '<i class="fa-solid fa-store"></i>' + escapeHtml(store);
    stores.appendChild(chip);
  });
  banner.classList.remove('hidden');
}

function renderTable() {
  const tbody = document.getElementById('tableBody');
  const searchVal = normalizeText(document.getElementById('searchInput').value);
  const statusFilter = document.getElementById('filterStatus').value;
  const locationFilter = document.getElementById('filterLocation').value;
  const personFilter = document.getElementById('filterPerson').value;

  let selectedManager = null;
  if (personFilter && personFilter.startsWith('mgr:')) {
    selectedManager = managersCache.find(m => normalizeText(m.hub) === normalizeText(personFilter.slice(4))) || null;
  }
  renderManagerBanner(selectedManager);

  tbody.innerHTML = '';
  let visibleCount = 0;
  const periodDates = getPeriodDates();

  employeesData.forEach((emp) => {
    // Filtro de busca
    const matchesSearch = normalizeText(emp.name).includes(searchVal) ||
      getAssignments(emp).some(val => normalizeText(val).includes(searchVal));

    // Filtro por pessoa (funcionário ou gerente)
    let matchesPerson = true;
    if (personFilter) {
      if (personFilter.startsWith('emp:')) {
        const filterName = normalizeText(personFilter.slice(4));
        matchesPerson = normalizeText(emp.name) === filterName || personFilter === 'emp:' + String(emp.id);
      } else if (personFilter.startsWith('mgr:')) {
        if (selectedManager) {
          matchesPerson = getAssignments(emp).some(val =>
            getManagerStores(selectedManager).some(store => Matching.storeNameMatches(val, store)));
        } else {
          matchesPerson = false;
        }
      }
    }

    // Filtro de status
    const isOnLeave = getAssignments(emp).some(val => normalizeText(val).includes('ferias'));
    let matchesStatus = true;
    if (statusFilter === 'FERIAS') matchesStatus = isOnLeave;
    if (statusFilter === 'ATIVOS') matchesStatus = !isOnLeave;

    // Filtro de Localização
    let matchesLocation = true;
    if (locationFilter !== 'ALL') {
      matchesLocation = getAssignments(emp).some(val => normalizeText(val) === normalizeText(locationFilter));
    }

    if (matchesSearch && matchesStatus && matchesLocation && matchesPerson) {
      visibleCount++;
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50/80 transition-colors border-b border-slate-200/60';

      tr.innerHTML = `
        <td class="py-3 px-4 font-semibold text-slate-800 sticky left-0 bg-white border-r border-slate-200 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="employee-name" title="${escapeHtml(emp.name)}">${escapeHtml(emp.name)}</span>
          </div>
        </td>
        ${ASSIGNMENT_KEYS.map((key, i) => `<td data-day-index="${i}" data-label="${weekdayLabel(periodDates[i])} ${formatShortDate(periodDates[i])}" class="py-2.5 px-3 text-center border-l border-slate-200">${formatCellBadge(emp[key])}</td>`).join('')}
        <td class="py-2.5 px-3 text-center border-l border-slate-200 no-print actions-cell">
          <div class="flex items-center justify-center gap-1">
            <button onclick="editEmployee('${escapeHtml(String(emp.id))}')" title="Editar Escala" class="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="clearEmployee('${escapeHtml(String(emp.id))}')" title="Limpar escala (dias voltam a -)" class="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition">
              <i class="fa-solid fa-eraser"></i>
            </button>
            <button onclick="deleteEmployee('${escapeHtml(String(emp.id))}')" title="Excluir Colaborador" class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    }
  });

  document.getElementById('emptyMessage').classList.toggle('hidden', visibleCount > 0);
}

// Limpa os dados preenchidos do dia para um funcionário (todos os dias voltam a "-").
async function clearEmployee(id) {
  const emp = employeesData.find(e => String(e.id) === String(id));
  if (!emp) return;
  if (!confirm(`Limpar a escala de "${emp.name}"? Todos os dias voltarão a "-".`)) return;
  ASSIGNMENT_KEYS.forEach(key => { emp[key] = '-'; });
  if (isUsingFirebase()) {
    try {
      const { id: empId, ...data } = emp;
      await db.collection('employees').doc(String(empId)).set(data, { merge: true });
    } catch (error) {
      alert('Erro ao limpar escala: ' + error.message);
      return;
    }
  } else {
    localStorage.setItem(DATA_KEY, JSON.stringify(employeesData));
  }
  refreshUI();
}

// Atualizar Indicadores
function updateKPIs() {
  document.getElementById('statTotalEmployees').innerText = employeesData.length;

  const onLeaveCount = employeesData.filter(emp => 
    getAssignments(emp).some(val => normalizeText(val).includes('ferias'))
  ).length;
  document.getElementById('statOnLeave').innerText = onLeaveCount;

  // Unidades cadastradas (lista persistida em config/stores)
  document.getElementById('statTotalStores').innerText = storesCache.length;
}

// Preencher dropdown de unidades
function populateLocationDropdown() {
  const select = document.getElementById('filterLocation');
  select.innerHTML = '<option value="ALL">Todas as Unidades</option>';

  const stores = storesCache.map(store => store.trim().toUpperCase()).sort();

  Array.from(stores).forEach(store => {
    const option = document.createElement('option');
    option.value = store;
    option.textContent = store;
    select.appendChild(option);
  });
}

// Preencher dropdown de pessoas (funcionários + gerentes)
function populatePersonDropdown() {
  const select = document.getElementById('filterPerson');
  if (!select) return;
  const previous = select.value;
  select.innerHTML = '<option value="">Todas as pessoas</option>';

  const byName = (a, b) => normalizeText(a).localeCompare(normalizeText(b));

  if (managersCache.length) {
    const group = document.createElement('optgroup');
    group.label = 'Gerentes';
    managersCache
      .slice()
      .sort((a, b) => byName(a.hub, b.hub))
      .forEach(manager => {
        const option = document.createElement('option');
        option.value = 'mgr:' + manager.hub;
        option.textContent = manager.hub;
        group.appendChild(option);
      });
    select.appendChild(group);
  }

  if (employeesData.length) {
    const group = document.createElement('optgroup');
    group.label = 'Funcionários';
    employeesData
      .slice()
      .sort((a, b) => byName(a.name, b.name))
      .forEach(emp => {
        const option = document.createElement('option');
        option.value = 'emp:' + normalizeText(emp.name);
        option.textContent = emp.name;
        group.appendChild(option);
      });
    select.appendChild(group);
  }

  if (previous) select.value = previous;
}

// Renderizar resumo por loja
function renderStoreCoverage() {
  const container = document.getElementById('storeCoverageContainer');
  container.innerHTML = '';

  const personFilter = document.getElementById('filterPerson').value;
  let selectedManager = null;
  if (personFilter && personFilter.startsWith('mgr:')) {
    selectedManager = managersCache.find(m => normalizeText(m.hub) === normalizeText(personFilter.slice(4))) || null;
  }

  const storeMap = {};

  employeesData.forEach(emp => {
    const days = ASSIGNMENT_KEYS.map((key, index) => {
      const date = getPeriodDates()[index];
      return {
        day: `${weekdayLabel(date)} (${formatShortDate(date)})`,
        val: emp[key]
      };
    });

    days.forEach(d => {
      const storeName = d.val ? d.val.trim() : '-';
      if (!isSpecialAssignment(storeName)) {
        if (!storeMap[storeName]) storeMap[storeName] = [];
        storeMap[storeName].push({ employee: emp.name, day: d.day });
      }
    });
  });

  const sortedStores = Object.keys(storeMap)
    .filter(store => !selectedManager || getManagerStores(selectedManager).some(mStore => Matching.storeNameMatches(store, mStore)))
    .sort();

  if (sortedStores.length === 0) {
    container.innerHTML = selectedManager
      ? '<p class="text-slate-500 text-sm">Nenhuma alocação encontrada nas lojas deste gerente.</p>'
      : '<p class="text-slate-500 text-sm">Nenhuma alocação em loja registrada.</p>';
    return;
  }

  sortedStores.forEach(store => {
    const card = document.createElement('div');
    card.className = 'bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm';

    let listHtml = '';
    storeMap[store].forEach(item => {
      listHtml += `
        <li class="flex justify-between items-center text-xs border-b border-slate-200/60 py-1.5">
          <span class="font-medium text-slate-700">${escapeHtml(item.employee)}</span>
          <span class="text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">${escapeHtml(item.day)}</span>
        </li>
      `;
    });

    card.innerHTML = `
      <div class="flex justify-between items-center mb-3">
        <h3 class="font-bold text-slate-800 text-sm flex items-center gap-2">
          <i class="fa-solid fa-location-dot text-emerald-600"></i> ${escapeHtml(store)}
        </h3>
        <span class="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-full">
          ${storeMap[store].length} alocações
        </span>
      </div>
      <ul class="space-y-0.5">
        ${listHtml}
      </ul>
    `;
    container.appendChild(card);
  });
}

// Modal Handlers
function openAddModal() {
  document.getElementById('modalTitle').innerText = 'Adicionar Colaborador';
  document.getElementById('employeeForm').reset();
  document.getElementById('employeeId').value = '';
  const firstWorkDay = MONTH_DAYS.find(d => d.date.getDay() === 1);
  const firstWork = firstWorkDay ? firstWorkDay.key : MONTH_DAYS[0].key;
  const el = document.getElementById('field' + firstWork);
  if (el) el.value = 'FERIADO';
  document.getElementById('employeeModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('employeeModal').classList.add('hidden');
}

function editEmployee(id) {
  const emp = employeesData.find(e => String(e.id) === String(id));
  if (!emp) return;

  document.getElementById('modalTitle').innerText = 'Editar Escala de Colaborador';
  document.getElementById('employeeId').value = emp.id;
  document.getElementById('fieldName').value = emp.name;
  ASSIGNMENT_KEYS.forEach(key => {
    document.getElementById(`field${key}`).value = emp[key] || '-';
  });

  document.getElementById('employeeModal').classList.remove('hidden');
}

async function saveEmployee(e) {
  e.preventDefault();
  const existingId = document.getElementById('employeeId').value;
  const name = document.getElementById('fieldName').value.toUpperCase().trim();

  const assignments = Object.fromEntries(ASSIGNMENT_KEYS.map(key => [
    key,
    document.getElementById(`field${key}`).value || '-'
  ]));

  if (isUsingFirebase()) {
    try {
      const data = { name, ...assignments };
      if (existingId) {
        await db.collection('employees').doc(String(existingId)).set(data);
      } else {
        await db.collection('employees').add(data);
      }
      closeModal();
    } catch (error) {
      alert('Erro ao salvar colaborador: ' + error.message);
    }
    return;
  }

  const newObj = {
    id: existingId ? existingId : Date.now(),
    name: name,
    ...assignments
  };

  if (existingId) {
    const idx = employeesData.findIndex(e => String(e.id) === String(existingId));
    if (idx !== -1) employeesData[idx] = newObj;
  } else {
    employeesData.push(newObj);
  }

  saveData();
  closeModal();
}

async function deleteEmployee(id) {
  if (!confirm('Tem certeza que deseja remover este colaborador da escala?')) return;
  if (isUsingFirebase()) {
    try {
      await db.collection('employees').doc(String(id)).delete();
    } catch (error) {
      alert('Erro ao excluir colaborador: ' + error.message);
    }
    return;
  }
  employeesData = employeesData.filter(e => String(e.id) !== String(id));
  saveData();
}

// Filtros e Alternância de Abas
function applyFilters() {
  renderTable();
  renderStoreCoverage();
}

function switchTab(tab) {
  const isTable = tab === 'table';
  const isStores = tab === 'stores';
  const isAdmin = tab === 'admin';

  document.getElementById('tableView').classList.toggle('hidden', !isTable);
  document.getElementById('storesView').classList.toggle('hidden', !isStores);
  document.getElementById('adminView').classList.toggle('hidden', !isAdmin);

  const baseOn = 'px-4 py-1.5 rounded-md text-sm font-medium transition-all bg-white text-slate-800 shadow-sm';
  const baseOff = 'px-4 py-1.5 rounded-md text-sm font-medium transition-all text-slate-600 hover:text-slate-900';

  document.getElementById('tabTableBtn').className = isTable ? baseOn : baseOff;
  document.getElementById('tabStoreBtn').className = isStores ? baseOn : baseOff;

  const adminBtn = document.getElementById('tabAdminBtn');
  if (adminBtn) {
    adminBtn.className = isAdmin ? baseOn : baseOff;
    if (!isAdminUser) adminBtn.classList.add('hidden');
  }
  if (isStores) {
    renderStoreCoverage();
  }
  if (isAdmin) {
    renderAdminList();
  }
}

// Exportar CSV
function exportCSV() {
  let csv = '\uFEFF'; // BOM para aceitar acentuação no Excel
  csv += `Funcionário(a);${getPeriodDates().map((date) => `${formatShortDate(date)} (${weekdayLabel(date)})`).join(';')}\n`;

  const csvCell = value => `"${String(value || '').replace(/"/g, '""')}"`;
  employeesData.forEach(emp => {
    csv += `${[emp.name, ...getAssignments(emp)].map(csvCell).join(';')}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', 'Escala_Operacional_Estoquistas_BA.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

// Inicialização ao carregar página
window.addEventListener('DOMContentLoaded', setupAuth);

window.addEventListener('beforeprint', updatePrintPeriod);

// Delegação de eventos para remover administradores
document.getElementById('adminList').addEventListener('click', (event) => {
  const button = event.target.closest('.remove-admin-btn');
  if (button && button.dataset && button.dataset.email) {
    removeAdmin(button.dataset.email);
  }
});

// Delegação de eventos para gerenciar lojas (editar/salvar/cancelar/excluir)
document.getElementById('storeList').addEventListener('click', (event) => {
  const editButton = event.target.closest('.edit-store-btn');
  if (editButton && editButton.dataset && editButton.dataset.store) {
    startStoreEdit(editButton);
    return;
  }
  const saveButton = event.target.closest('.store-edit-save');
  if (saveButton) {
    commitStoreEdit(saveButton.closest('li'), saveButton.closest('li').dataset.storeName);
    return;
  }
  const cancelButton = event.target.closest('.store-edit-cancel');
  if (cancelButton) {
    renderStoreList();
    return;
  }
  const removeButton = event.target.closest('.remove-store-btn');
  if (removeButton && removeButton.dataset && removeButton.dataset.store) {
    deleteStore(removeButton.dataset.store);
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    const editingInput = document.querySelector('#storeList .store-edit-input');
    if (editingInput) {
      renderStoreList();
      return;
    }
    const storeModal = document.getElementById('storeModal');
    const employeeModal = document.getElementById('employeeModal');
    if (storeModal && !storeModal.classList.contains('hidden')) closeStoreModal();
    else if (employeeModal && !employeeModal.classList.contains('hidden')) closeModal();
  }
  if (event.key === 'Enter' && document.activeElement && document.activeElement.id === 'newStoreInput') {
    addStoreFromInput();
  }
});