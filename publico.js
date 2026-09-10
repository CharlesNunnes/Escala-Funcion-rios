// ============================================================
// Escala de Funcionários - Visualização Pública (somente leitura)
// ============================================================

const ASSIGNMENT_KEYS = ['seg1', 'ter1', 'qua1', 'qui1', 'sex1', 'sab1', 'seg2', 'ter2', 'qua2', 'qui2', 'sex2', 'sab2'];
const DAY_NAMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

let publicEmployees = [];
let managersCache = [];
let managerUnsubscribe = null;

function normalizeText(value) {
  return String(value || '').trim().toLocaleLowerCase('pt-BR')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
  const today = new Date();
  const monday = new Date(today);
  const dayOfWeek = monday.getDay();
  monday.setDate(monday.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index + Math.floor(index / 6) * 1);
    return date;
  });
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
    element.innerHTML = `<span class="day-name">${DAY_NAMES[index % 6]}</span><span class="day-date">${formatShortDate(date)}</span>`;
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
  const managerStores = Array.isArray(manager.stores) ? manager.stores : [];
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
      option.value = 'emp:' + emp.id;
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
      return { id: doc.id, ...data };
    });
    populatePublicEmployeeDropdown();

    const selectedManager = getSelectedManager();
    renderManagerBanner(selectedManager);

    const employeeValue = document.getElementById('filterEmployeeP').value;
    const filtered = publicEmployees.filter(emp => {
      if (employeeValue && employeeValue.startsWith('emp:') && employeeValue !== 'emp:' + String(emp.id)) {
        return false;
      }
      if (selectedManager && Array.isArray(selectedManager.stores)) {
        if (!getAssignments(emp).some(val => selectedManager.stores.some(store => Matching.storeNameMatches(val, store)))) {
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
        ${ASSIGNMENT_KEYS.map((key, i) => `<td data-day-index="${i}" data-label="${DAY_NAMES[i % 6]} ${formatShortDate(periodDates[i])}" class="py-2.5 px-3 text-center border-l border-slate-200">${formatCellBadge(emp[key])}</td>`).join('')}
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

document.addEventListener('DOMContentLoaded', () => {
  updatePeriodHeader();
  loadPublicSchedule();
  setupManagersListener();
  window.addEventListener('beforeprint', updatePeriodHeader);
});