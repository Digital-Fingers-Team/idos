import * as db from "../store.js";
import * as E from "../engine.js";
import { html, raw, icon, esc, toast } from "../ui.js";

const QUICK = {
  "عام": ["حمى", "إرهاق", "قشعريرة", "فقدان الوزن", "فقدان الشهية", "تعرق ليلي"],
  "الرأس والأعصاب": ["صداع", "دوخة", "تشوش الرؤية", "تنميل الأطراف", "رعشة", "صعوبة التركيز"],
  "الصدر والتنفس": ["سعال", "ضيق التنفس", "ألم الصدر", "خفقان", "صفير الصدر", "بلغم"],
  "البطن والهضم": ["ألم البطن", "غثيان", "قيء", "إسهال", "إمساك", "حرقة الصدر", "انتفاخ البطن"],
  "الحلق والأنف": ["ألم الحلق", "صعوبة البلع", "سيلان الأنف", "احتقان الأنف", "عطس", "بحة الصوت"],
  "العظام والمفاصل": ["ألم المفاصل", "تورم المفاصل", "ألم الظهر", "ألم العضلات", "تيبس الصباح"],
  "الجلد": ["حكة", "طفح جلدي", "اصفرار الجلد", "جفاف الجلد", "تساقط الشعر"],
  "البول": ["تبول مؤلم", "تبول متكرر", "دم بالبول", "عطش شديد"],
  "النفسية والنوم": ["قلق", "اكتئاب", "أرق", "تقلبات مزاجية", "نوبات هلع مفاجئة"],
};

