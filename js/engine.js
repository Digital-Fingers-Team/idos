// IDOS symptom-matching engine. Pure functions, no DOM: runs in the browser and in Node (tools/eval.mjs).
import { DISEASES, ALIASES } from "../data/kb.js";

/* ---------- Arabic normalisation ---------- */
export function norm(text) {
  return String(text ?? "")
    .replace(/[ً-ْـ]/g, "") // tashkeel + tatweel
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^؀-ۿa-z0-9 ]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// strip the definite article and common prepositions so "في البطن" ≈ "البطن" ≈ "بطن"
function stem(word) {
  if (WORD_SYN[word]) return WORD_SYN[word];
  let w = word;
  if (w.length > 4 && w.startsWith("وال")) w = w.slice(3);
  else if (w.length > 3 && w.startsWith("ال")) w = w.slice(2);
  else if (w.length > 3 && (w.startsWith("بال") || w.startsWith("لل"))) w = w.slice(w.startsWith("بال") ? 3 : 2);
  return WORD_SYN[w] || w;
}
// word-level synonyms applied after stemming
const WORD_SYN = {
  "وجع": "الم", "اوجاع": "الم", "لام": "الم", "الام": "الم", "كحه": "سعال", "سخونيه": "حمي", "دوار": "دوخه",
  // body parts, incl. Egyptian forms with the possessive ـي ("my …")
  "ضهر": "ظهر", "ضهري": "ظهر", "زور": "حلق", "زوري": "حلق", "مناخير": "انف", "مناخيري": "انف", "ودن": "اذن", "ودني": "اذن",
  "عيني": "عين", "عينيا": "عين", "عينين": "عين", "عيون": "عين", "سناني": "اسنان", "سنان": "اسنان", "مفاصلي": "مفاصل",
  "جلدي": "جلد", "بطني": "بطن", "راسي": "راس", "صدري": "صدر", "رجلي": "ساق", "رجليا": "ساق", "ايدي": "يد", "شعري": "شعر",
  "عضلاتي": "عضلات", "صبح": "صباح", "الصبح": "صباح",
  // colloquial adjectives / verbs -> the noun used in the knowledge base
  "وارم": "تورم", "وارمه": "تورم", "منفوخ": "انتفاخ", "منفوخه": "انتفاخ", "متيبس": "تيبس", "متيبسه": "تيبس",
  "بتاكلني": "حكه", "بياكلني": "حكه", "بتدمع": "تدمع", "حمرا": "احمرار", "حمراء": "احمرار", "احمر": "احمرار",
  "صفرا": "اصفرار", "بيضا": "ابيض", "بيضاء": "ابيض", "بتنمل": "تنميل", "بينمل": "تنميل", "ناشف": "جفاف", "ناشفه": "جفاف",
  "بترعش": "رعشه", "دايخ": "دوخه", "بيشيب": "شيب", "بيقع": "تساقط", "افرازات": "افرازات",
};
const STOP = new Set(["في", "من", "عند", "مع", "على", "او", "و", "بعد", "قبل", "حول", "شديد", "شديده", "جدا", "خالص", "اوي", "عندي", "حاسس", "حاسه", "بيوجعني", "بتوجعني"]);
const tokens = (t) => norm(t).split(" ").filter((w) => w && !STOP.has(w)).map(stem);

/* ---------- vocabulary ---------- */
const N = DISEASES.length;
const df = new Map();
for (const d of DISEASES) for (const s of d.symptoms) df.set(s, (df.get(s) || 0) + 1);
export const SYMPTOMS = [...df.keys()].sort((a, b) => df.get(b) - df.get(a) || a.localeCompare(b, "ar"));

// IDF weight: a symptom shared by 30 diseases tells us little; one shared by 1 tells us a lot.
export const weight = (s) => Math.log(1 + N / (df.get(s) || N));

const byNorm = new Map(SYMPTOMS.map((s) => [norm(s), s]));
const aliasNorm = new Map(Object.entries(ALIASES).map(([k, v]) => [norm(k), v[0]]));

