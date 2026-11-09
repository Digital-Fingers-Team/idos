import * as db from "../store.js";
import { html, icon, avatar, fmtDate, fmtDay, fmtTime, today, statusBadge, toast, openDialog, empty, age, ago, esc } from "../ui.js";
import { apptCard, recordCard } from "./patient.js";

const byDate = (a, b) => (a.date + a.time).localeCompare(b.date + b.time);

function actions(a) {
  const btn = (act, label, cls = "ghost") => html`<button class="btn ${cls} sm" data-act="${act}" data-id="${a.id}">${label}</button>`;
  if (a.status === "pending") return html`<div class="row gap-s">${btn("confirm", "تأكيد", "primary")}${btn("cancel", "رفض")}</div>`;
  if (a.status === "confirmed") return html`<div class="row gap-s">${btn("visit", "تسجيل الزيارة", "primary")}${btn("cancel", "إلغاء")}</div>`;
  return "";
}

export function visitDialog(patientId, doctor, appt, after) {
  const p = db.get("users", patientId);
  openDialog(`تسجيل زيارة — ${p?.name}`, html`
    <div class="grid3">
      <label>الضغط<input name="bp" dir="ltr" placeholder="120/80" pattern="\\d{2,3}/\\d{2,3}"></label>
      <label>الحرارة<input name="temp" dir="ltr" type="number" step="0.1" min="34" max="43" placeholder="37.0"></label>
      <label>النبض<input name="pulse" dir="ltr" type="number" min="30" max="220" placeholder="80"></label>
    </div>
    <label>التشخيص<input name="diagnosis" required maxlength="160"></label>
    <label>العلاج<textarea name="treatment" rows="3" required maxlength="800"></textarea></label>
    <label>ملاحظات<textarea name="notes" rows="2" maxlength="800"></textarea></label>`, {
    submit: "حفظ في السجل", wide: true,
    onSubmit(fd) {
      db.insert("records", {
        patientId, doctorId: doctor.id, date: today(), title: `كشف ${doctor.department}`,
        diagnosis: fd.get("diagnosis").trim(), treatment: fd.get("treatment").trim(), notes: fd.get("notes").trim(),
        vitals: { bp: fd.get("bp"), temp: fd.get("temp"), pulse: fd.get("pulse") }, appointmentId: appt?.id || null,
      });
      if (appt) db.update("appointments", appt.id, { status: "completed" });
      toast("تم حفظ الزيارة في سجل المريض");
      after();
    },
  });
}

function bindActions(root, user, render) {
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const a = db.get("appointments", +b.dataset.id);
    if (b.dataset.act === "confirm") { db.update("appointments", a.id, { status: "confirmed" }); toast("تم تأكيد الموعد"); render(); }
    else if (b.dataset.act === "cancel") { db.update("appointments", a.id, { status: "cancelled" }); toast("تم إلغاء الموعد"); render(); }
    else if (b.dataset.act === "visit") visitDialog(a.patientId, user, a, render);
  });
}

export function dashboard({ user, render }) {
  const mine = db.where("appointments", (a) => a.doctorId === user.id);
  const todays = mine.filter((a) => a.date === today() && a.status !== "cancelled").sort(byDate);
  const pending = mine.filter((a) => a.status === "pending" && a.date >= today()).sort(byDate);
  const patients = new Set(mine.map((a) => a.patientId)).size;
  const done = mine.filter((a) => a.status === "completed").length;
  return {
    title: "لوحة الطبيب",
    html: html`
    <header class="page-head"><div><h1>صباح الخير، ${user.name}</h1><p class="muted">${user.department} · ${fmtDay(today())}</p></div></header>
    <div class="kpis">
      <a class="kpi" href="#/d/appointments">${icon("clock")}<b>${todays.length}</b><span>مواعيد اليوم</span></a>
      <a class="kpi" href="#/d/appointments">${icon("alert")}<b>${pending.length}</b><span>بانتظار التأكيد</span></a>
      <a class="kpi" href="#/d/patients">${icon("users")}<b>${patients}</b><span>مريض</span></a>
      <div class="kpi">${icon("check")}<b>${done}</b><span>زيارة مكتملة</span></div>
    </div>
    <section class="card"><div class="card-head"><h2>جدول اليوم</h2></div>
      ${todays.length ? html`<ul class="appts">${todays.map((a) => apptCard(a, "patient", html`${actions(a)}<a class="link small" href="#/d/patient/${a.patientId}">الملف</a>`))}</ul>` : empty("calendar", "لا مواعيد اليوم")}
    </section>
    <section class="card"><div class="card-head"><h2>طلبات بانتظار التأكيد</h2></div>
      ${pending.length ? html`<ul class="appts">${pending.map((a) => apptCard(a, "patient", actions(a)))}</ul>` : html`<p class="muted">لا يوجد</p>`}
    </section>`,
    mount: (root) => bindActions(root, user, render),
  };
}

