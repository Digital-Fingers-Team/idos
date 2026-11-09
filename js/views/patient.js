import * as db from "../store.js";
import * as E from "../engine.js";
import { isoDate, html, icon, avatar, fmtDate, fmtDay, fmtTime, today, statusBadge, userName, toast, confirmDialog, empty, ago } from "../ui.js";

export const SLOTS = (() => { const s = []; for (let m = 9 * 60; m < 15 * 60; m += 30) s.push(`${String(m / 60 | 0).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`); return s; })();
const upcoming = (a) => a.date >= today() && (a.status === "pending" || a.status === "confirmed");
const byDate = (a, b) => (a.date + a.time).localeCompare(b.date + b.time);

export function apptCard(a, who, actions = "") {
  const other = db.get("users", who === "doctor" ? a.doctorId : a.patientId);
  return html`<li class="appt">
    <div class="appt-date"><b>${new Date(a.date + "T12:00").getDate()}</b><small>${new Intl.DateTimeFormat("ar-EG", { month: "short" }).format(new Date(a.date + "T12:00"))}</small></div>
    <div class="appt-body"><h4>${other?.name || "—"}</h4>
      <p class="muted small">${who === "doctor" ? other?.department : ""} ${fmtDay(a.date)} · ${fmtTime(a.time)}</p>
      ${a.reason ? html`<p class="small">${a.reason}</p>` : ""}</div>
    <div class="appt-side">${statusBadge(a.status)}${actions}</div>
  </li>`;
}

export function dashboard({ user }) {
  const appts = db.where("appointments", (a) => a.patientId === user.id);
  const next = appts.filter(upcoming).sort(byDate);
  const records = db.where("records", (r) => r.patientId === user.id).sort((a, b) => b.date.localeCompare(a.date));
  const unread = db.where("messages", (m) => m.toId === user.id && !m.read).length;
  const checks = db.where("checks", (c) => c.patientId === user.id).slice(-3).reverse();
  return {
    title: "الرئيسية",
    html: html`
    <header class="page-head"><div><h1>أهلاً، ${user.name.split(" ")[0]}</h1><p class="muted">${fmtDay(today())}</p></div>
      <a class="btn primary" href="#/check">${icon("stetho")} فحص أعراض جديد</a></header>

    <div class="kpis">
      <a class="kpi" href="#/p/appointments">${icon("calendar")}<b>${next.length}</b><span>مواعيد قادمة</span></a>
      <a class="kpi" href="#/p/records">${icon("file")}<b>${records.length}</b><span>زيارات مسجّلة</span></a>
      <a class="kpi" href="#/messages">${icon("chat")}<b>${unread}</b><span>رسائل جديدة</span></a>
    </div>

    <div class="grid2 top">
      <section class="card">
        <div class="card-head"><h2>الموعد القادم</h2><a href="#/p/book" class="link">${icon("plus")} حجز</a></div>
        ${next.length ? html`<ul class="appts">${apptCard(next[0], "doctor")}</ul>
          ${next.length > 1 ? html`<a class="link" href="#/p/appointments">و${next.length - 1} موعد آخر</a>` : ""}`
          : empty("calendar", "مفيش مواعيد قادمة", "", html`<a class="btn primary sm" href="#/p/book">احجز موعداً</a>`)}
      </section>
      <section class="card">
        <div class="card-head"><h2>آخر زيارة</h2><a href="#/p/records" class="link">السجل كاملاً</a></div>
        ${records[0] ? html`<div class="rec-mini"><b>${records[0].diagnosis}</b><p class="muted small">${userName(records[0].doctorId)} · ${fmtDate(records[0].date)}</p><p class="small">${records[0].treatment}</p></div>`
          : empty("file", "لا توجد زيارات بعد")}
      </section>
    </div>

    <section class="card">
      <div class="card-head"><h2>فحوصاتك الأخيرة</h2></div>
      ${checks.length ? html`<ul class="list">${checks.map((c) => html`<li><div><b>${c.top[0]?.name || "—"}</b><p class="small muted">${c.symptoms.join("، ")}</p></div><span class="muted small">${ago(c.updatedAt || c.createdAt)}</span></li>`)}</ul>`
        : html`<p class="muted">لم تُجرِ فحص أعراض بعد. نتائج الفحص تُحفظ هنا ليراها طبيبك.</p>`}
    </section>`,
  };
}