/* ---------- Egyptian colloquial lexicon (phrase -> canonical symptom) ---------- */
export const COLLOQUIAL = {
  "بطني بتوجعني": "ألم البطن", "وجع في بطني": "ألم البطن", "وجع بطن": "ألم البطن", "مغص": "ألم البطن",
  "تعب في بطني": "ألم البطن", "وجع في المعده": "ألم البطن", "بطني منفوخه": "انتفاخ البطن", "منفوخ": "انتفاخ البطن",
  "كركبه": "غازات", "عايز ارجع": "غثيان", "نفسي غامه": "غثيان", "نفسي غمه عليا": "غثيان", "ترجيع": "قيء", "برجع": "قيء",
  "اسهال": "إسهال", "امساك": "إمساك", "حرقان في معدتي": "حرقة الصدر", "حرقان": "حرقة الصدر", "حموضه": "حرقة الصدر",
  "راسي بتوجعني": "صداع", "وجع راس": "صداع", "دماغي": "صداع", "راسي مصدعه": "صداع",
  "دايخ": "دوخة", "دماغي بتلف": "دوخة", "لف": "دوخة", "زغلله": "تشوش الرؤية", "مش شايف كويس": "تشوش الرؤية",
  "تنميل": "تنميل الأطراف", "سقعه في ايدي": "برودة الأطراف", "اغمى عليا": "إغماء", "وقعت من طولي": "إغماء",
  "كحه": "سعال", "بكح": "سعال", "كحه ناشفه": "سعال جاف", "بلغم": "بلغم", "نهجان": "ضيق التنفس", "بنهج": "ضيق التنفس",
  "نفسي مقطوع": "ضيق التنفس", "مش قادر اخد نفسي": "ضيق التنفس", "صدري بيزيق": "صفير الصدر", "صفير": "صفير الصدر",
  "وجع في صدري": "ألم الصدر", "صدري بيوجعني": "ألم الصدر", "قلبي بيدق": "خفقان", "قلبي بيدق بسرعه": "خفقان",
  "ضهري بيوجعني": "ألم الظهر", "وجع في ضهري": "ألم الظهر", "وجع ضهر": "ألم الظهر", "جسمي مكسر": "ألم الجسم",
  "جسمي بيوجعني": "ألم الجسم", "مفاصلي بتوجعني": "ألم المفاصل", "ركبتي بتوجعني": "ألم الركبتين", "شد عضلي": "تقلصات عضلية",
  "تعبان": "إرهاق", "مهدود": "إرهاق", "همدان": "إرهاق", "مرهق": "إرهاق", "مفيش طاقه": "إرهاق",
  "سخونيه": "حمى", "سخن": "حمى", "حراره": "حمى", "حرارتي عاليه": "حمى", "برد ورعشه": "قشعريرة", "بترعش": "رعشة",
  "زوري بيوجعني": "ألم الحلق", "وجع زور": "ألم الحلق", "مش قادر ابلع": "صعوبة البلع", "صوتي مبحوح": "بحة الصوت",
  "مناخيري سايبه": "سيلان الأنف", "رشح": "سيلان الأنف", "مرشح": "سيلان الأنف", "مناخيري مسدوده": "احتقان الأنف", "بعطس": "عطس",
  "ودني بتوجعني": "ألم الأذن", "صفاره في ودني": "طنين الأذن", "طنين": "طنين الأذن",
  "مش عارف انام": "أرق", "مش بنام": "أرق", "قلقان": "قلق", "متوتر": "قلق", "زهقان": "اكتئاب", "مخنوق": "اكتئاب",
  "مكتئب": "اكتئاب", "مش مركز": "صعوبة التركيز", "بنسى": "ضعف الذاكرة",
  "حرقان في البول": "تبول مؤلم", "بتبول كتير": "تبول متكرر", "بدخل الحمام كتير": "تبول متكرر", "دم في البول": "دم بالبول",
  "عطشان على طول": "عطش شديد", "جعان على طول": "جوع دائم", "وزني بينزل": "فقدان الوزن", "وزني بيزيد": "زيادة الوزن",
  "مليش نفس للاكل": "فقدان الشهية", "نفسي مسدوده": "فقدان الشهية",
  "جلدي بياكلني": "حكة", "هرش": "حكة", "حبوب في جلدي": "طفح جلدي", "عيني صفرا": "اصفرار الجلد", "صفار": "اصفرار الجلد",
  "رجلي وارمه": "تورم الساقين", "عرقان": "تعرق", "بعرق بالليل": "تعرق ليلي", "شعري بيقع": "تساقط الشعر",
  "بعرق كتير": "تعرق", "بعرق": "تعرق", "بتكرع": "تجشؤ", "تكريع": "تجشؤ", "وجع تحت في بطني": "ألم أسفل البطن", "تحت بطني": "ألم أسفل البطن",
  "بولي غامق": "بول داكن", "البول غامق": "بول داكن", "عيني بارزه": "جحوظ العينين", "عينيا بارزه": "جحوظ العينين",
  "بردان على طول": "شعور بالبرودة", "بردان": "شعور بالبرودة", "جلدي ناشف": "جفاف الجلد", "بقي ناشف": "جفاف الفم", "ريقي ناشف": "جفاف الفم",
  "مش متوازن": "مشاكل التوازن", "بتطوح": "مشاكل التوازن", "دايخ لما بغير وضع راسي": "دوار مع تغيير وضع الرأس", "لما بقوم بسرعه": "دوار مع تغيير وضع الرأس",
  "الجرح مش بيلم": "بطء التئام الجروح", "الجروح مش بتلم": "بطء التئام الجروح", "مش سامع كويس": "ضعف السمع", "سمعي تقيل": "ضعف السمع",
  "قشور": "قشور فضية", "بتشنج": "تشنجات", "تشنج": "تشنجات", "عضيت لساني": "عض اللسان", "حركتي بطيئه": "بطء الحركة", "بقيت بطيء": "بطء الحركة",
  "مش عارف اعمل حمام": "صعوبة التبول", "البول مش بينزل": "صعوبة التبول", "بقوم بالليل اتبول": "تبول ليلي", "بصحى اتبول": "تبول ليلي",
  "البول بينقط": "تنقيط بعد التبول", "بينقط": "تنقيط بعد التبول", "صداع بيدق": "صداع نابض", "دماغي بتخبط": "صداع نابض",
  "مش بستحمل النور": "حساسية للضوء", "النور بيضايقني": "حساسية للضوء", "مش بستحمل الصوت": "حساسية للصوت", "الدوشه بتضايقني": "حساسية للصوت",
  "رجلي بتنمل": "تنميل في الساق", "وجع بيزيد لما اقعد": "ألم يزداد عند الجلوس", "بيزيد لما اقعد": "ألم يزداد عند الجلوس",
  "بتبول كميات كبيره": "تبول بكميات كبيرة", "بقع وانا ماشي": "مشاكل التوازن",
  "نفسي في الملح": "رغبة ملحة في الملح", "بحب الملح": "رغبة ملحة في الملح", "اغمي عليا": "إغماء", "وقعت مغمى عليا": "إغماء",
  "بنسى كتير": "ضعف الذاكرة", "سرحان": "صعوبة التركيز", "مش طايق حد": "تهيج", "متعصب": "عصبية", "عصبي": "عصبية",
  "صوتي اتغير": "تغير الصوت", "حاسس بحاجه في زوري": "شعور بكتلة الحلق", "وزني زاد": "زيادة الوزن", "خسيت": "فقدان الوزن",
  "رجلي بتورم": "تورم الساقين", "وشي وارم": "تورم الوجه", "البول فيه رغوه": "بول رغوي", "بول برغوه": "بول رغوي",
  "نزيف من مناخيري": "نزيف أنفي", "مناخيري بتنزل دم": "نزيف أنفي", "براز اسود": "براز أسود", "دم مع البراز": "نزيف المستقيم",
  "جفوني تقيله": "تدلي الجفون", "شايف الحاجه اتنين": "ازدواج الرؤية",
};
const colloquialNorm = Object.entries(COLLOQUIAL)
  .map(([k, v]) => [norm(k), v])
  .sort((a, b) => b[0].length - a[0].length); // longest phrase first

