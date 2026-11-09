import * as db from "../store.js";
import { html, icon, toast } from "../ui.js";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../seed.js";
import { DISEASES, SYMPTOMS } from "../engine.js";

const HOME = { patient: "#/p", doctor: "#/d", admin: "#/a" };
const afterLogin = (u) => {
  const next = sessionStorage.getItem("idos:after-login");
  sessionStorage.removeItem("idos:after-login");
  return next || HOME[u.role];
};

export function landing() {
  const depts = new Set(DISEASES.map((d) => d.department)).size;
  return {
    html: html`
    <section class="hero">
      <div class="hero-text">
        <span class="eyebrow">${icon("pulse")} Immediate Diagnosis Of Symptoms</span>
        <h1>اكتب أعراضك بكلامك، و<em>IDOS</em> يرشدك للقسم الصح.</h1>
        <p class="lead">نظام رقمي للمستشفى يبدأ بتوجيه مبدئي للأعراض، وبعده المواعيد والسجل الطبي والتواصل مع الطبيب، كلهم في مكان واحد. والتشخيص والعلاج يفضلوا قرار الطبيب.</p>
        <div class="row gap">
          <a class="btn primary lg" href="#/check">${icon("stetho")} ابدأ فحص الأعراض</a>
          <a class="btn ghost lg" href="#/login">دخول تجريبي</a>
        </div>
      </div>
      <div class="hero-card" aria-hidden="true">
        <div class="mock-input">${icon("search")}<span>عندي سخونية وكحة وزوري بيوجعني</span></div>
        <div class="mock-chips"><span>حمى</span><span>سعال</span><span>ألم الحلق</span></div>
        <div class="mock-res"><b>الإنفلونزا الموسمية</b><i style="--w:72%"></i><small>تطابق قوي · باطنة</small></div>
        <div class="mock-res"><b>التهاب اللوزتين</b><i style="--w:58%"></i><small>تطابق متوسط · أنف وأذن وحنجرة</small></div>
        <div class="mock-res dim"><b>البرد العادي</b><i style="--w:44%"></i><small>تطابق متوسط</small></div>
      </div>
    </section>

    <section class="stats-strip">
      <div><b>${DISEASES.length}</b><span>مرضاً في قاعدة المعرفة</span></div>
      <div><b>${SYMPTOMS.length}</b><span>عرضاً موحّداً</span></div>
      <div><b>${depts}</b><span>تخصصاً طبياً</span></div>
      <div><b>3</b><span>أدوار: مريض، طبيب، إدارة</span></div>
    </section>

    <section class="features">
      <h2>كل الرحلة في نظام واحد</h2>
      <div class="grid3">
        <article>${icon("stetho")}<h3>فحص مبدئي للأعراض</h3><p>يفهم العامية المصرية زي «بطني بتوجعني» و«سخونية»، ويرتّب الاحتمالات حسب أهمية كل عرض، وينبّهك فوراً لو فيه علامة خطر.</p></article>
        <article>${icon("calendar")}<h3>مواعيد بدون طوابير</h3><p>احجز مع طبيب القسم المقترح في مواعيد متاحة فعلاً، والطبيب يأكد أو يعدّل من لوحته.</p></article>
        <article>${icon("file")}<h3>سجل طبي موحّد</h3><p>التشخيص والعلاج والعلامات الحيوية لكل زيارة محفوظين ومرتّبين، والمريض يقدر يشوف سجله.</p></article>
        <article>${icon("chat")}<h3>رسائل مع الطبيب</h3><p>متابعة بعد الزيارة من غير زحمة التليفونات.</p></article>
        <article>${icon("users")}<h3>إدارة المستشفى</h3><p>المستخدمين والأطباء والمواعيد وإحصائيات الأقسام في لوحة واحدة.</p></article>
        <article>${icon("shield")}<h3>الطبيب صاحب القرار</h3><p>النتيجة توجيه مبدئي مع توضيح ليه ظهرت، ومش تشخيص نهائي.</p></article>
      </div>
    </section>

    <section class="how">
      <h2>إزاي بيشتغل الفحص؟</h2>
      <ol class="steps">
        <li><b>توحيد الأعراض</b><span>كل طرق كتابة العرض الواحد، فصحى أو عامية، بتتحوّل لعرض واحد موحّد.</span></li>
        <li><b>وزن كل عرض</b><span>العرض النادر زي «براز أسود» بياخد وزن أكبر من العرض الشائع زي «إرهاق».</span></li>
        <li><b>المطابقة</b><span>بيقيس قد إيه المرض بيفسّر شكواك، وقد إيه شكواك بتغطي صورة المرض.</span></li>
        <li><b>علامات الخطر أولاً</b><span>تركيبات زي ألم الصدر مع ضيق التنفس بتطلّع تنبيه طوارئ قبل أي ترتيب.</span></li>
      </ol>
      <a class="btn primary" href="#/check">جرّب الآن</a>
    </section>`,
  };
}

