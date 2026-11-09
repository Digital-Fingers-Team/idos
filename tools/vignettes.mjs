// Colloquial-input test: short complaints written the way an Egyptian patient would type them.
// Each vignette lists the phrases (one per symptom) and the disease id(s) it was written for.
// Some knowledge-base entries share an identical symptom profile (e.g. hepatitis B / C,
// diabetes type 1 / 2); for those both ids are accepted because symptoms alone cannot separate them.
//   node tools/vignettes.mjs
import { readFileSync, writeFileSync } from "node:fs";
import * as E from "../js/engine.js";

export const VIGNETTES = [
  { phrases: ["اسهال", "عايز ارجع", "بطني بتوجعني", "سخونية"], accept: [1, 14] },
  { phrases: ["زوري بيوجعني", "مش قادر ابلع", "سخن"], accept: [3] },
  { phrases: ["حرقان في البول", "بدخل الحمام كتير", "وجع تحت في بطني"], accept: [4] },
  { phrases: ["حموضة", "بطني منفوخة", "كركبة", "بتكرع كتير"], accept: [5] },
  { phrases: ["كحة", "بلغم", "نهجان", "سخونية"], accept: [6] },
  { phrases: ["سخونية", "راسي بتوجعني", "كحة", "جسمي مكسر"], accept: [12] },
  { phrases: ["بعطس", "مناخيري سايبة", "مناخيري مسدودة", "زوري بيوجعني"], accept: [13, 58] },
  { phrases: ["مفاصلي بتوجعني", "مفاصلي وارمة", "مفاصلي متيبسة الصبح"], accept: [15, 90] },
  { phrases: ["مغص", "مرة اسهال ومرة امساك", "بطني منفوخة", "غازات"], accept: [20] },
  { phrases: ["تعبان على طول", "غثيان", "عيني صفرا", "بولي غامق"], accept: [28, 29] },
  { phrases: ["قلبي بيدق بسرعة", "وزني بينزل", "بعرق كتير", "عيني بارزة", "بترعش"], accept: [34] },
  { phrases: ["تعبان جدا", "وزني بيزيد", "بردان على طول", "امساك", "جلدي ناشف"], accept: [35] },
  { phrases: ["ركبتي بتوجعني", "تيبس الصبح", "صعوبة في الحركة"], accept: [90] },
  { phrases: ["بقع حمرا في جلدي", "قشور بيضا", "جلدي بياكلني"], accept: [46] },
  { phrases: ["بقع بيضا في جلدي", "شعري بيشيب", "حساسية من الشمس"], accept: [47] },
  { phrases: ["بتشنج", "اغمى عليا", "عضيت لساني"], accept: [53] },
  { phrases: ["بترعش", "حركتي بطيئة", "عضلاتي متيبسة", "بقع وانا ماشي"], accept: [54] },
  { phrases: ["عطس", "مناخيري بتاكلني", "عيني بتدمع", "عيني حمرا"], accept: [58] },
  { phrases: ["نهجان", "صدري بيزيق", "كحة مستمرة"], accept: [59, 22] },
  { phrases: ["صداع حوالين عيني", "مناخيري مسدودة", "وجع في سناني"], accept: [60] },
  { phrases: ["ودني بتوجعني", "مش سامع كويس", "صفارة في ودني", "ودني بتنزل افرازات"], accept: [61] },
  { phrases: ["دايخ لما بغير وضع راسي", "عايز ارجع", "مش متوازن"], accept: [63] },
  { phrases: ["نهجان", "رجلي وارمة", "تعبان", "كحة"], accept: [66, 67] },
  { phrases: ["عطشان على طول", "بتبول كتير", "جعان على طول", "الجرح مش بيلم"], accept: [69, 70] },
  { phrases: ["حموضة", "وجع في صدري", "صوتي مبحوح", "كحة ناشفة"], accept: [76] },
  { phrases: ["مش عارف اعمل حمام كويس", "بقوم بالليل اتبول", "البول بينقط"], accept: [80] },
  { phrases: ["وجع جامد في ضهري", "دم في البول", "عايز ارجع"], accept: [86] },
  { phrases: ["صداع بيدق", "مش بستحمل النور", "مش بستحمل الصوت", "برجع"], accept: [100] },
  { phrases: ["رجلي بتنمل", "وجع اسفل الضهر", "وجع بيزيد لما اقعد"], accept: [8] },
  { phrases: ["عطشان على طول", "بتبول كميات كبيرة", "جفاف"], accept: [38] },
];

