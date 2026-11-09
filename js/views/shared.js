import * as db from "../store.js";
import { html, icon, avatar, ago, toast, empty, ROLE, confirmDialog } from "../ui.js";

// who may this user start a conversation with?
function contacts(me) {
  const users = db.where("users", (u) => u.id !== me.id && u.status === "active");
  if (me.role === "admin") return users.filter((u) => u.role !== "patient");
  if (me.role === "doctor") {
    const mine = new Set(db.where("appointments", (a) => a.doctorId === me.id).map((a) => a.patientId));
    return users.filter((u) => u.role !== "patient" || mine.has(u.id));
  }
  const mine = new Set(db.where("appointments", (a) => a.patientId === me.id).map((a) => a.doctorId));
  return users.filter((u) => u.role === "doctor" && mine.has(u.id));
}

export function messages({ user, params, go, render }) {
  const msgs = db.where("messages", (m) => m.fromId === user.id || m.toId === user.id);
  const threads = new Map();
  for (const m of msgs) {
    const other = m.fromId === user.id ? m.toId : m.fromId;
    const t = threads.get(other) || { other, last: m, unread: 0 };
    if (m.createdAt >= t.last.createdAt) t.last = m;
    if (m.toId === user.id && !m.read) t.unread++;
    threads.set(other, t);
  }
  const list = [...threads.values()].sort((a, b) => b.last.createdAt.localeCompare(a.last.createdAt));
  const allowed = contacts(user);
  const activeId = params[0] ? +params[0] : null;
  const active = activeId ? db.get("users", activeId) : null;
  const canTalk = active && (threads.has(active.id) || allowed.some((u) => u.id === active.id));
  const thread = active ? msgs.filter((m) => m.fromId === active.id || m.toId === active.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : [];
  // opening a thread marks it read
  thread.filter((m) => m.toId === user.id && !m.read).forEach((m) => { m.read = true; });
  if (thread.some((m) => m.toId === user.id)) db.update("messages", thread[0].id, {});

  return {
    title: "الرسائل",
    html: html`
    <header class="page-head"><h1>الرسائل</h1></header>
    <div class="chat ${active ? "has-active" : ""}">
      <aside class="card threads">
        <label class="label">محادثة جديدة
          <select id="newChat"><option value="">${allowed.length ? "اختر شخصاً" : "لا توجد جهات اتصال بعد"}</option>
            ${allowed.map((u) => html`<option value="${u.id}">${u.name} (${u.role === "doctor" ? u.department : ROLE[u.role]})</option>`)}</select></label>
        ${list.length ? html`<ul>${list.map((t) => {
          const o = db.get("users", t.other);
          return html`<li><a href="#/messages/${t.other}" class="${t.other === activeId ? "active" : ""}">${avatar(o)}
            <div><b>${o?.name || "مستخدم محذوف"}</b><small>${t.last.body.slice(0, 40)}</small></div>
            ${t.unread ? html`<em class="count">${t.unread}</em>` : html`<small class="muted">${ago(t.last.createdAt)}</small>`}</a></li>`;
        })}</ul>` : html`<p class="muted small">لا توجد محادثات.</p>`}
      </aside>
      <section class="card thread">
        ${active ? html`
          <header><a class="back mobile-only" href="#/messages">${icon("arrow")}</a>${avatar(active)}<div><b>${active.name}</b><small class="muted">${active.role === "doctor" ? active.department : ROLE[active.role]}</small></div></header>
          <div class="bubbles" id="bubbles">${thread.length ? thread.map((m) => html`<div class="bubble ${m.fromId === user.id ? "me" : ""}"><p>${m.body}</p><small>${ago(m.createdAt)}</small></div>`) : html`<p class="muted center">ابدأ المحادثة</p>`}</div>
          ${canTalk ? html`<form id="send" class="composer"><textarea name="body" rows="1" required maxlength="1000" placeholder="اكتب رسالتك"></textarea>
            <button class="btn primary" aria-label="إرسال">${icon("send")}</button></form>` : html`<p class="muted small center">لا يمكنك مراسلة هذا المستخدم.</p>`}`
        : empty("chat", "اختر محادثة", "أو ابدأ محادثة جديدة من القائمة.")}
      </section>
    </div>`,
    mount(root) {
      root.querySelector("#newChat")?.addEventListener("change", (e) => e.target.value && go(`#/messages/${e.target.value}`));
      const b = root.querySelector("#bubbles");
      if (b) b.scrollTop = b.scrollHeight;
      const form = root.querySelector("#send");
      if (form) {
        const ta = form.body;
        ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          const body = ta.value.trim();
          if (!body) return;
          db.insert("messages", { fromId: user.id, toId: active.id, body, read: false });
          render();
          document.querySelector("#send textarea")?.focus();
        });
      }
    },
  };
}

