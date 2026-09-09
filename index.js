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
const ASSIGNMENT_KEYS = ['seg1', 'ter1', 'qua1', 'qui1', 'sex1', 'sab1', 'seg2', 'ter2', 'qua2', 'qui2', 'sex2', 'sab2'];
const DAY_NAMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const STORE_KEY = 'escala_operacional_varejo_stores';
const DEFAULT_STORES = [
  'EUD SH BAHIA', 'SH DA BAHIA', 'PARIPE', 'LIBERDADE', 'SÃO CAETANO',
  'PERIPERI', 'CABULA', 'G OUTLET', 'RIBEIRA', 'SH ITAIGARA', 'BELA VISTA',
  'CAJ RÓTULA', 'EUD SSA', 'COSTA AZUL', 'QDB SSA', 'FERR COSTA BARRIS',
  'SH BARRA', 'SH BROTAS', 'SH PARALELA', 'SH. SSA NORTE', 'CASTELO BRANCO',
  'MADISON', 'FERR COSTA PARALELA', 'CENTRO MATA', 'SH. SSA 2', 'SH. SSA 1',
  'SH LAPA', 'SH PIEDADE', 'QUIOSQ LAPA', 'PORTÃO', 'MIX STELA',
  'CENTRO LAURO', 'SH SEC', 'PARK SHOPPING'
];

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
  const legacyKeys = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  const normalized = { ...employee };
  legacyKeys.forEach((key, index) => {
    if (normalized[key] && !normalized[`${key}1`]) normalized[`${key}1`] = normalized[key];
    delete normalized[key];
  });
  ASSIGNMENT_KEYS.forEach(key => {
    if (!normalized[key]) normalized[key] = '-';
  });
  return normalized;
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

function getStoreList() {
  const saved = localStorage.getItem(STORE_KEY);
  if (!saved) return [...DEFAULT_STORES];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [...DEFAULT_STORES];
  } catch (error) {
    return [...DEFAULT_STORES];
  }
}

function saveStoreList(stores) {
  localStorage.setItem(STORE_KEY, JSON.stringify(stores));
}

function isSpecialAssignment(value) {
  const normalized = normalizeText(value);
  return !value || value === '-' || ['feriado', 'ferias', 'folga', 'atestado'].includes(normalized);
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

function addStore() {
  const store = prompt('Digite o nome da nova loja:');
  if (!store || !store.trim()) return;
  const normalizedStore = store.trim().toUpperCase();
  const stores = getStoreList();
  if (!stores.some(item => normalizeText(item) === normalizeText(normalizedStore))) {
    stores.push(normalizedStore);
    saveStoreList(stores);
    populateAssignmentSelects();
    populateLocationDropdown();
  }
}

function formatShortDate(date) {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  });
}

function updatePrintPeriod() {
  const dates = getPeriodDates();

  document.getElementById('printPeriod').innerText =
    `Período: ${formatShortDate(dates[0])} a ${formatShortDate(dates[dates.length - 1])}`;
  document.querySelectorAll('[data-day-index]').forEach(element => {
    const index = Number(element.dataset.dayIndex);
    const date = dates[index];
    element.innerHTML = `<span class="day-name">${DAY_NAMES[index % 6]}</span><span class="day-date">${formatShortDate(date)}</span>`;
  });
}

// Carregar do LocalStorage ou Inicializar
function initData() {
  const saved = localStorage.getItem('escala_operacional_varejo_data');
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

  // Definir data de impressão
  const now = new Date();
  document.getElementById('printDate').innerText = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
  updatePrintPeriod();
  populateAssignmentSelects();

  populateLocationDropdown();
  renderTable();
  updateKPIs();
  renderStoreCoverage();
}

// Salvar no LocalStorage
function saveData() {
  localStorage.setItem('escala_operacional_varejo_data', JSON.stringify(employeesData));
  updateKPIs();
  populateLocationDropdown();
  renderTable();
  renderStoreCoverage();
}

