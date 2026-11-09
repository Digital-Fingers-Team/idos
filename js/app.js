// IDOS app shell: hash router, role-based layout, theme.
import * as db from "./store.js";
import { buildSeed } from "./seed.js";
import { html, raw, icon, avatar, ROLE, esc } from "./ui.js";
import * as pub from "./views/public.js";
import * as checker from "./views/checker.js";
import * as patient from "./views/patient.js";
import * as doctor from "./views/doctor.js";
import * as admin from "./views/admin.js";
import * as shared from "./views/shared.js";

const NAV = {
  patient: [
    ["#/p", "home", "الرئيسية"], ["#/check", "stetho", "فحص الأعراض"], ["#/p/appointments", "calendar", "مواعيدي"],
    ["#/p/records", "file", "سجلي الطبي"], ["#/messages", "chat", "الرسائل"], ["#/profile", "user", "حسابي"],
  ],
  doctor: [
    ["#/d", "home", "الرئيسية"], ["#/d/appointments", "calendar", "المواعيد"], ["#/d/patients", "users", "المرضى"],
    ["#/messages", "chat", "الرسائل"], ["#/check", "stetho", "فحص الأعراض"], ["#/profile", "user", "حسابي"],
  ],
  admin: [
    ["#/a", "home", "الرئيسية"], ["#/a/users", "users", "المستخدمون"], ["#/a/appointments", "calendar", "المواعيد"],
    ["#/a/knowledge", "db", "قاعدة الأمراض"], ["#/messages", "chat", "الرسائل"], ["#/profile", "user", "حسابي"],
  ],
};
export const HOME = { patient: "#/p", doctor: "#/d", admin: "#/a" };

// [pattern, view, roles allowed (null = public)]
const ROUTES = [
  [/^\/?$/, pub.landing, null],
  [/^\/login$/, pub.login, null],
  [/^\/register$/, pub.register, null],
  [/^\/check$/, checker.view, null],
  [/^\/p$/, patient.dashboard, ["patient"]],
  [/^\/p\/appointments$/, patient.appointments, ["patient"]],
  [/^\/p\/book$/, patient.book, ["patient"]],
  [/^\/p\/records$/, patient.records, ["patient"]],
  [/^\/d$/, doctor.dashboard, ["doctor"]],
  [/^\/d\/appointments$/, doctor.appointments, ["doctor"]],
  [/^\/d\/patients$/, doctor.patients, ["doctor"]],
  [/^\/d\/patient\/(\d+)$/, doctor.patientFile, ["doctor"]],
  [/^\/a$/, admin.dashboard, ["admin"]],
  [/^\/a\/users$/, admin.users, ["admin"]],
  [/^\/a\/appointments$/, admin.appointments, ["admin"]],
  [/^\/a\/knowledge$/, admin.knowledge, ["admin"]],
  [/^\/messages(?:\/(\d+))?$/, shared.messages, ["patient", "doctor", "admin"]],
  [/^\/profile$/, shared.profile, ["patient", "doctor", "admin"]],
];

export const go = (hash) => { if (location.hash === hash) render(); else location.hash = hash; };

/* ---------- theme ---------- */
function getTheme() { try { return localStorage.getItem("idos:theme"); } catch { return null; } }
export function toggleTheme() {
  const dark = document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;
  const next = dark ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("idos:theme", next); } catch {}
}
if (getTheme()) document.documentElement.dataset.theme = getTheme();

/* ---------- layout ---------- */
const brand = html`<a href="#/" class="brand"><img src="logo.png" alt="" width="36" height="36"><span><b>IDOS</b><small>تشخيص فوري للأعراض</small></span></a>`;
const themeBtn = html`<button class="icon-btn" data-theme-toggle aria-label="تبديل المظهر">${icon("moon", "only-light")}${icon("sun", "only-dark")}</button>`;