/* ---------- original (2026-04) engine, including its colloquial dictionary ---------- */
const RAW = JSON.parse(readFileSync(new URL("../data/source/diseases.json", import.meta.url), "utf8"));
const OLD_DICT = { "بطني بتوجعني": "آلام البطن", "مغص": "تقلصات البطن", "كرشي": "انتفاخ البطن", "منفوخ": "انتفاخ", "عايز ارجع": "غثيان", "بترجع": "قيء", "اسهال": "إسهال", "امساك": "إمساك", "حرقان": "حموضة", "نفسي غمة عليا": "غثيان", "وجع في المعدة": "آلام البطن", "كركبة في البطن": "غازات", "وجع في بطني": "آلام البطن", "معدتي": "معدة", "تعب في بطني": "آلام البطن", "راسي بتوجعني": "صداع", "راسي مصدعة": "صداع", "دماغ": "رأس", "دوخة": "دوار", "زغللة": "تشوش الرؤية", "تنميل": "خدر", "لف": "دوار", "صداع جامد": "صداع شديد", "دماغي بتلف": "دوار", "مش شايف كويس": "تشوش الرؤية", "كحة": "سعال", "بلغم": "إفرازات", "نهجان": "ضيق تنفس", "نفسي مقطوع": "ضيق تنفس", "صدري بيزيق": "صفير الصدر", "شرقة": "سعال", "نغزة في قلبي": "خفقان", "ضربات قلبي سريعة": "تسارع ضربات القلب", "قلبي بيدق": "خفقان", "نهجة": "ضيق تنفس", "مش قادر اخد نفسي": "ضيق تنفس", "ضهري بيوجعني": "ألم أسفل الظهر", "جسمي مكسر": "ألم في الجسم", "تعبان": "إرهاق", "مهمد": "خمول", "عضمي": "عظام", "وجع مفاصل": "آلام المفاصل", "ركبتي": "ركبة", "شد عضلي": "تقلصات عضلية", "وجع في ضهري": "ألم الظهر", "تعبان وهمدان": "إعياء", "سخونية": "حمى", "سخن": "حمى", "رعشة": "قشعريرة", "برد": "نزلة برد", "عطس": "عطاس", "مناخيري": "أنف", "زوري بيوجعني": "التهاب الحلق", "مش عارف انام": "أرق", "تعب": "إرهاق", "خمول": "ضعف عام", "همدان": "إعياء", "مرشح": "سيلان الأنف", "مناخيري سايبة": "سيلان الأنف", "زوري ناشف": "جفاف الحلق" };
const n0 = (t) => t.toString().trim().replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[ً-ْ]/g, "");
function oldTranslate(text) { const t = n0(text); for (const [k, v] of Object.entries(OLD_DICT)) if (t.includes(n0(k))) return v; return text; }
function oldMatch(u0, d0) {
  const u = n0(u0), d = n0(d0);
  if (u === d || d.includes(u) || u.includes(d)) return true;
  const uw = u.split(" ").filter((w) => w.length > 3), dw = d.split(" ").filter((w) => w.length > 3);
  return uw.some((w) => dw.includes(w));
}
const oldScores = (phrases) => {
  const s = [...new Set(phrases.map(oldTranslate))];
  return RAW.map((d) => { const m = s.filter((x) => d.symptoms.some((y) => oldMatch(x, y))).length; return m ? (m / d.symptoms.length) * 0.5 + (m / s.length) * 0.5 : 0; });
};
const newScores = (phrases) => {
  const syms = [...new Set(phrases.map((p) => E.resolve(p)?.symptom).filter(Boolean))];
  const res = E.diagnose(syms, { limit: E.DISEASES.length });
  const out = new Array(E.DISEASES.length).fill(0);
  for (const r of res) out[r.disease.id - 1] = r.score;
  return out;
};
const understood = (phrases) => phrases.filter((p) => E.resolve(p)).length;
const oldUnderstood = (phrases) => phrases.filter((p) => { const t = oldTranslate(p); return RAW.some((d) => d.symptoms.some((y) => oldMatch(t, y))); }).length;