// Restaurar dados padrão
function resetData() {
  if (confirm('Deseja restaurar a escala para o formato original da planilha?')) {
    employeesData = INITIAL_DATA.map(normalizeEmployee);
    saveData();
  }
}

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
function renderTable() {
  const tbody = document.getElementById('tableBody');
  const searchVal = normalizeText(document.getElementById('searchInput').value);
  const statusFilter = document.getElementById('filterStatus').value;
  const locationFilter = document.getElementById('filterLocation').value;

  tbody.innerHTML = '';
  let visibleCount = 0;

  employeesData.forEach((emp) => {
    // Filtro de busca
    const matchesSearch = normalizeText(emp.name).includes(searchVal) ||
      getAssignments(emp).some(val => normalizeText(val).includes(searchVal));

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

    if (matchesSearch && matchesStatus && matchesLocation) {
      visibleCount++;
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50/80 transition-colors border-b border-slate-200/60';

      tr.innerHTML = `
        <td class="py-3 px-4 font-semibold text-slate-800 sticky left-0 bg-white border-r border-slate-200 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="employee-name" title="${escapeHtml(emp.name)}">${escapeHtml(emp.name)}</span>
          </div>
        </td>
        ${ASSIGNMENT_KEYS.map(key => `<td class="py-2.5 px-3 text-center border-l border-slate-200">${formatCellBadge(emp[key])}</td>`).join('')}
        <td class="py-2.5 px-3 text-center border-l border-slate-200 no-print">
          <div class="flex items-center justify-center gap-1">
            <button onclick="editEmployee(${emp.id})" title="Editar Escala" class="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="deleteEmployee(${emp.id})" title="Excluir Colaborador" class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition">
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

// Atualizar Indicadores
function updateKPIs() {
  document.getElementById('statTotalEmployees').innerText = employeesData.length;

  const onLeaveCount = employeesData.filter(emp => 
    getAssignments(emp).some(val => normalizeText(val).includes('ferias'))
  ).length;
  document.getElementById('statOnLeave').innerText = onLeaveCount;

  // Unidades únicas
  const stores = new Set();
  employeesData.forEach(emp => {
    getAssignments(emp).forEach(val => {
      if (val && !normalizeText(val).includes('feriado') && !normalizeText(val).includes('ferias') && val !== '-') {
        stores.add(val.trim().toUpperCase());
      }
    });
  });
  document.getElementById('statTotalStores').innerText = stores.size;
}

// Preencher dropdown de unidades
function populateLocationDropdown() {
  const select = document.getElementById('filterLocation');
  select.innerHTML = '<option value="ALL">Todas as Unidades</option>';

  const stores = new Set();
  employeesData.forEach(emp => {
    getAssignments(emp).forEach(val => {
      if (val && !normalizeText(val).includes('feriado') && !normalizeText(val).includes('ferias') && val !== '-') {
        stores.add(val.trim().toUpperCase());
      }
    });
  });

  Array.from(stores).sort().forEach(store => {
    const option = document.createElement('option');
    option.value = store;
    option.textContent = store;
    select.appendChild(option);
  });
}

// Renderizar resumo por loja
function renderStoreCoverage() {
  const container = document.getElementById('storeCoverageContainer');
  container.innerHTML = '';

  const storeMap = {};

  employeesData.forEach(emp => {
    const days = ASSIGNMENT_KEYS.map((key, index) => ({
      day: `${DAY_NAMES[index % 6]} (${formatShortDate(getPeriodDates()[index])})`,
      val: emp[key]
    }));

    days.forEach(d => {
      const storeName = d.val ? d.val.trim() : '-';
      if (!isSpecialAssignment(storeName)) {
        if (!storeMap[storeName]) storeMap[storeName] = [];
        storeMap[storeName].push({ employee: emp.name, day: d.day });
      }
    });
  });

  const sortedStores = Object.keys(storeMap).sort();

  if (sortedStores.length === 0) {
    container.innerHTML = '<p class="text-slate-500 text-sm">Nenhuma alocação em loja registrada.</p>';
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
  document.getElementById('fieldseg1').value = 'FERIADO';
  document.getElementById('employeeModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('employeeModal').classList.add('hidden');
}

function editEmployee(id) {
  const emp = employeesData.find(e => e.id === id);
  if (!emp) return;

  document.getElementById('modalTitle').innerText = 'Editar Escala de Colaborador';
  document.getElementById('employeeId').value = emp.id;
  document.getElementById('fieldName').value = emp.name;
  ASSIGNMENT_KEYS.forEach(key => {
    document.getElementById(`field${key}`).value = emp[key] || '-';
  });

  document.getElementById('employeeModal').classList.remove('hidden');
}

function saveEmployee(e) {
  e.preventDefault();
  const id = document.getElementById('employeeId').value;
  const name = document.getElementById('fieldName').value.toUpperCase().trim();

  const newObj = {
    id: id ? parseInt(id) : Date.now(),
    name: name,
    ...Object.fromEntries(ASSIGNMENT_KEYS.map(key => [
      key,
      document.getElementById(`field${key}`).value || '-'
    ]))
  };

  if (id) {
    const idx = employeesData.findIndex(e => e.id === parseInt(id));
    if (idx !== -1) employeesData[idx] = newObj;
  } else {
    employeesData.push(newObj);
  }

  saveData();
  closeModal();
}

function deleteEmployee(id) {
  if (confirm('Tem certeza que deseja remover este colaborador da escala?')) {
    employeesData = employeesData.filter(e => e.id !== id);
    saveData();
  }
}

// Filtros e Alternância de Abas
function applyFilters() {
  renderTable();
}

function switchTab(tab) {
  const isTable = tab === 'table';
  document.getElementById('tableView').classList.toggle('hidden', !isTable);
  document.getElementById('storesView').classList.toggle('hidden', isTable);

  document.getElementById('tabTableBtn').className = isTable 
    ? 'px-4 py-1.5 rounded-md text-sm font-medium transition-all bg-white text-slate-800 shadow-sm'
    : 'px-4 py-1.5 rounded-md text-sm font-medium transition-all text-slate-600 hover:text-slate-900';

  document.getElementById('tabStoreBtn').className = !isTable 
    ? 'px-4 py-1.5 rounded-md text-sm font-medium transition-all bg-white text-slate-800 shadow-sm'
    : 'px-4 py-1.5 rounded-md text-sm font-medium transition-all text-slate-600 hover:text-slate-900';
}

// Exportar CSV
function exportCSV() {
  let csv = '\uFEFF'; // BOM para aceitar acentuação no Excel
  csv += `Funcionário(a);${getPeriodDates().map((date, index) => `${formatShortDate(date)} (${DAY_NAMES[index % 6]})`).join(';')}\n`;

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
window.addEventListener('DOMContentLoaded', initData);
document.addEventListener('keydown', event => {
  const modal = document.getElementById('employeeModal');
  if (event.key === 'Escape' && modal && !modal.classList.contains('hidden')) closeModal();
});