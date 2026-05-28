let session = getSession();
if (!session) {
  window.location.href = 'index.html';
}

const ROLE_LABELS = { teacher: 'Преподаватель', student: 'Студент' };
const TYPE_LABELS = { pdf: 'PDF', ppt: 'PPT', doc: 'DOC' };

let currentView = 'dashboard';
let searchQuery = '';
let filterSubject = '';
let filterGroup = '';
let materialsCache = [];
let groupsCache = [];
let notificationsCache = [];
let isLoading = false;

const pageTitles = {
  dashboard: 'Главная',
  materials: 'Каталог материалов',
  upload: 'Загрузить материал',
  mymaterials: 'Мои материалы',
  notifications: 'Уведомления',
  profile: 'Профиль'
};

function initMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const menuBtn = document.getElementById('mobileMenuBtn');

  function closeSidebar() {
    sidebar?.classList.remove('open');
    overlay?.classList.add('hidden');
    document.body.classList.remove('sidebar-open');
  }

  function openSidebar() {
    sidebar?.classList.add('open');
    overlay?.classList.remove('hidden');
    document.body.classList.add('sidebar-open');
  }

  menuBtn?.addEventListener('click', () => {
    if (sidebar?.classList.contains('open')) closeSidebar();
    else openSidebar();
  });

  overlay?.addEventListener('click', closeSidebar);

  document.getElementById('sidebarNav')?.addEventListener('click', (e) => {
    if (e.target.closest('.nav-link') && window.innerWidth < 900) closeSidebar();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 900) closeSidebar();
  });
}

function initSidebar() {
  document.getElementById('userAvatar').textContent = session.avatar || '??';
  document.getElementById('userName').textContent = session.name;
  document.getElementById('userRole').textContent = ROLE_LABELS[session.role] || session.role;
  document.getElementById('sidebarRoleLabel').textContent = ROLE_LABELS[session.role];

  const unread = notificationsCache.filter((n) => !n.read).length;
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
      filterGroup = '';
      const searchInput = document.getElementById('globalSearch');
      if (searchInput) searchInput.value = '';
      render();
    });
  });
}

function getMaterials() {
  let list = [...materialsCache];
  if (session.role === 'teacher' && currentView === 'mymaterials') {
    list = list.filter((m) => m.authorId === session.id);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        (m.description || '').toLowerCase().includes(q)
    );
  }
  if (filterSubject) {
    list = list.filter((m) => m.subject === filterSubject);
  }
  if (filterGroup && session.role === 'teacher') {
    list = list.filter((m) => m.groupName === filterGroup);
  }
  return list;
}

function getSubjects() {
  return [...new Set(materialsCache.map((m) => m.subject))].sort();
}

