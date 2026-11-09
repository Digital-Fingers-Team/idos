import * as db from "../store.js";
import { html, icon, avatar, fmtDate, fmtTime, today, statusBadge, toast, openDialog, confirmDialog, empty, ROLE, STATUS, userName } from "../ui.js";
import { DISEASES, SYMPTOMS, weight } from "../engine.js";

const bars = (rows) => {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return html`<ul class="bars">${rows.map(([label, n]) => html`<li><span>${label}</span><i style="--w:${(n / max) * 100}%"></i><b>${n}</b></li>`)}</ul>`;
};

export function dashboard() {
  const users = db.all("users"), appts = db.all("appointments");
  const count = (arr, fn) => arr.filter(fn).length;
  const byDept = new Map();
  for (const a of appts) {
    const d = db.get("users", a.doctorId)?.department || "—";
    byDept.set(d, (byDept.get(d) || 0) + 1);
  }
  const checkDept = new Map();
  for (const c of db.all("checks")) if (c.department) checkDept.set(c.department, (checkDept.get(c.department) || 0) + 1);
  return {
    title: "لوحة الإدارة",
    html: html`
    <header class="page-head"><div><h1>لوحة الإدارة</h1><p class="muted">نظرة عامة على المستشفى</p></div></header>
    <div class="kpis">
      <a class="kpi" href="#/a/users">${icon("users")}<b>${count(users, (u) => u.role === "patient")}</b><span>مريض</span></a>
      <a class="kpi" href="#/a/users">${icon("stetho")}<b>${count(users, (u) => u.role === "doctor" && u.status === "active")}</b><span>طبيب نشط</span></a>
      <a class="kpi" href="#/a/appointments">${icon("calendar")}<b>${count(appts, (a) => a.date === today() && a.status !== "cancelled")}</b><span>مواعيد اليوم</span></a>
      <a class="kpi" href="#/a/appointments">${icon("alert")}<b>${count(appts, (a) => a.status === "pending")}</b><span>بانتظار التأكيد</span></a>
    </div>
    <div class="grid2 top">
      <section class="card"><h2>المواعيد حسب القسم</h2>${byDept.size ? bars([...byDept].sort((a, b) => b[1] - a[1])) : html`<p class="muted">لا يوجد</p>`}</section>
      <section class="card"><h2>حالة المواعيد</h2>${bars(Object.keys(STATUS).map((s) => [STATUS[s].label, count(appts, (a) => a.status === s)]))}</section>
      <section class="card"><h2>الأقسام المقترحة من فحص الأعراض</h2>
        ${checkDept.size ? bars([...checkDept].sort((a, b) => b[1] - a[1])) : html`<p class="muted small">تظهر هنا بعد أن يجري المرضى فحوصات. تفيد في توقّع الضغط على كل قسم.</p>`}</section>
      <section class="card"><h2>قاعدة المعرفة</h2>
        <p><b>${DISEASES.length}</b> مرض · <b>${SYMPTOMS.length}</b> عرض موحّد</p>
        <a class="btn ghost sm" href="#/a/knowledge">استعراض</a></section>
    </div>`,
  };
}