// best rank among accepted ids, ties broken pessimistically-fair (expected rank)
function hitAt(scores, accept, k) {
  let best = 0;
  for (const id of accept) {
    const ts = scores[id - 1];
    if (ts <= 0) continue;
    let g = 0, t = 0;
    scores.forEach((s, i) => { if (!accept.includes(i + 1)) { if (s > ts + 1e-12) g++; else if (Math.abs(s - ts) <= 1e-12) t++; } });
    best = Math.max(best, Math.max(0, Math.min(1, (k - g) / (t + 1))));
  }
  return best;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = { baseline: { t1: 0, t3: 0, phr: 0 }, idos: { t1: 0, t3: 0, phr: 0 } };
  let phrases = 0;
  const detail = [];
  for (const v of VIGNETTES) {
    const o = oldScores(v.phrases), n = newScores(v.phrases);
    phrases += v.phrases.length;
    rows.baseline.t1 += hitAt(o, v.accept, 1); rows.baseline.t3 += hitAt(o, v.accept, 3); rows.baseline.phr += oldUnderstood(v.phrases);
    rows.idos.t1 += hitAt(n, v.accept, 1); rows.idos.t3 += hitAt(n, v.accept, 3); rows.idos.phr += understood(v.phrases);
    detail.push({ phrases: v.phrases, expected: v.accept.map((i) => E.DISEASES[i - 1].name), resolved: v.phrases.map((p) => E.resolve(p)?.symptom || null),
      idosTop3: n.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0]).slice(0, 3).map(([, i]) => E.DISEASES[i].name) });
  }
  const N = VIGNETTES.length;
  const summary = Object.fromEntries(Object.entries(rows).map(([k, r]) => [k, { top1: r.t1 / N, top3: r.t3 / N, phrasesUnderstood: r.phr / phrases }]));
  writeFileSync(new URL("./vignette-results.json", import.meta.url), JSON.stringify({ n: N, phrases, summary, detail }, null, 1));
  console.log(`${N} vignettes, ${phrases} phrases`);
  for (const [k, s] of Object.entries(summary)) console.log(k.padEnd(10), "top1", (s.top1 * 100).toFixed(1), "top3", (s.top3 * 100).toFixed(1), "phrases understood", (s.phrasesUnderstood * 100).toFixed(1));
  for (const d of detail) if (!d.idosTop3.some((x) => d.expected.includes(x)) || d.resolved.includes(null)) console.log("  miss:", d.phrases.join(" | "), "->", d.resolved.join(","), "=>", d.idosTop3.join(" / "), "| expected", d.expected.join(" / "));
}

// node tools/vignettes.mjs --heldout [--v2] : score a frozen held-out set
if (process.argv.includes("--heldout")) {
  const v2 = process.argv.includes("--v2");
  const HELDOUT = v2 ? (await import("./vignettes-heldout-v2.mjs")).HELDOUT_V2 : (await import("./vignettes-heldout.mjs")).HELDOUT;
  let o1 = 0, o3 = 0, n1 = 0, n3 = 0, ph = 0, oph = 0, nph = 0;
  const miss = [];
  for (const v of HELDOUT) {
    const o = oldScores(v.phrases), n = newScores(v.phrases);
    o1 += hitAt(o, v.accept, 1); o3 += hitAt(o, v.accept, 3); n1 += hitAt(n, v.accept, 1); n3 += hitAt(n, v.accept, 3);
    ph += v.phrases.length; oph += oldUnderstood(v.phrases); nph += understood(v.phrases);
    if (hitAt(n, v.accept, 3) < 1) miss.push({ phrases: v.phrases, resolved: v.phrases.map((p) => E.resolve(p)?.symptom || null),
      top3: n.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0]).slice(0, 3).map(([, i]) => E.DISEASES[i].name), expected: v.accept.map((i) => E.DISEASES[i - 1].name) });
  }
  const N = HELDOUT.length;
  const summary = { n: N, phrases: ph, baseline: { top1: o1 / N, top3: o3 / N, phrasesUnderstood: oph / ph }, idos: { top1: n1 / N, top3: n3 / N, phrasesUnderstood: nph / ph }, miss };
  writeFileSync(new URL(v2 ? (process.argv.includes("--before") ? "./vignette-heldout-v2-before.json" : "./vignette-heldout-v2-results.json") : "./vignette-heldout-results.json", import.meta.url), JSON.stringify(summary, null, 1));
  console.log(JSON.stringify(summary, null, 1));
}
