const STORAGE_KEY = 'brainport_db';

const defaultDb = () => ({
  users: [
    {
      id: 'u1',
      email: 'teacher@brainport.edu',
      password: 'teacher123',
      role: 'teacher',
      name: 'Иванов А.С.',
      department: 'Информатика',
      avatar: 'ИА'
    },
    {
      id: 'u2',
      email: 'student@brainport.edu',
      password: 'student123',
      role: 'student',
      name: 'Петров М.В.',
      group: 'ИТ-301',
      avatar: 'ПМ'
    }
  ],
  materials: [
    {
      id: 'm1',
      title: 'Введение в алгоритмы',
      subject: 'Программирование',
      type: 'pdf',
      description: 'Лекция 1: сложность, массивы, базовые структуры данных.',
      authorId: 'u1',
      authorName: 'Иванов А.С.',
      createdAt: '2026-05-10',
      downloads: 42,
      size: '2.4 МБ'
    },
    {
      id: 'm2',
      title: 'Базы данных: нормализация',
      subject: 'Базы данных',
      type: 'ppt',
      description: 'Презентация по 1NF–3NF и проектированию схем.',
      authorId: 'u1',
      authorName: 'Иванов А.С.',
      createdAt: '2026-05-12',
      downloads: 28,
      size: '5.1 МБ'
    },
    {
      id: 'm3',
      title: 'Линейная алгебра — практикум',
      subject: 'Математика',
      type: 'doc',
      description: 'Задачи на матрицы, определители и системы уравнений.',
      authorId: 'u1',
      authorName: 'Иванов А.С.',
      createdAt: '2026-05-15',
      downloads: 19,
      size: '890 КБ'
    },
    {
      id: 'm4',
      title: 'Сетевые протоколы TCP/IP',
      subject: 'Сети',
      type: 'pdf',
      description: 'Краткий конспект по уровням модели и handshake.',
      authorId: 'u1',
      authorName: 'Иванов А.С.',
      createdAt: '2026-05-18',
      downloads: 35,
      size: '1.8 МБ'
    }
  ],
  notifications: [
    { id: 'n1', userId: 'u2', text: 'Добавлен новый материал: «Сетевые протоколы TCP/IP»', read: false, date: '2026-05-18' },
    { id: 'n2', userId: 'u2', text: 'Материал «Введение в алгоритмы» скачан 5 раз за неделю', read: true, date: '2026-05-16' }
  ]
});

function loadDb() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const db = defaultDb();
    saveDb(db);
    return db;
  }
  try {
    return JSON.parse(raw);
  } catch {
    const db = defaultDb();
    saveDb(db);
    return db;
  }
}

function saveDb(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function resetDb() {
  localStorage.removeItem(STORAGE_KEY);
  return loadDb();
}

function getSession() {
  const raw = sessionStorage.getItem('brainport_session');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setSession(user) {
  sessionStorage.setItem('brainport_session', JSON.stringify(user));
}

function clearSession() {
  sessionStorage.removeItem('brainport_session');
}

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
