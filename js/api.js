let supabaseClient = null;

function getSupabase() {
  if (!supabaseClient) {
    if (!window.supabase?.createClient) {
      throw new Error('Supabase SDK не загружен');
    }
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return supabaseClient;
}

function normalizeEmail(login) {
  const value = login.trim().toLowerCase();
  if (value.includes('@')) return value;
  return `${value}@${DEFAULT_EMAIL_DOMAIN}`;
}

function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function mapProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    department: row.department || '',
    group: row.group_name || '',
    avatar: row.avatar || initials(row.name)
  };
}

function mapMaterial(row) {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    type: row.type,
    description: row.description || '',
    authorId: row.author_id,
    authorName: row.author_name,
    createdAt: row.created_at,
    downloads: row.downloads ?? 0,
    size: row.size || '',
    filePath: row.file_path || null,
    fileName: row.file_name || null
  };
}

function mapNotification(row) {
  return {
    id: row.id,
    userId: row.user_id,
    text: row.text,
    read: row.read,
    date: row.date
  };
}

async function signIn(login, password) {
  const email = normalizeEmail(login);
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
  const profile = await fetchProfile(data.user.id);
  return profile;
}

async function signUp({ email, password, name, role, department, group }) {
  const normalizedEmail = normalizeEmail(email);
  const { data, error } = await getSupabase().auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        name: name.trim(),
        role,
        department: role === 'teacher' ? (department || '').trim() : null,
        group_name: role === 'student' ? (group || '').trim() : null,
        avatar: initials(name)
      }
    }
  });
  if (error) throw error;
  if (!data.user) throw new Error('Регистрация не завершена');

  let profile = await fetchProfile(data.user.id);
  if (!profile) {
    await upsertProfile(data.user.id, {
      email: normalizedEmail,
      name: name.trim(),
      role,
      department: role === 'teacher' ? department : null,
      group_name: role === 'student' ? group : null,
      avatar: initials(name)
    });
    profile = await fetchProfile(data.user.id);
  }
  return profile;
}

async function signOut() {
  await getSupabase().auth.signOut();
}

async function getCurrentSession() {
  const { data } = await getSupabase().auth.getSession();
  if (!data.session?.user) return null;
  const profile = await fetchProfile(data.session.user.id);
  return profile;
}

async function fetchProfile(userId) {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return mapProfile(data);
}

async function upsertProfile(userId, fields) {
  const { error } = await getSupabase().from('profiles').upsert({ id: userId, ...fields });
  if (error) throw error;
}

async function fetchMaterials() {
  const { data, error } = await getSupabase()
    .from('materials')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapMaterial);
}

async function insertMaterial(material, file) {
  let filePath = null;
  let fileName = null;
  if (file) {
    const ext = file.name.split('.').pop() || 'bin';
    const path = `${material.authorId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await getSupabase().storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { upsert: false });
    if (uploadError) throw uploadError;
    filePath = path;
    fileName = file.name;
  }

  const { data, error } = await getSupabase()
    .from('materials')
    .insert({
      title: material.title,
      subject: material.subject,
      type: material.type,
      description: material.description,
      author_id: material.authorId,
      author_name: material.authorName,
      created_at: material.createdAt,
      downloads: 0,
      size: material.size,
      file_path: filePath,
      file_name: fileName
    })
    .select()
    .single();
  if (error) throw error;
  return mapMaterial(data);
}

async function deleteMaterialById(id) {
  const { data: row } = await getSupabase().from('materials').select('file_path').eq('id', id).maybeSingle();
  const { error } = await getSupabase().from('materials').delete().eq('id', id);
  if (error) throw error;
  if (row?.file_path) {
    await getSupabase().storage.from(STORAGE_BUCKET).remove([row.file_path]);
  }
}

async function incrementDownload(id) {
  const { data, error: fetchError } = await getSupabase()
    .from('materials')
    .select('downloads')
    .eq('id', id)
    .single();
  if (fetchError) throw fetchError;
  const { error } = await getSupabase()
    .from('materials')
    .update({ downloads: (data.downloads || 0) + 1 })
    .eq('id', id);
  if (error) throw error;
}

async function getMaterialFileUrl(filePath) {
  const { data, error } = await getSupabase().storage.from(STORAGE_BUCKET).createSignedUrl(filePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}

async function fetchNotifications(userId) {
  const { data, error } = await getSupabase()
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapNotification);
}

async function markNotificationRead(id) {
  const { error } = await getSupabase().from('notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
}

async function notifyStudentsAboutMaterial(title, subject) {
  const { data: students, error: studentsError } = await getSupabase()
    .from('profiles')
    .select('id')
    .eq('role', 'student');
  if (studentsError) throw studentsError;
  if (!students?.length) return;

  const today = new Date().toISOString().slice(0, 10);
  const rows = students.map((s) => ({
    user_id: s.id,
    text: `Добавлен новый материал: «${title}» (${subject})`,
    read: false,
    date: today
  }));

  const { error } = await getSupabase().from('notifications').insert(rows);
  if (error) throw error;
}

function isSchemaMissingError(err) {
  const msg = (err?.message || err?.code || '').toString();
  return msg.includes('PGRST205') || msg.includes('schema cache') || msg.includes('relation');
}

function formatApiError(err) {
  if (isSchemaMissingError(err)) {
    return 'База не настроена. Выполните SQL из файла supabase/schema.sql в панели Supabase.';
  }
  if (err?.message === 'Invalid login credentials') {
    return 'Неверный логин или пароль.';
  }
  return err?.message || 'Произошла ошибка';
}
