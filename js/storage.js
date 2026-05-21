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