export function view({ user }) {
  return {
    title: "فحص الأعراض",
    keepScroll: false,
    html: html`
    <section class="checker">
      <header class="page-head">
        <div><h1>فحص الأعراض</h1><p class="muted">اكتب اللي حاسس بيه بطريقتك، أو اختار من القائمة. كل ما تزوّد أعراض، النتيجة بتبقى أدق.</p></div>
      </header>

      <div class="disclaimer">${icon("shield")}<p>دي <b>أداة توجيه مبدئي</b> بتقولك أنهي قسم مناسب وإيه الاحتمالات الأقرب، لكنها <b>مش تشخيص</b>. لو حالتك طارئة اتصل بالإسعاف <b dir="ltr">123</b>.</p></div>

      <div class="checker-grid">
        <div class="card">
          <label class="label" for="symInput">أضف عرضاً</label>
          <div class="combo">
            <div class="input-icon">${icon("search")}<input id="symInput" autocomplete="off" placeholder="مثال: سخونية وكحة وزوري بيوجعني" role="combobox" aria-expanded="false" aria-controls="symList"></div>
            <button class="btn primary" id="addBtn">إضافة</button>
            <ul id="symList" class="suggest" role="listbox" hidden></ul>
          </div>
          <p class="hint" id="parseHint" hidden></p>

          <div class="chosen" id="chosen" aria-live="polite"></div>

          <details class="quick" open>
            <summary>أعراض شائعة حسب الجهاز</summary>
            ${Object.entries(QUICK).map(([g, list]) => html`
              <div class="quick-group"><h4>${g}</h4><div class="chips">${list.map((s) => html`<button type="button" class="chip" data-add="${s}">${s}</button>`)}</div></div>`)}
          </details>
        </div>

        <div id="results" class="results"></div>
      </div>
    </section>`,
    mount(root, { go }) {
      let chosen = [];
      try { chosen = JSON.parse(sessionStorage.getItem("idos:symptoms") || "[]").filter((s) => E.SYMPTOMS.includes(s)); } catch {}
      const input = root.querySelector("#symInput");
      const list = root.querySelector("#symList");
      const hint = root.querySelector("#parseHint");
      let active = -1, saveTimer = null;

      const persist = () => { try { sessionStorage.setItem("idos:symptoms", JSON.stringify(chosen)); } catch {} };
      const add = (s) => { if (!chosen.includes(s)) chosen.push(s); persist(); draw(); };
      const del = (s) => { chosen = chosen.filter((x) => x !== s); persist(); draw(); };

      function draw() {
        root.querySelector("#chosen").innerHTML = chosen.length
          ? String(html`<div class="row between"><span class="label">أعراضك (${chosen.length})</span><button class="link" data-clear>مسح الكل</button></div>
             <div class="chips">${chosen.map((s) => html`<span class="chip on">${s}<button data-del="${s}" aria-label="حذف ${s}">${icon("x")}</button></span>`)}</div>`)
          : String(html`<p class="muted small">لسه ما ضفتش أعراض.</p>`);
        root.querySelectorAll(".quick [data-add]").forEach((b) => b.classList.toggle("on", chosen.includes(b.dataset.add)));
        drawResults();
      }

      function drawResults() {
        const box = root.querySelector("#results");
        if (!chosen.length) {
          box.innerHTML = String(html`<div class="card placeholder">${icon("stetho")}<h3>النتائج هتظهر هنا</h3><p class="muted">ابدأ بأوضح عرض عندك.</p></div>`);
          return;
        }
        const flags = E.redFlags(chosen);
        const res = E.diagnose(chosen, { limit: 5 });
        const dept = E.recommendDepartment(res.slice(0, 3));
        box.innerHTML = String(html`
          ${flags.length ? html`<div class="alarm" role="alert">${icon("alert")}<div><h3>توجّه للطوارئ أو اتصل بالإسعاف 123 الآن</h3>${flags.map((f) => html`<p>${f}</p>`)}</div></div>` : ""}
          ${dept ? html`<div class="card dept">
              <div><small class="muted">القسم المقترح (حسب أقرب 3 احتمالات)</small><h2>${dept}</h2>
              ${chosen.length < 3 ? html`<p class="small muted">أضف عرضين أو أكثر لنتيجة أدق.</p>` : ""}</div>
              <button class="btn primary" data-book="${dept}">${icon("calendar")} احجز موعداً</button></div>` : ""}
          ${res.length ? html`<h3 class="section-title">الاحتمالات الأقرب</h3>
            <ol class="res-list">${res.map((r, i) => {
              const b = E.band(r.score);
              return html`<li class="res ${b.key}">
                <div class="res-head"><span class="rank">${i + 1}</span><div><h4>${r.disease.name}</h4><small>${r.disease.department}</small></div>
                  <span class="badge ${b.key === "high" ? "ok" : b.key === "mid" ? "warn" : "muted"}">${b.label}</span></div>
                <div class="meter" role="img" aria-label="درجة التطابق ${Math.round(r.score * 100)}٪"><i style="width:${Math.round(r.score * 100)}%"></i></div>
                <details><summary>ليه ظهر الاحتمال ده؟</summary>
                  <p><b>أعراضك اللي بتطابقه:</b> ${r.matched.join("، ")}</p>
                  <p><b>بيفسّر</b> ${Math.round(r.precision * 100)}٪ من شكواك، و<b>بيغطي</b> ${Math.round(r.recall * 100)}٪ من صورة المرض.</p>
                  ${r.missing.length ? html`<p class="muted"><b>أعراض تانية بتصاحبه عادةً:</b> ${r.missing.slice(0, 6).join("، ")}</p>
                    <div class="chips">${r.missing.slice(0, 4).map((s) => html`<button class="chip sm" data-add="${s}">${icon("plus")} عندي ${s}</button>`)}</div>` : ""}
                </details></li>`;
            })}</ol>` : html`<div class="card placeholder"><p>مفيش مرض في قاعدة المعرفة بيطابق الأعراض دي. استشر طبيب باطنة عام.</p></div>`}
          <p class="small muted">الترتيب مبني على ${E.DISEASES.length} مرض من قاعدة معرفة IDOS. احتمالات وليست تشخيصاً.</p>`);
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => saveCheck(res, dept), 1500);
      }

      function saveCheck(res, dept) {
        const u = db.currentUser();
        if (!u || u.role !== "patient" || !res.length) return;
        const last = db.where("checks", (c) => c.patientId === u.id).at(-1);
        const sig = [...chosen].sort().join("|");
        const entry = { patientId: u.id, symptoms: [...chosen], top: res.slice(0, 3).map((r) => ({ name: r.disease.name, score: +r.score.toFixed(3) })), department: dept, sig };
        // update the same session's check instead of piling up one per keystroke
        if (last && Date.now() - new Date(last.createdAt) < 30 * 60e3) db.update("checks", last.id, entry);
        else db.insert("checks", entry);
      }

      function showSuggest() {
        const items = E.suggest(input.value);
        active = -1;
        list.innerHTML = items.map((it, i) => `<li role="option" id="opt${i}" data-sym="${esc(it.symptom)}">${esc(it.label)}${it.colloquial ? `<small>${esc(it.symptom)}</small>` : ""}</li>`).join("");
        list.hidden = !items.length;
        input.setAttribute("aria-expanded", String(!!items.length));
      }
      function commitInput() {
        const text = input.value.trim();
        if (!text) return;
        const { found, unknown } = E.parseFreeText(text);
        found.forEach((f) => add(f.symptom));
        hint.hidden = !(found.length || unknown.length);
        hint.innerHTML = [
          found.length ? `تمت إضافة: <b>${found.map((f) => esc(f.symptom)).join("، ")}</b>` : "",
          unknown.length ? `<span class="warn-text">لم أفهم: ${unknown.map(esc).join("، ")}. جرّب كلمة أبسط أو اختر من الاقتراحات.</span>` : "",
        ].filter(Boolean).join("<br>");
        if (found.length) input.value = "";
        list.hidden = true;
      }

      input.addEventListener("input", showSuggest);
      input.addEventListener("keydown", (e) => {
        const opts = [...list.querySelectorAll("li")];
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          if (!opts.length) return;
          e.preventDefault();
          active = (active + (e.key === "ArrowDown" ? 1 : -1) + opts.length) % opts.length;
          opts.forEach((o, i) => o.classList.toggle("active", i === active));
          input.setAttribute("aria-activedescendant", `opt${active}`);
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (active >= 0 && opts[active]) { add(opts[active].dataset.sym); input.value = ""; list.hidden = true; hint.hidden = true; }
          else commitInput();
        } else if (e.key === "Escape") list.hidden = true;
      });
      list.addEventListener("mousedown", (e) => {
        const li = e.target.closest("li");
        if (!li) return;
        e.preventDefault();
        add(li.dataset.sym); input.value = ""; list.hidden = true; hint.hidden = true;
      });
      input.addEventListener("blur", () => setTimeout(() => (list.hidden = true), 100));
      root.querySelector("#addBtn").addEventListener("click", commitInput);

      root.addEventListener("click", (e) => {
        const t = e.target.closest("[data-add],[data-del],[data-clear],[data-book]");
        if (!t) return;
        if (t.dataset.add) chosen.includes(t.dataset.add) && t.closest(".quick") ? del(t.dataset.add) : add(t.dataset.add);
        else if (t.dataset.del) del(t.dataset.del);
        else if (t.hasAttribute("data-clear")) { chosen = []; persist(); draw(); }
        else if (t.dataset.book) {
          try { sessionStorage.setItem("idos:book", JSON.stringify({ department: t.dataset.book, reason: chosen.join("، ") })); } catch {}
          const u = db.currentUser();
          if (!u) { sessionStorage.setItem("idos:after-login", "#/p/book"); toast("سجّل دخولك أو أنشئ حساباً لإكمال الحجز", "info"); go("#/login"); }
          else if (u.role !== "patient") toast("الحجز متاح لحسابات المرضى", "info");
          else go("#/p/book");
        }
      });
      draw();
      return () => clearTimeout(saveTimer);
    },
  };
}
