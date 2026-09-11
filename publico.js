// ============================================================
// Escala de Funcionários - Visualização Pública (somente leitura)
// ============================================================

// Modelo semanal na visualização pública: mostra apenas a semana corrente
// (Segunda a Sábado) — o período que o funcionário/gerente consulta.
function getMonthDays() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const offsetToMonday = (today.getDay() + 6) % 7; // dias desde o início da semana
  const monday = new Date(now.getFullYear(), now.getMonth(), today.getDate() - offsetToMonday);
  const days = [];
  for (let i = 0; i < 6; i++) {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    days.push({ key: 'd' + date.getDate(), date });
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

let publicEmployees = [];
let managersCache = [];
let managerUnsubscribe = null;

function normalizeText(value) {
  return String(value || '').trim().toLocaleLowerCase('pt-BR')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeEmployee(employee) {
  const hasDayKeys = MONTH_DAYS.some(d => employee[d.key] != null);
  // Só converte o formato antigo (seg1..sab2) quando o doc ainda não tem dias;
  // se já tem chaves dN, o legado é ignorado para não sobrescrever dias limpados/editados.
  const normalized = hasDayKeys ? { ...employee } : migrateLegacyToDayKeys(employee);
  MONTH_DAYS.forEach(d => {
    if (normalized[d.key] == null || normalized[d.key] === '-') {
      normalized[d.key] = '-';
    }
  });
  // Remove as chaves antigas para não poluir nada que venha a ser gravado.
  LEGACY_WEEK_KEYS.forEach(key => delete normalized[key]);
  LEGACY_ASSIGNMENT_KEYS.forEach(key => delete normalized[key]);
  return normalized;
}

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

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
}

function getAssignments(emp) {
  return ASSIGNMENT_KEYS.map(key => String(emp[key] || '-')).filter(val => val && val !== '-');
}

function getPeriodDates() {
  return MONTH_DAYS.map(d => d.date);
}

function formatShortDate(date) {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  });
}

function updatePeriodHeader() {
  const dates = getPeriodDates();

  document.getElementById('printPeriod').innerText =
    `Período: ${formatShortDate(dates[0])} a ${formatShortDate(dates[dates.length - 1])}`;

  const now = new Date();
  document.getElementById('printDate').innerText =
    now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  document.querySelectorAll('#escalaTable th[data-day-index]').forEach(element => {
    const index = Number(element.dataset.dayIndex);
    const date = dates[index];
    element.innerHTML = `<span class="day-name">${weekdayLabel(date)}</span><span class="day-date">${formatShortDate(date)}</span>`;
  });
}

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

