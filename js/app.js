const session = getSession();
if (!session) {
  window.location.href = 'index.html';
}

const ROLE_LABELS = { teacher: 'Преподаватель', student: 'Студент' };
const TYPE_LABELS = { pdf: 'PDF', ppt: 'PPT', doc: 'DOC' };

let currentView = 'dashboard';
let searchQuery = '';
let filterSubject = '';

const pageTitles = {
  dashboard: 'Главная',
  materials: 'Каталог материалов',
  upload: 'Загрузить материал',
  mymaterials: 'Мои материалы',
  notifications: 'Уведомления',
  profile: 'Профиль'
};

function initSidebar() {
  document.getElementById('userAvatar').textContent = session.avatar || '??';
  document.getElementById('userName').textContent = session.name;
  document.getElementById('userRole').textContent = ROLE_LABELS[session.role] || session.role;
  document.getElementById('sidebarRoleLabel').textContent = ROLE_LABELS[session.role];

  const unread = getUnreadCount();
  const navItems =
    session.role === 'teacher'
      ? [
          { id: 'dashboard', icon: '📊', label: 'Главная' },
          { id: 'materials', icon: '📚', label: 'Каталог' },
          { id: 'upload', icon: '⬆️', label: 'Загрузить' },
          { id: 'mymaterials', icon: '📁', label: 'Мои материалы' },
          { id: 'profile', icon: '👤', label: 'Профиль' }
        ]
      : [
          { id: 'dashboard', icon: '📊', label: 'Главная' },
          { id: 'materials', icon: '📚', label: 'Материалы' },
          { id: 'notifications', icon: '🔔', label: 'Уведомления', badge: unread },
          { id: 'profile', icon: '👤', label: 'Профиль' }
        ];

  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = `
    <div class="nav-section">Меню</div>
    ${navItems
      .map(
        (item) => `
      <button type="button" class="nav-link ${item.id === currentView ? 'active' : ''}" data-view="${item.id}">
        <span>${item.icon}</span>
        <span>${item.label}</span>
        ${item.badge ? `<span class="badge">${item.badge}</span>` : ''}
      </button>`
      )
      .join('')}
  `;

  nav.querySelectorAll('.nav-link').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentView = btn.dataset.view;
      searchQuery = '';
      filterSubject = '';
      document.getElementById('globalSearch').value = '';
      render();
    });
  });
}

function getUnreadCount() {
  const db = loadDb();
  return db.notifications.filter((n) => n.userId === session.id && !n.read).length;
}

function getMaterials() {
  const db = loadDb();
  let list = [...db.materials];
  if (session.role === 'teacher' && currentView === 'mymaterials') {
    list = list.filter((m) => m.authorId === session.id);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
    );
  }
  if (filterSubject) {
    list = list.filter((m) => m.subject === filterSubject);
  }
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getSubjects() {
  const db = loadDb();
  return [...new Set(db.materials.map((m) => m.subject))].sort();
}

function showToast(message) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

