// Small UI toolkit: safe HTML templating, icons, toasts, dialogs, formatting.
import * as db from "./store.js";

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

// Tagged template: interpolations are escaped unless wrapped with raw().
class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
export const raw = (s) => new Raw(s);
export function html(strings, ...vals) {
  let out = "";
  strings.forEach((s, i) => {
    out += s;
    if (i < vals.length) {
      const v = vals[i];
      if (v instanceof Raw) out += v.s;
      else if (Array.isArray(v)) out += v.map((x) => (x instanceof Raw ? x.s : esc(x))).join("");
      else if (v !== false && v != null) out += esc(v);
    }
  });
  return new Raw(out);
}

/* ---------- icons (inline SVG, stroke = currentColor) ---------- */
const P = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  stetho: "M6 3v6a4 4 0 0 0 8 0V3M10 13v3a5 5 0 0 0 10 0v-2M20 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  file: "M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6",
  chat: "M4 5h16v11H9l-5 4z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7M18 14a6 6 0 0 1 4 7",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14M21 21l-5-5",
  plus: "M12 5v14M5 12h14",
  x: "M6 6l12 12M18 6 6 18",
  check: "M5 12l5 5 9-10",
  alert: "M12 3 2 20h20zM12 10v4M12 17v.5",
  moon: "M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  pulse: "M3 12h4l3-8 4 16 3-8h4",
  db: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  send: "M4 12 20 4l-6 16-3-7z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3 2",
  menu: "M4 6h16M4 12h16M4 18h16",
  arrow: "M15 5l-7 7 7 7",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  edit: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  hospital: "M4 21V5h16v16M9 21v-5h6v5M12 8v5M9.5 10.5h5",
};
export const icon = (name, cls = "") =>
  raw(`<svg class="i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[name] || P.file}"/></svg>`);

/* ---------- formatting ---------- */
const dfFull = new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long" });
const dfShort = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short", year: "numeric" });
export const fmtDate = (iso) => (iso ? dfShort.format(new Date(iso.length === 10 ? iso + "T12:00" : iso)) : "—");
export const fmtDay = (iso) => dfFull.format(new Date(iso + "T12:00"));
export function fmtTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "ص" : "م"}`;
}
// local calendar date (YYYY-MM-DD) — toISOString() would give the UTC date, wrong near midnight in Cairo
export const isoDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const today = () => isoDate();
export const ago = (iso) => {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60) return "الآن";
  if (s < 3600) return `منذ ${Math.floor(s / 60)} د`;
  if (s < 86400) return `منذ ${Math.floor(s / 3600)} س`;
  return fmtDate(iso);
};
export function age(birth) {
  if (!birth) return null;
  const b = new Date(birth), n = new Date();
  return n.getFullYear() - b.getFullYear() - (n < new Date(n.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0);
}
export const initials = (name = "") => name.replace(/^د\.\s*/, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("");
export const avatar = (u, cls = "") => html`<span class="avatar ${cls}" data-role="${u?.role || ""}">${initials(u?.name)}</span>`;
export const userName = (id) => db.get("users", id)?.name || "مستخدم محذوف";

export const STATUS = {
  pending: { label: "بانتظار التأكيد", cls: "warn" },
  confirmed: { label: "مؤكد", cls: "info" },
  completed: { label: "تم", cls: "ok" },
  cancelled: { label: "ملغي", cls: "muted" },
};
export const statusBadge = (s) => html`<span class="badge ${STATUS[s]?.cls}">${STATUS[s]?.label || s}</span>`;
export const ROLE = { admin: "مسؤول النظام", doctor: "طبيب", patient: "مريض" };

/* ---------- toast ---------- */
export function toast(msg, type = "ok") {
  let box = document.getElementById("toasts");
  if (!box) { box = document.createElement("div"); box.id = "toasts"; box.setAttribute("role", "status"); document.body.append(box); }
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `${icon(type === "err" ? "alert" : "check")}<span>${esc(msg)}</span>`;
  box.append(t);
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 300); }, 3200);
}

/* ---------- dialog ---------- */
// openDialog(title, bodyHtml, {submit: label, onSubmit(formData, dialog) -> false keeps it open})
export function openDialog(title, body, { submit, danger = false, onSubmit, wide = false } = {}) {
  const d = document.createElement("dialog");
  d.className = wide ? "wide" : "";
  d.innerHTML = String(html`
    <form method="dialog" class="dlg">
      <header><h2>${title}</h2><button type="button" class="icon-btn" data-close aria-label="إغلاق">${icon("x")}</button></header>
      <div class="dlg-body">${raw(String(body))}</div>
      ${submit ? html`<footer><button type="button" class="btn ghost" data-close>إلغاء</button>
        <button class="btn ${danger ? "danger" : "primary"}" value="ok">${submit}</button></footer>` : ""}
    </form>`);
  document.body.append(d);
  const form = d.querySelector("form");
  d.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => d.close()));
  d.addEventListener("close", () => d.remove());
  d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const keep = onSubmit ? (await onSubmit(new FormData(form), d)) === false : false;
    if (!keep) d.close();
  });
  d.showModal();
  d.querySelector("input,select,textarea")?.focus();
  return d;
}
export const confirmDialog = (title, text, label = "تأكيد", danger = true) =>
  new Promise((res) => {
    let ok = false;
    const d = openDialog(title, html`<p>${text}</p>`, { submit: label, danger, onSubmit: () => { ok = true; } });
    d.addEventListener("close", () => res(ok));
  });

export const empty = (ic, title, text = "", action = "") =>
  html`<div class="empty">${icon(ic)}<h3>${title}</h3>${text ? html`<p>${text}</p>` : ""}${action ? raw(String(action)) : ""}</div>`;