function setState(state) {
  document.getElementById('publicTableBody').innerHTML = '';
  document.getElementById('tableView').classList.toggle('hidden', state !== 'table');
  document.getElementById('emptyState').classList.toggle('hidden', state !== 'empty');
  document.getElementById('errorState').classList.toggle('hidden', state !== 'error');
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

function populatePublicEmployeeDropdown() {
  const select = document.getElementById('filterEmployeeP');
  if (!select) return;
  const previous = select.value;
  select.innerHTML = '<option value="">Todos os funcionários</option>';
  publicEmployees.slice()
    .sort((a, b) => normalizeText(a.name).localeCompare(normalizeText(b.name)))
    .forEach(emp => {
      const option = document.createElement('option');
      option.value = 'emp:' + normalizeText(emp.name);
      option.textContent = emp.name;
      select.appendChild(option);
    });
  if (previous) select.value = previous;
}

function populatePublicManagerDropdown() {
  const select = document.getElementById('filterManagerP');
  if (!select) return;
  const previous = select.value;
  select.innerHTML = '<option value="">Todos os gerentes</option>';
  managersCache.slice()
    .sort((a, b) => normalizeText(a.hub).localeCompare(normalizeText(b.hub)))
    .forEach(manager => {
      const option = document.createElement('option');
      option.value = 'mgr:' + manager.hub;
      option.textContent = manager.hub;
      select.appendChild(option);
    });
  if (previous) select.value = previous;
}

function applyPublicFilter() {
  loadPublicSchedule();
}

function getSelectedManager() {
  const personFilter = document.getElementById('filterManagerP').value;
  if (personFilter && personFilter.startsWith('mgr:')) {
    return managersCache.find(m => normalizeText(m.hub) === normalizeText(personFilter.slice(4))) || null;
  }
  return null;
}

function setupManagersListener() {
  if (managerUnsubscribe || !db) return;
  managerUnsubscribe = db.collection('managers')
    .onSnapshot(snapshot => {
      managersCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      populatePublicManagerDropdown();
    }, error => {
      console.error('Erro ao escutar gerentes:', error);
      const hint = document.getElementById('publicFilterHint');
      if (hint) hint.textContent = 'Filtro por gerente indisponível: libere a leitura pública de "managers" nas regras do Firestore.';
    });
}

async function loadPublicSchedule() {
  setState('table');
  const tbody = document.getElementById('publicTableBody');

  try {
    const empSnapshot = await db.collection('employees').get();

    publicEmployees = empSnapshot.docs.map(doc => {
      const data = doc.data() || {};
      return { id: doc.id, ...normalizeEmployee(data) };
    });
    populatePublicEmployeeDropdown();

    const selectedManager = getSelectedManager();
    renderManagerBanner(selectedManager);

    const employeeValue = document.getElementById('filterEmployeeP').value;
    const employeeName = employeeValue && employeeValue.startsWith('emp:') ? employeeValue.slice(4) : null;
    const filtered = publicEmployees.filter(emp => {
      if (employeeValue && employeeValue.startsWith('emp:')) {
        const matchesById = employeeValue === 'emp:' + String(emp.id);
        const matchesByName = employeeName ? normalizeText(emp.name) === normalizeText(employeeName) : false;
        if (!matchesById && !matchesByName) return false;
      }
      if (selectedManager) {
        if (!getAssignments(emp).some(val => getManagerStores(selectedManager).some(store => Matching.storeNameMatches(val, store)))) {
          return false;
        }
      }
      return true;
    });

    if (!filtered.length) {
      const emptyText = document.querySelector('#emptyState p');
      const hasActiveFilter = !!(employeeValue || document.getElementById('filterManagerP').value);
      if (emptyText) {
        emptyText.textContent = hasActiveFilter
          ? 'Nenhum funcionário encontrado para os filtros escolhidos.'
          : 'Nenhuma escala publicada no momento.';
      }
      setState('empty');
      return;
    }

    tbody.innerHTML = '';

    const periodDates = getPeriodDates();

    filtered.forEach(emp => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-200/60';

      tr.innerHTML = `
        <td class="py-3 px-4 font-semibold text-slate-800 sticky left-0 bg-white border-r border-slate-200 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="employee-name" title="${escapeHtml(emp.name)}">${escapeHtml(emp.name)}</span>
          </div>
        </td>
        ${ASSIGNMENT_KEYS.map((key, i) => `<td data-day-index="${i}" data-label="${weekdayLabel(periodDates[i])} ${formatShortDate(periodDates[i])}" class="py-2.5 px-3 text-center border-l border-slate-200">${formatCellBadge(emp[key])}</td>`).join('')}
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    document.getElementById('errorMessage').innerText =
      (error.code === 'permission-denied')
        ? 'A leitura pública ainda não foi liberada no Firestore. Publique as regras atualizadas no console do Firebase.'
        : ('Falha ao carregar a escala: ' + (error.message || 'erro desconhecido'));
    setState('error');
  }
}

// Gera as colunas de dias do mês no cabeçalho da tabela pública
function initTableHeaderRow() {
  const row = document.getElementById('tableHeaderRow');
  if (!row) return;
  if (row.dataset.initialized) return;
  row.dataset.initialized = '1';
  MONTH_DAYS.forEach((d, i) => {
    const th = document.createElement('th');
    th.dataset.dayIndex = i;
    th.className = 'py-2 px-2 text-center text-[10px] sm:text-xs';
    row.appendChild(th);
  });
  updatePeriodHeader();
}

// Lojas efetivas de um gerente = doc do Firestore + seed local (fonte de verdade), sem duplicar.
function getManagerStores(manager) {
  const docStores = Array.isArray(manager.stores) ? manager.stores : [];
  let seedStores = [];
  if (window.MANAGERS_SEED && Array.isArray(window.MANAGERS_SEED.managers)) {
    const sm = window.MANAGERS_SEED.managers.find(sm => normalizeText(sm.hub) === normalizeText(manager.hub));
    if (sm && Array.isArray(sm.stores)) seedStores = sm.stores;
  }
  const result = docStores.slice();
  seedStores.forEach(store => {
    if (!result.some(existing => normalizeText(existing) === normalizeText(store))) result.push(store);
  });
  return result;
}

document.addEventListener('DOMContentLoaded', () => {
  initTableHeaderRow();
  updatePeriodHeader();
  loadPublicSchedule();
  setupManagersListener();
  window.addEventListener('beforeprint', updatePeriodHeader);
});