export function appointments({ user, render }) {
  const appts = db.where("appointments", (a) => a.patientId === user.id);
  const next = appts.filter(upcoming).sort(byDate);
  const past = appts.filter((a) => !upcoming(a)).sort(byDate).reverse();
  const cancelBtn = (a) => html`<button class="btn ghost sm danger-text" data-cancel="${a.id}">إلغاء</button>`;
  return {
    title: "مواعيدي",
    html: html`
    <header class="page-head"><h1>مواعيدي</h1><a class="btn primary" href="#/p/book">${icon("plus")} حجز موعد</a></header>
    <section class="card"><h2>القادمة</h2>
      ${next.length ? html`<ul class="appts">${next.map((a) => apptCard(a, "doctor", cancelBtn(a)))}</ul>` : empty("calendar", "لا مواعيد قادمة")}
    </section>
    <section class="card"><h2>السابقة</h2>
      ${past.length ? html`<ul class="appts">${past.map((a) => apptCard(a, "doctor"))}</ul>` : html`<p class="muted">لا يوجد</p>`}
    </section>`,
    mount(root) {
      root.addEventListener("click", async (e) => {
        const b = e.target.closest("[data-cancel]");
        if (!b) return;
        if (await confirmDialog("إلغاء الموعد", "متأكد إنك عايز تلغي الموعد ده؟", "إلغاء الموعد")) {
          db.update("appointments", +b.dataset.cancel, { status: "cancelled" });
          toast("تم إلغاء الموعد");
          render();
        }
      });
    },
  };
}