/* ---------- resolving what the user typed to canonical symptoms ---------- */
// Returns {symptom, via} or null. via: "exact" | "colloquial" | "fuzzy"
export function resolve(input) {
  const n = norm(input);
  if (!n) return null;
  if (byNorm.has(n)) return { symptom: byNorm.get(n), via: "exact" };
  if (aliasNorm.has(n)) return { symptom: aliasNorm.get(n), via: "alias" };
  for (const [k, v] of colloquialNorm) if (n === k || n.includes(k)) return { symptom: v, via: "colloquial" };
  // fuzzy: best Jaccard overlap of stemmed tokens
  const q = new Set(tokens(n));
  if (!q.size) return null;
  let best = null, bestScore = 0;
  for (const s of SYMPTOMS) {
    const t = new Set(tokens(s));
    let inter = 0;
    for (const w of q) if (t.has(w)) inter++;
    const j = inter / (q.size + t.size - inter);
    if (j > bestScore || (j === bestScore && best && df.get(s) > df.get(best))) { bestScore = j; best = s; }
  }
  return bestScore >= 0.5 ? { symptom: best, via: "fuzzy" } : null;
}

// Split free text ("عندي سخونية وكحة، وزوري بيوجعني") into symptoms.
export function parseFreeText(text) {
  const found = [], unknown = [];
  const parts = String(text).split(/[،,؛;\n\.]+|\s+و(?=\S)|\s+و\s+/).map((p) => p.trim()).filter(Boolean);
  for (const p of parts) {
    const r = resolve(p);
    if (r && !found.some((f) => f.symptom === r.symptom)) found.push(r);
    else if (!r) unknown.push(p);
  }
  return { found, unknown };
}