let roleFilter = "all";
export function users({ user: me, render }) {
  const list = db.where("users", (u) => roleFilter === "all" || u.role === roleFilter).sort((a, b) => a.role.localeCompare(b.role) || a.name.localeCompare(b.name, "ar"));
  return {
    title: "المستخدمون",
    html: html`
    <header class="page-head"><h1>المستخدمون</h1><button class="btn primary" id="addUser">${icon("plus")} إضافة طبيب أو مسؤول</button></header>
    <div class="row between wrap gap">
      <div class="tabs">${[["all", "الكل"], ["doctor", "الأطباء"], ["patient", "المرضى"], ["admin", "الإدارة"]].map(([k, l]) => html`<button aria-selected="${k === roleFilter}" data-r="${k}">${l}</button>`)}</div>
      <div class="input-icon search">${icon("search")}<input id="q" type="search" placeholder="بحث"></div>
    </div>
    <section class="card flush">
      <div class="table-wrap"><table>
        <thead><tr><th>الاسم</th><th>الدور</th><th>القسم</th><th>الموبايل</th><th>الحالة</th><th></th></tr></thead>
        <tbody id="tb">${list.map((u) => html`<tr data-q="${u.name} ${u.email} ${u.phone}">
          <td><div class="who">${avatar(u)}<div><b>${u.name}</b><small dir="ltr">${u.email}</small></div></div></td>
          <td>${ROLE[u.role]}</td><td>${u.department || "—"}</td><td dir="ltr">${u.phone || "—"}</td>
          <td><span class="badge ${u.status === "active" ? "ok" : "muted"}">${u.status === "active" ? "نشط" : "موقوف"}</span></td>
          <td class="actions">${u.id === me.id ? html`<small class="muted">أنت</small>` : html`
            <button class="icon-btn" data-toggle="${u.id}" title="${u.status === "active" ? "إيقاف" : "تفعيل"}">${icon(u.status === "active" ? "x" : "check")}</button>
            <button class="icon-btn danger-text" data-del="${u.id}" title="حذف">${icon("trash")}</button>`}</td></tr>`)}</tbody>
      </table></div>
    </section>`,
    mount(root) {
      root.querySelectorAll("[data-r]").forEach((b) => b.addEventListener("click", () => { roleFilter = b.dataset.r; render(); }));
      root.querySelector("#q").addEventListener("input", (e) => {
        const q = e.target.value.trim().toLowerCase();
        root.querySelectorAll("#tb tr").forEach((tr) => (tr.hidden = q && !tr.dataset.q.toLowerCase().includes(q)));
      });
      root.querySelector("#addUser").addEventListener("click", () => {
        const depts = [...new Set(DISEASES.map((d) => d.department).concat(db.where("users", (u) => u.role === "doctor").map((u) => u.department)))].sort((a, b) => a.localeCompare(b, "ar"));
        openDialog("إضافة مستخدم", html`
          <div class="grid2"><label>الدور<select name="role"><option value="doctor">طبيب</option><option value="admin">مسؤول</option></select></label>
          <label>القسم<input name="department" list="depts" required><datalist id="depts">${depts.map((d) => html`<option>${d}</option>`)}</datalist></label></div>
          <label>الاسم<input name="name" required minlength="3"></label>
          <div class="grid2"><label>البريد<input name="email" type="email" required dir="ltr"></label>
          <label>الموبايل<input name="phone" required pattern="01[0125][0-9]{8}" dir="ltr"></label></div>
          <label>كلمة مرور مؤقتة<input name="password" required minlength="8" dir="ltr"></label>`, {
          submit: "إضافة",
          async onSubmit(fd) {
            const email = fd.get("email").trim().toLowerCase();
            if (db.all("users").some((u) => u.email.toLowerCase() === email)) { toast("البريد مسجل بالفعل", "err"); return false; }
            const { salt, hash } = await db.hashPassword(fd.get("password"));
            const role = fd.get("role");
            let name = fd.get("name").trim();
            if (role === "doctor" && !name.startsWith("د.")) name = `د. ${name}`;
            db.insert("users", { role, name, email, phone: fd.get("phone"), department: fd.get("department").trim(), status: "active", salt, hash });
            toast("تمت الإضافة");
            render();
          },
        });
      });
      root.addEventListener("click", async (e) => {
        const t = e.target.closest("[data-toggle],[data-del]");
        if (!t) return;
        if (t.dataset.toggle) {
          const u = db.get("users", +t.dataset.toggle);
          db.update("users", u.id, { status: u.status === "active" ? "suspended" : "active" });
          toast(u.status === "active" ? "تم التفعيل" : "تم إيقاف الحساب");
          render();
        } else {
          const u = db.get("users", +t.dataset.del);
          const linked = db.where("appointments", (a) => a.patientId === u.id || a.doctorId === u.id).length;
          if (await confirmDialog("حذف مستخدم", `سيتم حذف ${u.name} نهائياً${linked ? ` مع ${linked} موعد مرتبط` : ""}. الأفضل إيقاف الحساب بدلاً من حذفه. متابعة؟`, "حذف نهائي")) {
            db.where("appointments", (a) => a.patientId === u.id || a.doctorId === u.id).forEach((a) => db.remove("appointments", a.id));
            db.remove("users", u.id);
            toast("تم الحذف");
            render();
          }
        }
      });
    },
  };
}