export function profile({ user, render, go }) {
  return {
    title: "حسابي",
    html: html`
    <header class="page-head"><h1>حسابي</h1></header>
    <div class="grid2 top">
      <form class="card" id="info">
        <h2>البيانات الشخصية</h2>
        <label>الاسم<input name="name" value="${user.name}" required minlength="3"></label>
        <label>الموبايل<input name="phone" value="${user.phone || ""}" pattern="01[0125][0-9]{8}" dir="ltr"></label>
        ${user.role === "patient" ? html`<div class="grid2">
          <label>فصيلة الدم<select name="bloodType"><option value="">غير معروفة</option>${["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((b) => html`<option ${b === user.bloodType ? "selected" : ""}>${b}</option>`)}</select></label>
          <label>تاريخ الميلاد<input name="birthDate" type="date" value="${user.birthDate || ""}"></label></div>` : ""}
        <label>البريد الإلكتروني<input value="${user.email}" disabled dir="ltr"></label>
        <button class="btn primary">حفظ</button>
      </form>
      <div>
        <form class="card" id="pw">
          <h2>تغيير كلمة المرور</h2>
          <label>كلمة المرور الحالية<input name="old" type="password" required dir="ltr" autocomplete="current-password"></label>
          <label>كلمة المرور الجديدة<input name="new" type="password" required minlength="8" dir="ltr" autocomplete="new-password"></label>
          <button class="btn ghost">تغيير</button>
        </form>
        <section class="card">
          <h2>بيانات العرض التجريبي</h2>
          <p class="muted small">IDOS يعمل حالياً بالكامل داخل متصفحك: البيانات محفوظة على هذا الجهاز فقط ولا تُرسل لأي خادم.</p>
          <div class="row gap wrap">
            <button class="btn ghost sm" id="export">${icon("download")} تنزيل نسخة من البيانات</button>
            ${user.role === "admin" ? html`<button class="btn ghost sm danger-text" id="reset">${icon("trash")} إعادة ضبط العرض</button>` : ""}
          </div>
        </section>
      </div>
    </div>`,
    mount(root) {
      root.querySelector("#info").addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(e.target));
        db.update("users", user.id, fd);
        toast("تم الحفظ");
        render();
      });
      root.querySelector("#pw").addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const { hash } = await db.hashPassword(fd.get("old"), user.salt);
        if (hash !== user.hash) { toast("كلمة المرور الحالية غير صحيحة", "err"); return; }
        db.update("users", user.id, await db.hashPassword(fd.get("new")));
        e.target.reset();
        toast("تم تغيير كلمة المرور");
      });
      root.querySelector("#export").addEventListener("click", () => {
        const data = user.role === "admin" ? db.exportJSON() : JSON.stringify({
          profile: { name: user.name, email: user.email, phone: user.phone, bloodType: user.bloodType, birthDate: user.birthDate },
          appointments: db.where("appointments", (a) => a.patientId === user.id || a.doctorId === user.id),
          records: db.where("records", (r) => r.patientId === user.id || r.doctorId === user.id),
        }, null, 2);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
        a.download = `idos-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      });
      root.querySelector("#reset")?.addEventListener("click", async () => {
        if (await confirmDialog("إعادة ضبط العرض", "سيتم مسح كل البيانات على هذا الجهاز وإرجاع المستشفى التجريبي لحالته الأصلية.", "إعادة الضبط")) {
          db.reset();
          location.hash = "#/";
          location.reload();
        }
      });
    },
  };
}