export function suggest(prefix, limit = 8) {
  const n = norm(prefix);
  if (n.length < 2) return [];
  const out = [];
  for (const s of SYMPTOMS) if (norm(s).includes(n)) { out.push({ label: s, symptom: s }); if (out.length >= limit) return out; }
  for (const [k, v] of Object.entries(COLLOQUIAL)) {
    if (norm(k).includes(n) && !out.some((o) => o.symptom === v)) out.push({ label: k, symptom: v, colloquial: true });
    if (out.length >= limit) break;
  }
  return out;
}

/* ---------- red flags: combinations that need emergency care, not a ranking ---------- */
export const RED_FLAGS = [
  { all: ["ألم الصدر", "ضيق التنفس"], msg: "ألم في الصدر مع ضيق تنفس قد يدل على مشكلة في القلب أو الرئة." },
  { all: ["ألم الصدر", "تعرق"], msg: "ألم في الصدر مع عرق قد يدل على أزمة قلبية." },
  { any: ["شلل", "ضعف الوجه"], msg: "ضعف أو شلل مفاجئ في الوجه أو الأطراف من علامات السكتة الدماغية." },
  { all: ["صعوبة الكلام", "تنميل الوجه"], msg: "صعوبة الكلام مع تنميل الوجه من علامات السكتة الدماغية." },
  { any: ["دم بالقيء", "براز أسود", "نزيف غزير"], msg: "النزيف الداخلي أو الغزير يحتاج تدخلاً فورياً." },
  { any: ["زرقة الشفتين", "زرقة الجلد"], msg: "ازرقاق الشفاه أو الجلد علامة على نقص الأكسجين." },
  { any: ["إغماء"], msg: "فقدان الوعي يحتاج تقييماً طبياً عاجلاً." },
  { any: ["تشنجات"], msg: "التشنجات تحتاج تقييماً طبياً عاجلاً." },
  { any: ["أفكار انتحارية", "إيذاء النفس"], msg: "لست وحدك. تواصل فوراً مع طبيب أو اتصل بالخط الساخن للصحة النفسية 16328 أو بالإسعاف 123." },
];
export function redFlags(symptoms) {
  const set = new Set(symptoms);
  return RED_FLAGS.filter((f) => (f.all ? f.all.every((s) => set.has(s)) : f.any.some((s) => set.has(s)))).map((f) => f.msg);
}

/* ---------- ranking ---------- */
// IDF-weighted agreement between what the patient reports (U) and a disease profile (D):
//   precision = w(U∩D)/w(U)  — how much of the complaint the disease explains
//   recall    = w(U∩D)/w(D)  — how much of the disease profile is present
//   score     = (precision + recall) / 2   (tools/eval.mjs compares this with F1 and the original scoring)
export function diagnose(symptoms, { limit = 5 } = {}) {
  const U = [...new Set(symptoms)].filter((s) => df.has(s));
  if (!U.length) return [];
  const wU = U.reduce((a, s) => a + weight(s), 0);
  const results = [];
  for (const d of DISEASES) {
    const matched = d.symptoms.filter((s) => U.includes(s));
    if (!matched.length) continue;
    const wM = matched.reduce((a, s) => a + weight(s), 0);
    const wD = d.symptoms.reduce((a, s) => a + weight(s), 0);
    const p = wM / wU, r = wM / wD;
    const score = (p + r) / 2;
    results.push({ disease: d, score, precision: p, recall: r, matched, missing: d.symptoms.filter((s) => !U.includes(s)) });
  }
  results.sort((a, b) => b.score - a.score || b.matched.length - a.matched.length);
  return results.slice(0, limit);
}

// Confidence band shown to the user, deliberately coarse — this is triage, not a diagnosis.
export function band(score) {
  if (score >= 0.6) return { key: "high", label: "تطابق قوي" };
  if (score >= 0.35) return { key: "mid", label: "تطابق متوسط" };
  return { key: "low", label: "تطابق ضعيف" };
}

// Department recommendation: weighted vote of the top results.
export function recommendDepartment(results) {
  const votes = new Map();
  for (const r of results) votes.set(r.disease.department, (votes.get(r.disease.department) || 0) + r.score);
  return [...votes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

export { DISEASES };