function publicShell(content, user) {
  return html`
  <header class="topbar">
    ${brand}
    <nav class="top-links">
      <a href="#/check">فحص الأعراض</a>
      ${user ? html`<a class="btn primary sm" href="${HOME[user.role]}">لوحتي</a>`
             : html`<a href="#/login">دخول</a><a class="btn primary sm" href="#/register">حساب جديد</a>`}
      ${themeBtn}
    </nav>
  </header>
  <main id="main" class="public">${content}</main>
  <footer class="site-foot">
    <p>IDOS — مشروع Digital Fingers Team. أداة الفحص للتوجيه المبدئي فقط ولا تُغني عن الطبيب.</p>
    <p>في الطوارئ اتصل بالإسعاف <b dir="ltr">123</b></p>
  </footer>`;
}

function appShell(content, user, path) {
  const items = NAV[user.role];
  const active = (href) => {
    const h = href.slice(1);
    return path === h || (h.length > 2 && path.startsWith(h + "/")) ? "active" : "";
  };
  const unread = db.where("messages", (m) => m.toId === user.id && !m.read).length;
  return html`
  <div class="app">
    <aside class="sidebar">
      ${brand}
      <nav>
        ${items.map(([href, ic, label]) => html`<a href="${href}" class="${active(href)}">${icon(ic)}<span>${label}</span>
          ${href === "#/messages" && unread ? html`<em class="count">${unread}</em>` : ""}</a>`)}
      </nav>
      <div class="me">
        ${avatar(user)}
        <div><b>${user.name}</b><small>${user.role === "doctor" ? user.department : ROLE[user.role]}</small></div>
        <button class="icon-btn" data-logout aria-label="تسجيل الخروج" title="تسجيل الخروج">${icon("logout")}</button>
      </div>
    </aside>
    <div class="app-main">
      <header class="app-top">
        <div class="mobile-brand">${brand}</div>
        <div class="spacer"></div>
        ${themeBtn}
        <button class="icon-btn mobile-only" data-logout aria-label="تسجيل الخروج">${icon("logout")}</button>
      </header>
      <main id="main">${content}</main>
    </div>
    <nav class="tabbar">
      ${items.slice(0, 5).map(([href, ic, label]) => html`<a href="${href}" class="${active(href)}">${icon(ic)}<span>${label}</span>
        ${href === "#/messages" && unread ? html`<em class="dot"></em>` : ""}</a>`)}
    </nav>
  </div>`;
}

/* ---------- router ---------- */
const root = document.getElementById("root");
let cleanup = null;

export function render() {
  const path = decodeURIComponent(location.hash.replace(/^#/, "")) || "/";
  const user = db.currentUser();
  let match = null, route = null;
  for (const r of ROUTES) { match = path.match(r[0]); if (match) { route = r; break; } }
  if (!route) return go(user ? HOME[user.role] : "#/");
  const [, view, roles] = route;
  if (roles && !user) { sessionStorage.setItem("idos:after-login", location.hash); return go("#/login"); }
  if (roles && !roles.includes(user.role)) return go(HOME[user.role]);
  if (user && (path === "/login" || path === "/register")) return go(HOME[user.role]);

  if (cleanup) { cleanup(); cleanup = null; }
  const ctx = { user, params: match.slice(1), go, render };
  const v = view(ctx);
  document.title = v.title ? `${v.title} · IDOS` : "IDOS — تشخيص فوري للأعراض";
  const inApp = user && (roles || path === "/check");
  root.innerHTML = String(inApp ? appShell(v.html, user, path) : publicShell(v.html, user));
  root.querySelectorAll("[data-theme-toggle]").forEach((b) => b.addEventListener("click", toggleTheme));
  root.querySelectorAll("[data-logout]").forEach((b) => b.addEventListener("click", () => { db.logout(); go("#/"); }));
  const main = root.querySelector("#main");
  cleanup = v.mount?.(main, ctx) || null;
  if (!v.keepScroll) window.scrollTo(0, 0);
}

async function start() {
  if (!db.ready()) db.init(await buildSeed());
  window.addEventListener("hashchange", render);
  render();
}
start().catch((e) => {
  root.innerHTML = `<div class="fatal"><h1>تعذّر تشغيل IDOS</h1><p>${esc(e.message)}</p></div>`;
  console.error(e);
});
export { raw };
