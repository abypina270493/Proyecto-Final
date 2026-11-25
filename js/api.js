// Capa de acceso a la API y manejo de sesión
const API_BASE = "https://portfolio-api-three-black.vercel.app/api/v1";
const TOKEN_KEY = "authToken";
const USER_KEY = "authUser";

// ---------- Sesión ----------
function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* sin acceso a localStorage */
  }
}

// Un token es válido si es un JWT bien formado y no ha expirado (si trae exp)
function isTokenValid(token) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return !payload.exp || payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

// Guardia de rutas: úsala al inicio de las vistas protegidas
function requireAuth() {
  if (!isTokenValid(getToken())) {
    clearSession();
    window.location.replace("login.html");
    return false;
  }
  return true;
}

function logout() {
  clearSession();
  window.location.replace("login.html");
}

// ---------- Peticiones ----------
async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (auth) headers["auth-token"] = getToken();

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor.");
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* respuesta sin cuerpo JSON */
  }

  if (res.status === 401 && auth) {
    // Token rechazado por la API: cerrar sesión
    logout();
    throw new Error("Sesión expirada.");
  }
  if (!res.ok) {
    throw new Error((data && data.message) || "Ocurrió un error en la solicitud.");
  }
  return data;
}

// ---------- Auth ----------
const registerUser = (user) => request("/auth/register", { method: "POST", body: user });

async function loginUser({ email, password }) {
  const data = await request("/auth/login", { method: "POST", body: { email, password } });
  if (!data || !data.token) throw new Error("Respuesta inválida del servidor.");
  saveSession(data.token, data.userPublicData || data.user);
  return data;
}

// ---------- Proyectos (protegidos) ----------
const getProjects = () => request("/projects", { auth: true });
const createProject = (project) => request("/projects", { method: "POST", body: project, auth: true });
const updateProject = (id, project) => request(`/projects/${id}`, { method: "PUT", body: project, auth: true });
const deleteProject = (id) => request(`/projects/${id}`, { method: "DELETE", auth: true });