function demoButtons() {
  return html`<div class="demo">
    <p>حسابات تجريبية (كلمة المرور <code>${DEMO_PASSWORD}</code>):</p>
    <div class="row gap wrap">${DEMO_ACCOUNTS.map((a) => html`<button type="button" class="btn ghost sm" data-demo="${a.email}">${a.label}</button>`)}</div>
  </div>`;
}

export function login() {
  return {
    title: "تسجيل الدخول",
    html: html`
    <section class="auth">
      <form class="card auth-card" id="loginForm" novalidate>
        <h1>تسجيل الدخول</h1>
        <label>البريد الإلكتروني<input name="email" type="email" required autocomplete="email" dir="ltr"></label>
        <label>كلمة المرور<input name="password" type="password" required autocomplete="current-password" dir="ltr"></label>
        <p class="form-error" hidden></p>
        <button class="btn primary block">دخول</button>
        <p class="muted center">مريض جديد؟ <a href="#/register">أنشئ حساباً</a></p>
        ${demoButtons()}
      </form>
    </section>`,
    mount(root, { go }) {
      const form = root.querySelector("#loginForm");
      const err = form.querySelector(".form-error");
      const submit = async () => {
        if (!form.reportValidity()) return;
        const fd = new FormData(form);
        const r = await db.login(fd.get("email"), fd.get("password"));
        if (r.error) { err.textContent = r.error; err.hidden = false; return; }
        toast(`أهلاً ${r.user.name}`);
        go(afterLogin(r.user));
      };
      form.addEventListener("submit", (e) => { e.preventDefault(); submit(); });
      form.querySelectorAll("[data-demo]").forEach((b) => b.addEventListener("click", () => {
        form.email.value = b.dataset.demo;
        form.password.value = DEMO_PASSWORD;
        submit();
      }));
    },
  };
}

export function register() {
  return {
    title: "حساب جديد",
    html: html`
    <section class="auth">
      <form class="card auth-card" id="regForm">
        <h1>حساب مريض جديد</h1>
        <label>الاسم الكامل<input name="name" required minlength="3" autocomplete="name"></label>
        <div class="grid2">
          <label>رقم الموبايل<input name="phone" required pattern="01[0125][0-9]{8}" inputmode="tel" dir="ltr" placeholder="01xxxxxxxxx"></label>
          <label>تاريخ الميلاد<input name="birthDate" type="date" required></label>
        </div>
        <div class="grid2">
          <label>النوع<select name="gender" required><option value="">اختر</option><option>ذكر</option><option>أنثى</option></select></label>
          <label>فصيلة الدم<select name="bloodType"><option value="">غير معروفة</option>${["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((b) => html`<option>${b}</option>`)}</select></label>
        </div>
        <label>البريد الإلكتروني<input name="email" type="email" required autocomplete="email" dir="ltr"></label>
        <label>كلمة المرور<input name="password" type="password" required minlength="8" autocomplete="new-password" dir="ltr"><small>8 أحرف على الأقل</small></label>
        <p class="form-error" hidden></p>
        <button class="btn primary block">إنشاء الحساب</button>
        <p class="muted center">لديك حساب؟ <a href="#/login">سجّل الدخول</a></p>
      </form>
    </section>`,
    mount(root, { go }) {
      const form = root.querySelector("#regForm");
      const err = form.querySelector(".form-error");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(form));
        const email = fd.email.trim().toLowerCase();
        if (db.all("users").some((u) => u.email.toLowerCase() === email)) {
          err.textContent = "هذا البريد مسجّل بالفعل"; err.hidden = false; return;
        }
        if (fd.birthDate > new Date().toLocaleDateString("en-CA")) { err.textContent = "تاريخ الميلاد غير صحيح"; err.hidden = false; return; }
        const { salt, hash } = await db.hashPassword(fd.password);
        const u = db.insert("users", { role: "patient", status: "active", name: fd.name.trim(), email, phone: fd.phone,
          birthDate: fd.birthDate, gender: fd.gender, bloodType: fd.bloodType, salt, hash });
        db.setSession(u);
        toast("تم إنشاء حسابك");
        go(afterLogin(u));
      });
    },
  };
}