function renderDashboard() {
  const db = loadDb();
  const materials = db.materials;
  const myMaterials =
    session.role === 'teacher'
      ? materials.filter((m) => m.authorId === session.id)
      : materials;
  const totalDownloads = materials.reduce((s, m) => s + m.downloads, 0);

  const stats =
    session.role === 'teacher'
      ? [
          { label: 'Всего материалов', value: materials.length },
          { label: 'Мои публикации', value: myMaterials.length, accent: true },
          { label: 'Скачиваний', value: totalDownloads },
          { label: 'Предметов', value: getSubjects().length }
        ]
      : [
          { label: 'Доступно материалов', value: materials.length },
          { label: 'Предметов', value: getSubjects().length, accent: true },
          { label: 'Новых уведомлений', value: getUnreadCount() },
          { label: 'Всего скачиваний', value: totalDownloads }
        ];

  const recent = [...materials]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return `
    <div class="stats-grid">
      ${stats
        .map(
          (s) => `
        <div class="stat-card">
          <div class="label">${s.label}</div>
          <div class="value ${s.accent ? 'accent' : ''}">${s.value}</div>
        </div>`
        )
        .join('')}
    </div>
    <h3 style="margin-bottom:0.75rem">Последние материалы</h3>
    <table class="recent-table">
      <thead>
        <tr><th>Название</th><th>Предмет</th><th>Автор</th><th>Дата</th></tr>
      </thead>
      <tbody>
        ${recent
          .map(
            (m) => `
          <tr>
            <td>${escapeHtml(m.title)}</td>
            <td>${escapeHtml(m.subject)}</td>
            <td>${escapeHtml(m.authorName)}</td>
            <td>${m.createdAt}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>
  `;
}

function renderMaterialCard(m, options = {}) {
  const canDelete = options.canDelete && session.role === 'teacher';
  return `
    <article class="material-card" data-id="${m.id}">
      <span class="type-badge type-${m.type}">${TYPE_LABELS[m.type] || m.type}</span>
      <h3>${escapeHtml(m.title)}</h3>
      <div class="subject">${escapeHtml(m.subject)}</div>
      <p class="desc">${escapeHtml(m.description)}</p>
      <div class="material-meta">
        <span>👤 ${escapeHtml(m.authorName)}</span>
        <span>📅 ${m.createdAt}</span>
        <span>⬇ ${m.downloads}</span>
        <span>📦 ${m.size}</span>
      </div>
      <div class="material-actions">
        <button type="button" class="btn btn-primary btn-sm btn-download" data-id="${m.id}">Скачать</button>
        ${canDelete ? `<button type="button" class="btn btn-danger btn-sm btn-delete" data-id="${m.id}">Удалить</button>` : ''}
      </div>
    </article>
  `;
}

function renderMaterials() {
  const list = getMaterials();
  const subjects = getSubjects();

  return `
    <div class="toolbar">
      <select id="filterSubject">
        <option value="">Все предметы</option>
        ${subjects.map((s) => `<option value="${escapeHtml(s)}" ${filterSubject === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
      </select>
    </div>
    <div class="materials-grid" id="materialsGrid">
      ${
        list.length
          ? list.map((m) => renderMaterialCard(m, { canDelete: currentView === 'mymaterials' })).join('')
          : `<div class="empty-state"><div class="icon">📭</div><p>Материалы не найдены</p></div>`
      }
    </div>
  `;
}

function renderUpload() {
  const subjects = getSubjects();
  return `
    <div class="panel">
      <h3>Новый учебный материал</h3>
      <form id="uploadForm">
        <div class="form-group">
          <label for="matTitle">Название *</label>
          <input type="text" id="matTitle" required maxlength="120">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="matSubject">Предмет *</label>
            <input type="text" id="matSubject" list="subjectList" required>
            <datalist id="subjectList">
              ${subjects.map((s) => `<option value="${escapeHtml(s)}">`).join('')}
            </datalist>
          </div>
          <div class="form-group">
            <label for="matType">Тип файла</label>
            <select id="matType">
              <option value="pdf">PDF</option>
              <option value="ppt">PPT</option>
              <option value="doc">DOC</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="matDesc">Описание</label>
          <textarea id="matDesc" rows="3" placeholder="Краткое описание содержания"></textarea>
        </div>
        <div class="form-group">
          <label for="matFile">Файл (демо — имя файла)</label>
          <input type="file" id="matFile" accept=".pdf,.ppt,.pptx,.doc,.docx">
        </div>
        <button type="submit" class="btn btn-primary">Опубликовать</button>
      </form>
    </div>
  `;
}

function renderNotifications() {
  const db = loadDb();
  const list = db.notifications
    .filter((n) => n.userId === session.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!list.length) {
    return `<div class="empty-state"><div class="icon">🔔</div><p>Уведомлений пока нет</p></div>`;
  }

  return `
    <div class="notif-list">
      ${list
        .map(
          (n) => `
        <div class="notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
          <span>${n.read ? '📭' : '📬'}</span>
          <div style="flex:1">${escapeHtml(n.text)}</div>
          <span class="date">${n.date}</span>
        </div>`
        )
        .join('')}
    </div>
    <p style="margin-top:1rem;color:var(--text-muted);font-size:0.85rem">Нажмите на уведомление, чтобы отметить прочитанным.</p>
  `;
}

function renderProfile() {
  const extra =
    session.role === 'teacher'
      ? `<dt>Кафедра</dt><dd>${escapeHtml(session.department || '—')}</dd>`
      : `<dt>Группа</dt><dd>${escapeHtml(session.group || '—')}</dd>`;

  return `
    <div class="profile-grid">
      <div class="profile-avatar-lg">${session.avatar || '??'}</div>
      <dl class="info-list">
        <dt>ФИО</dt><dd>${escapeHtml(session.name)}</dd>
        <dt>Email</dt><dd>${escapeHtml(session.email)}</dd>
        <dt>Роль</dt><dd>${ROLE_LABELS[session.role]}</dd>
        ${extra}
        <dt>Режим</dt><dd>Демо (localStorage, без сервера)</dd>
      </dl>
    </div>
    <div style="margin-top:2rem">
      <button type="button" class="btn btn-secondary" id="resetDataBtn">Сбросить демо-данные</button>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function render() {
  initSidebar();
  document.getElementById('pageTitle').textContent = pageTitles[currentView] || 'BrainPort';

  const showSearch = currentView === 'materials' || currentView === 'mymaterials';
  document.getElementById('globalSearchWrap').classList.toggle('hidden', !showSearch);

  const content = document.getElementById('appContent');
  switch (currentView) {
    case 'dashboard':
      content.innerHTML = renderDashboard();
      break;
    case 'materials':
    case 'mymaterials':
      content.innerHTML = renderMaterials();
      bindMaterialsEvents();
      break;
    case 'upload':
      content.innerHTML = renderUpload();
      bindUploadForm();
      break;
    case 'notifications':
      content.innerHTML = renderNotifications();
      bindNotifications();
      break;
    case 'profile':
      content.innerHTML = renderProfile();
      document.getElementById('resetDataBtn')?.addEventListener('click', () => {
        if (confirm('Сбросить все демо-данные к начальному состоянию?')) {
          resetDb();
          showToast('Данные сброшены');
          render();
        }
      });
      break;
    default:
      content.innerHTML = renderDashboard();
  }
}

function bindMaterialsEvents() {
  const filter = document.getElementById('filterSubject');
  if (filter) {
    filter.addEventListener('change', (e) => {
      filterSubject = e.target.value;
      document.getElementById('appContent').innerHTML = renderMaterials();
      bindMaterialsEvents();
    });
  }

  document.querySelectorAll('.btn-download').forEach((btn) => {
    btn.addEventListener('click', () => downloadMaterial(btn.dataset.id));
  });

  document.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', () => deleteMaterial(btn.dataset.id));
  });
}

function downloadMaterial(id) {
  const db = loadDb();
  const mat = db.materials.find((m) => m.id === id);
  if (!mat) return;

  mat.downloads += 1;
  saveDb(db);

  const blob = new Blob(
    [
      `BrainPort — демо-файл\n\nНазвание: ${mat.title}\nПредмет: ${mat.subject}\nТип: ${mat.type}\nАвтор: ${mat.authorName}\n\nЭто заглушка. В реальном приложении здесь был бы файл с сервера.`
    ],
    { type: 'text/plain;charset=utf-8' }
  );
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${mat.title.replace(/[^\wа-яА-ЯёЁ\s-]/gi, '')}.${mat.type}`;
  a.click();
  URL.revokeObjectURL(a.href);

  showToast(`«${mat.title}» — скачивание (демо)`);
  if (currentView === 'materials' || currentView === 'mymaterials') {
    document.getElementById('appContent').innerHTML = renderMaterials();
    bindMaterialsEvents();
  }
}

function deleteMaterial(id) {
  if (!confirm('Удалить этот материал?')) return;
  const db = loadDb();
  db.materials = db.materials.filter((m) => m.id !== id);
  saveDb(db);
  showToast('Материал удалён');
  render();
}

function bindUploadForm() {
  document.getElementById('uploadForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('matTitle').value.trim();
    const subject = document.getElementById('matSubject').value.trim();
    const type = document.getElementById('matType').value;
    const description = document.getElementById('matDesc').value.trim() || 'Без описания';
    const fileInput = document.getElementById('matFile');
    let size = '1.0 МБ';
    if (fileInput.files[0]) {
      const bytes = fileInput.files[0].size;
      size =
        bytes > 1024 * 1024
          ? `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
          : `${Math.round(bytes / 1024)} КБ`;
    }

    const db = loadDb();
    const newMat = {
      id: uid('m'),
      title,
      subject,
      type,
      description,
      authorId: session.id,
      authorName: session.name,
      createdAt: new Date().toISOString().slice(0, 10),
      downloads: 0,
      size
    };
    db.materials.push(newMat);

    db.users
      .filter((u) => u.role === 'student')
      .forEach((u) => {
        db.notifications.unshift({
          id: uid('n'),
          userId: u.id,
          text: `Добавлен новый материал: «${title}» (${subject})`,
          read: false,
          date: newMat.createdAt
        });
      });

    saveDb(db);
    showToast('Материал опубликован');
    currentView = 'mymaterials';
    render();
  });
}

function bindNotifications() {
  document.querySelectorAll('.notif-item').forEach((el) => {
    el.addEventListener('click', () => {
      const db = loadDb();
      const n = db.notifications.find((x) => x.id === el.dataset.id);
      if (n && !n.read) {
        n.read = true;
        saveDb(db);
        render();
      }
    });
  });
}

document.getElementById('globalSearch')?.addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  if (currentView === 'materials' || currentView === 'mymaterials') {
    document.getElementById('appContent').innerHTML = renderMaterials();
    bindMaterialsEvents();
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  clearSession();
  window.location.href = 'index.html';
});

render();
