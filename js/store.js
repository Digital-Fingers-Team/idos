// Local data store. Everything lives in this browser (localStorage) — IDOS runs as a
// static demo without a server, so each visitor gets an independent copy of the hospital.
const KEY = "idos:v2";
const SESSION = "idos:session";
const TABLES = ["users", "appointments", "records", "messages", "checks"];

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      for (const t of TABLES) s[t] ||= [];
      s.seq ||= 1000;
      return s;
    }
  } catch { /* corrupted or blocked storage: start fresh */ }
  return null;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode: keep in memory */ }
  listeners.forEach((fn) => fn());
}
const listeners = new Set();
export const onChange = (fn) => (listeners.add(fn), () => listeners.delete(fn));

export const ready = () => state !== null;
export function init(seed) {
  state = { seq: 1000, ...Object.fromEntries(TABLES.map((t) => [t, []])), ...seed };
  save();
}
export function reset() {
  try { localStorage.removeItem(KEY); localStorage.removeItem(SESSION); } catch {}
  state = null;
}

export const all = (t) => state[t];
export const get = (t, id) => state[t].find((r) => r.id === id);
export const where = (t, fn) => state[t].filter(fn);
export function insert(t, row) {
  const rec = { id: ++state.seq, createdAt: new Date().toISOString(), ...row };
  state[t].push(rec);
  save();
  return rec;
}
export function update(t, id, patch) {
  const r = get(t, id);
  if (!r) return null;
  Object.assign(r, patch, { updatedAt: new Date().toISOString() });
  save();
  return r;
}
export function remove(t, id) {
  state[t] = state[t].filter((r) => r.id !== id);
  save();
}
export function exportJSON() {
  const copy = structuredClone(state);
  copy.users.forEach((u) => { delete u.hash; delete u.salt; });
  return JSON.stringify(copy, null, 2);
}

/* ---------- auth ---------- */
async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function hashPassword(password, salt = crypto.getRandomValues(new Uint32Array(2)).join("")) {
  return { salt, hash: await sha256(`${salt}:${password}`) };
}
export async function login(email, password) {
  const u = state.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (!u) return { error: "البريد الإلكتروني غير مسجّل" };
  const { hash } = await hashPassword(password, u.salt);
  if (hash !== u.hash) return { error: "كلمة المرور غير صحيحة" };
  if (u.status !== "active") return { error: "هذا الحساب موقوف، تواصل مع إدارة المستشفى" };
  try { localStorage.setItem(SESSION, String(u.id)); } catch {}
  return { user: u };
}
export function logout() { try { localStorage.removeItem(SESSION); } catch {} }
export function currentUser() {
  if (!state) return null;
  let id = null;
  try { id = Number(localStorage.getItem(SESSION)); } catch {}
  const u = id ? get("users", id) : null;
  return u && u.status === "active" ? u : null;
}
export function setSession(u) { try { localStorage.setItem(SESSION, String(u.id)); } catch {} }