let apptFilter = "upcoming";
export function appointments({ user, render }) {
  const mine = db.where("appointments", (a) => a.doctorId === user.id);
  const F = {
    upcoming: ["القادمة", (a) => a.date >= today() && ["pending", "confirmed"].includes(a.status)],
    pending: ["بانتظار التأكيد", (a) => a.status === "pending"],
    completed: ["المكتملة", (a) => a.status === "completed"],
    all: ["الكل", () => true],
  };
  const list = mine.filter(F[apptFilter][1]).sort(byDate);
  if (apptFilter !== "upcoming") list.reverse();
  return {
    title: "المواعيد",
    html: html`
    <header class="page-head"><h1>المواعيد</h1></header>
    <div class="tabs" role="tablist">${Object.entries(F).map(([k, [l, fn]]) => html`<button role="tab" aria-selected="${k === apptFilter}" data-f="${k}">${l} <em>${mine.filter(fn).length}</em></button>`)}</div>
    <section class="card">${list.length ? html`<ul class="appts">${list.map((a) => apptCard(a, "patient", html`${actions(a)}<a class="link small" href="#/d/patient/${a.patientId}">الملف</a>`))}</ul>` : empty("calendar", "لا توجد مواعيد هنا")}</section>`,
    mount(root) {
      root.querySelectorAll("[data-f]").forEach((b) => b.addEventListener("click", () => { apptFilter = b.dataset.f; render(); }));
      bindActions(root, user, render);
    },
  };
}

export function patients({ user }) {
  const ids = new Set([...db.where("appointments", (a) => a.doctorId === user.id).map((a) => a.patientId),
    ...db.where("records", (r) => r.doctorId === user.id).map((r) => r.patientId)]);
  const list = db.where("users", (u) => ids.has(u.id));
  const last = (pid) => db.where("appointments", (a) => a.doctorId === user.id && a.patientId === pid).sort(byDate).at(-1);
  return {
    title: "المرضى",
    html: html`
    <header class="page-head"><h1>المرضى</h1>
      <div class="input-icon search">${icon("search")}<input id="q" placeholder="بحث بالاسم أو الموبايل" type="search"></div></header>
    <section class="card">
      ${list.length ? html`<ul class="list people" id="plist">${list.map((p) => html`
        <li data-q="${p.name} ${p.phone}"><a href="#/d/patient/${p.id}">${avatar(p)}<div><b>${p.name}</b>
          <small class="muted">${age(p.birthDate) ?? "—"} سنة · ${p.gender || ""} · <span dir="ltr">${p.phone}</span></small></div>
          <span class="muted small">آخر موعد: ${fmtDate(last(p.id)?.date)}</span></a></li>`)}</ul>` : empty("users", "لا يوجد مرضى بعد")}
    </section>`,
    mount(root) {
      root.querySelector("#q")?.addEventListener("input", (e) => {
        const q = e.target.value.trim();
        root.querySelectorAll("#plist li").forEach((li) => (li.hidden = q && !li.dataset.q.includes(q)));
      });
    },
  };
}

export function patientFile({ user, params, render, go }) {
  const p = db.get("users", +params[0]);
  if (!p || p.role !== "patient") return { html: empty("user", "المريض غير موجود") };
  const recs = db.where("records", (r) => r.patientId === p.id).sort((a, b) => b.date.localeCompare(a.date));
  const appts = db.where("appointments", (a) => a.patientId === p.id && a.doctorId === user.id).sort(byDate).reverse();
  const checks = db.where("checks", (c) => c.patientId === p.id).slice(-5).reverse();
  return {
    title: p.name,
    html: html`
    <a class="back" href="#/d/patients">${icon("arrow")} المرضى</a>
    <section class="card profile-strip">
      ${avatar(p, "lg")}
      <div class="grow"><h1>${p.name}</h1>
        <p class="muted">${age(p.birthDate) ?? "—"} سنة · ${p.gender || ""} · فصيلة الدم <b>${p.bloodType || "—"}</b> · <span dir="ltr">${p.phone}</span></p></div>
      <div class="row gap-s wrap"><button class="btn primary" id="addVisit">${icon("plus")} تسجيل زيارة</button>
        <a class="btn ghost" href="#/messages/${p.id}">${icon("chat")} مراسلة</a></div>
    </section>
    <div class="grid2 top">
      <section><h2 class="section-title">السجل الطبي</h2>
        ${recs.length ? html`<div class="records">${recs.map((r) => recordCard(r))}</div>` : empty("file", "لا توجد زيارات مسجلة")}</section>
      <aside>
        <section class="card"><h2>فحوصات الأعراض (من المريض)</h2>
          ${checks.length ? html`<ul class="list">${checks.map((c) => html`<li><div><b>${c.symptoms.join("، ")}</b>
            <p class="small muted">أعلى احتمال: ${c.top[0]?.name || "—"} · القسم: ${c.department || "—"}</p></div><span class="small muted">${ago(c.updatedAt || c.createdAt)}</span></li>`)}</ul>`
            : html`<p class="muted small">لم يُجرِ المريض فحص أعراض.</p>`}</section>
        <section class="card"><h2>مواعيده معك</h2>
          ${appts.length ? html`<ul class="list">${appts.map((a) => html`<li><span>${fmtDate(a.date)} · ${fmtTime(a.time)}</span>${statusBadge(a.status)}</li>`)}</ul>` : html`<p class="muted small">لا يوجد</p>`}</section>
      </aside>
    </div>`,
    mount(root) {
      root.querySelector("#addVisit")?.addEventListener("click", () => {
        const open = appts.find((a) => a.status === "confirmed" && a.date === today());
        visitDialog(p.id, user, open, render);
      });
    },
  };
}
