const API_URL = 'https://manly-senator-unison.ngrok-free.dev/api';

const HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true'
};

const state = {
  dates:   [],
  ideias:  [],
  periodo: '',
  cal: {
    year:     new Date().getFullYear(),
    month:    new Date().getMonth(),
    selected: null,
  }
};

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];
const PERIODO_LABELS = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };

async function initApp() {
  try {
    const response = await fetch(`${API_URL}/state`, { headers: HEADERS });
    const data = await response.json();
    state.dates  = data.dates;
    state.ideias = data.ideias;
  } catch (error) {
    console.error('Erro ao buscar dados do banco:', error);
  }
  renderIdeias();
  renderCalendario();
}

document.addEventListener('DOMContentLoaded', initApp);

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

function selectPeriodo(val) {
  state.periodo = val;
  document.querySelectorAll('.periodo-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.periodo === val);
  });
}

async function submitDate() {
  const nome    = document.getElementById('form-nome').value.trim();
  const data    = document.getElementById('form-data').value;
  const hora    = document.getElementById('form-hora').value;
  const local   = document.getElementById('form-local').value.trim();
  const periodo = state.periodo;

  if (!nome || !data || !periodo || !hora || !local) {
    alert('Por favor, preencha todos os campos.');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/dates`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ nome, data, hora, local, periodo })
    });

    if (response.ok) {
      state.dates.push({ nome, data, periodo, hora, local });
      renderCalendario();

      document.getElementById('form-nome').value  = '';
      document.getElementById('form-data').value  = '';
      document.getElementById('form-hora').value  = '';
      document.getElementById('form-local').value = '';
      selectPeriodo('');
      state.periodo = '';

      const msg = document.getElementById('form-success');
      msg.classList.add('show');
      setTimeout(() => msg.classList.remove('show'), 3000);
    }
  } catch (error) {
    alert('Erro ao salvar no banco de dados.');
  }
}

async function addIdeia() {
  const input = document.getElementById('ideia-input');
  const texto = input.value.trim();
  if (!texto) return;

  try {
    const response = await fetch(`${API_URL}/ideias`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ texto })
    });

    if (response.ok) {
      const resData = await response.json();
      const hoje = new Date().toLocaleDateString('pt-BR');
      state.ideias.unshift({ id: resData.id, texto, data: hoje });
      input.value = '';
      renderIdeias();
    }
  } catch (error) {
    console.error(error);
  }
}

async function removeIdeia(id) {
  try {
    const response = await fetch(`${API_URL}/ideias/${id}`, {
      method: 'DELETE',
      headers: HEADERS
    });

    if (response.ok) {
      state.ideias = state.ideias.filter(i => i.id !== id);
      renderIdeias();
    }
  } catch (error) {
    alert('Erro ao deletar ideia do banco.');
  }
}

function renderIdeias() {
  const list = document.getElementById('ideias-list');
  if (!list) return;
  if (state.ideias.length === 0) {
    list.innerHTML = '<p class="empty-msg">Nenhuma ideia ainda. Que tal criar a primeira? ✨</p>';
    return;
  }
  list.innerHTML = state.ideias.map(ideia => `
    <div class="ideia-item">
      <div class="ideia-icon-wrap">
        <svg viewBox="0 0 24 24" class="icon">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </div>
      <div class="ideia-body">
        <p class="ideia-text">${escapeHtml(ideia.texto)}</p>
        <span class="ideia-date">${ideia.data}</span>
      </div>
      <button class="ideia-remove" onclick="removeIdeia('${ideia.id}')" title="Remover">
        <svg viewBox="0 0 24 24" class="icon">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </button>
    </div>
  `).join('');
}

function renderCalendario() {
  const label    = document.getElementById('cal-month-label');
  const daysEl   = document.getElementById('cal-days');
  const detailEl = document.getElementById('cal-detail');
  const emptyEl  = document.getElementById('cal-empty');

  if (!label || !daysEl) return;

  const { year, month, selected } = state.cal;
  label.textContent = `${MONTHS[month]} ${year}`;

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();

  const today    = new Date();
  const todayStr = toDateString(today.getFullYear(), today.getMonth(), today.getDate());

  const datesMap = {};
  state.dates.forEach(d => {
    if (!datesMap[d.data]) datesMap[d.data] = [];
    datesMap[d.data].push(d);
  });

  let html = '';
  for (let i = 0; i < firstWeekday; i++) html += '<div class="cal-day empty"></div>';

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr  = toDateString(year, month, day);
    const isToday  = dateStr === todayStr;
    const isSel    = dateStr === selected;
    const hasEvent = !!datesMap[dateStr];

    let cls = 'cal-day';
    if (isToday) cls += ' today';
    if (isSel)   cls += ' selected';

    html += `
      <div class="${cls}" onclick="calSelectDay('${dateStr}')">
        ${day}
        ${hasEvent ? '<span class="dot"></span>' : ''}
      </div>`;
  }

  daysEl.innerHTML = html;

  if (!selected) {
    detailEl.innerHTML = '';
    emptyEl.style.display = state.dates.length === 0 ? 'block' : 'none';
    return;
  }

  emptyEl.style.display = 'none';
  const events = datesMap[selected] || [];

  if (events.length === 0) {
    detailEl.innerHTML = `
      <div class="cal-event-card" style="text-align:center;color:#999;font-size:.9rem;">
        Nenhum date neste dia.
      </div>`;
    return;
  }

  detailEl.innerHTML = events.map(ev => `
    <div class="cal-event-card">
      <div class="cal-event-name">${escapeHtml(ev.nome)}</div>
      <div class="cal-event-meta">
        ${periodoSvg(ev.periodo)}
        <span>${PERIODO_LABELS[ev.periodo] || ev.periodo} · ${ev.hora}</span>
      </div>
      <div class="cal-event-meta">
        <svg viewBox="0 0 24 24" class="icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span>${escapeHtml(ev.local)}</span>
      </div>
    </div>
  `).join('');
}

function calSelectDay(dateStr) {
  state.cal.selected = state.cal.selected === dateStr ? null : dateStr;
  renderCalendario();
}

function calPrevMonth() {
  if (state.cal.month === 0) { state.cal.month = 11; state.cal.year--; }
  else state.cal.month--;
  state.cal.selected = null;
  renderCalendario();
}

function calNextMonth() {
  if (state.cal.month === 11) { state.cal.month = 0; state.cal.year++; }
  else state.cal.month++;
  state.cal.selected = null;
  renderCalendario();
}

function toDateString(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function periodoSvg(p) {
  if (p === 'manha') return `<svg viewBox="0 0 24 24" class="icon"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  if (p === 'tarde') return `<svg viewBox="0 0 24 24" class="icon"><path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/></svg>`;
  return `<svg viewBox="0 0 24 24" class="icon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