export function book({ user, go }) {
  let pre = {};
  try { pre = JSON.parse(sessionStorage.getItem("idos:book") || "{}"); } catch {}
  const doctors = db.where("users", (u) => u.role === "doctor" && u.status === "active");
  const depts = [...new Set(doctors.map((d) => d.department))].sort((a, b) => a.localeCompare(b, "ar"));
  const noDoctorFor = pre.department && !depts.includes(pre.department) ? pre.department : null;
  const dept0 = depts.includes(pre.department) ? pre.department : depts.includes("باطنة") ? "باطنة" : depts[0];
  const days = [];
  const now = new Date();
  const lastSlotPassed = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}` >= SLOTS.at(-1);
  for (let i = lastSlotPassed ? 1 : 0, d = new Date(); days.length < 12; i++) {
    const x = new Date(d); x.setDate(d.getDate() + i);
    if (x.getDay() !== 5) days.push(isoDate(x)); // hospital clinics closed on Friday
  }
  return {
    title: "حجز موعد",
    html: html`
    <header class="page-head"><h1>حجز موعد</h1></header>
    ${noDoctorFor ? html`<div class="notice">${icon("alert")}<p>مفيش طبيب متاح حالياً في قسم «${noDoctorFor}»، اخترنالك الباطنة كبداية والطبيب هيحوّلك لو احتاج.</p></div>` : ""}
    <form class="card book" id="bookForm">
      <fieldset><legend>1. القسم</legend>
        <select name="department" id="dept">${depts.map((d) => html`<option ${d === dept0 ? "selected" : ""}>${d}</option>`)}</select></fieldset>
      <fieldset><legend>2. الطبيب</legend><div id="docs" class="pick-list"></div></fieldset>
      <fieldset><legend>3. اليوم</legend>
        <div class="days">${days.map((d, i) => html`<label class="day"><input type="radio" name="date" value="${d}" ${i === 0 ? "checked" : ""} required>
          <span><small>${new Intl.DateTimeFormat("ar-EG", { weekday: "short" }).format(new Date(d + "T12:00"))}</small><b>${new Date(d + "T12:00").getDate()}</b></span></label>`)}</div></fieldset>
      <fieldset><legend>4. الساعة</legend><div id="slots" class="slots"></div></fieldset>
      <label>سبب الزيارة<textarea name="reason" rows="2" maxlength="300" placeholder="مثال: كحة مستمرة من أسبوع">${pre.reason || ""}</textarea></label>
      <button class="btn primary lg">تأكيد الحجز</button>
    </form>`,
    mount(root) {
      const form = root.querySelector("#bookForm");
      const drawDocs = () => {
        const list = doctors.filter((d) => d.department === form.department.value);
        root.querySelector("#docs").innerHTML = String(html`${list.map((d, i) => html`<label class="pick"><input type="radio" name="doctorId" value="${d.id}" ${i === 0 ? "checked" : ""} required>${avatar(d)}<span><b>${d.name}</b><small>${d.department}</small></span></label>`)}`);
        drawSlots();
      };
      const drawSlots = () => {
        const doc = +form.doctorId?.value, date = form.date.value;
        const taken = new Set(db.where("appointments", (a) => a.doctorId === doc && a.date === date && a.status !== "cancelled").map((a) => a.time));
        const now = new Date(), isToday = date === today();
        const nowHM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        const free = SLOTS.filter((s) => !taken.has(s) && !(isToday && s <= nowHM));
        root.querySelector("#slots").innerHTML = free.length
          ? String(html`${free.map((s, i) => html`<label class="slot"><input type="radio" name="time" value="${s}" ${i === 0 ? "checked" : ""} required><span>${fmtTime(s)}</span></label>`)}`)
          : String(html`<p class="muted">لا توجد مواعيد متاحة في هذا اليوم، اختر يوماً آخر.</p>`);
      };
      form.addEventListener("change", (e) => {
        if (e.target.name === "department") drawDocs();
        else if (e.target.name === "doctorId" || e.target.name === "date") drawSlots();
      });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!form.time || !form.time.value) { toast("اختر ساعة متاحة", "err"); return; }
        const fd = Object.fromEntries(new FormData(form));
        const clash = db.where("appointments", (a) => a.doctorId === +fd.doctorId && a.date === fd.date && a.time === fd.time && a.status !== "cancelled");
        if (clash.length) { toast("الموعد ده اتحجز حالاً، اختر غيره", "err"); drawSlots(); return; }
        db.insert("appointments", { patientId: user.id, doctorId: +fd.doctorId, date: fd.date, time: fd.time, reason: fd.reason.trim(), status: "pending" });
        // keep the symptom check that led to this booking, so the doctor sees it in the patient file
        let syms = [];
        try { syms = JSON.parse(sessionStorage.getItem("idos:symptoms") || "[]"); } catch {}
        if (pre.reason && syms.length && !db.where("checks", (c) => c.patientId === user.id && c.sig === [...syms].sort().join("|")).length) {
          const res = E.diagnose(syms, { limit: 3 });
          db.insert("checks", { patientId: user.id, symptoms: syms, sig: [...syms].sort().join("|"), department: E.recommendDepartment(res),
            top: res.map((r) => ({ name: r.disease.name, score: +r.score.toFixed(3) })) });
        }
        try { sessionStorage.removeItem("idos:book"); } catch {}
        toast("تم الحجز، بانتظار تأكيد الطبيب");
        go("#/p/appointments");
      });
      drawDocs();
    },
  };
}

export const recordCard = (r, showPatient = false) => html`<article class="record">
  <header><div><h3>${r.diagnosis}</h3><p class="muted small">${r.title || "زيارة"} · ${fmtDate(r.date)} · ${showPatient ? userName(r.patientId) : userName(r.doctorId)}</p></div></header>
  ${r.vitals && Object.values(r.vitals).some(Boolean) ? html`<div class="vitals">
    ${r.vitals.bp ? html`<span>الضغط <b dir="ltr">${r.vitals.bp}</b></span>` : ""}
    ${r.vitals.temp ? html`<span>الحرارة <b dir="ltr">${r.vitals.temp}°</b></span>` : ""}
    ${r.vitals.pulse ? html`<span>النبض <b dir="ltr">${r.vitals.pulse}</b></span>` : ""}</div>` : ""}
  <dl><dt>العلاج</dt><dd>${r.treatment || "—"}</dd>${r.notes ? html`<dt>ملاحظات</dt><dd>${r.notes}</dd>` : ""}</dl>
</article>`;

export function records({ user }) {
  const recs = db.where("records", (r) => r.patientId === user.id).sort((a, b) => b.date.localeCompare(a.date));
  return {
    title: "سجلي الطبي",
    html: html`
    <header class="page-head"><h1>سجلي الطبي</h1></header>
    <section class="card profile-strip">
      ${avatar(user, "lg")}<div><h2>${user.name}</h2><p class="muted">فصيلة الدم: <b>${user.bloodType || "غير مسجلة"}</b> · ${user.gender || ""}</p></div>
    </section>
    ${recs.length ? html`<div class="records">${recs.map((r) => recordCard(r))}</div>` : empty("file", "لا توجد سجلات بعد", "بعد أول زيارة، تشخيص الطبيب وعلاجك هيظهروا هنا.")}`,
  };
}