function getMaterialGroups() {
  const fromMaterials = materialsCache.map((m) => m.groupName).filter(Boolean);
  const fromStudents = groupsCache;
  return [...new Set([...fromMaterials, ...fromStudents])].sort((a, b) => a.localeCompare(b, 'ru'));
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

function showContentError(message) {
  document.getElementById('appContent').innerHTML = `
    <div class="empty-state">
      <div class="icon">⚠️</div>
      <p>${escapeHtml(message)}</p>
      <p style="margin-top:0.75rem;font-size:0.85rem;color:var(--text-muted)">
        Откройте Supabase → SQL Editor и выполните <code>supabase/schema.sql</code>
      </p>
    </div>`;
}

function renderDashboard() {
  const materials = materialsCache;
  const myMaterials =
    session.role === 'teacher' ? materials.filter((m) => m.authorId === session.id) : materials;
  const totalDownloads = materials.reduce((s, m) => s + (m.downloads || 0), 0);
  const unread = notificationsCache.filter((n) => !n.read).length;

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
          { label: 'Новых уведомлений', value: unread },
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
    <div class="table-scroll">
      <table class="recent-table">
        <thead>
          <tr><th>Название</th><th>Предмет</th>${session.role === 'teacher' ? '<th>Группа</th>' : ''}<th>Автор</th><th>Дата</th></tr>
        </thead>
        <tbody>
          ${
            recent.length
              ? recent
                  .map(
                    (m) => `
            <tr>
              <td>${escapeHtml(m.title)}</td>
              <td>${escapeHtml(m.subject)}</td>
              ${session.role === 'teacher' ? `<td>${escapeHtml(m.groupName || '—')}</td>` : ''}
              <td>${escapeHtml(m.authorName)}</td>
              <td>${m.createdAt}</td>
            </tr>`
                  )
                  .join('')
              : `<tr><td colspan="${session.role === 'teacher' ? 5 : 4}">Пока нет материалов</td></tr>`
          }
        </tbody>
      </table>
    </div>
  `;
}

function renderMaterialCard(m, options = {}) {
  const canDelete = options.canDelete && session.role === 'teacher';
  return `
    <article class="material-card" data-id="${m.id}">
      <span class="type-badge type-${m.type}">${TYPE_LABELS[m.type] || m.type}</span>
      <h3>${escapeHtml(m.title)}</h3>
      <div class="subject">${escapeHtml(m.subject)}</div>
      ${m.groupName ? `<div class="group-badge">👥 ${escapeHtml(m.groupName)}</div>` : ''}
      <p class="desc">${escapeHtml(m.description)}</p>
      <div class="material-meta">
        <span>👤 ${escapeHtml(m.authorName)}</span>
        <span>📅 ${m.createdAt}</span>
        <span>⬇ ${m.downloads}</span>
        <span>📦 ${m.size || '—'}</span>
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
  const groups = getMaterialGroups();
  const emptyHint =
    session.role === 'student' && !session.group
      ? '<p style="margin-top:0.5rem;font-size:0.85rem">Укажите группу в профиле при регистрации, чтобы видеть материалы.</p>'
      : '';

  return `
    <div class="toolbar">
      <select id="filterSubject">
        <option value="">Все предметы</option>
        ${subjects.map((s) => `<option value="${escapeHtml(s)}" ${filterSubject === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
      </select>
      ${
        session.role === 'teacher'
          ? `
      <select id="filterGroup">
        <option value="">Все группы</option>
        ${groups.map((g) => `<option value="${escapeHtml(g)}" ${filterGroup === g ? 'selected' : ''}>${escapeHtml(g)}</option>`).join('')}
      </select>`
          : ''
      }
    </div>
    <div class="materials-grid" id="materialsGrid">
      ${
        list.length
          ? list.map((m) => renderMaterialCard(m, { canDelete: currentView === 'mymaterials' })).join('')
          : `<div class="empty-state"><div class="icon">📭</div><p>Материалы не найдены</p>${emptyHint}</div>`
      }
    </div>
  `;
}

function renderUpload() {
  const subjects = getSubjects();
  const groups = getMaterialGroups();
  const groupField = groups.length
    ? `
        <div class="form-group">
          <label for="matGroup">Группа *</label>
          <select id="matGroup" required>
            <option value="">Выберите группу</option>
            ${groups.map((g) => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('')}
          </select>
          <p class="form-hint">Материал увидят только студенты этой группы</p>
        </div>`
    : `
        <div class="form-group">
          <label for="matGroup">Группа *</label>
          <input type="text" id="matGroup" required placeholder="Например: ИТ-301">
          <p class="form-hint">Сначала зарегистрируйте студентов с указанием группы, или введите название вручную</p>
        </div>`;

  return `
    <div class="panel">
      <h3>Новый учебный материал</h3>
      <form id="uploadForm">
        <div class="form-group">
          <label for="matTitle">Название *</label>
          <input type="text" id="matTitle" required maxlength="120">
        </div>
        ${groupField}
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
          <label for="matFile">Файл</label>
          <input type="file" id="matFile" accept=".pdf,.ppt,.pptx,.doc,.docx">
        </div>
        <button type="submit" class="btn btn-primary" id="uploadSubmitBtn">Опубликовать</button>
      </form>
    </div>
  `;
}

function renderNotifications() {
  const list = [...notificationsCache].sort((a, b) => new Date(b.date) - new Date(a.date));

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
        <dt>Хранилище</dt><dd>Supabase (облако)</dd>
      </dl>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

async function refreshData() {
  materialsCache = await fetchMaterials();
  if (session.role === 'teacher') {
    groupsCache = await fetchStudentGroups();
  }
  if (session.role === 'student') {
    notificationsCache = await fetchNotifications(session.id);
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

  const groupFilter = document.getElementById('filterGroup');
  if (groupFilter) {
    groupFilter.addEventListener('change', (e) => {
      filterGroup = e.target.value;
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

async function downloadMaterial(id) {
  const mat = materialsCache.find((m) => m.id === id);
  if (!mat) return;

  try {
    await incrementDownload(id);
    mat.downloads = (mat.downloads || 0) + 1;

    if (mat.filePath) {
      const url = await getMaterialFileUrl(mat.filePath);
      const a = document.createElement('a');
      a.href = url;
      a.download = mat.fileName || `${mat.title}.${mat.type}`;
      a.target = '_blank';
      a.rel = 'noopener';
      a.click();
    } else {
      const blob = new Blob(
        [`BrainPort\n\n${mat.title}\n${mat.subject}\n\nФайл не был прикреплён при публикации.`],
        { type: 'text/plain;charset=utf-8' }
      );
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${mat.title.replace(/[^\wа-яА-ЯёЁ\s-]/gi, '')}.txt`;
      a.click();
      URL.revokeObjectURL(a.href);
    }

    showToast(`«${mat.title}» — скачивание`);
    if (currentView === 'materials' || currentView === 'mymaterials') {
      document.getElementById('appContent').innerHTML = renderMaterials();
      bindMaterialsEvents();
    }
  } catch (err) {
    showToast(formatApiError(err));
  }
}

async function deleteMaterial(id) {
  if (!confirm('Удалить этот материал?')) return;
  try {
    await deleteMaterialById(id);
    materialsCache = materialsCache.filter((m) => m.id !== id);
    showToast('Материал удалён');
    render();
  } catch (err) {
    showToast(formatApiError(err));
  }
}

function bindUploadForm() {
  document.getElementById('uploadForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('uploadSubmitBtn');
    btn.disabled = true;
    btn.textContent = 'Публикация...';

    try {
      const title = document.getElementById('matTitle').value.trim();
      const groupName = document.getElementById('matGroup').value.trim();
      const subject = document.getElementById('matSubject').value.trim();
      const type = document.getElementById('matType').value;

      if (!groupName) {
        showToast('Выберите группу для публикации');
        return;
      }
      const description = document.getElementById('matDesc').value.trim() || 'Без описания';
      const fileInput = document.getElementById('matFile');
      const file = fileInput.files[0] || null;
      let size = '';
      if (file) {
        const bytes = file.size;
        size =
          bytes > 1024 * 1024
            ? `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
            : `${Math.round(bytes / 1024)} КБ`;
      }

      const created = await insertMaterial(
        {
          title,
          subject,
          type,
          description,
          authorId: session.id,
          authorName: session.name,
          createdAt: new Date().toISOString().slice(0, 10),
          size,
          groupName
        },
        file
      );

      materialsCache.unshift(created);
      await notifyStudentsAboutMaterial(title, subject, groupName);
      showToast('Материал опубликован');
      currentView = 'mymaterials';
      await render();
    } catch (err) {
      showToast(formatApiError(err));
    } finally {
      btn.disabled = false;
      btn.textContent = 'Опубликовать';
    }
  });
}

function bindNotifications() {
  document.querySelectorAll('.notif-item').forEach((el) => {
    el.addEventListener('click', async () => {
      const n = notificationsCache.find((x) => x.id === el.dataset.id);
      if (n && !n.read) {
        try {
          await markNotificationRead(n.id);
          n.read = true;
          render();
        } catch (err) {
          showToast(formatApiError(err));
        }
      }
    });
  });
}

function renderViewContent() {
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
      break;
    default:
      content.innerHTML = renderDashboard();
  }
}

async function render() {
  if (isLoading) return;
  isLoading = true;

  const content = document.getElementById('appContent');
  if (!content.innerHTML || content.querySelector('.loading-state')) {
    content.innerHTML = '<div class="loading-state">Загрузка...</div>';
  }

  try {
    await refreshData();
    initSidebar();
    document.getElementById('pageTitle').textContent = pageTitles[currentView] || 'BrainPort';

    const showSearch = currentView === 'materials' || currentView === 'mymaterials';
    document.getElementById('globalSearchWrap').classList.toggle('hidden', !showSearch);

    renderViewContent();
  } catch (err) {
    showContentError(formatApiError(err));
  } finally {
    isLoading = false;
  }
}

document.getElementById('globalSearch')?.addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  if (currentView === 'materials' || currentView === 'mymaterials') {
    document.getElementById('appContent').innerHTML = renderMaterials();
    bindMaterialsEvents();
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    await signOut();
  } catch (_) {}
  clearSession();
  window.location.href = 'index.html';
});

(async function bootstrap() {
  initMobileMenu();

  try {
    const live = await getCurrentSession();
    if (live) {
      session = live;
      setSession(session);
    }
  } catch (_) {
    clearSession();
    window.location.href = 'index.html';
    return;
  }

  await render();
})();