let aFilter = "all";
export function appointments({ render }) {
  const list = db.where("appointments", (a) => aFilter === "all" || a.status === aFilter).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  return {
    title: "كل المواعيد",
    html: html`
    <header class="page-head"><h1>كل المواعيد</h1></header>
    <div class="tabs">${[["all", "الكل"], ...Object.entries(STATUS).map(([k, v]) => [k, v.label])].map(([k, l]) => html`<button aria-selected="${k === aFilter}" data-f="${k}">${l}</button>`)}</div>
    <section class="card flush">${list.length ? html`<div class="table-wrap"><table>
      <thead><tr><th>التاريخ</th><th>المريض</th><th>الطبيب</th><th>القسم</th><th>الحالة</th></tr></thead>
      <tbody>${list.map((a) => html`<tr><td>${fmtDate(a.date)} · ${fmtTime(a.time)}</td><td>${userName(a.patientId)}</td><td>${userName(a.doctorId)}</td>
        <td>${db.get("users", a.doctorId)?.department || "—"}</td><td>${statusBadge(a.status)}</td></tr>`)}</tbody></table></div>` : empty("calendar", "لا توجد مواعيد")}</section>`,
    mount(root) { root.querySelectorAll("[data-f]").forEach((b) => b.addEventListener("click", () => { aFilter = b.dataset.f; render(); })); },
  };
}

export function knowledge() {
  const depts = [...new Set(DISEASES.map((d) => d.department))].sort((a, b) => a.localeCompare(b, "ar"));
  return {
    title: "قاعدة الأمراض",
    html: html`
    <header class="page-head"><div><h1>قاعدة الأمراض</h1><p class="muted">${DISEASES.length} مرض و${SYMPTOMS.length} عرض موحّد. الأعراض النادرة (الداكنة) لها وزن أكبر في المطابقة.</p></div></header>
    <div class="row wrap gap">
      <div class="input-icon search">${icon("search")}<input id="q" type="search" placeholder="ابحث عن مرض أو عرض"></div>
      <select id="dept"><option value="">كل الأقسام</option>${depts.map((d) => html`<option>${d}</option>`)}</select>
      <span class="muted small" id="cnt"></span>
    </div>
    <div class="kb" id="kb">${DISEASES.map((d) => html`<article data-dept="${d.department}" data-q="${d.name} ${d.symptoms.join(" ")}">
      <header><h3>${d.name}</h3><span class="badge info">${d.department}</span></header>
      <div class="chips">${d.symptoms.map((s) => html`<span class="chip sm w${Math.min(3, Math.floor(weight(s)))}">${s}</span>`)}</div></article>`)}</div>`,
    mount(root) {
      const q = root.querySelector("#q"), dept = root.querySelector("#dept"), cnt = root.querySelector("#cnt");
      const apply = () => {
        let n = 0;
        root.querySelectorAll("#kb article").forEach((a) => {
          const show = (!dept.value || a.dataset.dept === dept.value) && (!q.value.trim() || a.dataset.q.includes(q.value.trim()));
          a.hidden = !show; n += show;
        });
        cnt.textContent = `${n} نتيجة`;
      };
      q.addEventListener("input", apply); dept.addEventListener("change", apply); apply();
    },
  };
}
